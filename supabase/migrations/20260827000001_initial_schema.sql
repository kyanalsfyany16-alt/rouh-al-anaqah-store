-- Migration: Initial schema for Roh Al Anaqa (روح الأناقة)
-- Based on STORE_DOCUMENTATION.md - exact rebuild, no mock data

-- Extensions
create extension if not exists "pgcrypto";

-- Helper: updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- =========================
-- profiles (1:1 with auth.users)
-- =========================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  first_name text,
  last_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer','employee','admin','super_admin')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated_at before update on public.profiles for each row execute function public.handle_updated_at();
create index profiles_role_idx on public.profiles(role);
create index profiles_email_idx on public.profiles(email);

-- Guard: prevent deleting super_admin
create or replace function public.guard_super_admin_delete()
returns trigger as $$
begin
  if old.role = 'super_admin' then
    raise exception 'Cannot delete super_admin profile';
  end if;
  return old;
end;
$$ language plpgsql;
create trigger guard_super_admin_delete before delete on public.profiles for each row execute function public.guard_super_admin_delete();

-- Auto-create profile on signup
create or replace function public.on_auth_user_created()
returns trigger as $$
begin
  insert into public.profiles (id, email, first_name, last_name, phone, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', null),
    coalesce(new.raw_user_meta_data->>'last_name', null),
    coalesce(new.raw_user_meta_data->>'phone', null),
    'customer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.on_auth_user_created();

-- =========================
-- categories
-- =========================
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  parent_id uuid references public.categories(id) on delete set null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index categories_parent_idx on public.categories(parent_id);
create index categories_slug_idx on public.categories(slug);
create index categories_active_idx on public.categories(is_active);

-- =========================
-- brands
-- =========================
create table public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  logo_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index brands_slug_idx on public.brands(slug);
create index brands_active_idx on public.brands(is_active);

-- =========================
-- products
-- =========================
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  short_description text,
  specifications jsonb,
  price numeric(10,2) not null check (price >= 0),
  discount_price numeric(10,2) check (discount_price is null or discount_price >= 0),
  tax_rate numeric(5,2) not null default 0 check (tax_rate >= 0),
  sku text unique,
  barcode text,
  stock integer not null default 0 check (stock >= 0),
  min_stock integer not null default 0 check (min_stock >= 0),
  low_stock_threshold integer not null default 5 check (low_stock_threshold >= 0),
  brand_id uuid references public.brands(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  images jsonb not null default '[]'::jsonb,
  currency_code text not null default 'SAR',
  is_featured boolean not null default false,
  is_published boolean not null default true,
  is_returnable boolean not null default false,
  is_new_arrival boolean not null default false,
  is_best_seller boolean not null default false,
  rating numeric(2,1) not null default 0 check (rating >= 0 and rating <= 5),
  review_count integer not null default 0 check (review_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
);
-- Partial unique already covered; ensure sku null allowed via unique constraint allows multiple nulls in PG, need partial index for strict
create unique index products_sku_unique
on public.products(sku)
where sku is not null;
create index products_category_idx on public.products(category_id);
create index products_brand_idx on public.products(brand_id);
create index products_slug_idx on public.products(slug);
create index products_published_idx on public.products(is_published);
create index products_featured_idx on public.products(is_featured) where is_featured = true;
create index products_price_idx on public.products(price);
create trigger products_updated_at before update on public.products for each row execute function public.handle_updated_at();

-- =========================
-- category_attributes
-- =========================
create table public.category_attributes (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  name text not null,
  slug text not null,
  type text not null default 'text' check (type in ('text','number','boolean','date','image','select','multiselect')),
  options jsonb not null default '[]'::jsonb,
  is_required boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (category_id, slug)
);
create index category_attributes_category_idx on public.category_attributes(category_id);

-- =========================
-- product_attribute_values
-- =========================
create table public.product_attribute_values (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  attribute_id uuid not null references public.category_attributes(id) on delete cascade,
  value_text text,
  value_number numeric(12,2),
  value_boolean boolean,
  value_date date,
  value_image text,
  created_at timestamptz not null default now(),
  unique (product_id, attribute_id)
);
create index pav_product_idx on public.product_attribute_values(product_id);
create index pav_attribute_idx on public.product_attribute_values(attribute_id);

-- =========================
-- product_variants
-- =========================
create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  sku text,
  price numeric(10,2) not null default 0 check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  image_url text,
  attributes jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create unique index product_variants_sku_unique on public.product_variants(sku) where sku is not null;
create index product_variants_product_idx on public.product_variants(product_id);
create index product_variants_active_idx on public.product_variants(is_active);

-- =========================
-- product_images (normalized storage for product images)
-- =========================
create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  public_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index product_images_product_idx on public.product_images(product_id);

-- =========================
-- coupons
-- =========================
create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  type text not null default 'percentage' check (type in ('percentage','fixed')),
  value numeric(10,2) not null default 0 check (value >= 0),
  min_order numeric(10,2) not null default 0 check (min_order >= 0),
  max_uses integer check (max_uses is null or max_uses > 0),
  used_count integer not null default 0 check (used_count >= 0),
  is_active boolean not null default true,
  valid_from timestamptz,
  valid_until timestamptz,
  created_at timestamptz not null default now()
);
create index coupons_code_idx on public.coupons(code);
create index coupons_active_idx on public.coupons(is_active);

-- =========================
-- addresses
-- =========================
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  full_name text not null,
  phone text not null,
  line1 text not null,
  line2 text,
  city text not null,
  state text,
  postal_code text,
  country text not null default 'السعودية',
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index addresses_user_idx on public.addresses(user_id);

-- =========================
-- bank_accounts
-- =========================
create table public.bank_accounts (
  id uuid primary key default gen_random_uuid(),
  bank_name text not null,
  account_holder text not null,
  account_number text not null,
  iban text,
  currency_code text not null default 'YER',
  notes text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger bank_accounts_updated_at before update on public.bank_accounts for each row execute function public.handle_updated_at();
create index bank_accounts_active_idx on public.bank_accounts(is_active);

-- =========================
-- orders
-- =========================
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  status text not null default 'pending' check (status in ('pending','paid','processing','shipped','delivered','cancelled','returned')),
  subtotal numeric(10,2) not null default 0 check (subtotal >= 0),
  discount numeric(10,2) not null default 0 check (discount >= 0),
  shipping numeric(10,2) not null default 0 check (shipping >= 0),
  total numeric(10,2) not null default 0 check (total >= 0),
  coupon_id uuid references public.coupons(id) on delete set null,
  shipping_address jsonb,
  payment_method text not null default 'cash_on_delivery' check (payment_method in ('cash_on_delivery','bank_transfer')),
  notes text,
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','pending_verification','paid','refunded')),
  bank_account_id uuid references public.bank_accounts(id) on delete set null,
  receipt_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger orders_updated_at before update on public.orders for each row execute function public.handle_updated_at();
create index orders_user_idx on public.orders(user_id);
create index orders_status_idx on public.orders(status);
create index orders_payment_status_idx on public.orders(payment_status);
create index orders_created_idx on public.orders(created_at desc);

-- =========================
-- order_items
-- =========================
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name text not null,
  price numeric(10,2) not null check (price >= 0),
  quantity integer not null default 1 check (quantity > 0),
  image_url text
);
create index order_items_order_idx on public.order_items(order_id);
create index order_items_product_idx on public.order_items(product_id);

-- =========================
-- payment_receipts
-- =========================
create table public.payment_receipts (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  bank_account_id uuid references public.bank_accounts(id) on delete set null,
  storage_path text not null,
  public_url text not null,
  amount numeric(10,2) not null default 0 check (amount >= 0),
  currency_code text not null default 'YER',
  status text not null default 'pending' check (status in ('pending','approved','rejected','pending_verification','paid','refunded','unpaid')),
  admin_notes text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
-- Normalize status values to match doc: pending/approved/rejected + reuse payment_status values; allow both
create index payment_receipts_order_idx on public.payment_receipts(order_id);
create index payment_receipts_user_idx on public.payment_receipts(user_id);
create index payment_receipts_status_idx on public.payment_receipts(status);

-- FK from orders.receipt_id -> payment_receipts.id (add after payment_receipts exists)
alter table public.orders add constraint orders_receipt_fk foreign key (receipt_id) references public.payment_receipts(id) on delete set null;

-- =========================
-- reviews
-- =========================
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);
create index reviews_product_idx on public.reviews(product_id);
create index reviews_user_idx on public.reviews(user_id);
create index reviews_approved_idx on public.reviews(is_approved);

-- =========================
-- wishlists (doc calls it wishlists)
-- =========================
create table public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);
create index wishlists_user_idx on public.wishlists(user_id);
create index wishlists_product_idx on public.wishlists(product_id);

-- =========================
-- cart_items
-- =========================
create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);
create index cart_items_user_idx on public.cart_items(user_id);
create index cart_items_product_idx on public.cart_items(product_id);

-- =========================
-- banners
-- =========================
create table public.banners (
  id uuid primary key default gen_random_uuid(),
  title text,
  subtitle text,
  image_url text not null,
  link_url text,
  position text not null default 'home' check (position in ('home','shop','category','product')),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index banners_active_idx on public.banners(is_active);
create index banners_position_idx on public.banners(position);

-- =========================
-- settings (single row id=1)
-- =========================
create table public.settings (
  id integer primary key check (id = 1),
  store_name text not null default 'روح الأناقة',
  logo_url text,
  favicon_url text,
  email text,
  phone text,
  address text,
  about_us text,
  privacy_policy text,
  terms text,
  shipping_policy text,
  return_policy text,
  tax_rate numeric(5,2) not null default 0 check (tax_rate >= 0),
  default_currency_code text default 'SAR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
insert into public.settings (id, store_name) values (1, 'روح الأناقة') on conflict (id) do nothing;
create trigger settings_updated_at before update on public.settings for each row execute function public.handle_updated_at();

-- =========================
-- social_media
-- =========================
create table public.social_media (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  url text not null,
  icon text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index social_media_active_idx on public.social_media(is_active);

-- =========================
-- currencies
-- =========================
create table public.currencies (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  symbol text not null,
  rate numeric(10,4) not null default 1 check (rate > 0),
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
insert into public.currencies (code, name, symbol, rate, is_default, is_active) values ('SAR','الريال السعودي','ر.س',1,true,true) on conflict (code) do nothing;
create index currencies_active_idx on public.currencies(is_active);
create index currencies_default_idx on public.currencies(is_default) where is_default = true;

-- =========================
-- notifications
-- =========================
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  message text,
  type text not null default 'info' check (type in ('info','success','warning','error')),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications(user_id);
create index notifications_read_idx on public.notifications(is_read);
