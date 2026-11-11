-- Run ONCE on an existing database. Fixes accounts created before the database was installed
-- (they had no profile, so they could never become admin). Safe to run again.
create or replace function public.ensure_profile() returns boolean language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return false; end if;
  insert into public.profiles (id, email, full_name)
  select u.id, u.email, coalesce(u.raw_user_meta_data->>'full_name', '') from auth.users u where u.id = auth.uid()
  on conflict (id) do nothing;
  return true;
end $$;
grant execute on function public.ensure_profile() to anon, authenticated;

create or replace function public.claim_first_admin() returns boolean language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or exists (select 1 from public.profiles where role = 'admin') then return false; end if;
  perform public.ensure_profile();
  perform set_config('app.bypass', '1', true);
  update public.profiles set role = 'admin' where id = auth.uid();
  return found;
end $$;
grant execute on function public.claim_first_admin() to authenticated;

-- give a profile to every account that is missing one
insert into public.profiles (id, email, full_name)
select u.id, u.email, coalesce(u.raw_user_meta_data->>'full_name', '') from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);
