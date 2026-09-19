-- Migration: RLS hardening — prevent role escalation & enforce hierarchy
-- Fixes profiles_update loophole where any staff could promote to super_admin

-- Trigger to enforce role change rules at DB level (defense in depth)
create or replace function public.handle_profiles_role_guard()
returns trigger as $$
declare
  caller_role text;
  caller_id uuid := auth.uid();
begin
  -- Allow self-update of non-role fields (first_name, last_name, phone) is handled; role/is_active changes are guarded
  if (NEW.role is distinct from OLD.role) or (NEW.is_active is distinct from OLD.is_active) or (NEW.email is distinct from OLD.email) then
    -- Fetch caller role
    select role into caller_role from public.profiles where id = caller_id;

    -- If caller is null (service_role via edge function), allow (edge functions use service_role and bypass RLS)
    if caller_id is null then
      return NEW;
    end if;

    -- No one can change own role via direct table update (must use edge function)
    if OLD.id = caller_id and NEW.role is distinct from OLD.role then
      raise exception 'Cannot change own role directly';
    end if;

    -- Super_admin target protection
    if OLD.role = 'super_admin' and caller_role is distinct from 'super_admin' then
      raise exception 'Only super_admin can modify super_admin';
    end if;

    -- New role = super_admin → only super_admin
    if NEW.role = 'super_admin' and caller_role is distinct from 'super_admin' then
      raise exception 'Only super_admin can assign super_admin';
    end if;

    -- New role = admin → only super_admin
    if NEW.role = 'admin' and caller_role is distinct from 'super_admin' then
      raise exception 'Only super_admin can assign admin';
    end if;

    -- New role = employee → only admin or super_admin
    if NEW.role = 'employee' and caller_role not in ('admin','super_admin') then
      raise exception 'Only admin can assign employee';
    end if;

    -- Deactivating super_admin → only super_admin
    if OLD.role = 'super_admin' and NEW.is_active = false and caller_role is distinct from 'super_admin' then
      raise exception 'Cannot deactivate super_admin';
    end if;

    -- Email change of super_admin → only super_admin
    if OLD.role = 'super_admin' and NEW.email is distinct from OLD.email and caller_role is distinct from 'super_admin' then
      raise exception 'Only super_admin can change super_admin email';
    end if;
  end if;

  return NEW;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists profiles_role_guard on public.profiles;
create trigger profiles_role_guard before update on public.profiles for each row execute function public.handle_profiles_role_guard();

-- Also guard insert (should only be via trigger on_auth_user_created with role customer, or via service_role)
create or replace function public.handle_profiles_insert_guard()
returns trigger as $$
begin
  -- If inserted role is super_admin/admin via anon/authenticated without service_role, block unless caller is super_admin
  if NEW.role in ('admin','super_admin') then
    -- Allow service_role (auth.uid() is null) or super_admin caller
    if auth.uid() is not null then
      declare caller_role text;
      begin
        select role into caller_role from public.profiles where id = auth.uid();
        if caller_role is distinct from 'super_admin' then
          raise exception 'Only super_admin can insert admin/super_admin';
        end if;
      end;
    end if;
  end if;
  return NEW;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists profiles_insert_guard on public.profiles;
create trigger profiles_insert_guard before insert on public.profiles for each row execute function public.handle_profiles_insert_guard();

-- Fix: Ensure anon cannot write profiles (already via policy but double-check enable)
-- Tighten profiles insert: only own id or service_role
-- Already exists as "profiles_insert_own" with check auth.uid()=id — good

-- Verify storage policies for payment-receipts owner field correctness:
-- Our previous migration used owner = auth.uid() but storage.objects.owner is uuid of uploader.
-- Ensure policy uses correct column (owner). Supabase docs use owner = auth.uid() correctly.
-- No change needed, but add comment.

-- Additional hardening: prevent anon from reading profiles beyond public check (already authenticated only)
-- Ensure orders delete is not allowed (no policy = default deny)
