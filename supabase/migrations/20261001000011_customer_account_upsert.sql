-- FL TASE3 - signed-in customers maintain their own customer row.
-- A definer function is required because RLS forbids anonymous/anonymous-customer
-- writes to public.customers; the only row ever touched is the caller's own.

create or replace function public.upsert_my_customer(
  p_full_name text,
  p_phone     text,
  p_email     text default null
)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_user_id   uuid := auth.uid();
  v_token_email text;
  v_customer  public.customers%rowtype;
  v_email     text;
begin
  if v_user_id is null then
    raise exception 'Sign in first.';
  end if;

  if p_full_name is null or length(trim(p_full_name)) < 2 then
    raise exception 'Please enter your full name.';
  end if;
  if p_phone is null or p_phone !~ '^[0-9+\s\-]{8,20}$' then
    raise exception 'Please enter a valid phone number.';
  end if;

  v_token_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_email := lower(nullif(trim(coalesce(p_email, '')), ''));
  if v_email = '' then v_email := v_token_email; end if;
  -- Only ever trust the verified email inside the token. The submitted one may
  -- only be used when it matches it.
  if v_email <> v_token_email then v_email := v_token_email; end if;
  if v_email = '' then v_email := null; end if;

  select * into v_customer from public.customers where user_id = v_user_id limit 1;

  if not found then
    -- Existing guest rows are claimed only via the verified email address.
    select * into v_customer
      from public.customers
     where v_email is not null and lower(email) = v_email
     limit 1;

    if not found then
      insert into public.customers (full_name, phone, email, user_id)
      values (trim(p_full_name), p_phone, v_email, v_user_id)
      returning * into v_customer;
    else
      update public.customers
         set user_id = v_user_id, updated_at = now()
       where id = v_customer.id;
    end if;
  end if;

  update public.customers
     set full_name = trim(p_full_name),
         phone     = p_phone,
         email     = coalesce(email, v_email),
         updated_at = now()
   where id = v_customer.id;

  return v_customer.id;
end;
$$;

grant execute on function public.upsert_my_customer(text, text, text)
  to authenticated;

-- Signed-in users create no customer rows by themselves, but the function above
-- runs as the owner (security definer) so no additional grant/RLS is needed.