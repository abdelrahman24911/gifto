-- FL TASE3 — role guard NULL-safety fix
-- (follow-up to P0 §10.1 #1 / migration 12)
--
-- Migration 12 installed these guards:
--     if not (is_admin() or is_service_role() or is_trusted_session()) then raise ...
-- On the real Supabase PostgREST runtime the JWT is exposed only as the
-- `request.jwt.claims` JSON blob; the singular `request.jwt.claim.role` GUC is
-- NOT set. `is_service_role()` therefore evaluated
--     NULLIF(current_setting('request.jwt.claim.role', true), '') = 'service_role'
-- to NULL, and `current_user = 'service_role'` to false, so it returned NULL
-- instead of false. A NULL inside the OR chain makes the guard `not NULL` ->
-- NULL, so the IF never raised: any authenticated user could escalate their own
-- role (direct profiles UPDATE) or change any user's role via set_role(), and
-- the change was even written to role_change_log as if authorized.
--
-- The regression was hidden in local tests because the harness set the singular
-- `request.jwt.claim.role` GUC, which real PostgREST does not. This migration:
--   1. makes the session classifiers strictly boolean (never NULL), reading the
--      service_role claim from auth.jwt() (how PostgREST exposes it), and
--   2. wraps every guard operand in coalesce() for defence in depth.
-- After this, only is_admin() / service_role sessions / trusted provisioning
-- sessions (postgres, supabase_*) may change a profile role.

-- ---------------------------------------------------------------------------
-- 1. Strictly-boolean service-role detection
-- ---------------------------------------------------------------------------

create or replace function public.is_service_role()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), '') = 'service_role'
      or coalesce(auth.jwt() ->> 'role', '') = 'service_role'
      or current_user = 'service_role';
$$;

-- ---------------------------------------------------------------------------
-- 2. Re-install the guards with NULL-safe boolean operands
-- ---------------------------------------------------------------------------

create or replace function public.protect_profile_role()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if not (
      coalesce(public.is_admin(), false)
      or coalesce(public.is_service_role(), false)
      or coalesce(public.is_trusted_session(), false)
    ) then
      raise exception 'Changing a profile role requires administrator privileges.';
    end if;

    insert into public.role_change_log (target_profile_id, target_email, new_role, changed_by, description)
    values (new.id, new.email, new.role, auth.uid(), 'Role changed');
  end if;

  return new;
end;
$$;

create or replace function public.set_role(p_target_id uuid, p_new_role public.user_role)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if not (
    coalesce(public.is_admin(), false)
    or coalesce(public.is_service_role(), false)
    or coalesce(public.is_trusted_session(), false)
  ) then
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
