-- FL TASE3 - link customers to registered accounts
-- A guest checkout stays a guest checkout. A signed-in customer only ever gets
-- linked to a customer row when we can prove the row is theirs: either the row
-- is created during their session, or the checkout email matches both the row
-- and the email inside their verified auth token.

alter table public.customers
  add column if not exists user_id uuid references auth.users (id) on delete set null;

create unique index if not exists customers_user_uq
  on public.customers (user_id) where user_id is not null;

create index if not exists customers_user_idx on public.customers (user_id);

-- ---------------------------------------------------------------------------
-- The signed-in customer can read (never write) their own records.
-- The existing staff-only policies keep working: policies for the same
-- command are OR-ed together.
-- ---------------------------------------------------------------------------
create policy "customers: read own" on public.customers
  for select using (user_id is not null and user_id = auth.uid());

create policy "orders: read own" on public.orders
  for select using (
    exists (
      select 1 from public.customers c
      where c.id = orders.customer_id
        and c.user_id = auth.uid()
    )
  );

create policy "order_items: read own" on public.order_items
  for select using (
    exists (
      select 1
        from public.orders o
        join public.customers c on c.id = o.customer_id
      where o.id = order_items.order_id
        and c.user_id = auth.uid()
    )
  );

create policy "order_status_history: read own" on public.order_status_history
  for select using (
    exists (
      select 1
        from public.orders o
        join public.customers c on c.id = o.customer_id
      where o.id = order_status_history.order_id
        and c.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- create_order: safe account linking
-- ---------------------------------------------------------------------------
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
  v_safe_link   boolean := false;
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

  -- 1) email match wins, and it only counts as "ours" when the submitted email
  --    also equals the verified email in the caller's auth token.
  if p_email is not null then
    select id into v_customer_id
      from public.customers
     where lower(email) = lower(trim(p_email))
     limit 1;

    if v_customer_id is not null then
      v_safe_link := auth.uid() is not null
        and lower(trim(p_email)) = lower(coalesce(auth.jwt() ->> 'email', ''));
    end if;
  end if;

  -- 2) otherwise fall back to a phone match, which is never linked automatically
  if v_customer_id is null and p_phone is not null then
    select id into v_customer_id
      from public.customers
     where lower(phone) = lower(p_phone)
     limit 1;
  end if;

  if v_customer_id is null then
    insert into public.customers (full_name, phone, email, user_id)
    values (trim(p_full_name), p_phone,
            nullif(trim(coalesce(p_email, '')), ''), auth.uid())
    returning id into v_customer_id;
  else
    update public.customers
       set full_name = trim(p_full_name),
           phone     = coalesce(phone, p_phone),
           email     = coalesce(email, nullif(trim(coalesce(p_email, '')), '')),
           user_id   = case when v_safe_link then coalesce(user_id, auth.uid()) else user_id end,
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

grant execute on function public.create_order(jsonb, text, text, text, text, text, text, text, text, public.order_source, numeric, public.payment_status) to anon, authenticated;
