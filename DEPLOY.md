# Deploying FL Tase3 (Supabase + Vercel)

This guide takes the project from your Windows machine to a live site:
a hosted **Supabase** database + auth + storage, and the **Next.js** app on **Vercel**.

You only need to do Part 1 once.

---

## What lives where

| Thing | Where it goes | Value / location |
| --- | --- | --- |
| Source code | GitHub repo | push from `C:\Users\bodyo\OneDrive\Desktop\fy.eltase3` |
| Database, Auth, Storage | Hosted Supabase project | created in Part 1 |
| Database schema | `supabase/migrations/*.sql` | pushed with `supabase db push` |
| Demo data + admin logins | `supabase/seed.sql` | pushed with `--include-seed` |
| App hosting | Vercel | imports the GitHub repo |
| Secrets / config | Vercel Environment Variables + local `.env.local` | see tables below |

### Environment variables

| Name | Example | Where to get it | Used by |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://abcd1234.supabase.co` | Supabase → Settings → API → Project URL | app, middleware, storage |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOi...` | Supabase → Settings → API → anon public | app, middleware |
| `NEXT_PUBLIC_SITE_URL` | `https://fltase3.com` | your live domain (or the Vercel URL) | SEO metadata |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOi...` | Supabase → Settings → API → service_role (secret) | notification worker (server only) |
| `RESEND_API_KEY` | `re_...` | Resend → API Keys | email notification worker (server only) |
| `ORDER_NOTIFICATION_FROM` | `FL Tase3 <orders@yourdomain.com>` | a Resend-verified sender | email notification worker (server only) |
| `ORDER_NOTIFICATION_EMAIL` | `owner@yourdomain.com` | owner's inbox for new-order alerts | email notification worker (server only) |
| `CRON_SECRET` | `<random hex>` | generate with `openssl rand -hex 32` | protects the dispatch endpoint |

> The storefront itself needs only the three `NEXT_PUBLIC_*` values. The
> `SUPABASE_SERVICE_ROLE_KEY`, Resend and `CRON_SECRET` values are **server-only**
> and power the new-order email notification worker (see Part 8). Without the
> Resend values the app still works — notifications are simply skipped.
>
> WhatsApp is **not active**. Its environment variables are intentionally omitted
> here; the code is kept dormant for a future opt-in.

---

## Part 0 — Open the terminal in the right folder

The tools are already installed on this machine:

- **Supabase CLI** → `C:\Users\bodyo\AppData\Roaming\npm\supabase.ps1`
- **Node.js / npm** → used for the Next.js app
- **Git** → to push to GitHub

### Open a terminal (PowerShell)

1. Press `Win` and type **PowerShell**, open **Windows PowerShell** (or **Terminal**).
2. Go to the project folder:

```powershell
cd "C:\Users\bodyo\OneDrive\Desktop\fy.eltase3"
```

3. Confirm you are in the right place (you should see `package.json`, `supabase`, `src`):

```powershell
Get-ChildItem
```

> You can also open the folder in File Explorer, right-click the background,
> and choose **Open in Terminal**.

---

## Part 1 — Create the hosted Supabase project

1. Open https://supabase.com/dashboard and sign in (create a free account if needed).
2. Click **New project**.
3. Fill in:
   - **Name**: `fl-tase3`
   - **Database Password**: pick a strong password and **save it** (you will type it in Part 2).
   - **Region**: pick the closest to your users, e.g. **Frankfurt (eu-central-1)**.
4. Click **Create new project** and wait (~1–2 minutes) until it finishes provisioning.
5. Open **Project Settings (gear icon) → API** and copy these two values somewhere safe:
   - **Project URL** → looks like `https://abcd1234.supabase.co`
   - **anon public** key → a long string starting with `eyJ...`
6. Still in Settings, note the **Reference ID** (e.g. `abcd1234`). This is your `<ref>`.

---

## Part 2 — Push the schema and demo data to Supabase

Run these commands in the project folder (from Part 0).

### 2.1 Log in to Supabase

```powershell
supabase login
```

- This opens the browser. Approve it, or generate a token at
  https://supabase.com/dashboard/account/tokens and paste it when prompted.

### 2.2 Link this folder to your hosted project

```powershell
supabase link --project-ref <ref>
```

- Replace `<ref>` with the Reference ID from Part 1 (step 6).
- It asks for the **database password** you saved in Part 1. Paste it (input is hidden).

### 2.3 Apply migrations **and** seed data

```powershell
supabase db push --linked --include-seed
```

- `db push` runs every file in `supabase/migrations/` in order.
- `--include-seed` then runs `supabase/seed.sql` (18 demo products, 14 orders, demo admin).

**If the CLI says it needs Docker:** run the migrations without the flag, then paste the seed by hand:

```powershell
supabase db push --linked
```

1. Open Supabase → **SQL Editor** → **New query**.
2. Open `supabase/seed.sql` in a text editor, copy everything, paste it in, and click **Run**.

### 2.4 Verify

In Supabase → **Table Editor** you should see:

- `products` with **18** rows
- `orders` with **14** rows
- `categories` with **8** rows

---

## Part 3 — Create / secure the admin login

The seed already created two staff accounts:

| Email | Password | Role |
| --- | --- | --- |
| `admin@fltase3.com` | `Admin1234!` | admin |
| `staff@fltase3.com` | `Staff1234!` | staff |

### Change the passwords (do this before going live)

1. Supabase → **Authentication → Users**.
2. Click the user → **Reset password** (or **Update password**) and set a strong one.

### Or create your own admin instead

1. Supabase → **Authentication → Users → Add user → Create new user**.
2. Email: your address, Password: strong, toggle **Auto Confirm User** on.
3. Under **User Metadata**, paste:

```json
{ "full_name": "Your Name", "role": "admin" }
```

4. Save. A database trigger (`handle_new_user`) creates the `profiles` row with the `admin` role automatically.

---

## Part 4 — Supabase Auth URLs

Supabase → **Authentication → URL Configuration**:

- **Site URL**: `https://<your-live-domain>`
- **Redirect URLs** — add:
  - `https://<your-live-domain>/**`
  - `http://localhost:3000/**` (keep this for local development)

Email confirmation:

- **Authentication → Providers → Email** — for a real launch, keep **Confirm email** on and configure
  **SMTP** (Auth → Emails / SMTP settings) so signup emails actually send.
- For quick testing you can turn **Confirm email** off.
- Admin/staff login (email + password) works either way.

---

## Part 5 — Put the code on GitHub (first time only)

In the project folder:

```powershell
git add -A
git commit -m "feat: admin console, storefront complete"
git push
```

If there is no remote yet, create an empty repo on GitHub and connect it:

```powershell
git remote add origin https://github.com/<you>/<repo>.git
git branch -M main
git push -u origin main
```

---

## Part 6 — Deploy on Vercel

1. Open https://vercel.com/new and sign in with GitHub.
2. **Import** your repository.
3. Vercel auto-detects Next.js — leave the build settings as they are.
4. Open **Environment Variables** and add all three (Production **and** Preview):

| Key | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon public key |
| `NEXT_PUBLIC_SITE_URL` | `https://<your-live-domain>` |

5. Click **Deploy**. The build connects to the hosted Supabase, so it will succeed
   (the earlier local build failed only because local Supabase/Docker was off).
6. When done, copy the Vercel URL (e.g. `https://fl-tase3.vercel.app`).
   If you have a custom domain, add it under **Project → Settings → Domains**,
   then update `NEXT_PUBLIC_SITE_URL` and the Supabase Auth URLs (Part 4) to match.

---

## Part 7 — Verify the live site

- Storefront: `https://<your-domain>/` shows the 18 products.
- Admin: `https://<your-domain>/admin` → sign in with the admin account →
  Dashboard, Orders, Products, Inventory, Customers all load.
- Upload a product image in **Admin → Products** to confirm Storage works.

When everything works, remove the demo data: delete the 14 sample orders/customers
from the admin, or run this in the Supabase SQL Editor:

```sql
truncate public.order_status_history, public.inventory_movements, public.order_items, public.orders, public.customers cascade;
```

---

## Part 8 — New-order email notifications

Every order placed on the storefront enqueues a notification job **in the same
database transaction as the order** (table `notification_outbox`), so a job can
never be lost even if the request dies right after checkout. The app then tries
to send it immediately (`after()` on the checkout server action), and a Vercel
Cron sweep retries anything that failed or was missed. Failed jobs retry with
exponential backoff (1 min → 1 h, max 5 attempts) and already-sent jobs are never
re-sent.

The **active channel is email** (via [Resend](https://resend.com)). WhatsApp is
kept in the codebase but **dormant**: no order enqueues a WhatsApp job and the
worker never claims or calls the WhatsApp channel.

The migration ships with the rest: `supabase/migrations/20261001000015_order_notifications.sql`
is applied by `supabase db push` in Part 2 (nothing extra to run).

### 8.1 Create the Resend sender

1. Create a [Resend](https://resend.com) account and an **API key** (`re_...`).
2. Add and **verify your sending domain** (Resend → Domains), so the `from`
   address is allowed to send.
3. Decide the recipient: the owner inbox that should receive new-order alerts.

The email contains the order number, customer name and phone, each item with its
quantity, the subtotal, delivery fee and total, and the delivery address, area,
governorate and notes — all taken from the persisted order, never from the
client display data.

### 8.2 Set the environment variables

Add `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `ORDER_NOTIFICATION_FROM`,
`ORDER_NOTIFICATION_EMAIL` and `CRON_SECRET` from the table above to
**Vercel → Project → Settings → Environment Variables** (Production **and**
Preview). Locally, add the same keys to `.env.local`.

`ORDER_NOTIFICATION_FROM` must be a verified sender, e.g.
`FL Tase3 <orders@yourdomain.com>`.

### 8.3 The retry cron

`vercel.json` registers a cron that calls `/api/notifications/dispatch` every 5
minutes. The endpoint is **not public**: it requires
`Authorization: Bearer $CRON_SECRET` (which Vercel Cron sends automatically).

> **Vercel plan limits:** on the free **Hobby** plan crons run at most **once per
> day** and the schedule may be adjusted. The immediate `after()` send still runs
> right after checkout, so the cron is only a safety net. For frequent retries on
> Hobby, point any external scheduler (GitHub Actions, cron-job.org, …) at
> `https://<your-domain>/api/notifications/dispatch` with
> `Authorization: Bearer <CRON_SECRET>`.

### 8.4 Verify

1. Place a test order on the storefront.
2. Supabase → **Table Editor → `notification_outbox`**: a row should exist for
   the order with `channel = email` and `status = sent` (or `failed` +
   `last_error` while retrying).
3. The configured owner inbox should receive the alert.

---

## Quick reference — all commands

```powershell
# 0. go to project
cd "C:\Users\bodyo\OneDrive\Desktop\fy.eltase3"

# 2. connect to Supabase and publish database
supabase login
supabase link --project-ref <ref>
supabase db push --linked --include-seed

# 5. push code
git add -A ; git commit -m "deploy" ; git push

# optional: run the app locally against hosted Supabase
npm run dev
```

---

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `supabase login` opens nothing | Generate a token at https://supabase.com/dashboard/account/tokens and paste it. |
| `db push` asks for Docker | Run `supabase db push --linked` and paste `supabase/seed.sql` into the SQL Editor. |
| `relation "..." does not exist` | Migrations did not finish — re-run `supabase db push --linked`. |
| Vercel build fails with `fetch failed` / `supabase` errors | Env vars missing or wrong. Re-check the three variables in Part 6. |
| Admin login says invalid credentials | Wrong email/password, or the user was not confirmed. Check **Authentication → Users**. |
| Images don't load | Buckets come from migration `..._storage.sql`; confirm the 4 buckets exist under **Storage**. |
| `NEXT_PUBLIC_SITE_URL` wrong | Update it in Vercel and Supabase Auth URLs, then redeploy. |
| No order emails arrive | Check the `notification_outbox` row's `last_error`, that the `from` domain is **verified** in Resend, and that `ORDER_NOTIFICATION_EMAIL` is correct. Re-trigger with a manual `POST` to `/api/notifications/dispatch` (with the Bearer secret). |
| `/api/notifications/dispatch` returns 401 | `CRON_SECRET` missing/mismatched, or the caller did not send `Authorization: Bearer <secret>`. |

---

## Local development against the hosted database (optional)

Instead of running Supabase locally, point the app at the hosted project.
Create `.env.local` in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Then:

```powershell
npm run dev
```

Open http://localhost:3000.
