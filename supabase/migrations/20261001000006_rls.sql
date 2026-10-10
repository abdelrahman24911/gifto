-- FL TASE3 — Row Level Security
-- Customers may only read the live catalogue. Every write path for orders and
-- inventory goes through SECURITY DEFINER functions that re-check the caller's
-- role, so hiding UI is never the security boundary.

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create policy "profiles: read own or staff" on public.profiles
  for select using (id = auth.uid() or public.is_staff());

create policy "profiles: update own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy "profiles: admins manage" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
create policy "categories: read active or staff" on public.categories
  for select using (is_active or public.is_staff());
create policy "categories: staff write" on public.categories
  for all using (public.is_staff()) with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
create policy "products: read active or staff" on public.products
  for select using (is_active or public.is_staff());
create policy "products: staff write" on public.products
  for all using (public.is_staff()) with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- product relations
-- ---------------------------------------------------------------------------
create policy "product_images: read visible" on public.product_images
  for select using (
    public.is_staff()
    or exists (select 1 from public.products p where p.id = product_id and p.is_active)
  );
create policy "product_images: staff write" on public.product_images
  for all using (public.is_staff()) with check (public.is_staff());

create policy "product_categories: read visible" on public.product_categories
  for select using (
    public.is_staff()
    or exists (select 1 from public.products p where p.id = product_id and p.is_active)
  );
create policy "product_categories: staff write" on public.product_categories
  for all using (public.is_staff()) with check (public.is_staff());

create policy "product_tags: read all" on public.product_tags
  for select using (true);
create policy "product_tags: staff write" on public.product_tags
  for all using (public.is_staff()) with check (public.is_staff());

create policy "product_tag_relations: read all" on public.product_tag_relations
  for select using (true);
create policy "product_tag_relations: staff write" on public.product_tag_relations
  for all using (public.is_staff()) with check (public.is_staff());

create policy "product_options: read visible" on public.product_options
  for select using (
    public.is_staff()
    or exists (select 1 from public.products p where p.id = product_id and p.is_active)
  );
create policy "product_options: staff write" on public.product_options
  for all using (public.is_staff()) with check (public.is_staff());

create policy "product_option_values: read visible" on public.product_option_values
  for select using (
    public.is_staff()
    or exists (
      select 1 from public.product_options po
      join public.products p on p.id = po.product_id
      where po.id = option_id and (p.is_active or public.is_staff())
    )
  );
create policy "product_option_values: staff write" on public.product_option_values
  for all using (public.is_staff()) with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- customers / orders / inventory  — staff only, direct table access
-- ---------------------------------------------------------------------------
create policy "customers: staff only" on public.customers
  for all using (public.is_staff()) with check (public.is_staff());

create policy "orders: staff only" on public.orders
  for all using (public.is_staff()) with check (public.is_staff());

create policy "order_items: staff only" on public.order_items
  for all using (public.is_staff()) with check (public.is_staff());

create policy "order_status_history: staff only" on public.order_status_history
  for all using (public.is_staff()) with check (public.is_staff());

create policy "inventory_movements: staff read" on public.inventory_movements
  for select using (public.is_staff());
-- no insert/update/delete policy: movements are written only by functions

-- ---------------------------------------------------------------------------
-- default privileges (Supabase usually sets these; re-stating them is harmless)
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on sequences to anon, authenticated;
