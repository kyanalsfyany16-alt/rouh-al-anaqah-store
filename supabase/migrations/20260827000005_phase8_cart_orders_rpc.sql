-- Migration Phase 8: Cart variant support + Order creation RPC + Coupon validation
-- 1. Add variant_id to cart_items and order_items
alter table public.cart_items add column if not exists variant_id uuid references public.product_variants(id) on delete set null;
-- Drop old unique and create new one with variant
alter table public.cart_items drop constraint if exists cart_items_user_id_product_id_key;
drop index if exists cart_items_user_product_unique;
create unique index cart_items_user_product_variant_unique on public.cart_items(user_id, product_id, variant_id) where variant_id is not null;
create unique index cart_items_user_product_unique on public.cart_items(user_id, product_id) where variant_id is null;

alter table public.order_items add column if not exists variant_id uuid references public.product_variants(id) on delete set null;
alter table public.order_items add column if not exists variant_name text;
alter table public.order_items add column if not exists variant_attributes jsonb;

-- 2. Coupon validation function
create or replace function public.validate_coupon(p_code text, p_user_id uuid, p_subtotal numeric)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  c record;
  discount numeric := 0;
begin
  select * into c from public.coupons where code = upper(trim(p_code)) limit 1;
  if not found then
    return jsonb_build_object('valid', false, 'message', 'الكوبون غير موجود');
  end if;
  if not c.is_active then
    return jsonb_build_object('valid', false, 'message', 'الكوبون غير نشط');
  end if;
  if c.valid_from is not null and now() < c.valid_from then
    return jsonb_build_object('valid', false, 'message', 'الكوبون لم يبدأ بعد');
  end if;
  if c.valid_until is not null and now() > c.valid_until then
    return jsonb_build_object('valid', false, 'message', 'انتهت صلاحية الكوبون');
  end if;
  if c.max_uses is not null and c.used_count >= c.max_uses then
    return jsonb_build_object('valid', false, 'message', 'تم استنفاد استخدامات الكوبون');
  end if;
  if p_subtotal < coalesce(c.min_order,0) then
    return jsonb_build_object('valid', false, 'message', 'الحد الأدنى للطلب لم يتحقق');
  end if;

  if c.type = 'percentage' then
    discount := round(p_subtotal * c.value / 100, 2);
  else
    discount := least(c.value, p_subtotal);
  end if;

  return jsonb_build_object('valid', true, 'discount', discount, 'coupon_id', c.id, 'type', c.type, 'value', c.value);
end;
$$;

-- 3. Atomic order creation + stock decrement
create or replace function public.create_order_atomic(
  p_user_id uuid,
  p_shipping_address jsonb,
  p_payment_method text,
  p_bank_account_id uuid,
  p_coupon_code text,
  p_notes text,
  p_items jsonb -- [{"product_id": uuid, "variant_id": uuid|null, "quantity": int}]
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_subtotal numeric := 0;
  v_discount numeric := 0;
  v_shipping numeric := 0;
  v_total numeric := 0;
  v_coupon_id uuid := null;
  v_coupon_discount numeric := 0;
  item record;
  v_product record;
  v_variant record;
  v_price numeric;
  v_stock int;
  v_item_price numeric;
  v_item_total numeric;
begin
  if p_user_id is null or p_user_id != auth.uid() then
    raise exception 'Unauthorized';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'السلة فارغة';
  end if;

  -- Validate coupon if provided
  if p_coupon_code is not null and btrim(p_coupon_code) <> '' then
    -- Use validate_coupon logic inline to get discount
    declare c jsonb;
    begin
      c := public.validate_coupon(p_coupon_code, p_user_id, 0); -- we will recalc after subtotal
      if not (c->>'valid')::boolean then
        raise exception '%', c->>'message';
      end if;
      -- defer discount calc after subtotal
    end;
  end if;

  -- First pass: validate stock and compute subtotal with real prices
  for item in select * from jsonb_to_recordset(p_items) as x(product_id uuid, variant_id uuid, quantity int)
  loop
    if item.quantity <= 0 then raise exception 'كمية غير صالحة'; end if;

    select * into v_product from public.products where id = item.product_id and is_published = true;
    if not found then raise exception 'المنتج غير موجود أو غير منشور: %', item.product_id; end if;

    if item.variant_id is not null then
      select * into v_variant from public.product_variants where id = item.variant_id and product_id = item.product_id and is_active = true;
      if not found then raise exception 'المتغير غير موجود'; end if;
      v_price := coalesce(v_variant.price, v_product.price);
      v_stock := v_variant.stock;
      if v_stock < item.quantity then raise exception 'المخزون غير كافٍ للمتغير: %', v_variant.name; end if;
    else
      v_price := coalesce(v_product.discount_price, v_product.price);
      v_stock := v_product.stock;
      if v_stock < item.quantity then raise exception 'المخزون غير كافٍ للمنتج: %', v_product.name; end if;
    end if;

    v_subtotal := v_subtotal + (v_price * item.quantity);
  end loop;

  -- Now validate coupon with real subtotal and compute discount
  if p_coupon_code is not null and btrim(p_coupon_code) <> '' then
    declare c jsonb;
    begin
      c := public.validate_coupon(p_coupon_code, p_user_id, v_subtotal);
      if not (c->>'valid')::boolean then
        raise exception '%', c->>'message';
      end if;
      v_coupon_discount := (c->>'discount')::numeric;
      v_coupon_id := (c->>'coupon_id')::uuid;
      v_discount := v_coupon_discount;
    end;
  end if;

  -- Shipping: free over 300 else 30 (same as frontend)
  if v_subtotal >= 300 then v_shipping := 0; else v_shipping := 30; end if;
  v_total := v_subtotal - v_discount + v_shipping;
  if v_total < 0 then v_total := 0; end if;

  -- Create order
  insert into public.orders (user_id, status, subtotal, discount, shipping, total, coupon_id, shipping_address, payment_method, notes, payment_status, bank_account_id)
  values (p_user_id, 'pending', v_subtotal, v_discount, v_shipping, v_total, v_coupon_id, p_shipping_address, p_payment_method, p_notes,
          case when p_payment_method = 'cash_on_delivery' then 'unpaid' else 'pending_verification' end,
          p_bank_account_id)
  returning id into v_order_id;

  -- Second pass: insert order_items and decrement stock with row-level lock
  for item in select * from jsonb_to_recordset(p_items) as x(product_id uuid, variant_id uuid, quantity int)
  loop
    select * into v_product from public.products where id = item.product_id for update;
    if item.variant_id is not null then
      select * into v_variant from public.product_variants where id = item.variant_id for update;
      v_item_price := coalesce(v_variant.price, v_product.price);
      -- Decrement variant stock
      update public.product_variants set stock = stock - item.quantity where id = item.variant_id and stock >= item.quantity;
      if not found then raise exception 'فشل خصم مخزون المتغير'; end if;
      insert into public.order_items (order_id, product_id, variant_id, variant_name, variant_attributes, name, price, quantity, image_url)
      values (v_order_id, item.product_id, item.variant_id, v_variant.name, to_jsonb(v_variant.attributes), v_product.name, v_item_price, item.quantity, coalesce(v_variant.image_url, (v_product.images->>0)));
    else
      v_item_price := coalesce(v_product.discount_price, v_product.price);
      update public.products set stock = stock - item.quantity where id = item.product_id and stock >= item.quantity;
      if not found then raise exception 'فشل خصم مخزون المنتج'; end if;
      insert into public.order_items (order_id, product_id, name, price, quantity, image_url)
      values (v_order_id, item.product_id, v_product.name, v_item_price, item.quantity, (v_product.images->>0));
    end if;
  end loop;

  -- Increment coupon used_count
  if v_coupon_id is not null then
    update public.coupons set used_count = used_count + 1 where id = v_coupon_id;
  end if;

  -- Clear cart
  delete from public.cart_items where user_id = p_user_id;

  return jsonb_build_object('order_id', v_order_id, 'total', v_total, 'subtotal', v_subtotal, 'discount', v_discount, 'shipping', v_shipping);
end;
$$;

grant execute on function public.validate_coupon(text, uuid, numeric) to authenticated;
grant execute on function public.create_order_atomic(uuid, jsonb, text, uuid, text, text, jsonb) to authenticated;
