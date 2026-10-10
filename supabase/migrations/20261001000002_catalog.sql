-- FL TASE3 — product catalog

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  image_path  text,
  is_active   boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.categories enable row level security;

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
create table public.products (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  slug                text not null unique,
  description         text not null default '',
  short_description   text,
  price               numeric(10,2) not null check (price >= 0),
  compare_at_price    numeric(10,2) check (compare_at_price is null or compare_at_price >= price),
  sku                 text unique,
  stock_quantity      int not null default 0 check (stock_quantity >= 0),
  low_stock_threshold int not null default 5 check (low_stock_threshold >= 0),
  is_active           boolean not null default true,
  is_featured         boolean not null default false,
  is_best_seller      boolean not null default false,
  is_customizable     boolean not null default false,
  rating              numeric(2,1) not null default 0 check (rating between 0 and 5),
  reviews_count       int not null default 0 check (reviews_count >= 0),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.products enable row level security;

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- product_images (Supabase Storage paths — never binary data)
-- ---------------------------------------------------------------------------
create table public.product_images (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references public.products (id) on delete cascade,
  storage_path text not null,
  alt_text     text,
  sort_order   int not null default 0,
  is_primary   boolean not null default false,
  created_at   timestamptz not null default now()
);

alter table public.product_images enable row level security;

create unique index product_images_one_primary
  on public.product_images (product_id) where is_primary;

create index product_images_product_idx on public.product_images (product_id, sort_order);

-- ---------------------------------------------------------------------------
-- taxonomy tags: recipient / occasion / vibe / general
-- ---------------------------------------------------------------------------
create table public.product_tags (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null,
  kind       text not null default 'general'
            check (kind in ('recipient', 'occasion', 'vibe', 'general')),
  sort_order int not null default 0,
  unique (slug, kind)
);

alter table public.product_tags enable row level security;

create table public.product_tag_relations (
  product_id uuid not null references public.products (id) on delete cascade,
  tag_id     uuid not null references public.product_tags (id) on delete cascade,
  primary key (product_id, tag_id)
);

alter table public.product_tag_relations enable row level security;

create index product_tag_relations_tag_idx on public.product_tag_relations (tag_id);

-- ---------------------------------------------------------------------------
-- product <-> category (many to many)
-- ---------------------------------------------------------------------------
create table public.product_categories (
  product_id  uuid not null references public.products (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  primary key (product_id, category_id)
);

alter table public.product_categories enable row level security;

create index product_categories_category_idx on public.product_categories (category_id);

-- ---------------------------------------------------------------------------
-- product options & values (color / size / personalization)
-- ---------------------------------------------------------------------------
create table public.product_options (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products (id) on delete cascade,
  name        text not null,
  type        text not null default 'text' check (type in ('text', 'select', 'color', 'personalization')),
  is_required boolean not null default false,
  sort_order  int not null default 0
);

alter table public.product_options enable row level security;

create index product_options_product_idx on public.product_options (product_id, sort_order);

create table public.product_option_values (
  id         uuid primary key default gen_random_uuid(),
  option_id  uuid not null references public.product_options (id) on delete cascade,
  value      text not null,
  sort_order int not null default 0
);

alter table public.product_option_values enable row level security;

create index product_option_values_option_idx on public.product_option_values (option_id, sort_order);
