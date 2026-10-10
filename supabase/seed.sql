-- ===========================================================================
-- FL TASE3 — demo seed data
-- ---------------------------------------------------------------------------
-- Everything below is DEMO data. Replace it with the real Fl Tase3 catalogue
-- through the admin dashboard (or edit this file and re-run `npm run db:reset`).
-- Prices are realistic Egyptian EGP values.
-- ===========================================================================

begin;

-- ---------------------------------------------------------------------------
-- categories (8)
-- ---------------------------------------------------------------------------
insert into public.categories (id, name, slug, description, sort_order, is_active) values
  ('11111111-1111-1111-1111-000000000001', 'For Her',       'for-her',        'Thoughtful picks she will actually use.',        1, true),
  ('11111111-1111-1111-1111-000000000002', 'For Him',       'for-him',        'Gifts that do not end up in a drawer.',          2, true),
  ('11111111-1111-1111-1111-000000000003', 'Your Person',   'your-person',    'For the one who already has everything.',        3, true),
  ('11111111-1111-1111-1111-000000000004', 'Birthday',      'birthday',       'Make their day feel like a whole event.',        4, true),
  ('11111111-1111-1111-1111-000000000005', 'Graduation',    'graduation',     'They made it. Say it properly.',                 5, true),
  ('11111111-1111-1111-1111-000000000006', 'Just Because',  'just-because',   'No reason is the best reason.',                  6, true),
  ('11111111-1111-1111-1111-000000000007', 'Boxes & Hampers','boxes-hampers', 'Curated boxes, ready to be handed over.',        7, true),
  ('11111111-1111-1111-1111-000000000008', 'Personalized',  'personalized',   'With their name on it. Instant favourite.',      8, true)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- taxonomy tags
-- ---------------------------------------------------------------------------
insert into public.product_tags (id, name, slug, kind, sort_order) values
  ('33333333-3333-3333-3333-000000000001', 'Her',      'her',          'recipient', 1),
  ('33333333-3333-3333-3333-000000000002', 'Him',      'him',          'recipient', 2),
  ('33333333-3333-3333-3333-000000000003', 'Friend',   'friend',       'recipient', 3),
  ('33333333-3333-3333-3333-000000000004', 'Partner',  'partner',      'recipient', 4),
  ('33333333-3333-3333-3333-000000000005', 'Family',   'family',       'recipient', 5),
  ('33333333-3333-3333-3333-000000000006', 'Birthday',      'birthday',      'occasion', 1),
  ('33333333-3333-3333-3333-000000000007', 'Graduation',    'graduation',    'occasion', 2),
  ('33333333-3333-3333-3333-000000000008', 'Anniversary',   'anniversary',   'occasion', 3),
  ('33333333-3333-3333-3333-000000000009', 'Just Because',  'just-because',  'occasion', 4),
  ('33333333-3333-3333-3333-000000000010', 'Other',         'other',         'occasion', 5),
  ('33333333-3333-3333-3333-000000000011', 'Cute',      'cute',      'vibe', 1),
  ('33333333-3333-3333-3333-000000000012', 'Funny',     'funny',     'vibe', 2),
  ('33333333-3333-3333-3333-000000000013', 'Romantic',  'romantic',  'vibe', 3),
  ('33333333-3333-3333-3333-000000000014', 'Minimal',   'minimal',   'vibe', 4),
  ('33333333-3333-3333-3333-000000000015', 'Crazy',     'crazy',     'vibe', 5),
  ('33333333-3333-3333-3333-000000000016', 'Luxury',    'luxury',    'vibe', 6)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- products (18) — final stock quantities
-- ---------------------------------------------------------------------------
insert into public.products
  (id, name, slug, description, short_description, price, compare_at_price, sku,
   stock_quantity, low_stock_threshold, is_active, is_featured, is_best_seller,
   is_customizable, rating, reviews_count, created_at)
values
  ('22222222-2222-2222-2222-000000000001','Birthday Bliss Box','birthday-bliss-box','A full birthday in one box: a scented candle, a hand-written card, their favourite sweets, a mini celebration kit and a small keepsake they will keep on their shelf. Wrapped in our ribbon and ready to hand over.','Everything they need for a proper birthday moment.',650,790,'FT-BB-001',24,5,true,true,true,true,4.9,63,'2026-06-12'),
  ('22222222-2222-2222-2222-000000000002','Cute Little Things','cute-little-things','A small box of very cute, very useless-in-the-best-way things: a sticker pack, a tiny plush, a hair clip and a note from you. Proof that small gifts hit different.','Tiny things, huge smile.',320,null,'FT-CL-002',40,6,true,true,false,false,4.8,91,'2026-06-20'),
  ('22222222-2222-2222-2222-000000000003','Graduation Starter','graduation-starter','For the one who just threw the cap. A quality notebook, a pen that feels expensive, a congratulatory card and a keepsake frame for the graduation photo.','They made it. Give them something that says so.',890,990,'FT-GS-003',12,4,true,true,false,false,4.9,38,'2026-07-01'),
  ('22222222-2222-2222-2222-000000000004','Memory Box','memory-box','A wooden box you fill with photos, tickets and small notes. We engrave the date that matters on the lid and pack it with tissue and ribbon.','Your memories, presented properly.',780,null,'FT-MB-004',9,4,true,false,false,true,4.9,47,'2026-06-05'),
  ('22222222-2222-2222-2222-000000000005','Couple''s Box','couples-box','Two matching mugs, a shared bucket-list card deck, a candle for two and a message from you. Designed for anniversaries, engagements and make-up gifts.','For the two of them.',1250,1450,'FT-CB-005',7,3,true,true,false,true,4.8,29,'2026-06-18'),
  ('22222222-2222-2222-2222-000000000006','Self-Care Sunday','self-care-sunday','Bath salts, a face mask, a soft eye pillow, herbal tea and a genuinely good chocolate bar. A full evening off, boxed.','A whole evening off, in one box.',720,null,'FT-SC-006',18,5,true,true,false,false,4.9,74,'2026-06-25'),
  ('22222222-2222-2222-2222-000000000007','Just Because Mini','just-because-mini','No occasion, no excuse, no problem. A small box with a sweet note, a snack and something oddly delightful.','The easiest gift you will ever send.',250,null,'FT-JB-007',55,10,true,false,true,false,4.7,128,'2026-05-30'),
  ('22222222-2222-2222-2222-000000000008','Personalized Name Mug','personalized-name-mug','A ceramic mug printed with their name in our house typeface, wrapped in a slim gift box. Dishwasher safe, ego safe.','Their name. Their mug.',280,340,'FT-PM-008',60,10,true,false,true,true,4.9,212,'2026-05-22'),
  ('22222222-2222-2222-2222-000000000009','Funny Gift Box','funny-gift-box','A box engineered to make them laugh out loud: a pun card, a ridiculous mug, a novelty snack and a rubber duck with attitude.','Certified loud-laugh territory.',450,null,'FT-FG-009',30,6,true,false,true,false,4.8,104,'2026-06-08'),
  ('22222222-2222-2222-2222-000000000010','Newborn Welcome Hamper','newborn-welcome-hamper','Soft cotton basics, a plush toy, a milestone card set and a gift for the parents who definitely need coffee. Our largest hamper.','For the tiniest human and exhausted parents.',1450,1600,'FT-NW-010',0,3,true,false,false,false,5.0,17,'2026-07-04'),
  ('22222222-2222-2222-2222-000000000011','Anniversary Keepsake','anniversary-keepsake','A linen-wrapped keepsake box with a photo booklet, two engraved tokens and a letter you write (we send you a prompt).','The one they keep forever.',1650,null,'FT-AK-011',4,3,true,false,false,true,4.9,23,'2026-06-14'),
  ('22222222-2222-2222-2222-000000000012','Coffee Lover''s Set','coffee-lovers-set','Speciality beans, a hand grinder, a ceramic dripper and a sturdy travel cup. Brews properly, looks good on any desk.','For someone who is always cold.',560,null,'FT-CL-012',22,5,true,false,false,false,4.8,56,'2026-06-02'),
  ('22222222-2222-2222-2222-000000000013','Desk Goals Bundle','desk-goals-bundle','A linen desk pad, a metal pen, a magnetic bookmark set and a small plant they will probably forget to water.','For the one starting something new.',640,720,'FT-DG-013',16,5,true,false,false,false,4.7,41,'2026-06-28'),
  ('22222222-2222-2222-2222-000000000014','Sweet Tooth Basket','sweet-tooth-basket','A basket of genuinely good chocolate, lokum, biscuits and a fizzy drink. No vending-machine sweets allowed.','Sugar, but make it thoughtful.',390,null,'FT-ST-014',35,8,true,false,false,false,4.8,87,'2026-05-28'),
  ('22222222-2222-2222-2222-000000000015','Perfume & Pamper Box','perfume-pamper-box','A travel-size perfume, body lotion, a silk scrunchie and a hand cream, presented in a rigid box with a satin ribbon.','Looks expensive because it is.',1100,1250,'FT-PP-015',10,4,true,true,false,false,4.9,52,'2026-06-16'),
  ('22222222-2222-2222-2222-000000000016','Exam Stress Kit','exam-stress-kit','Highlighters that do not skip, a focus playlist card, chewing gum, a squeeze toy and a note telling them they are going to pass.','For the last two weeks of the semester.',470,null,'FT-ES-016',26,6,true,false,false,false,4.8,66,'2026-06-22'),
  ('22222222-2222-2222-2222-000000000017','She Said Yes Box','she-said-yes-box','A celebration box with sparkling juice, a framed photo slot, confetti, a candle and a card for the newly engaged.','Congratulations, properly packaged.',1900,2100,'FT-SY-017',3,3,true,false,false,true,5.0,11,'2026-07-08'),
  ('22222222-2222-2222-2222-000000000018','Movie Night Kit','movie-night-kit','Popcorn seasonings, two eye masks, a blanket scarf, a streaming gift note and chocolate. One evening, sorted.','Friday night, handled.',520,null,'FT-MN-018',20,5,true,false,false,false,4.7,73,'2026-06-10')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- product images: intentionally empty — real photography is uploaded later.
-- The storefront renders designed placeholders until then.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- product <-> category
-- ---------------------------------------------------------------------------
insert into public.product_categories (product_id, category_id) values
  ('22222222-2222-2222-2222-000000000001','11111111-1111-1111-1111-000000000004'),
  ('22222222-2222-2222-2222-000000000001','11111111-1111-1111-1111-000000000007'),
  ('22222222-2222-2222-2222-000000000002','11111111-1111-1111-1111-000000000006'),
  ('22222222-2222-2222-2222-000000000002','11111111-1111-1111-1111-000000000007'),
  ('22222222-2222-2222-2222-000000000003','11111111-1111-1111-1111-000000000005'),
  ('22222222-2222-2222-2222-000000000004','11111111-1111-1111-1111-000000000003'),
  ('22222222-2222-2222-2222-000000000004','11111111-1111-1111-1111-000000000007'),
  ('22222222-2222-2222-2222-000000000005','11111111-1111-1111-1111-000000000003'),
  ('22222222-2222-2222-2222-000000000005','11111111-1111-1111-1111-000000000007'),
  ('22222222-2222-2222-2222-000000000006','11111111-1111-1111-1111-000000000001'),
  ('22222222-2222-2222-2222-000000000006','11111111-1111-1111-1111-000000000007'),
  ('22222222-2222-2222-2222-000000000007','11111111-1111-1111-1111-000000000006'),
  ('22222222-2222-2222-2222-000000000008','11111111-1111-1111-1111-000000000008'),
  ('22222222-2222-2222-2222-000000000009','11111111-1111-1111-1111-000000000007'),
  ('22222222-2222-2222-2222-000000000009','11111111-1111-1111-1111-000000000006'),
  ('22222222-2222-2222-2222-000000000010','11111111-1111-1111-1111-000000000007'),
  ('22222222-2222-2222-2222-000000000011','11111111-1111-1111-1111-000000000003'),
  ('22222222-2222-2222-2222-000000000011','11111111-1111-1111-1111-000000000008'),
  ('22222222-2222-2222-2222-000000000012','11111111-1111-1111-1111-000000000002'),
  ('22222222-2222-2222-2222-000000000012','11111111-1111-1111-1111-000000000007'),
  ('22222222-2222-2222-2222-000000000013','11111111-1111-1111-1111-000000000002'),
  ('22222222-2222-2222-2222-000000000013','11111111-1111-1111-1111-000000000005'),
  ('22222222-2222-2222-2222-000000000014','11111111-1111-1111-1111-000000000007'),
  ('22222222-2222-2222-2222-000000000014','11111111-1111-1111-1111-000000000004'),
  ('22222222-2222-2222-2222-000000000015','11111111-1111-1111-1111-000000000001'),
  ('22222222-2222-2222-2222-000000000015','11111111-1111-1111-1111-000000000007'),
  ('22222222-2222-2222-2222-000000000016','11111111-1111-1111-1111-000000000006'),
  ('22222222-2222-2222-2222-000000000016','11111111-1111-1111-1111-000000000005'),
  ('22222222-2222-2222-2222-000000000017','11111111-1111-1111-1111-000000000003'),
  ('22222222-2222-2222-2222-000000000017','11111111-1111-1111-1111-000000000007'),
  ('22222222-2222-2222-2222-000000000018','11111111-1111-1111-1111-000000000006'),
  ('22222222-2222-2222-2222-000000000018','11111111-1111-1111-1111-000000000007')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- product tags
-- ---------------------------------------------------------------------------
insert into public.product_tag_relations (product_id, tag_id)
select p.id, t.id
from public.products p
join public.product_tags t
  on t.slug in (
    case when p.slug in ('birthday-bliss-box','couples-box','sweet-tooth-basket','funny-gift-box','personalized-name-mug') then 'birthday' end,
    case when p.slug in ('graduation-starter','desk-goals-bundle','exam-stress-kit') then 'graduation' end,
    case when p.slug in ('memory-box','anniversary-keepsake','she-said-yes-box','couples-box') then 'anniversary' end,
    case when p.slug in ('cute-little-things','just-because-mini','movie-night-kit','desk-goals-bundle','exam-stress-kit','sweet-tooth-basket') then 'just-because' end,
    case when p.slug in ('self-care-sunday','perfume-pamper-box','newborn-welcome-hamper','anniversary-keepsake') then 'other' end,
    case when p.slug in ('self-care-sunday','perfume-pamper-box','newborn-welcome-hamper') then 'her' end,
    case when p.slug in ('coffee-lovers-set','desk-goals-bundle','funny-gift-box') then 'him' end,
    case when p.slug in ('cute-little-things','just-because-mini','exam-stress-kit','graduation-starter','coffee-lovers-set','desk-goals-bundle','sweet-tooth-basket','funny-gift-box') then 'friend' end,
    case when p.slug in ('couples-box','memory-box','anniversary-keepsake','she-said-yes-box','movie-night-kit') then 'partner' end,
    case when p.slug in ('newborn-welcome-hamper','memory-box','graduation-starter','exam-stress-kit','personalized-name-mug','sweet-tooth-basket') then 'family' end,
    case when p.slug in ('birthday-bliss-box','cute-little-things','sweet-tooth-basket','movie-night-kit','just-because-mini') then 'cute' end,
    case when p.slug in ('funny-gift-box','exam-stress-kit','just-because-mini','movie-night-kit') then 'funny' end,
    case when p.slug in ('couples-box','memory-box','anniversary-keepsake','she-said-yes-box') then 'romantic' end,
    case when p.slug in ('graduation-starter','coffee-lovers-set','desk-goals-bundle','personalized-name-mug') then 'minimal' end,
    case when p.slug in ('funny-gift-box','cute-little-things') then 'crazy' end,
    case when p.slug in ('perfume-pamper-box','anniversary-keepsake','she-said-yes-box','couples-box','newborn-welcome-hamper') then 'luxury' end
  )
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- product options (personalisation)
-- ---------------------------------------------------------------------------
insert into public.product_options (id, product_id, name, type, is_required, sort_order)
select gen_random_uuid(), p.id, 'Gift message', 'personalization', false, 1
from public.products p where p.is_customizable
on conflict do nothing;

insert into public.product_options (id, product_id, name, type, is_required, sort_order)
select gen_random_uuid(), p.id, 'Name to print', 'text', true, 2
from public.products p where p.slug in ('personalized-name-mug')
on conflict do nothing;

insert into public.product_options (id, product_id, name, type, is_required, sort_order)
select gen_random_uuid(), p.id, 'Ribbon colour', 'select', false, 3
from public.products p where p.is_customizable
on conflict do nothing;

insert into public.product_option_values (option_id, value, sort_order)
select o.id, v.value, v.ord
from public.product_options o
cross join (values ('Rose', 1), ('Ivory', 2), ('Sage', 3), ('Midnight', 4)) as v(value, ord)
where o.name = 'Ribbon colour';

-- ---------------------------------------------------------------------------
-- customers
-- ---------------------------------------------------------------------------
insert into public.customers (id, full_name, phone, email, created_at) values
  ('44444444-4444-4444-4444-000000000001','Nour Abdelrahman','01012345678','nour.abdelrahman@example.com','2026-06-01'),
  ('44444444-4444-4444-4444-000000000002','Karim Hassan','01198765432','karim.hassan@example.com','2026-06-04'),
  ('44444444-4444-4444-4444-000000000003','Salma Ibrahim','01234567890',null,'2026-06-09'),
  ('44444444-4444-4444-4444-000000000004','Omar El-Sayed','01555123456','omar.elsayed@example.com','2026-06-15'),
  ('44444444-4444-4444-4444-000000000005','Mariam Fathy','01001122334',null,'2026-06-21'),
  ('44444444-4444-4444-4444-000000000006','Youssef Adel','01277889900','youssef.adel@example.com','2026-07-02')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- orders (14) spanning website / instagram / whatsapp / store / manual
-- ---------------------------------------------------------------------------
insert into public.orders
  (id, customer_id, source, status, payment_status, delivery_fee, notes, gift_message,
   delivery_address, governorate, area, created_at, updated_at)
values
  ('55555555-5555-5555-5555-000000000001','44444444-4444-4444-4444-000000000001','website','delivered','paid',60,null,'Happy birthday Nour, you deserve this.','12 Street 9, Maadi','Cairo','Maadi','2026-08-20T11:20:00+03:00','2026-08-24T09:00:00+03:00'),
  ('55555555-5555-5555-5555-000000000002','44444444-4444-4444-4444-000000000002','instagram','delivered','paid',50,null,null,'45 Road 7, Smouha','Alexandria','Smouha','2026-08-25T16:05:00+03:00','2026-08-28T13:10:00+03:00'),
  ('55555555-5555-5555-5555-000000000003','44444444-4444-4444-4444-000000000003','whatsapp','shipped','cash_on_delivery',60,'Please call before arriving.','Enjoy your Sunday off.','8 Nile Corniche, Rousetta','Behera','Rousetta','2026-09-02T10:45:00+03:00','2026-09-04T17:30:00+03:00'),
  ('55555555-5555-5555-5555-000000000004','44444444-4444-4444-4444-000000000004','store','delivered','paid',0,null,null,'Store pickup — Zamalek','Cairo','Zamalek','2026-09-05T18:30:00+03:00','2026-09-05T18:45:00+03:00'),
  ('55555555-5555-5555-5555-000000000005','44444444-4444-4444-4444-000000000005','website','delivered','paid',70,null,'Happy anniversary to us.','30 Street 4, Heliopolis','Cairo','Heliopolis','2026-09-08T20:12:00+03:00','2026-09-11T12:00:00+03:00'),
  ('55555555-5555-5555-5555-000000000006','44444444-4444-4444-4444-000000000001','website','confirmed','cash_on_delivery',60,null,null,'12 Street 9, Maadi','Cairo','Maadi','2026-09-15T09:02:00+03:00','2026-09-15T14:20:00+03:00'),
  ('55555555-5555-5555-5555-000000000007','44444444-4444-4444-4444-000000000006','manual','pending','cash_on_delivery',50,'Taken over the phone by a staff member.','Good luck with the exams!','17 University Road, Tanta','Gharbia','Tanta','2026-09-20T13:40:00+03:00','2026-09-20T13:40:00+03:00'),
  ('55555555-5555-5555-5555-000000000008','44444444-4444-4444-4444-000000000003','instagram','preparing','pending',70,null,null,'8 Nile Corniche, Rousetta','Behera','Rousetta','2026-09-24T19:25:00+03:00','2026-09-25T10:05:00+03:00'),
  ('55555555-5555-5555-5555-000000000009','44444444-4444-4444-4444-000000000002','website','delivered','paid',60,null,'Congrats on graduating.','45 Road 7, Smouha','Alexandria','Smouha','2026-09-27T12:00:00+03:00','2026-09-30T15:45:00+03:00'),
  ('55555555-5555-5555-5555-000000000010','44444444-4444-4444-4444-000000000005','whatsapp','cancelled','failed',80,'Customer cancelled — payment failed on delivery.','She said yes!','30 Street 4, Heliopolis','Cairo','Heliopolis','2026-09-28T14:15:00+03:00','2026-09-29T08:30:00+03:00'),
  ('55555555-5555-5555-5555-000000000011','44444444-4444-4444-4444-000000000004','store','delivered','paid',0,null,null,'Store pickup — Zamalek','Cairo','Zamalek','2026-10-01T17:50:00+03:00','2026-10-01T18:10:00+03:00'),
  ('55555555-5555-5555-5555-000000000012','44444444-4444-4444-4444-000000000006','website','pending','cash_on_delivery',60,null,'Do not open before midnight!','17 University Road, Tanta','Gharbia','Tanta','2026-10-03T08:30:00+03:00','2026-10-03T08:30:00+03:00'),
  ('55555555-5555-5555-5555-000000000013','44444444-4444-4444-4444-000000000001','instagram','delivered','paid',50,null,null,'12 Street 9, Maadi','Cairo','Maadi','2026-10-04T15:05:00+03:00','2026-10-05T11:00:00+03:00'),
  ('55555555-5555-5555-5555-000000000014','44444444-4444-4444-4444-000000000003','website','preparing','cash_on_delivery',70,null,'One year down.','8 Nile Corniche, Rousetta','Behera','Rousetta','2026-10-06T10:20:00+03:00','2026-10-06T16:00:00+03:00')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- order items — prices snapshotted from the product at seed time
-- ---------------------------------------------------------------------------
with data(order_id, slug, qty, personalization) as (
  values
    ('55555555-5555-5555-5555-000000000001'::uuid,'birthday-bliss-box'::text,1::int,'{"message":"Happy birthday Nour, you deserve this."}'),
    ('55555555-5555-5555-5555-000000000001','personalized-name-mug',1,'{"name":"Nour","message":"Morning hero."}'),
    ('55555555-5555-5555-5555-000000000002','funny-gift-box',1,'{}'),
    ('55555555-5555-5555-5555-000000000002','just-because-mini',2,'{}'),
    ('55555555-5555-5555-5555-000000000003','self-care-sunday',1,'{"message":"Rest is productive too."}'),
    ('55555555-5555-5555-5555-000000000004','coffee-lovers-set',1,'{}'),
    ('55555555-5555-5555-5555-000000000005','couples-box',1,'{"message":"Six years and still my favourite person."}'),
    ('55555555-5555-5555-5555-000000000006','memory-box',1,'{"name":"Nour & Ziad","message":"From our first trip to now."}'),
    ('55555555-5555-5555-5555-000000000006','sweet-tooth-basket',1,'{}'),
    ('55555555-5555-5555-5555-000000000007','exam-stress-kit',2,'{"message":"You''ve got this, Yara."}'),
    ('55555555-5555-5555-5555-000000000008','perfume-pamper-box',1,'{}'),
    ('55555555-5555-5555-5555-000000000009','graduation-starter',1,'{"message":"Dr. Karim has a nice ring to it."}'),
    ('55555555-5555-5555-5555-000000000009','desk-goals-bundle',1,'{}'),
    ('55555555-5555-5555-5555-000000000010','she-said-yes-box',1,'{"message":"Congratulations Mariam & Ahmed!"}'),
    ('55555555-5555-5555-5555-000000000011','movie-night-kit',2,'{}'),
    ('55555555-5555-5555-5555-000000000011','cute-little-things',1,'{}'),
    ('55555555-5555-5555-5555-000000000012','birthday-bliss-box',1,'{"message":"Happy birthday Hana!"}'),
    ('55555555-5555-5555-5555-000000000013','sweet-tooth-basket',2,'{}'),
    ('55555555-5555-5555-5555-000000000013','just-because-mini',1,'{}'),
    ('55555555-5555-5555-5555-000000000014','anniversary-keepsake',1,'{"name":"Salma & Mostafa","message":"Same time next year."}'),
    ('55555555-5555-5555-5555-000000000014','personalized-name-mug',2,'{"name":"Mostafa"}')
)
insert into public.order_items
  (order_id, product_id, product_name_snapshot, slug_snapshot, unit_price, quantity,
   personalization_data, created_at)
select d.order_id, p.id, p.name, p.slug, p.price, d.qty::int,
       d.personalization::jsonb, o.created_at
from data d
join public.products p on p.slug = d.slug
join public.orders o on o.id = d.order_id
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- order totals
-- ---------------------------------------------------------------------------
update public.orders o
set subtotal = s.subtotal,
    total    = s.subtotal + o.delivery_fee
from (
  select order_id, sum(line_total) as subtotal
  from public.order_items
  group by order_id
) s
where s.order_id = o.id;

-- ---------------------------------------------------------------------------
-- status history
-- ---------------------------------------------------------------------------
insert into public.order_status_history (order_id, from_status, to_status, note, created_at)
select id, null, 'pending', 'Order placed', created_at
from public.orders;

insert into public.order_status_history (order_id, from_status, to_status, note, created_at)
select id, 'pending', status,
       case status
         when 'confirmed' then 'Confirmed with the customer'
         when 'preparing' then 'Being packed'
         when 'shipped'   then 'Handed to the courier'
         when 'delivered' then 'Delivered and signed for'
         when 'cancelled' then 'Order cancelled'
       end,
       updated_at
from public.orders
where status <> 'pending';

-- ---------------------------------------------------------------------------
-- inventory movements
-- ---------------------------------------------------------------------------
insert into public.inventory_movements (product_id, type, quantity, reference_type, reference_id, note, created_at)
select oi.product_id,
       case when o.status = 'cancelled' then 'cancellation'::public.movement_type
            else 'sale'::public.movement_type end,
       case when o.status = 'cancelled' then oi.quantity else -oi.quantity end,
       'order', o.id,
       case when o.status = 'cancelled'
            then 'Restocked from cancelled order ' || o.order_number
            else 'Sold via ' || o.source || ' order ' || o.order_number end,
       o.created_at
from public.order_items oi
join public.orders o on o.id = oi.order_id
where oi.product_id is not null;

-- a real-world manual adjustment so the history is not perfectly tidy
update public.products set stock_quantity = stock_quantity - 2 where slug = 'cute-little-things';
insert into public.inventory_movements (product_id, type, quantity, reference_type, note, created_at)
select id, 'adjustment', -2, 'manual', 'Two units damaged in storage — written off', now() - interval '12 days'
from public.products where slug = 'cute-little-things';

-- opening receipt so that the sum of every movement equals current stock
insert into public.inventory_movements (product_id, type, quantity, reference_type, note, created_at)
select p.id,
       'restock',
       p.stock_quantity - coalesce(m.net, 0),
       'manual',
       'Opening inventory received',
       now() - interval '90 days'
from public.products p
left join (
  select product_id, sum(quantity) as net
  from public.inventory_movements
  group by product_id
) m on m.product_id = p.id
where p.stock_quantity - coalesce(m.net, 0) <> 0;

-- ---------------------------------------------------------------------------
-- demo staff accounts (password: Admin1234! / Staff1234!)
-- ---------------------------------------------------------------------------
insert into auth.users
  (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
   raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000','99999999-9999-9999-9999-000000000001',
   'authenticated','authenticated','admin@fltase3.com',
   crypt('Admin1234!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Fl Tase3 Admin","role":"admin"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000','99999999-9999-9999-9999-000000000002',
   'authenticated','authenticated','staff@fltase3.com',
   crypt('Staff1234!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}',
   '{"full_name":"Fl Tase3 Staff","role":"staff"}', now(), now())
on conflict (id) do nothing;

insert into auth.identities
  (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id,
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
       'email', u.email, now(), now(), now()
from auth.users u
where u.email in ('admin@fltase3.com', 'staff@fltase3.com')
on conflict do nothing;


commit;
