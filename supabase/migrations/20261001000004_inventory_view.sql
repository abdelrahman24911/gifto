-- FL TASE3 — business logic: inventory, orders, status transitions

-- ===========================================================================
-- Inventory view
-- ---------------------------------------------------------------------------
-- stock_quantity  = AVAILABLE to sell (already net of every sale)
-- reserved_quantity = units sitting in open (not yet delivered/cancelled) orders
-- on_hand_quantity  = available + reserved  (physical estimate)
-- ===========================================================================
create or replace view public.inventory_status
with (security_invoker = true) as
select
  p.id                 as product_id,
  p.name,
  p.slug,
  p.sku,
  p.stock_quantity,
  p.low_stock_threshold,
  coalesce(r.reserved, 0)::int as reserved_quantity,
  (p.stock_quantity + coalesce(r.reserved, 0))::int as on_hand_quantity,
  case
    when p.stock_quantity <= 0 then 'out_of_stock'
    when p.stock_quantity <= p.low_stock_threshold then 'low_stock'
    else 'healthy'
  end as status,
  p.is_active,
  p.updated_at
from public.products p
left join (
  select oi.product_id, sum(oi.quantity) as reserved
  from public.order_items oi
  join public.orders o on o.id = oi.order_id
  where o.status in ('pending', 'confirmed', 'preparing', 'shipped')
    and oi.product_id is not null
  group by 1
) r on r.product_id = p.id;

grant select on public.inventory_status to authenticated;
