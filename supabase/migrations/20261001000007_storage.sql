-- FL TASE3 — storage buckets + policies
-- Buckets: product-images, category-images, homepage-images, brand-assets
-- Images are referenced by storage path from the database; nothing binary
-- ever lands in PostgreSQL.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-images',  'product-images',  true, 5242880, array['image/jpeg','image/png','image/webp','image/avif']),
  ('category-images', 'category-images', true, 5242880, array['image/jpeg','image/png','image/webp','image/avif']),
  ('homepage-images', 'homepage-images', true, 5242880, array['image/jpeg','image/png','image/webp','image/avif']),
  ('brand-assets',    'brand-assets',    true, 5242880, array['image/jpeg','image/png','image/webp','image/svg+xml'])
on conflict (id) do nothing;

-- public read for every asset bucket
create policy "storage: public read asset buckets"
  on storage.objects for select
  using (bucket_id in ('product-images', 'category-images', 'homepage-images', 'brand-assets'));

-- staff-only writes
create policy "storage: staff upload"
  on storage.objects for insert
  with check (
    public.is_staff()
    and bucket_id in ('product-images', 'category-images', 'homepage-images', 'brand-assets')
  );

create policy "storage: staff update"
  on storage.objects for update
  using (
    public.is_staff()
    and bucket_id in ('product-images', 'category-images', 'homepage-images', 'brand-assets')
  )
  with check (
    public.is_staff()
    and bucket_id in ('product-images', 'category-images', 'homepage-images', 'brand-assets')
  );

create policy "storage: staff delete"
  on storage.objects for delete
  using (
    public.is_staff()
    and bucket_id in ('product-images', 'category-images', 'homepage-images', 'brand-assets')
  );
