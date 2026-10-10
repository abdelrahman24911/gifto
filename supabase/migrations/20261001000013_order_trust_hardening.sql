-- FL TASE3 — order trust hardening (P0 §10.1 #2)
--
-- `create_order` previously accepted `p_delivery_fee numeric` and
-- `p_payment_status` from the caller and wrote them verbatim into the order
-- (migration 09). A caller who bypasses the app could zero the delivery fee or
-- mark an order `paid` without paying.
--
-- Fix: the delivery fee and payment status are now DERIVED inside the RPC:
--   - delivery fee  -> `public.delivery_fee_for(governorate, subtotal)`, from a
--                      DB-backed tier table that mirrors the app constants in
--                      `src/lib/constants.ts` (GOVERNORATES fees,
--                      DEFAULT_DELIVERY_FEE=60, FREE_DELIVERY_THRESHOLD=1500).
--   - payment status -> derived 1:1 from `p_payment_method`, an enum whose only
--                      values are `cash_on_delivery` / `card`. There is no
--                      caller input that can produce `paid` or `failed`.
-- The old signature (with `numeric, payment_status`) is RETAINED as a hardened
-- transitional overload (Option B, zero-downtime rollout). It ignores the
-- caller-supplied `p_delivery_fee`, whitelists `p_payment_status` to the only
-- two non-paid values the legacy app can send, maps that to a payment method,
-- and delegates to the strict implementation -- so an old RPC call can never
-- mark an order paid or set its delivery fee. It is replaced in place (no
-- DROP), so there is never a moment when the legacy signature is missing. A
-- follow-up migration removes it once the legacy app is fully replaced.

-- ---------------------------------------------------------------------------
-- 1. Payment methods
-- ---------------------------------------------------------------------------

create type public.payment_method as enum ('cash_on_delivery', 'card');

-- ---------------------------------------------------------------------------
-- 2. DB-backed delivery tiers (mirrors GOVERNORATES fees in src/lib/constants.ts)
-- ---------------------------------------------------------------------------

create table public.delivery_fees (
  governorate_slug text primary key,
  fee              numeric(10,2) not null check (fee >= 0)
);

insert into public.delivery_fees (governorate_slug, fee) values
  ('cairo', 60), ('giza', 65), ('alexandria', 70), ('behera', 75), ('gharbia', 75),
  ('qalyubia', 70), ('sharqia', 80), ('mansoura', 80), ('ismailia', 85), ('fayoum', 85),
  ('minya', 95), ('assiut', 100), ('sohag', 105), ('qena', 110), ('luxor', 115),
  ('aswan', 120), ('red-sea', 130), ('new-valley', 140), ('matrouh', 130),
  ('sinai', 140), ('suez', 90), ('port-said', 90), ('damietta', 90), ('kafr-el-sheikh', 85)
on conflict (governorate_slug) do update set fee = excluded.fee;

alter table public.delivery_fees enable row level security;

create policy "delivery_fees: read all" on public.delivery_fees
  for select using (true);

-- ---------------------------------------------------------------------------
-- 3. Delivery fee is a DB decision
-- ---------------------------------------------------------------------------
-- Mirrors `deliveryFeeFor` in src/lib/checkout.ts:
--   subtotal >= 1500 -> free; known governorate -> its fee; otherwise 60.
-- Values are deliberately duplicated in the migration header comment so a
-- business change must be reviewed in both places (constants + DB).

create or replace function public.delivery_fee_for(p_governorate text, p_subtotal numeric)
returns numeric
language sql stable security definer
set search_path = public
as $$
  select case
    when p_subtotal >= 1500 then 0
    else coalesce(
      (select df.fee from public.delivery_fees df where df.governorate_slug = trim(p_governorate)),
      60
    )
  end;
$$;

grant execute on function public.delivery_fee_for(text, numeric) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Harden create_order: no caller-supplied money or status
--    4a — strict implementation (new signature, p_payment_method)
--    4b — transitional legacy overload (old signature, hardened, delegates)
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
  p_payment_method     public.payment_method default 'cash_on_delivery'
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
  v_delivery_fee numeric(10,2);
  v_payment     public.payment_status := 'cash_on_delivery';
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

  -- payment status is derived, never caller-supplied
  v_payment := case p_payment_method
    when 'card' then 'pending'::public.payment_status
    else 'cash_on_delivery'::public.payment_status
  end;

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
    v_customer_id, p_source, 'pending', v_payment,
    0, 0, 0, nullif(trim(coalesce(p_delivery_notes, '')), ''),
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

  -- delivery fee depends only on governorate + server-computed subtotal
  v_delivery_fee := public.delivery_fee_for(p_governorate, v_subtotal);

  update public.orders
     set subtotal = v_subtotal,
         delivery_fee = v_delivery_fee,
         total = v_subtotal + v_delivery_fee
   where id = v_order_id;

  insert into public.order_status_history (order_id, from_status, to_status, note, changed_by)
  values (v_order_id, null, 'pending', 'Order placed', auth.uid());

  return jsonb_build_object(
    'id', v_order_id,
    'order_number', v_order_number,
    'subtotal', v_subtotal,
    'delivery_fee', v_delivery_fee,
    'total', v_subtotal + v_delivery_fee,
    'payment_status', v_payment
  );
end;
$$;

revoke all on function public.create_order(jsonb, text, text, text, text, text, text, text, text, public.order_source, public.payment_method) from public;
grant execute on function public.create_order(jsonb, text, text, text, text, text, text, text, text, public.order_source, public.payment_method) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4b. Transitional legacy overload (zero-downtime compatibility)
-- ---------------------------------------------------------------------------
-- The currently deployed app calls this signature. `create or replace` swaps
-- the old, insecure body for this hardened adapter IN PLACE, so there is never
-- a window where the legacy signature is missing. The legacy arguments are not
-- trusted:
--   * `p_delivery_fee` is ignored entirely — the fee is derived by the strict
--     overload from `delivery_fees` / subtotal;
--   * `p_payment_status` is accepted only if it is one of the two non-paid
--     values the legacy app can legitimately send, and is mapped to a payment
--     method; anything else ('paid', 'failed', ...) raises.
-- PostgREST resolution stays unambiguous: a body carrying
-- `p_delivery_fee`/`p_payment_status` matches only this overload, a body
-- carrying `p_payment_method` matches only the strict overload, and a body
-- carrying neither is ambiguous and fails closed.

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
  v_method public.payment_method;
begin
  -- `p_delivery_fee` is deliberately ignored (never trusted).
  case p_payment_status
    when 'cash_on_delivery' then v_method := 'cash_on_delivery';
    when 'pending'          then v_method := 'card';
    else
      raise exception 'Unsupported payment status "%".', p_payment_status;
  end case;

  return public.create_order(
    p_items            => p_items,
    p_full_name        => p_full_name,
    p_phone            => p_phone,
    p_email            => p_email,
    p_governorate      => p_governorate,
    p_area             => p_area,
    p_delivery_address => p_delivery_address,
    p_delivery_notes   => p_delivery_notes,
    p_gift_message     => p_gift_message,
    p_source           => p_source,
    p_payment_method   => v_method
  );
end;
$$;

revoke all on function public.create_order(jsonb, text, text, text, text, text, text, text, text, public.order_source, numeric, public.payment_status) from public;
grant execute on function public.create_order(jsonb, text, text, text, text, text, text, text, text, public.order_source, numeric, public.payment_status) to anon, authenticated;