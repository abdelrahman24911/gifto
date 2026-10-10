# FL Tase3 — Pre-Launch QA, User Flows & Improvement Plan

**Project:** FL Tase3 — Gifts in Egypt, wrapped properly  
**Demo URL:** https://gifto-pi.vercel.app/  
**Purpose:** A living checklist for finishing the demo, testing the store end-to-end, and preparing it for a real client/business launch.

> **Current context:** This is an in-progress demo. The logo, Instagram page, WhatsApp number, and real product images will be added later. Do not treat these as forgotten tasks; they are planned launch content. Any placeholder reviews, ratings, stock levels, delivery promises, contact details, or order counts must remain clearly demo-only until verified.

---

## 1. Status legend

- `[ ]` Not done / not verified
- `[x]` Done and verified
- `[!]` Issue found
- `[~]` Intentionally postponed

Only check an item after testing it. A page existing does not mean its functionality has been verified.

## 2. Remaining work — master checklist

### A. Brand and store content
- [ ] Add final FL Tase3 logo and favicon.
- [ ] Add the real Instagram profile URL and verify it opens the correct account.
- [ ] Add the real WhatsApp business number and test the click-to-chat link on mobile and desktop.
- [ ] Add real product images; remove any placeholder/reference images before launch.
- [ ] Confirm product names, descriptions, contents, sizes, customization options, and prices with the business owner.
- [ ] Confirm sale prices and discount calculations.
- [ ] Replace all demo contact details and test links.
- [ ] Verify all claims about reviews, ratings, orders, stock, delivery, and customer satisfaction. Remove or label anything not supported by real data.
- [ ] Write and review shipping, returns/refunds, privacy, terms, FAQ, and contact information.
- [ ] Proofread English/Arabic copy and keep currency consistently displayed as EGP / جنيه مصري.

### B. Product catalog and imagery
- [ ] Ensure every product has a unique, stable ID/slug.
- [ ] Add a primary image and, where useful, detail/lifestyle images.
- [x] Use consistent image aspect ratios and crop behavior across product cards. (aspect-square cards + `next/image` fill/object-cover — verified in code)
- [ ] Add meaningful alt text to informative images.
- [ ] Use optimized WebP/AVIF images and responsive image sizes.
- [ ] Reserve image dimensions or use aspect-ratio containers to prevent layout shifts.
- [ ] Lazy-load below-the-fold images; prioritize only the true above-the-fold hero image when appropriate.
- [!] Add graceful fallback UI for missing or failed images. (placeholder covers «no path» only; a path that exists but fails to load has no `onError` fallback — §10.3)
- [ ] Confirm the product image bucket is private/public as intended and that upload permissions are secure.
- [ ] Test product cards when an image is absent, slow, or returns an error.

### C. Shopping experience
- [ ] Test search with exact names, partial names, no matches, and empty input.
- [ ] Test every category, occasion, recipient, vibe, and budget filter that is shown.
- [ ] Confirm multiple filters combine correctly and clearing filters resets them.
- [ ] Confirm sorting works and behaves predictably with filters and pagination.
- [ ] Check pagination, page boundaries, and product counts.
- [ ] Confirm out-of-stock products cannot be purchased.
- [ ] Verify product details, customization fields, quantity controls, and add-to-cart behavior.
- [ ] Verify cart updates immediately when quantity changes or items are removed.
- [ ] Verify subtotal, discount, delivery fee, and final total calculations.
- [ ] Confirm cart contents persist after refresh and behave sensibly in a new tab/session.
- [ ] Test empty cart, single-item cart, multiple items, and quantity limits.
- [ ] Make error, success, loading, and empty states clear and consistent.

### D. Gift finder
- [ ] Complete the gift finder from start to finish on mobile and desktop.
- [ ] Test every answer path and combinations of recipient, occasion, budget, and style.
- [ ] Confirm recommendations actually match the selected constraints.
- [ ] Define what happens if no products match: show a helpful empty state and a way to broaden/reset choices.
- [ ] Make it easy to edit answers and restart.
- [ ] Ensure recommended products link to the correct product details.
- [ ] Add loading/error handling if recommendations depend on a request.

### E. Checkout, orders, and backend
- [ ] Decide and document the intended checkout flow (guest checkout, account requirement, or another approach).
- [x] Validate required customer fields, phone number, address, governorate/city, and delivery notes. (Zod `checkoutSchema` client+server; RPC re-validates required fields — migration 09 `:86-103`)
- [!] Validate input on both client and server; never trust client-submitted totals or stock values. (prices+subtotal recomputed server-side; delivery fee + payment status now derived inside `create_order` — **fixed**, §10.1 #2)
- [ ] Calculate prices, discounts, delivery fees, and totals on the server.
- [x] Prevent purchases exceeding available stock. (server-action pre-check + RPC `select ... for update` + `stock_quantity < v_qty` guard — migration 09 `:166-179`)
- [!] Make order creation safe against double-clicks/retries and duplicate submissions. (no idempotency key; repeated posts create duplicate orders — §10.2)
- [x] Confirm a successful order is stored correctly in Supabase. (insert → `order_items` → stock decrement → `inventory_movements` → `order_status_history`; verified on hosted DB during deploy)
- [x] Confirm order items retain the correct product, quantity, and price at purchase time. (name/slug/`unit_price` snapshots from DB — migration 09 `:181-190`)
- [~] Confirm stock changes follow the chosen order/payment status policy. (decrements at placement today; restock-on-cancel/refund policy is a business decision, not yet defined or wired)
- [ ] Test failure cases: network error, invalid input, unavailable product, and server error.
- [ ] Show a clear success/confirmation screen and a usable order reference.
- [~] Verify order tracking works for valid, invalid, and unknown order references. (RPC + track page exist; real event-display run against deployed URL still pending — §10.4)
- [!] Ensure one customer cannot read another customer's order or personal details. (tracking has no ownership check — anyone with the `order_number` can query status; acceptable for guest-COD only while numbers stay unguessable — §10.3)
- [!] Review Supabase RLS policies, storage policies, server secrets, and API permissions. (storage/grant review done; **P0** self-service promotion to admin via `profiles` update — **fixed** in migration `20261001000012_role_hardening.sql`, §10.1 #1)
- [x] Keep service-role keys and other secrets out of client-side code. (no `service_role` refs; envs on Vercel for production/preview/development, `.env*` git-ignored)
- [ ] Add server-side logging for actionable errors without logging unnecessary personal data.
- [ ] Test the complete order lifecycle in a safe test environment before using real orders.

### F. Admin and inventory (if included in this release)
- [x] Confirm who can access the admin dashboard; protect all admin routes server-side. (`requireStaff()` gate in admin layout + re-checked in every admin server action)
- [ ] Create, edit, publish, unpublish, and delete/archive products.
- [ ] Upload, replace, reorder, and remove product images.
- [ ] Update price, sale price, category, options, and stock.
- [ ] View and search orders.
- [ ] Update order status using a defined allowed transition flow.
- [!] Prevent unauthorized users from changing product, stock, or order data. (guard exists; the role-escalation hole that let any user become staff/admin is now **fixed** — §10.1 #1, migration `20261001000012`)
- [ ] Add validation and confirmation for destructive actions.
- [ ] Test empty states, loading states, server errors, and permission errors.
- [x] Verify inventory remains consistent when two orders attempt to buy the last item. (RPC uses `for update` row locks; serialized losers raise a friendly "Only N left" error — migration 09 `:166-179`)

### G. Responsive design, accessibility, and performance
- [ ] Test widths around 360px, 390px, 768px, 1024px, and 1440px.
- [ ] Check for horizontal overflow, clipped text, overlapping buttons, and awkward line breaks.
- [ ] Make navigation, filters, dialogs, cart, and forms usable with touch.
- [ ] Ensure keyboard focus is visible and controls can be reached without a mouse.
- [ ] Use semantic headings, labels, button names, and form error messages.
- [ ] Check color contrast and do not rely on color alone to communicate stock/error state.
- [ ] Avoid content/layout jumping as images and fonts load.
- [ ] Inspect browser console and network requests for errors.
- [x] Run a production build and lint/type checks. (2026-10-10: `tsc` ✔, `lint` ✔, `npm run build` ✔ 27 routes against hosted DB)
- [ ] Measure real page performance (Lighthouse or equivalent) rather than guessing based on perceived loading.
- [ ] Identify slow sections using browser Performance/Network tools before optimizing.
- [ ] Avoid unnecessary client components, repeated requests, large dependencies, and unoptimized assets.
- [ ] Add useful metadata, page titles, descriptions, Open Graph image, favicon, and canonical URLs as appropriate.
- [!] Check 404 and error pages. (no custom `not-found.tsx` / `error.tsx`; default Next pages shown — §10.3)

### H. Launch and operations
- [x] Confirm production environment variables and Supabase project are correct. (ref `mymlvbgvbogzubfvovwy`; envs on Vercel for all three environments)
- [ ] Confirm the production deployment uses the intended branch and latest successful build.
- [x] Test the deployed production URL, not only localhost. (https://gifto-pi.vercel.app — `/`, `/shop`, `/admin/login` 200; admin + staff logins pass; product data confirmed in HTML)
- [ ] Verify custom domain and HTTPS if/when configured.
- [ ] Verify backup/recovery approach for critical store data.
- [ ] Define how orders, cancellations, returns, refunds, and customer support are handled.
- [ ] Test social links and WhatsApp contact links on real devices.
- [ ] Keep a short release checklist and record any known limitations.

---

## 3. Core user flows to test

For each flow, record the result, browser/device, and any issue found.

### Flow 1 — Browse and discover a gift
1. Open the homepage.
2. Understand what the store sells and how to start shopping.
3. Select an occasion/category or open the shop.
4. Apply a filter (occasion, recipient, vibe, or budget).
5. Sort or move between product pages if applicable.
6. Open a product.
7. Confirm the correct product, price, availability, and details are shown.
8. Return to the listing and confirm the shopping context behaves as expected.

**Expected:** The user can find a relevant product without confusion; filters and pagination do not show contradictory results.

### Flow 2 — Gift finder
1. Open Gift Finder.
2. Answer every question.
3. Review the recommended products.
4. Open a recommendation.
5. Return and change one answer.
6. Reset or complete a path that produces no matches.

**Expected:** Recommendations reflect answers; the user can change choices; no-match and error states offer a useful next step.

### Flow 3 — Add to cart and edit cart
1. Open a product.
2. Select required options/customization.
3. Add it to the cart.
4. Confirm cart count and feedback update.
5. Change quantity.
6. Remove an item.
7. Refresh the page.
8. Test an empty cart and a multi-item cart.

**Expected:** The cart shows correct products, quantities, prices, and totals; persisted data does not become stale or invalid.

### Flow 4 — Checkout and place an order
1. Start checkout from a non-empty cart.
2. Enter valid customer and delivery details.
3. Test missing and invalid required fields.
4. Review products, quantities, shipping, discounts, and total.
5. Submit once; then test repeated clicks/network retry behavior safely.
6. Confirm the order-success page and reference.
7. Check the order in the admin/backend.
8. Attempt tracking with valid and invalid references.

**Expected:** One valid order is created, totals are authoritative, inventory follows the agreed policy, and customer/order information is not exposed to others.

### Flow 5 — Admin manages catalog and stock
1. Sign in as an authorized admin.
2. Create or edit a product.
3. Upload/replace its image.
4. Change price and stock.
5. Publish/unpublish the product.
6. Verify the storefront reflects changes.
7. Try the same admin URL as a non-admin user.
8. Attempt invalid values and unauthorized mutations.

**Expected:** Only authorized users can mutate data; changes appear correctly; invalid and unauthorized actions are rejected.

### Flow 6 — Mobile purchase
1. Open the deployed store on a real phone or mobile viewport.
2. Navigate using the mobile menu.
3. Find a product using search/filter or Gift Finder.
4. Add it to cart and edit quantity.
5. Complete the test checkout.
6. Open WhatsApp/Instagram links.
7. Repeat with a slow connection if practical.

**Expected:** No horizontal scrolling or blocked controls; the flow is usable one-handed and loading/error states are understandable.

### Flow 7 — Failure and edge cases
- Search returns no results.
- Filters produce no matches.
- Product image fails to load.
- Product becomes unavailable before checkout.
- Stock is zero or lower than requested quantity.
- Invalid or malformed form input.
- Network disconnects during submit.
- Server returns an error.
- User refreshes during checkout or confirmation.
- A user attempts to access another user's order or admin functions.

**Expected:** Helpful recovery messages; no silent failures, duplicate orders, incorrect totals, or unauthorized data access.

---

## 4. Test matrix

Run these at minimum before a client demo, and again before launch.

| Area | Test cases | Priority |
|---|---|---|
| Homepage | All nav links, CTA buttons, featured products, footer links | P1 |
| Search | Exact, partial, no result, special characters, empty query | P1 |
| Filters | Single, combined, clear all, pagination interaction | P1 |
| Product page | Correct details, price, stock, customization, missing image | P1 |
| Cart | Add, quantity, remove, refresh, multiple products, totals | P0 |
| Checkout | Valid/invalid form, repeated submit, server-calculated total | P0 |
| Orders | Create, confirm, track, invalid reference, access control | P0 |
| Inventory | Out of stock, last item, concurrent attempts, stock policy | P0 |
| Admin | Access control, CRUD, image upload, validation, order status | P0 if in scope |
| Responsive | 360px, 390px, tablet, desktop, overflow | P1 |
| Performance | Production build, image loading, console/network, metrics | P1 |
| Content | Logo, Instagram, WhatsApp, real policies, verified claims | P0 before public launch |

**Priority guide**
- **P0:** Must work / be resolved before public launch.
- **P1:** Important for a credible demo and smooth shopping experience.
- **P2:** Useful polish after core flows are stable.

---

## 5. What to improve in the UI/UX

### Homepage
- Keep the hero focused on one main action (Shop gifts) and one secondary action (Find a gift).
- Make sure the first viewport communicates what is sold, who it is for, and why this store is different.
- Avoid repeating the same products in multiple sections unless the purpose is clear.
- Consider a genuinely useful price-led section such as “Gifts under EGP 500” if the catalog supports it.
- Keep shipping, customization, and packaging benefits concise and verifiable.
- Ensure every CTA goes somewhere useful.

### Product cards and product detail pages
- Use consistent image ratios, card heights, and button placement.
- Make sale price and original price easy to distinguish without visual clutter.
- Show stock status only when backed by real inventory.
- Put essential product contents and personalization details near the purchase action.
- Make delivery estimates conditional on location and business policy, not universal promises.
- Keep add-to-cart feedback visible and accessible.

### Shop and filtering
- Show result counts and an obvious active-filter state.
- Provide a clear “Clear filters” action.
- On mobile, use a compact filter drawer/sheet with Apply and Reset controls if suitable.
- Preserve filters and sort state when practical.
- Ensure pagination and sorting are stable and do not produce duplicates or missing items.

### Gift finder
- Keep questions short and easy to answer.
- Show progress if the flow has multiple steps.
- Let users go back and edit answers.
- Explain why recommendations fit (e.g., occasion + budget) where possible.
- Provide an escape route to browse all products.
- Do not present arbitrary recommendations as personalized if no matching logic supports that claim.

### Cart and checkout
- Keep the total breakdown transparent: items, discounts, shipping, and final total.
- Make quantity/remove actions easy on mobile.
- Do not surprise the user with a delivery fee only at the final step.
- Keep validation next to the field that needs correction.
- Prevent accidental double submission and provide a clear success state.
- Collect only customer data needed to fulfil the order.

### Trust and content
- Use real brand/contact details once ready.
- Do not publish invented testimonials, ratings, sales counts, or scarcity claims.
- Publish clear shipping, cancellation, return/refund, privacy, and contact information.
- Explain gift wrapping and personalization accurately.
- Keep the visual tone consistent across storefront, checkout, confirmation, and transactional messages.

---

## 6. Technical checks for the current stack

Assuming the project remains Next.js + Supabase:

- [ ] Run lint, type-check, and production build. ([x] on 2026-10-10 — see §9 footer; commands below are correct)
- [ ] Check server logs and browser console while completing the core flows.
- [ ] Confirm data access is protected by Supabase RLS and storage policies.
- [ ] Use server-side validation for order inputs, prices, discounts, and inventory.
- [ ] Keep privileged Supabase keys on the server only.
- [x] Ensure admin authorization is enforced by the server/database, not just hidden UI. (server actions re-check `requireStaff()`; DB writes gated by `is_staff()`/`is_admin()` RLS + role-change lockdown — escalation path §10.1 #1 fixed in migration `20261001000012`)
- [x] Confirm migrations are committed and can be applied reproducibly. (all 9 migrations pushed to hosted project via `supabase db push --linked --include-seed`; counts verified)
- [x] Confirm `.env` files and secrets are not committed. (`.env*` and `.vercel` git-ignored; `git` tracks none — verified)
- [ ] Test against a staging/test dataset before manipulating real inventory.
- [ ] Add stable loading, empty, error, and success states.
- [ ] Check image dimensions and caching behavior.
- [ ] Check production Vercel deployment logs and environment variables.
- [ ] Confirm Git changes are committed and pushed to the intended remote.

Useful commands (adjust to the scripts available in `package.json`):

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Do not assume every command exists; inspect `package.json` first.

---

## 7. Performance investigation checklist

If a section feels slow, measure before rewriting it.

1. Open browser DevTools → Network.
2. Reload with cache disabled.
3. Identify slow requests, oversized images, repeated requests, and blocked scripts.
4. Open DevTools → Performance and record the interaction or page load.
5. Check whether delay is server response, JavaScript execution, image decoding, or layout.
6. Compare localhost production build with the deployed production site.
7. Optimize the actual bottleneck and retest.

Things to inspect:
- [ ] Large image files or wrong image dimensions.
- [ ] Client components used where server rendering would suffice.
- [ ] Repeated Supabase queries or unnecessary refetches.
- [ ] Large client-side dependencies.
- [ ] Blocking third-party scripts/fonts.
- [ ] Skeletons or loading states that remain visible longer than necessary.
- [ ] Unstable image/card dimensions causing layout shifts.

---

## 8. Recommended order of work

### Phase 1 — Core functionality
- [ ] Verify navigation, search, filters, product details, gift finder, cart.
- [ ] Finish checkout/order creation and tracking if included in the demo.
- [ ] Verify inventory and authorization rules.
- [ ] Fix all P0 issues.

### Phase 2 — Business content
- [ ] Add logo and favicon.
- [ ] Add real Instagram and WhatsApp links.
- [ ] Add real product images and final descriptions/prices.
- [ ] Finalize delivery, return/refund, privacy, and contact information.
- [ ] Verify every customer-facing claim.

### Phase 3 — Responsive polish and performance
- [ ] Test all target screen widths.
- [ ] Optimize images and fix layout shifts.
- [ ] Measure and fix slow pages/sections.
- [ ] Check keyboard navigation, labels, contrast, and error states.

### Phase 4 — Release verification
- [ ] Run lint/type-check/build.
- [ ] Run the full user flows against the deployed URL.
- [ ] Test in a safe staging/test environment.
- [ ] Confirm Vercel and Supabase production configuration.
- [ ] Record any known limitations and obtain business-owner approval before launch.

---

## 9. Final sign-off

Do not call the store production-ready until all applicable P0 items are checked and the critical user flows have been tested on the deployed site.

- [ ] Branding and contact details are final.
- [ ] Product content, prices, and images are verified.
- [ ] Search, filters, Gift Finder, product pages, and cart pass.
- [ ] Checkout/order creation and tracking pass, if included.
- [ ] Inventory and access control pass.
- [ ] Mobile and desktop layouts pass.
- [ ] No known critical build, console, or backend errors.
- [ ] Policies and customer-facing claims are accurate.
- [ ] Business owner has reviewed and approved the experience.

**Last tested on:** 2026-10-10 (hosted deployment of migrations `…012`/`…013`/`…014` completed and smoke-verified against the live project; interactive device checklist pending, §10.4)  
**Tested by:** opencode + user (deploy & logins)  
**Environment / URL:** https://gifto-pi.vercel.app · Supabase ref `mymlvbgvbogzubfvovwy` · git `main` @ `6562c1b`  
**Open P0 issues:** none — both P0 fixes are **deployed to the hosted project and smoke-verified there** (migrations `20261001000012_role_hardening.sql`, `20261001000013_order_trust_hardening.sql`, plus `20261001000014_role_guard_null_fix.sql` which fixed a hosted-only runtime regression in `…012`; all applied to `mymlvbgvbogzubfvovwy`)
**Known limitations:** bespoke `next@16` conventions (see AGENTS.md); no custom 404/error pages; tracking has no ownership check; statuses/shipping/time data are demo-only until business verifies (see §10.3–10.4); `npm run build` currently fails at the `/checkout`/`/cart` prerender with "Invalid API key" — **root cause identified: the `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` is stale/revoked** (the project's current anon key was validated via REST; updating `.env.local` should fix the build — not caused by either fix); a Supabase CLI access token (`sbp_…`) was pasted into the session chat and **should be revoked** in the dashboard; delivery-fee values live in both `src/lib/constants.ts` and the DB `delivery_fees` table — keep in sync when rates change

---

## 10. Audit results — 2026-10-10

**Method:** local `npx tsc --noEmit` ✔ and `npm run lint` ✔ (clean on post-fix re-runs; both unchanged since). Hosted deployment and smoke tests against `mymlvbgvbogzubfvovwy` executed 2026-10-10: migrations `…012`+`…013` pushed, then `…014` after the hosted smoke run exposed a runtime regression (see §10.1 #1). Hosted verification used the live REST API (fresh anon key from `supabase projects api-keys`, PostgREST strict/legacy resolution, signup+JWT sessions for role tests) and rolled-back DB sessions for order behavior. `npm run build` ❌ — prerender of `/checkout`/`/cart` throws "Invalid API key" because `.env.local` holds a stale anon key (confirmed via REST; current key works). Initial audit: build ✔ (27 routes), deployed smoke at the production URL, plus source review of storefront/checkout/RLS/RPC/admin paths (see §10.1 #1/#2 for both P0s).

### 10.1 Confirmed P0 — resolve before public launch

1. **Self-service escalation to admin. — ✅ FIXED & DEPLOYED (migrations `20261001000012_role_hardening.sql` + `20261001000014_role_guard_null_fix.sql`; smoke-verified on the hosted project)**
   `profiles` `"update own"` policy guards only the row (`id = auth.uid()`), not the columns — `supabase/migrations/20261001000006_rls.sql:12-13`. Any signed-up user can `UPDATE profiles SET role = 'admin' WHERE id = auth.uid()`. Every admin action re-checks `requireStaff()`/`requireAdmin()` in `src/lib/data/auth.ts`, which reads `profiles.role`, so the update flips the whole admin surface (products/orders/inventory) open. Self-signup is trivial because `mailer_autoconfirm=true`. A second, redundant vector existed at signup: `handle_new_user` promoted based on `new.raw_user_meta_data->>'role'` (`20261001000001_foundations.sql:89-110`), which an attacker controls when calling the public signup endpoint.
   **Fix applied (both vectors closed):**
   - `handle_new_user` now always inserts `role = 'customer'` — signup metadata is never trusted for `admin`/`staff`.
   - Direct `role` mutation through ordinary writes is blocked by a `BEFORE UPDATE` trigger (`protect_profile_role`) that raises `Changing a profile role requires administrator privileges.` unless the caller is `is_admin()` (existing `admin` role; level-up management is admin-only), `is_service_role()`, or `is_trusted_session()` (DB provisioning: `session_user` in `postgres`/`supabase_admin`/`supabase_auth_admin`/`service_role`). A table-level `REVOKE UPDATE (role, role_id)` is *not* used because table-level `UPDATE` grants from default privileges are additive in Postgres and would mask the intent.
   - Authorized management goes through `public.set_role(p_target_id, p_new_role)` (`SECURITY DEFINER`): gated by the same admin check, refuses self-changes (anti-lockout), grants only to `authenticated`, revoked from `public`/`anon`. Every (effective) role change is audited into `public.role_change_log` (RLS — visible to staff only).
   - Fresh installs promote the demo accounts via `set_role` in `supabase/seed.sql` (no metadata trust).
   **Verification (executed 2026-10-10, Postgres 17.6 Supabase-image container):** 12/12 scenario tests pass (`session_user = authenticator` + `SET ROLE authenticator→authenticated/anon/service_role` + `request.jwt.claim.*`, i.e. a PostgREST-equivalent session): T1/T2 signup metadata `admin`/`staff` → profile stays `customer`; T3 self-promote via UPDATE blocked; T4 cross-user promote blocked (0 rows, RLS); T5 anon blocked; T6/T7 `set_role` rejected for customer and staff; T8 staff self-promote blocked; T9 admin `set_role` on another user succeeds (authorized path); T10 admin self-change rejected (anti-lockout); T11 admin direct UPDATE authorized; T12 legitimate self `full_name` update unaffected; T14 service-role path works; helper truth table (admin/staff/customer/service) correct; demo `admin`/`staff` accounts retain roles; audit log records each change. `npx tsc --noEmit` ✔, `npm run lint` ✔.
   **Hosted regression found & fixed (…014):** the local harness set the singular `request.jwt.claim.*` GUCs, which real PostgREST does not — it exposes the JWT only as `request.jwt.claims` (JSON) and relies on `auth.jwt()` reading that blob. With `request.jwt.claim.role` unset, `is_service_role()` returned **NULL** instead of false, turning the guard `not (false OR NULL OR false)` into `NULL` → no raise. Reproduced on the local container and **proven against the live project** (a fresh signup escalated itself to `admin`; `set_role` promoted another user). Migration `…014` makes every classifier strictly boolean (`coalesce(...)` + `coalesce(auth.jwt() ->> 'role','') = 'service_role'`) and re-installs both guards with `coalesce`. **Post-fix hosted re-run (live REST/PostgREST + JWT sessions):** direct `PATCH … role=admin` → `400` `Changing a profile role requires administrator privileges.`; non-admin `set_role(other)` → `400` `Only an administrator can change a profile role.`; attacker stayed `customer`; legitimate self `full_name` update → `204`; admin `set_role(other)` → `204` (recovery path intact); `role_change_log` stays empty after blocked attempts.
   **Remaining:** app-side `npm run build` still fails on `/checkout`/`/cart` prerender — root cause is the stale `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` (see footer); revoke the session-pasted CLI access token; after the app deploys, smoke the admin logins in the UI.

2. **`create_order` trusts caller-supplied money/status. — ✅ FIXED & DEPLOYED (migration `20261001000013_order_trust_hardening.sql`; smoke-verified on the hosted project)**
   `public.create_order(p_items, …, p_source, p_delivery_fee, p_payment_status)` was `SECURITY DEFINER`, granted to `anon, authenticated` (`20261001000009_customer_account_link.sql:57-73,225`). Line items and subtotal were recomputed from the DB (good), but `p_delivery_fee` and `p_payment_status` were taken verbatim and written into the order, so a bypassing caller could zero the delivery fee and mark an order `paid` without paying.
   **Fix applied:** `create_order` now accepts `p_payment_method public.payment_method` (enum `cash_on_delivery`/`card`) and derives both money/status server-side. For a zero-downtime rollout (Option B) the **old signature is retained as a hardened transitional overload** (replaced in place with `create or replace`, no `DROP`) that ignores caller `p_delivery_fee`, whitelists `p_payment_status` to `cash_on_delivery`/`pending` only (mapping it to a method; anything else raises), and delegates to the strict implementation. A follow-up migration removes it once the legacy app is retired. PostgREST resolves unambiguously: a body carrying `p_delivery_fee`/`p_payment_status` matches only the legacy overload, one carrying `p_payment_method` matches only the strict overload, and a body carrying neither fails closed (ambiguous).
   - delivery fee via `public.delivery_fee_for(governorate, subtotal)` from a DB-backed `public.delivery_fees` tier table (mirrors `GOVERNORATES` fees, `DEFAULT_DELIVERY_FEE=60`, `FREE_DELIVERY_THRESHOLD=1500` in `src/lib/constants.ts`);
   - payment status 1:1 from the method (`cash_on_delivery` | card→`pending`) — no caller input can yield `paid`/`failed`.
   App updated to send `payment_method` only (`src/lib/data/orders.ts`, `src/app/(store)/checkout/actions.ts`, generated `database.types.ts`). The client-side fee estimate in `checkout-form.tsx` is display-only; parity with the DB tier table is a maintenance rule (both files reference the same values).
   **Verification (executed 2026-10-10, Postgres 17.6 Supabase-image container):** 7/7 order tests pass via a PostgREST-equivalent `authenticator` session (anon + authenticated): T-O1 old signature no longer callable; T-O2 `payment_method => 'paid'` rejected (enum); T-O3 honest COD order → computed fee 60 / total 260 / `cash_on_delivery`; T-O4 card → `pending`; T-O5 unknown governorate → default fee 60; T-O6 threshold met (1500) → fee 0; T-O7 `p_delivery_fee` not a parameter (rejected). Preflight: old overload count 0, anon+authenticated EXECUTE, `public` revoked; `delivery_fee_for` parity samples match app constants. Persisted-state checks: 0 orders with `payment_status='paid'`; 0 fee mismatches vs the DB function; stock decremented exactly; snapshots priced from DB. `npx tsc --noEmit` ✔, `npm run lint` ✔.
   **Remaining (hosted verified 2026-10-10):** over the live REST API, both overloads resolve unambiguously (legacy body `p_delivery_fee`+`p_payment_status`, strict body `p_payment_method`; a body with neither → `PGRST203` fail-closed; `paid` rejected on both paths — enum on strict, `Unsupported payment status "paid".` on legacy); full order behavior re-checked in a rolled-back hosted transaction (COD Cairo → fee 60/total 310; card → `pending`; forged legacy fee=0 → still 60; threshold 1500 → fee 0; unknown governorate → 60; stock −10 across 5 `sale` movements) with persisted data unchanged (orders=14, customers=6). Remaining: mobile/desktop UI smoke of checkout after the app deploys (display fee matches charged fee); app-side `npm run build` still fails on `/checkout`/`/cart` prerender — stale anon key, see footer.

### 10.2 Confirmed P1

- **No idempotency / double-submit guard.** Repeated `POST`s to `placeOrder` (`src/app/(store)/checkout/actions.ts:28-90`) create duplicate orders; the RPC has no idempotency key. → client `submitting` lock + server idempotency key or short-window dedupe in the RPC.
- **Homepage duplicates products.** `[...featured, ...bestSellers].slice(0, 3)` for the hero and unfiltered dual grids (`src/app/(store)/page.tsx:79,124-128,171-175`) show a product twice when it is both featured and best-selling.
- **"Gifts by budget" claim can be wrong.** Tier cards assert "N handpicked picks from EGP X" (`page.tsx:151-153`) from `getBudgetProducts()`; has not been verified to agree with the `budget` shop filter and true prices.
- **Unhandled throw before the try block.** `getCheckoutLines` at `src/app/(store)/checkout/actions.ts:48-49` raises on a malformed `product_id` → generic 500 instead of a friendly error.

### 10.3 Confirmed P2 / polish

- No custom `not-found.tsx` / `error.tsx` — default Next pages.
- Image fallback covers "no path" (placeholder, `src/components/commerce/product-image.tsx:34-36`) but not "path that fails to load" (no `onError`).
- Order tracking has no ownership check — anyone holding an `order_number` can read status (`get_order_status`, `20261001000005_order_functions.sql:332`). Acceptable for a guest-COD demo only while order numbers remain unguessable; document it.
- Confirmation view reads a client cookie rather than re-fetching the canonical order from the DB (`src/components/shop/confirmation-view.tsx`) — fine as a post-submit view, but the DB is the record of truth.
- No error/logging story for actionable errors (only friendly RPC messages); `supabase/seed.sql:5` references `npm run db:reset`, which does not exist (docs drift).
- Homepage delivery promises ("Ordered today, gifted tomorrow") and testimonials are demo claims — keep labeled demo-only until ops/policies are real (already tracked under §2.A).

### 10.4 Still needs device/release work (left `[ ]` in this audit)

Interactive device runs: widths 360/390/768/1024/1440, touch + keyboard nav, contrast, network-throttle run, Lighthouse, live tracking event display, mobile filter drawer, admin CRUD round-trip in the UI, empty/error/success state walkthrough, and Flows 1–7 against the deployed URL. These are the §3/§4 items not marked above.

### 10.5 Five highest-priority tasks (ordered)

1. **[P0 — DONE]** Kill the role-escalation path — protect the `profiles.role` column + stop trusting signup metadata. Migrations `20261001000012` + `…014` are **applied to the hosted project**; a live REST run proves a fresh signup cannot escalate (direct role `UPDATE` and `set_role` both blocked; admin recovery works). See §10.1 #1.
2. **[P0 — DONE]** Harden `create_order` — compute delivery fee + payment status inside the RPC. Migration `20261001000013` is **applied to the hosted project**; REST overload resolution and fee/status/total verified live. See §10.1 #2.
3. **[P1]** Add order-placement idempotency / double-submit guard.
4. **[P1]** Fix homepage product duplication and verify the "Gifts by budget" claims (`page.tsx:79,124-128,151-153,171-175`).
5. **[P1]** Add `not-found.tsx` / `error.tsx` and a small error-logging story (fixes the `db:reset` doc drift too).

**Recommendation:** both P0 fixes are **deployed and smoke-verified on the hosted project** (migrations `…012`+`…014` role escalation, `…013` order trust; `…014` fixed a hosted-only NULL-logic regression in `…012`). Next: update `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` (the stale key is the current build blocker), deploy the app, UI smoke of checkout + admin logins, and rotate/revoke the exposed DB password and session-pasted CLI token. Highest remaining priorities are the P1s in §10.5 (#3/#4/#5).  
