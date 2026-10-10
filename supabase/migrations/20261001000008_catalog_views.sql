-- FL TASE3 - read models for the storefront

-- ---------------------------------------------------------------------------
-- category_stats: categories + how many ACTIVE products they actually hold.
-- security_invoker keeps the underlying categories/products RLS policies in
-- force, so a customer can never count products they are not allowed to see.
-- ---------------------------------------------------------------------------
create or replace view public.category_stats
with (security_invoker = true) as
select
  c.id,
  c.name,
  c.slug,
  c.description,
  c.image_path,
  c.sort_order,
  c.is_active,
  c.created_at,
  c.updated_at,
  count(pc.product_id) filter (where p.is_active)::int as product_count
from public.categories c
left join public.product_categories pc on pc.category_id = c.id
left join public.products p on p.id = pc.product_id
group by c.id;

grant select on public.category_stats to anon, authenticated;

-- ---------------------------------------------------------------------------
-- tag_stats: same idea for the gift-finder facets.
-- ---------------------------------------------------------------------------
create or replace view public.tag_stats
with (security_invoker = true) as
select
  t.id,
  t.name,
  t.slug,
  t.kind,
  t.sort_order,
  count(ptr.product_id) filter (where p.is_active)::int as product_count
from public.product_tags t
left join public.product_tag_relations ptr on ptr.tag_id = t.id
left join public.products p on p.id = ptr.product_id
group by t.id;

grant select on public.tag_stats to anon, authenticated;
