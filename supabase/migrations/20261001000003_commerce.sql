-- FL TASE3 — customers, orders, inventory movements

-- ---------------------------------------------------------------------------
-- customers (guest checkout friendly — matched by phone or email)
-- ---------------------------------------------------------------------------
create table public.customers (
  id         uuid primary key default gen_random_uuid(),
  full_name  text not null,
  phone      text,
  email      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customers_contact_check check (phone is not null or email is not null)
);

alter table public.customers enable row level security;

create unique index customers_phone_uq on public.customers (lower(phone)) where phone is not null;
create unique index customers_email_uq on public.customers (lower(email)) where email is not null;

create trigger customers_set_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------
create type public.order_source as enum ('website', 'instagram', 'whatsapp', 'store', 'manual');
create type public.order_status as enum ('pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled');
create type public.payment_status as enum ('pending', 'paid', 'failed', 'cash_on_delivery');
create type public.movement_type as enum ('sale', 'restock', 'adjustment', 'cancellation', 'return');

create sequence public.order_number_seq start 1001;

create table public.orders (
  id               uuid primary key default gen_random_uuid(),
  order_number     text not null unique
                   default 'FT-' || nextval('public.order_number_seq'),
  customer_id      uuid not null references public.customers (id) on delete restrict,
  source           public.order_source not null default 'website',
  status           public.order_status not null default 'pending',
  payment_status   public.payment_status not null default 'cash_on_delivery',
  subtotal         numeric(10,2) not null default 0 check (subtotal >= 0),
  delivery_fee     numeric(10,2) not null default 0 check (delivery_fee >= 0),
  total            numeric(10,2) not null default 0 check (total >= 0),
  notes            text,
  gift_message     text,
  delivery_address text not null,
  governorate      text not null,
  area             text,
  created_by       uuid references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.orders enable row level security;

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create index orders_created_at_idx on public.orders (created_at desc);
create index orders_status_idx on public.orders (status, created_at desc);
create index orders_customer_idx on public.orders (customer_id);
create index orders_source_idx on public.orders (source);

-- ---------------------------------------------------------------------------
-- order_items — snapshots keep history stable when a product changes
-- ---------------------------------------------------------------------------
create table public.order_items (
  id                   uuid primary key default gen_random_uuid(),
  order_id             uuid not null references public.orders (id) on delete cascade,
  product_id           uuid references public.products (id) on delete set null,
  product_name_snapshot text not null,
  slug_snapshot        text,
  unit_price           numeric(10,2) not null check (unit_price >= 0),
  quantity             int not null check (quantity > 0),
  line_total           numeric(10,2) generated always as (unit_price * quantity) stored,
  personalization_data jsonb not null default '{}'::jsonb,
  created_at           timestamptz not null default now()
);

alter table public.order_items enable row level security;

create index order_items_order_idx on public.order_items (order_id);
create index order_items_product_idx on public.order_items (product_id);

-- ---------------------------------------------------------------------------
-- order status audit trail
-- ---------------------------------------------------------------------------
create table public.order_status_history (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders (id) on delete cascade,
  from_status public.order_status,
  to_status   public.order_status not null,
  note        text,
  changed_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

alter table public.order_status_history enable row level security;

create index order_status_history_order_idx on public.order_status_history (order_id, created_at desc);

-- ---------------------------------------------------------------------------
-- inventory_movements — the traceable history of every stock change
-- ---------------------------------------------------------------------------
create table public.inventory_movements (
  id             uuid primary key default gen_random_uuid(),
  product_id     uuid not null references public.products (id) on delete cascade,
  type           public.movement_type not null,
  quantity       int not null,
  reference_type text,
  reference_id   uuid,
  note           text,
  created_by     uuid references public.profiles (id) on delete set null,
  created_at     timestamptz not null default now()
);

alter table public.inventory_movements enable row level security;

create index inventory_movements_product_idx on public.inventory_movements (product_id, created_at desc);
create index inventory_movements_created_idx on public.inventory_movements (created_at desc);
