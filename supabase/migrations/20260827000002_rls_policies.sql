-- Migration: RLS policies for Roh Al Anaqa
-- Roles: customer, employee, admin, super_admin
-- Helpers is_staff / is_admin check profiles.role + is_active

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.brands enable row level security;
alter table public.products enable row level security;
alter table public.category_attributes enable row level security;
alter table public.product_attribute_values enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.coupons enable row level security;
alter table public.addresses enable row level security;
alter table public.bank_accounts enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payment_receipts enable row level security;
alter table public.reviews enable row level security;
alter table public.wishlists enable row level security;
alter table public.cart_items enable row level security;
alter table public.banners enable row level security;
alter table public.settings enable row level security;
alter table public.social_media enable row level security;
alter table public.currencies enable row level security;
alter table public.notifications enable row level security;

-- Helper functions (security definer to avoid RLS recursion)
create or replace function public.is_staff()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role in ('employee','admin','super_admin')
    and is_active = true
  );
$$ language sql security definer stable set search_path = public;

create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role in ('admin','super_admin')
    and is_active = true
  );
$$ language sql security definer stable set search_path = public;

create or replace function public.is_super_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role = 'super_admin'
    and is_active = true
  );
$$ language sql security definer stable set search_path = public;

-- =========================
-- profiles
-- =========================
create policy "profiles_select_own_or_staff" on public.profiles for select to authenticated using (auth.uid() = id or public.is_staff());
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "profiles_update_own_or_staff" on public.profiles for update to authenticated using (auth.uid() = id or public.is_staff()) with check (auth.uid() = id or public.is_staff());
-- Staff cannot change role/email of super_admin unless super_admin
create policy "profiles_delete_staff" on public.profiles for delete to authenticated using (public.is_staff() and (select role from public.profiles where id = profiles.id) != 'super_admin');

-- =========================
-- categories / brands / banners / coupons / social_media / currencies (catalog public read, staff write)
-- =========================
-- categories
create policy "categories_select_all" on public.categories for select using (true);
create policy "categories_write_staff" on public.categories for all to authenticated using (public.is_staff()) with check (public.is_staff());
-- brands
create policy "brands_select_all" on public.brands for select using (true);
create policy "brands_write_staff" on public.brands for all to authenticated using (public.is_staff()) with check (public.is_staff());
-- banners
create policy "banners_select_all" on public.banners for select using (true);
create policy "banners_write_staff" on public.banners for all to authenticated using (public.is_staff()) with check (public.is_staff());
-- coupons (public can read active for validation, but select all for simplicity as per doc: true)
create policy "coupons_select_all" on public.coupons for select using (true);
create policy "coupons_write_staff" on public.coupons for all to authenticated using (public.is_staff()) with check (public.is_staff());
-- social_media
create policy "social_select_all" on public.social_media for select using (true);
create policy "social_write_admin" on public.social_media for all to authenticated using (public.is_admin()) with check (public.is_admin());
-- currencies
create policy "currencies_select_all" on public.currencies for select using (true);
create policy "currencies_write_admin" on public.currencies for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- =========================
-- products and related
-- =========================
create policy "products_select_all" on public.products for select using (true);
create policy "products_write_staff" on public.products for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy "category_attributes_select_all" on public.category_attributes for select using (true);
create policy "category_attributes_write_staff" on public.category_attributes for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy "pav_select_all" on public.product_attribute_values for select using (true);
create policy "pav_write_staff" on public.product_attribute_values for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy "variants_select_all" on public.product_variants for select using (true);
create policy "variants_write_staff" on public.product_variants for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy "product_images_select_all" on public.product_images for select using (true);
create policy "product_images_write_staff" on public.product_images for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- =========================
-- addresses (owner only)
-- =========================
create policy "addresses_select_own" on public.addresses for select to authenticated using (auth.uid() = user_id);
create policy "addresses_insert_own" on public.addresses for insert to authenticated with check (auth.uid() = user_id);
create policy "addresses_update_own" on public.addresses for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "addresses_delete_own" on public.addresses for delete to authenticated using (auth.uid() = user_id);

-- =========================
-- orders
-- =========================
create policy "orders_select_own_or_staff" on public.orders for select to authenticated using (auth.uid() = user_id or public.is_staff());
create policy "orders_insert_own" on public.orders for insert to authenticated with check (auth.uid() = user_id);
create policy "orders_update_staff" on public.orders for update to authenticated using (public.is_staff()) with check (public.is_staff());
-- No delete for customers

-- =========================
-- order_items
-- =========================
create policy "order_items_select_own_or_staff" on public.order_items for select to authenticated using (
  exists (select 1 from public.orders where orders.id = order_items.order_id and (orders.user_id = auth.uid() or public.is_staff()))
);
create policy "order_items_insert_own" on public.order_items for insert to authenticated with check (
  exists (select 1 from public.orders where orders.id = order_items.order_id and orders.user_id = auth.uid())
);

-- =========================
-- payment_receipts
-- =========================
create policy "receipts_select_own_or_staff" on public.payment_receipts for select to authenticated using (auth.uid() = user_id or public.is_staff());
create policy "receipts_insert_own" on public.payment_receipts for insert to authenticated with check (auth.uid() = user_id);
create policy "receipts_update_staff" on public.payment_receipts for update to authenticated using (public.is_staff()) with check (public.is_staff());

-- =========================
-- bank_accounts (public read active, admin write)
-- =========================
create policy "bank_accounts_select_active" on public.bank_accounts for select using (is_active = true or public.is_admin());
create policy "bank_accounts_write_admin" on public.bank_accounts for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- =========================
-- reviews
-- =========================
create policy "reviews_select_all" on public.reviews for select using (is_approved = true or auth.uid() = user_id or public.is_staff());
create policy "reviews_insert_own" on public.reviews for insert to authenticated with check (auth.uid() = user_id);
create policy "reviews_update_staff" on public.reviews for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "reviews_delete_own_or_staff" on public.reviews for delete to authenticated using (auth.uid() = user_id or public.is_staff());

-- =========================
-- wishlists
-- =========================
create policy "wishlists_select_own" on public.wishlists for select to authenticated using (auth.uid() = user_id);
create policy "wishlists_insert_own" on public.wishlists for insert to authenticated with check (auth.uid() = user_id);
create policy "wishlists_delete_own" on public.wishlists for delete to authenticated using (auth.uid() = user_id);

-- =========================
-- cart_items
-- =========================
create policy "cart_select_own" on public.cart_items for select to authenticated using (auth.uid() = user_id);
create policy "cart_insert_own" on public.cart_items for insert to authenticated with check (auth.uid() = user_id);
create policy "cart_update_own" on public.cart_items for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "cart_delete_own" on public.cart_items for delete to authenticated using (auth.uid() = user_id);

-- =========================
-- settings (public read, admin write)
-- =========================
create policy "settings_select_all" on public.settings for select using (true);
create policy "settings_write_admin" on public.settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- =========================
-- notifications
-- =========================
create policy "notifications_select_own_or_staff" on public.notifications for select to authenticated using (auth.uid() = user_id or user_id is null or public.is_staff());
create policy "notifications_insert_staff" on public.notifications for insert to authenticated with check (public.is_staff());
create policy "notifications_update_own_or_staff" on public.notifications for update to authenticated using (auth.uid() = user_id or public.is_staff()) with check (auth.uid() = user_id or public.is_staff());
create policy "notifications_delete_staff" on public.notifications for delete to authenticated using (public.is_staff());
