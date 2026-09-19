-- Migration: Storage buckets and policies for Roh Al Anaqa
-- Buckets: product-images, category-images, brand-images, banner-images, store-assets, payment-receipts
-- product-images, category-images, brand-images, banner-images, store-assets = public
-- payment-receipts = private

-- Create buckets
insert into storage.buckets (id, name, public) values ('product-images','product-images', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('category-images','category-images', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('brand-images','brand-images', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('banner-images','banner-images', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('store-assets','store-assets', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('payment-receipts','payment-receipts', false) on conflict (id) do nothing;

-- Ensure storage.objects RLS is enabled (it is by default in Supabase)
-- Policies for public buckets: read for all, write for staff (except product-images tightened to staff after migration fix)

-- Helper: is_staff already exists from previous migration

-- product-images: public read, staff write (tightened vs older permissive anon write)
create policy "product_images_public_read" on storage.objects for select using (bucket_id = 'product-images');
create policy "product_images_staff_insert" on storage.objects for insert to authenticated with check (bucket_id = 'product-images' and public.is_staff());
create policy "product_images_staff_update" on storage.objects for update to authenticated using (bucket_id = 'product-images' and public.is_staff()) with check (bucket_id = 'product-images' and public.is_staff());
create policy "product_images_staff_delete" on storage.objects for delete to authenticated using (bucket_id = 'product-images' and public.is_staff());

-- category-images
create policy "category_images_public_read" on storage.objects for select using (bucket_id = 'category-images');
create policy "category_images_staff_insert" on storage.objects for insert to authenticated with check (bucket_id = 'category-images' and public.is_staff());
create policy "category_images_staff_update" on storage.objects for update to authenticated using (bucket_id = 'category-images' and public.is_staff()) with check (bucket_id = 'category-images' and public.is_staff());
create policy "category_images_staff_delete" on storage.objects for delete to authenticated using (bucket_id = 'category-images' and public.is_staff());

-- brand-images
create policy "brand_images_public_read" on storage.objects for select using (bucket_id = 'brand-images');
create policy "brand_images_staff_insert" on storage.objects for insert to authenticated with check (bucket_id = 'brand-images' and public.is_staff());
create policy "brand_images_staff_update" on storage.objects for update to authenticated using (bucket_id = 'brand-images' and public.is_staff()) with check (bucket_id = 'brand-images' and public.is_staff());
create policy "brand_images_staff_delete" on storage.objects for delete to authenticated using (bucket_id = 'brand-images' and public.is_staff());

-- banner-images
create policy "banner_images_public_read" on storage.objects for select using (bucket_id = 'banner-images');
create policy "banner_images_staff_insert" on storage.objects for insert to authenticated with check (bucket_id = 'banner-images' and public.is_staff());
create policy "banner_images_staff_update" on storage.objects for update to authenticated using (bucket_id = 'banner-images' and public.is_staff()) with check (bucket_id = 'banner-images' and public.is_staff());
create policy "banner_images_staff_delete" on storage.objects for delete to authenticated using (bucket_id = 'banner-images' and public.is_staff());

-- store-assets (logo, favicon)
create policy "store_assets_public_read" on storage.objects for select using (bucket_id = 'store-assets');
create policy "store_assets_staff_insert" on storage.objects for insert to authenticated with check (bucket_id = 'store-assets' and public.is_staff());
create policy "store_assets_staff_update" on storage.objects for update to authenticated using (bucket_id = 'store-assets' and public.is_staff()) with check (bucket_id = 'store-assets' and public.is_staff());
create policy "store_assets_staff_delete" on storage.objects for delete to authenticated using (bucket_id = 'store-assets' and public.is_staff());

-- payment-receipts (private): owner can insert/select own, staff can select all and delete
create policy "receipts_private_select_owner" on storage.objects for select to authenticated using (bucket_id = 'payment-receipts' and owner = auth.uid());
create policy "receipts_private_select_staff" on storage.objects for select to authenticated using (bucket_id = 'payment-receipts' and public.is_staff());
create policy "receipts_private_insert_owner" on storage.objects for insert to authenticated with check (bucket_id = 'payment-receipts' and owner = auth.uid());
create policy "receipts_private_delete_staff" on storage.objects for delete to authenticated using (bucket_id = 'payment-receipts' and public.is_staff());
