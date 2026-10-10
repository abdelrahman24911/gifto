-- FL TASE3 - per-customer rollup used by the admin customers table
create or replace view public.customer_stats
with (security_invoker = true) as
select
  c.id,
  c.full_name,
  c.phone,
  c.email,
  c.user_id,
  c.created_at,
  c.updated_at,
  count(o.id) filter (where o.status <> 'cancelled')::int as order_count,
  coalesce(sum(o.total) filter (where o.status <> 'cancelled'), 0)::numeric(12,2) as total_spent,
  max(o.created_at) filter (where o.status <> 'cancelled')   as last_order_at
from public.customers c
left join public.orders o on o.customer_id = c.id
group by c.id;

grant select on public.customer_stats to authenticated;
