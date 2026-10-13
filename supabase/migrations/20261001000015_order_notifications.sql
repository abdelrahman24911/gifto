-- FL TASE3 — new-order notifications (transactional outbox)
--
-- Active channel: EMAIL (Resend). WhatsApp is intentionally dormant: the enum
-- value exists for a future opt-in, but no order ever enqueues a WhatsApp job
-- and the worker only claims the email channel, so the WhatsApp API is never
-- called.
--
-- Reliability model:
--   * The outbox row is written INSIDE `create_order`, in the same transaction
--     as the order. A notification can therefore never be queued for an order
--     that did not persist, and a persisted order always has exactly one job.
--   * `idempotency_key` (order + event + channel) plus the composite unique
--     constraint make retried checkouts / duplicate enqueue calls harmless.
--   * A separate server-side worker claims due jobs atomically
--     (`FOR UPDATE SKIP LOCKED`), sends them, and records sent/failed with
--     bounded attempts and backoff. A WhatsApp failure never rolls back the
--     order and never surfaces to the customer.
--
-- The worker RPCs are gated on `is_service_role()` / `is_trusted_session()`
-- (see migration 14); no anon/authenticated caller can read the outbox or
-- trigger a notification. RLS additionally restricts direct reads to staff.

-- ---------------------------------------------------------------------------
-- 1. Status + channel enums
-- ---------------------------------------------------------------------------

create type public.notification_status as enum ('pending', 'sending', 'sent', 'failed');
-- 'email' is the active channel; 'whatsapp' is reserved for a future opt-in.
create type public.notification_channel as enum ('email', 'whatsapp');

-- ---------------------------------------------------------------------------
-- 2. Outbox table
-- ---------------------------------------------------------------------------

create table public.notification_outbox (
  id                  uuid primary key default gen_random_uuid(),
  order_id            uuid not null references public.orders (id) on delete cascade,
  channel             public.notification_channel not null default 'email',
  event_type          text not null default 'order_created',
  idempotency_key     text not null unique,
  payload             jsonb not null,
  status              public.notification_status not null default 'pending',
  attempts            int not null default 0 check (attempts >= 0),
  max_attempts        int not null default 5 check (max_attempts >= 1),
  next_attempt_at     timestamptz not null default now(),
  locked_at           timestamptz,
  last_error          text,
  provider_message_id text,
  sent_at             timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint notification_outbox_order_event_channel_uq
    unique (order_id, event_type, channel)
);

alter table public.notification_outbox enable row level security;

create policy "notification_outbox: staff read" on public.notification_outbox
  for select using (public.is_staff());
-- No insert/update/delete policy: rows are written only by SECURITY DEFINER
-- functions (`create_order`, claim, mark) so RLS can never be bypassed by a
-- direct client write.

create trigger notification_outbox_set_updated_at
  before update on public.notification_outbox
  for each row execute function public.set_updated_at();

create index notification_outbox_due_idx
  on public.notification_outbox (next_attempt_at)
  where status in ('pending', 'failed');

create index notification_outbox_order_idx
  on public.notification_outbox (order_id);

-- ---------------------------------------------------------------------------
-- 3. Re-declare the strict `create_order` (migration 13) to enqueue the job
-- ---------------------------------------------------------------------------
-- Only the notification insert is added; all validation, pricing, stock and
-- inventory behavior is byte-for-byte the migration-13 implementation. The
-- transitional legacy overload from migration 13 keeps delegating here, so it
-- inherits the outbox write automatically.

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

  -- Queue the owner notification (email) in the SAME transaction. The payload is
  -- built from authoritative persisted values (snapshots, server totals), never
  -- from client-submitted money or item data. `on conflict` makes re-runs
  -- harmless, and the unique (order_id, event_type, channel) constraint means an
  -- order can never enqueue a duplicate job for this channel.
  insert into public.notification_outbox (order_id, channel, event_type, idempotency_key, payload)
  values (
    v_order_id,
    'email',
    'order_created',
    'order:' || v_order_id::text || ':order_created:email',
    jsonb_build_object(
      'order_number', v_order_number,
      'customer_name', trim(p_full_name),
      'customer_phone', p_phone,
      'items', coalesce((
        select jsonb_agg(jsonb_build_object(
                 'name', oi.product_name_snapshot,
                 'quantity', oi.quantity,
                 'unit_price', oi.unit_price
               ) order by oi.created_at)
        from public.order_items oi
        where oi.order_id = v_order_id
      ), '[]'::jsonb),
      'subtotal', v_subtotal,
      'delivery_fee', v_delivery_fee,
      'total', v_subtotal + v_delivery_fee,
      'currency', 'EGP',
      'payment_status', v_payment,
      'governorate', trim(p_governorate),
      'area', nullif(trim(coalesce(p_area, '')), ''),
      'delivery_address', trim(p_delivery_address),
      'delivery_notes', nullif(trim(coalesce(p_delivery_notes, '')), '')
    )
  )
  on conflict (idempotency_key) do nothing;

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
-- 4. Worker RPCs — service-role only
-- ---------------------------------------------------------------------------

-- Atomically claim due jobs for a single channel (defaults to the active email
-- channel). Restricting by channel means the dormant WhatsApp channel is never
-- claimed and therefore never sent. Jobs stuck in "sending" longer than 10
-- minutes (worker crash or ambiguous provider timeout) are released back to
-- 'failed' so they are retried rather than lost. Exactly-once external delivery
-- cannot be guaranteed; this is at-least-once with idempotent bookkeeping.
create or replace function public.claim_notification_jobs(
  p_limit int default 10,
  p_channel public.notification_channel default 'email'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit int := greatest(1, least(coalesce(p_limit, 10), 50));
  v_jobs  jsonb;
begin
  if not (coalesce(public.is_service_role(), false) or coalesce(public.is_trusted_session(), false)) then
    raise exception 'Not authorized to claim notifications.';
  end if;

  update public.notification_outbox
     set status = 'failed',
         locked_at = null,
         next_attempt_at = now(),
         last_error = coalesce(last_error, 'Timed out before the provider confirmed delivery.')
   where status = 'sending'
     and channel = p_channel
     and locked_at < now() - interval '10 minutes';

  with due as (
    select id
      from public.notification_outbox
     where status in ('pending', 'failed')
       and channel = p_channel
       and next_attempt_at <= now()
       and attempts < max_attempts
     order by next_attempt_at asc
     limit v_limit
     for update skip locked
  ),
  claimed as (
    update public.notification_outbox o
       set status = 'sending',
           locked_at = now(),
           attempts = o.attempts + 1
      from due
     where o.id = due.id
    returning o.id, o.order_id, o.channel, o.event_type, o.payload, o.attempts, o.max_attempts
  )
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', c.id,
           'order_id', c.order_id,
           'channel', c.channel,
           'event_type', c.event_type,
           'payload', c.payload,
           'attempts', c.attempts,
           'max_attempts', c.max_attempts
         )), '[]'::jsonb)
    into v_jobs
    from claimed c;

  return v_jobs;
end;
$$;

create or replace function public.mark_notification_sent(
  p_id uuid,
  p_provider_message_id text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (coalesce(public.is_service_role(), false) or coalesce(public.is_trusted_session(), false)) then
    raise exception 'Not authorized to update notifications.';
  end if;

  update public.notification_outbox
     set status = 'sent',
         sent_at = now(),
         locked_at = null,
         provider_message_id = nullif(trim(coalesce(p_provider_message_id, '')), ''),
         last_error = null
   where id = p_id;
end;
$$;

create or replace function public.mark_notification_failed(
  p_id uuid,
  p_error text,
  p_retry boolean default false,
  p_next_attempt_at timestamptz default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (coalesce(public.is_service_role(), false) or coalesce(public.is_trusted_session(), false)) then
    raise exception 'Not authorized to update notifications.';
  end if;

  update public.notification_outbox
     set status = 'failed',
         locked_at = null,
         last_error = left(coalesce(nullif(trim(p_error), ''), 'Notification failed.'), 500),
         next_attempt_at = case
           when coalesce(p_retry, false) and attempts < max_attempts
             then coalesce(p_next_attempt_at, now() + interval '1 minute')
           else null
         end
   where id = p_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Grants
-- ---------------------------------------------------------------------------

revoke all on function public.claim_notification_jobs(int, public.notification_channel) from public, anon, authenticated;
revoke all on function public.mark_notification_sent(uuid, text) from public, anon, authenticated;
revoke all on function public.mark_notification_failed(uuid, text, boolean, timestamptz) from public, anon, authenticated;

grant execute on function public.claim_notification_jobs(int, public.notification_channel) to service_role;
grant execute on function public.mark_notification_sent(uuid, text) to service_role;
grant execute on function public.mark_notification_failed(uuid, text, boolean, timestamptz) to service_role;

grant select, insert, update, delete on public.notification_outbox to service_role;
