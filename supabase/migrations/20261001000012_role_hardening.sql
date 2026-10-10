-- FL TASE3 — role hardening
--
-- Closes two privilege-escalation paths found in the pre-launch audit (§10.1 #1):
--
--   1. Signup metadata could mint an admin/staff role. `handle_new_user` copied
--      `raw_user_meta_data ->> 'role'` into `profiles.role`, and that metadata is
--      fully attacker-controlled at the public signup endpoint. Roles are now
--      never taken from metadata; a new profile is always `customer`.
--
--   2. Any authenticated user could `UPDATE profiles SET role = 'admin'` on their
--      own row (the `"profiles: update own"` policy guards the row, not the
--      columns). A column-level `REVOKE` is ineffective here because the
--      table-level `UPDATE` grant from default privileges is additive, so a
--      `BEFORE UPDATE` trigger is the enforcement boundary instead.
--
-- Authorized role management runs through `public.set_role()`, a SECURITY
-- DEFINER function callable only by:
--   - an existing admin (`is_admin()`), or
--   - service-role API sessions (`is_service_role()`), or
--   - trusted provisioning sessions (`session_user` is `postgres`/`supabase_*`,
--     i.e. migrations and seeding).
-- Every role change — no matter the path — is recorded in
-- `public.role_change_log`.

-- ---------------------------------------------------------------------------
-- 1. Signup never grants a privileged role
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'phone',
    'customer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. Session classification helpers
-- ---------------------------------------------------------------------------
-- `session_user` is the real login role and is NOT changed by SECURITY DEFINER
-- or `SET ROLE`, so it reliably identifies the connection owner. PostgREST
-- connects as `authenticator` and then `SET ROLE`s to anon/authenticated, and
-- exposes the JWT `role` claim via `request.jwt.claim.role`, which is how
-- service-role sessions are detected.

create or replace function public.is_service_role()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select nullif(current_setting('request.jwt.claim.role', true), '') = 'service_role'
      or current_user = 'service_role';
$$;

create or replace function public.is_trusted_session()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select session_user in ('postgres', 'supabase_admin', 'supabase_auth_admin', 'service_role');
$$;

-- ---------------------------------------------------------------------------
-- 3. Audit log for every role change
-- ---------------------------------------------------------------------------

create table public.role_change_log (
  id                bigint generated always as identity primary key,
  target_profile_id uuid not null references public.profiles (id) on delete cascade,
  target_email      text,
  new_role          public.user_role not null,
  changed_by        uuid references auth.users (id) on delete set null,
  description       text,
  created_at        timestamptz not null default now()
);

alter table public.role_change_log enable row level security;

create policy "role_change_log: staff view" on public.role_change_log
  for select using (public.is_staff());

create index role_change_log_target_created_idx
  on public.role_change_log (target_profile_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 4. Block unprivileged role changes at the table boundary
-- ---------------------------------------------------------------------------
-- Fires on every profiles UPDATE. A role change is allowed only when the caller
-- is an existing admin, a service-role session, or a trusted provisioning
-- session. Authorized changes are audited here so set_role() and any direct
-- admin SQL share a single audit point.

create or replace function public.protect_profile_role()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if not (public.is_admin() or public.is_service_role() or public.is_trusted_session()) then
      raise exception 'Changing a profile role requires administrator privileges.';
    end if;

    insert into public.role_change_log (target_profile_id, target_email, new_role, changed_by, description)
    values (new.id, new.email, new.role, auth.uid(), 'Role changed');
  end if;

  return new;
end;
$$;

create trigger profiles_protect_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- ---------------------------------------------------------------------------
-- 5. Authorized admin/staff management
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER so a session that passed one of the gates above can update
-- any profile row even though RLS would otherwise limit the row set. Admins may
-- manage other users but never their own role (avoids accidental
-- self-demotion/lockout).

create or replace function public.set_role(p_target_id uuid, p_new_role public.user_role)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if not (public.is_admin() or public.is_service_role() or public.is_trusted_session()) then
    raise exception 'Only an administrator can change a profile role.';
  end if;

  if p_target_id = auth.uid() then
    raise exception 'Administrators cannot change their own role.';
  end if;

  if not exists (select 1 from public.profiles where id = p_target_id) then
    raise exception 'Profile not found.';
  end if;

  update public.profiles
     set role = p_new_role
   where id = p_target_id;
end;
$$;

revoke all on function public.set_role(uuid, public.user_role) from public, anon;
grant execute on function public.set_role(uuid, public.user_role) to authenticated;