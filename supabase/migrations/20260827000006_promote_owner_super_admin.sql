-- Migration: Promote store owner to super_admin (idempotent, safe, no password)
-- Target: kyanalsfyany16@gmail.com
-- Requirements:
-- - Does NOT change registration flow (all new users remain customer via on_auth_user_created)
-- - Only promotes this specific email if auth user + profile already exist
-- - Does NOT use Service Role in Frontend, only DB migration (runs with elevated privileges)
-- - Preserves RLS/Guards (handle_profiles_role_guard allows super_admin self-promotion only via service_role/migration)
-- - If account does not exist, does nothing (owner must register first via /register or Supabase Dashboard)

-- Ensure profile exists for the owner and promote to super_admin
-- We update by lower(email) to be case-insensitive, and ensure is_active = true

do $$
declare
  v_user_id uuid;
begin
  -- Find auth user id by email (auth.users is in auth schema)
  select id into v_user_id from auth.users where lower(email) = lower('kyanalsfyany16@gmail.com') limit 1;

  if v_user_id is not null then
    -- Upsert profile: if exists update role, if not exists create with super_admin
    -- First, try update existing profile
    update public.profiles
    set role = 'super_admin',
        is_active = true,
        updated_at = now()
    where id = v_user_id;

    -- If no profile row was updated (profile missing), insert it
    if not found then
      insert into public.profiles (id, email, role, is_active)
      values (v_user_id, 'kyanalsfyany16@gmail.com', 'super_admin', true)
      on conflict (id) do update set role = 'super_admin', is_active = true;
    end if;

    raise notice 'Owner % promoted to super_admin (user_id=%)', 'kyanalsfyany16@gmail.com', v_user_id;
  else
    raise notice 'Owner account not found in auth.users for %. Please create account first via /register, then re-run migration or run manual SQL.', 'kyanalsfyany16@gmail.com';
  end if;
end $$;

-- Additional safety: Ensure no other customer was auto-promoted - verify trigger still forces customer
-- (No change needed, trigger on_auth_user_created hardcodes ''customer'')

-- Verify RLS still blocks employee from modifying super_admin (handled by handle_profiles_role_guard)
-- No Service Role Key is exposed here; this runs as migration owner
