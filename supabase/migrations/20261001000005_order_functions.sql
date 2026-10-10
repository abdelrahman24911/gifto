-- FL TASE3 — order + inventory functions
-- Every stock-changing operation goes through one of these functions so that
-- products.stock_quantity and inventory_movements can never drift apart.

-- ===========================================================================
-- 1. Create an order (guest checkout AND manual/admin sales share this path)
-- ===========================================================================
create or replace function public.create_order(
  p_items              jsonb,
  p_full_name          text,
  p_phone              text,
  p_email              text,
  p_governorate        text,
  p_area               text,
  p_delivery_address   text,
  p_delivery_notes     text default null,
  p_gift_message       text default null,
  p_source             public.order_source default 'website',
  p_delivery_fee       numeric default 0,
  p_payment_status     public.payment_status default 'cash_on_delivery'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item        jsonb;
  v_product     public.products%rowtype;
  v_qty         int;
  v_subtotal    numeric(10,2) := 0;
  v_order_id    uuid;
  v_order_number text;
  v_customer_id uuid;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Your cart is empty.';
  end if;
  if p_full_name is null or length(trim(p_full_name)) < 2 then
    raise exception 'Please enter the recipient full name.';
  end if;
  if p_phone is null or p_phone !~ '^[0-9+\s\-]{8,20}$' then
    raise exception 'Please enter a valid phone number.';
  end if;
  if p_governorate is null or length(trim(p_governorate)) = 0 then
    raise exception 'Please choose a governorate.';
  end if;
  if p_delivery_address is null or length(trim(p_delivery_address)) < 5 then
    raise exception 'Please enter a delivery address.';
  end if;
  if p_delivery_fee < 0 then
    raise exception 'Invalid delivery fee.';
  end if;

  -- resolve / create the customer
  select id into v_customer_id from public.customers
   where (p_phone is not null and lower(phone) = lower(p_phone))
      or (p_email is not null and lower(email) = lower(p_email))
   limit 1;

  if v_customer_id is null then
    insert into public.customers (full_name, phone, email)
    values (trim(p_full_name), p_phone, nullif(trim(coalesce(p_email, '')), ''))
    returning id into v_customer_id;
  else
    update public.customers
       set full_name = trim(p_full_name),
           phone     = coalesce(phone, p_phone),
           email     = coalesce(email, nullif(trim(coalesce(p_email, '')), '')),
           updated_at = now()
     where id = v_customer_id;
  end if;

  insert into public.orders (
    customer_id, source, status, payment_status,
    subtotal, delivery_fee, total, notes, gift_message,
    delivery_address, governorate, area, created_by
  ) values (
    v_customer_id, p_source, 'pending', p_payment_status,
    0, p_delivery_fee, 0, nullif(trim(coalesce(p_delivery_notes, '')), ''),
    nullif(trim(coalesce(p_gift_message, '')), ''),
    trim(p_delivery_address), trim(p_governorate), nullif(trim(coalesce(p_area, '')), ''),
    auth.uid()
  )
  returning id, order_number into v_order_id, v_order_number;

  for v_item in select value from jsonb_array_elements(p_items) loop
    v_qty := nullif(v_item ->> 'quantity', '')::int;

    if v_qty is null or v_qty < 1 then
      raise exception 'Invalid quantity for a cart item.';
    end if;

    if nullif(v_item ->> 'product_id', '') is null then
      raise exception 'A cart item is missing its product.';
    end if;

    select * into v_product
      from public.products
     where id = (v_item ->> 'product_id')::uuid
       for update;

    if not found then
      raise exception 'One of the products in your cart no longer exists.';
    end if;
    if not v_product.is_active then
      raise exception '% is currently unavailable.', v_product.name;
    end if;
    if v_product.stock_quantity < v_qty then
      raise exception 'Only % left of %.', v_product.stock_quantity, v_product.name;
    end if;

    insert into public.order_items (
      order_id, product_id, product_name_snapshot, slug_snapshot,
      unit_price, quantity, personalization_data
    ) values (
      v_order_id, v_product.id, v_product.name, v_product.slug,
      v_product.price, v_qty,
      case when v_item -> 'personalization' is null
           then '{}'::jsonb
           else v_item -> 'personalization' end
    );

    update public.products
       set stock_quantity = stock_quantity - v_qty
     where id = v_product.id;

    insert into public.inventory_movements (
      product_id, type, quantity, reference_type, reference_id, note, created_by
    ) values (
      v_product.id, 'sale', -v_qty, 'order', v_order_id,
      'Sold via ' || p_source || ' order ' || v_order_number,
      auth.uid()
    );

    v_subtotal := v_subtotal + (v_product.price * v_qty);
  end loop;

  update public.orders
     set subtotal = v_subtotal,
         total = v_subtotal + p_delivery_fee
   where id = v_order_id;

  insert into public.order_status_history (order_id, from_status, to_status, note, changed_by)
  values (v_order_id, null, 'pending', 'Order placed', auth.uid());

  return jsonb_build_object(
    'id', v_order_id,
    'order_number', v_order_number,
    'subtotal', v_subtotal,
    'delivery_fee', p_delivery_fee,
    'total', v_subtotal + p_delivery_fee
  );
end;
$$;

revoke all on function public.create_order(jsonb, text, text, text, text, text, text, text, text, public.order_source, numeric, public.payment_status) from public;
grant execute on function public.create_order(jsonb, text, text, text, text, text, text, text, text, public.order_source, numeric, public.payment_status) to anon, authenticated;

-- ===========================================================================
-- 2. Change an order status (auditable, reverses stock on cancellation)
-- ===========================================================================
create or replace function public.set_order_status(
  p_order_id   uuid,
  p_new_status public.order_status,
  p_note       text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order  public.orders%rowtype;
  v_item   public.order_items%rowtype;
begin
  if not public.is_staff() then
    raise exception 'You are not allowed to change order statuses.';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Order not found.';
  end if;
  if v_order.status = p_new_status then
    return jsonb_build_object('id', v_order.id, 'status', v_order.status, 'changed', false);
  end if;

  update public.orders set status = p_new_status where id = p_order_id;

  insert into public.order_status_history (order_id, from_status, to_status, note, changed_by)
  values (p_order_id, v_order.status, p_new_status, nullif(trim(coalesce(p_note, '')), ''), auth.uid());

  if p_new_status = 'cancelled' then
    for v_item in select * from public.order_items where order_id = p_order_id and product_id is not null loop
      update public.products set stock_quantity = stock_quantity + v_item.quantity where id = v_item.product_id;
      insert into public.inventory_movements (product_id, type, quantity, reference_type, reference_id, note, created_by)
      values (v_item.product_id, 'cancellation', v_item.quantity, 'order', p_order_id,
              'Restocked from cancelled order ' || v_order.order_number, auth.uid());
    end loop;
  elsif v_order.status = 'cancelled' then
    -- re-opening a previously cancelled order re-commits its stock
    for v_item in select * from public.order_items where order_id = p_order_id and product_id is not null loop
      perform 1 from public.products where id = v_item.product_id for update;
      if not found then
        continue;
      end if;
      if (select stock_quantity from public.products where id = v_item.product_id) < v_item.quantity then
        raise exception 'Not enough stock to reopen this order for %.', v_item.product_name_snapshot;
      end if;
      update public.products set stock_quantity = stock_quantity - v_item.quantity where id = v_item.product_id;
      insert into public.inventory_movements (product_id, type, quantity, reference_type, reference_id, note, created_by)
      values (v_item.product_id, 'sale', -v_item.quantity, 'order', p_order_id,
              'Stock re-committed after reopening order ' || v_order.order_number, auth.uid());
    end loop;
  end if;

  return jsonb_build_object('id', v_order.id, 'status', p_new_status, 'changed', true);
end;
$$;

-- ===========================================================================
-- 3. Payment status
-- ===========================================================================
create or replace function public.set_payment_status(
  p_order_id uuid,
  p_new_status public.payment_status
)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare v_order public.orders%rowtype;
begin
  if not public.is_staff() then
    raise exception 'You are not allowed to change payment statuses.';
  end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found.'; end if;
  update public.orders set payment_status = p_new_status where id = p_order_id;
  insert into public.order_status_history (order_id, from_status, to_status, note, changed_by)
  values (p_order_id, v_order.status, v_order.status, 'Payment set to ' || p_new_status, auth.uid());
  return jsonb_build_object('id', p_order_id, 'payment_status', p_new_status);
end;
$$;

-- ===========================================================================
-- 4. Manual stock adjustment (reason is mandatory)
-- ===========================================================================
create or replace function public.adjust_stock(
  p_product_id uuid,
  p_new_stock  int,
  p_reason     text
)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_product public.products%rowtype;
  v_delta   int;
  v_reason  text := nullif(trim(coalesce(p_reason, '')), '');
begin
  if not public.is_staff() then
    raise exception 'You are not allowed to adjust inventory.';
  end if;
  if v_reason is null or length(v_reason) < 3 then
    raise exception 'A reason is required for stock adjustments.';
  end if;
  if p_new_stock is null or p_new_stock < 0 then
    raise exception 'Stock cannot be negative.';
  end if;

  select * into v_product from public.products where id = p_product_id for update;
  if not found then raise exception 'Product not found.'; end if;

  v_delta := p_new_stock - v_product.stock_quantity;
  if v_delta = 0 then
    return jsonb_build_object('changed', false, 'stock_quantity', v_product.stock_quantity);
  end if;

  update public.products set stock_quantity = p_new_stock where id = p_product_id;

  insert into public.inventory_movements (product_id, type, quantity, reference_type, reference_id, note, created_by)
  values (
    p_product_id,
    case when v_delta > 0 then 'restock'::public.movement_type else 'adjustment'::public.movement_type end,
    v_delta, 'manual', null,
    v_reason, auth.uid()
  );

  return jsonb_build_object('changed', true, 'stock_quantity', p_new_stock, 'delta', v_delta);
end;
$$;

-- ===========================================================================
-- 5. Quick restock
-- ===========================================================================
create or replace function public.restock(
  p_product_id uuid,
  p_quantity   int,
  p_note       text default null
)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare v_product public.products%rowtype;
begin
  if not public.is_staff() then
    raise exception 'You are not allowed to restock inventory.';
  end if;
  if p_quantity is null or p_quantity < 1 then
    raise exception 'Quantity must be at least 1.';
  end if;
  select * into v_product from public.products where id = p_product_id for update;
  if not found then raise exception 'Product not found.'; end if;

  update public.products set stock_quantity = stock_quantity + p_quantity where id = p_product_id;

  insert into public.inventory_movements (product_id, type, quantity, reference_type, note, created_by)
  values (p_product_id, 'restock', p_quantity, 'manual',
          nullif(trim(coalesce(p_note, '')), 'Restocked'), auth.uid());

  return jsonb_build_object('changed', true, 'stock_quantity', v_product.stock_quantity + p_quantity);
end;
$$;

-- ===========================================================================
-- 6. Guest order lookup — requires order number AND checkout phone
-- ===========================================================================
create or replace function public.get_order_status(
  p_order_number text,
  p_phone         text
)
returns jsonb
language plpgsql stable security definer
set search_path = public
as $$
declare v_order public.orders%rowtype;
begin
  select * into v_order
    from public.orders o
    join public.customers c on c.id = o.customer_id
   where upper(o.order_number) = upper(trim(p_order_number))
     and c.phone is not null
     and lower(c.phone) = lower(trim(p_phone))
   limit 1;

  if not found then
    return null;
  end if;

  return (
    select jsonb_build_object(
      'order_number', v_order.order_number,
      'status', v_order.status,
      'payment_status', v_order.payment_status,
      'total', v_order.total,
      'governorate', v_order.governorate,
      'created_at', v_order.created_at,
      'items', coalesce((
        select jsonb_agg(jsonb_build_object(
          'name', oi.product_name_snapshot,
          'quantity', oi.quantity,
          'unit_price', oi.unit_price
        ) order by oi.created_at)
        from public.order_items oi where oi.order_id = v_order.id
      ), '[]'::jsonb)
    )
  );
end;
$$;
