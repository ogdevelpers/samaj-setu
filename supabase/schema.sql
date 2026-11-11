-- Shri Dasha Vaishnav Porwad Samaj portal: database schema, access rules and storage.
-- Run once in Supabase: SQL Editor > New query > paste > Run.

-- ============ TABLES ============
create table public.chapters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  state text not null,
  district text not null,
  area text not null,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'member' check (role in ('member','treasurer','coordinator','admin')),
  chapter_id uuid references public.chapters(id) on delete set null,
  household_id uuid,
  lang text not null default 'hi' check (lang in ('hi','en')),
  created_at timestamptz not null default now()
);

create table public.households (
  id uuid primary key default gen_random_uuid(),
  head_user_id uuid not null unique references auth.users(id) on delete cascade,
  head_name text not null,
  chapter_id uuid references public.chapters(id),
  place_state text,
  place_district text,
  place_area text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  waiver_amount numeric not null default 0,
  reject_note text,
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.profiles
  add constraint profiles_household_fk foreign key (household_id) references public.households(id) on delete set null;

-- address and phone never go to other members
create table public.household_private (
  household_id uuid primary key references public.households(id) on delete cascade,
  address text,
  phone text
);

create table public.people (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  full_name text not null,
  gender text check (gender in ('M','F')),
  dob date,
  relation text not null default 'other',
  is_head boolean not null default false,
  deceased boolean not null default false,
  occupation text,
  blood_group text,
  can_donate_blood boolean not null default false,
  father_id uuid references public.people(id) on delete set null,
  mother_id uuid references public.people(id) on delete set null,
  spouse_id uuid references public.people(id) on delete set null,
  created_at timestamptz not null default now()
);
create index on public.people (household_id);
create index on public.people (father_id);
create index on public.people (mother_id);
create index on public.people (spouse_id);

create table public.person_contacts (
  person_id uuid primary key references public.people(id) on delete cascade,
  phone text,
  visible boolean not null default false
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  starts_at timestamptz not null,
  venue text,
  category text not null default 'function',
  chapter_id uuid references public.chapters(id) on delete cascade,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.rsvps (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (event_id, user_id)
);

create table public.notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  category text not null default 'general' check (category in ('general','finance','education','condolence','shubh')),
  chapter_id uuid references public.chapters(id) on delete cascade,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.albums (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_id uuid references public.events(id) on delete set null,
  event_date date not null,
  chapter_id uuid references public.chapters(id) on delete cascade,
  video_url text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.albums(id) on delete cascade,
  path text not null,
  thumb_path text not null,
  created_at timestamptz not null default now()
);
create index on public.photos (album_id);

create table public.fee_years (
  fy text primary key,
  per_member numeric not null check (per_member >= 0)
);

create sequence public.receipt_seq start 1001;

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  chapter_id uuid not null references public.chapters(id),
  fy text not null,
  kind text not null check (kind in ('dues','occasion','donation')),
  occasion text,
  fund text,
  amount numeric not null check (amount > 0),
  mode text not null default 'upi' check (mode in ('upi','cash','bank')),
  utr text,
  screenshot_path text,
  status text not null default 'pending' check (status in ('pending','confirmed','rejected')),
  visibility text not null default 'name' check (visibility in ('amount','name','private')),
  label text,
  note text,
  receipt_no text,
  created_by uuid references auth.users(id),
  confirmed_by uuid references auth.users(id),
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.payments (household_id);
create index on public.payments (chapter_id, status);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid references public.chapters(id) on delete set null,
  spent_on date not null default current_date,
  description text not null,
  category text not null default 'general',
  amount numeric not null check (amount > 0),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('business','job','vivah')),
  title text not null,
  body text,
  contact text,
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  approved boolean not null default false,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.scholarships (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  amount numeric,
  deadline date,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.scholarship_applications (
  id uuid primary key default gen_random_uuid(),
  scholarship_id uuid not null references public.scholarships(id) on delete cascade,
  applicant_id uuid not null references auth.users(id) on delete cascade,
  student_name text not null,
  institution text,
  marks text,
  note text,
  status text not null default 'submitted' check (status in ('submitted','approved','declined')),
  created_at timestamptz not null default now()
);

create table public.audit_log (
  id bigserial primary key,
  actor uuid,
  action text not null,
  detail text,
  created_at timestamptz not null default now()
);

-- ============ HELPERS ============
create function public.my_role() returns text language sql stable security definer set search_path = public as
$$ select role from public.profiles where id = auth.uid() $$;

create function public.my_chapter() returns uuid language sql stable security definer set search_path = public as
$$ select chapter_id from public.profiles where id = auth.uid() $$;

create function public.is_admin() returns boolean language sql stable security definer set search_path = public as
$$ select coalesce(public.my_role() = 'admin', false) $$;

create function public.is_staff() returns boolean language sql stable security definer set search_path = public as
$$ select coalesce(public.my_role() in ('admin','coordinator','treasurer'), false) $$;

create function public.is_member() returns boolean language sql stable security definer set search_path = public as
$$ select public.is_staff() or exists (
     select 1 from public.profiles p join public.households h on h.id = p.household_id
     where p.id = auth.uid() and h.status = 'approved') $$;

-- coordinator of this chapter (or admin)
create function public.can_coordinate(c uuid) returns boolean language sql stable security definer set search_path = public as
$$ select public.is_admin() or (public.my_role() = 'coordinator' and public.my_chapter() = c and c is not null) $$;

-- treasurer of this chapter (or admin)
create function public.can_treasure(c uuid) returns boolean language sql stable security definer set search_path = public as
$$ select public.is_admin() or (public.my_role() = 'treasurer' and public.my_chapter() = c and c is not null) $$;

create function public.can_manage_chapter(c uuid) returns boolean language sql stable security definer set search_path = public as
$$ select public.can_coordinate(c) or public.can_treasure(c) $$;

create function public.household_owner(h uuid) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.households where id = h and head_user_id = auth.uid()) $$;

create function public.household_editable(h uuid) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.households where id = h
     and (head_user_id = auth.uid() or public.can_coordinate(chapter_id))) $$;

create function public.household_visible(h uuid) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.households where id = h
     and (head_user_id = auth.uid() or public.can_manage_chapter(chapter_id)
          or (status = 'approved' and public.is_member()))) $$;

-- ============ TRIGGERS ============
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- registering a household links the signed-in user to it and to its chapter
create function public.link_household() returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform set_config('app.bypass', '1', true);
  update public.profiles set household_id = new.id, chapter_id = coalesce(chapter_id, new.chapter_id)
    where id = new.head_user_id;
  return new;
end $$;
create trigger households_link after insert on public.households
  for each row execute function public.link_household();

create function public.protect_profile() returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- auth.uid() is null for the SQL editor and service role, so the first admin can be set there
  if auth.uid() is null or current_setting('app.bypass', true) = '1' or public.is_admin() then return new; end if;
  if new.role is distinct from old.role or new.chapter_id is distinct from old.chapter_id
     or new.household_id is distinct from old.household_id or new.id is distinct from old.id then
    raise exception 'Not allowed to change role, chapter or household';
  end if;
  return new;
end $$;
create trigger profiles_protect before update on public.profiles
  for each row execute function public.protect_profile();

create function public.protect_household() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.can_coordinate(old.chapter_id) then
    if new.status = 'approved' and old.status <> 'approved' then
      new.approved_by := auth.uid(); new.approved_at := now();
    end if;
    return new;
  end if;
  if new.status is distinct from old.status or new.waiver_amount is distinct from old.waiver_amount
     or new.chapter_id is distinct from old.chapter_id or new.head_user_id is distinct from old.head_user_id then
    raise exception 'Only the chapter coordinator can change this';
  end if;
  return new;
end $$;
create trigger households_protect before update on public.households
  for each row execute function public.protect_household();

create function public.payment_defaults() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    select chapter_id into new.chapter_id from public.households where id = new.household_id;
    if not public.can_treasure(new.chapter_id) then
      new.status := 'pending'; new.confirmed_by := null; new.confirmed_at := null; new.receipt_no := null;
    end if;
  end if;
  if new.status = 'confirmed' and (tg_op = 'INSERT' or old.status <> 'confirmed') then
    new.receipt_no := coalesce(new.receipt_no, 'A-' || nextval('public.receipt_seq'));
    new.confirmed_by := coalesce(new.confirmed_by, auth.uid());
    new.confirmed_at := coalesce(new.confirmed_at, now());
  end if;
  return new;
end $$;
create trigger payments_defaults before insert or update on public.payments
  for each row execute function public.payment_defaults();

create function public.log_audit() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_log (actor, action, detail)
  values (auth.uid(), tg_table_name || ' ' || lower(tg_op),
          coalesce((to_jsonb(new)->>'id'), (to_jsonb(old)->>'id')) || ' ' ||
          coalesce(to_jsonb(new)->>'status', ''));
  return coalesce(new, old);
end $$;
create trigger audit_households after update on public.households for each row execute function public.log_audit();
create trigger audit_payments after update on public.payments for each row execute function public.log_audit();
create trigger audit_profiles after update on public.profiles for each row execute function public.log_audit();

-- ============ MEMBER-FACING FUNCTIONS ============
create function public.community_stats() returns table(households bigint, members bigint, chapters bigint)
language sql stable security definer set search_path = public as $$
  select (select count(*) from public.households where status = 'approved'),
         (select count(*) from public.people p join public.households h on h.id = p.household_id
            where h.status = 'approved' and not p.deceased),
         (select count(*) from public.chapters)
  where public.is_member()
$$;

create function public.upcoming_birthdays(days int default 7) returns table(full_name text, dob date, area text, on_day date)
language sql stable security definer set search_path = public as $$
  select p.full_name, p.dob, c.area,
         (make_date(extract(year from current_date)::int, extract(month from p.dob)::int, least(extract(day from p.dob)::int, 28))
            + (case when make_date(extract(year from current_date)::int, extract(month from p.dob)::int, least(extract(day from p.dob)::int, 28)) < current_date
                    then interval '1 year' else interval '0' end))::date as on_day
  from public.people p
  join public.households h on h.id = p.household_id and h.status = 'approved'
  join public.chapters c on c.id = h.chapter_id
  where public.is_member() and p.dob is not null and not p.deceased
  order by 4
  limit 50
$$;

-- shubh samachar board: amount appears only if the contributor chose so
create function public.contribution_board() returns table(label text, occasion text, amount numeric, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select case when pay.visibility = 'private' then null else pay.label end,
         pay.occasion,
         case when pay.visibility = 'amount' then pay.amount else null end,
         pay.confirmed_at
  from public.payments pay
  where public.is_member() and pay.status = 'confirmed' and pay.kind = 'occasion' and pay.visibility <> 'private'
  order by pay.confirmed_at desc
  limit 30
$$;

-- yearly totals every member can read (transparency)
create function public.finance_summary(p_fy text) returns table(income_dues numeric, income_occasion numeric, income_donation numeric, expenses numeric)
language sql stable security definer set search_path = public as $$
  select coalesce(sum(amount) filter (where kind = 'dues'), 0),
         coalesce(sum(amount) filter (where kind = 'occasion'), 0),
         coalesce(sum(amount) filter (where kind = 'donation'), 0),
         (select coalesce(sum(amount), 0) from public.expenses
            where spent_on >= make_date(split_part(p_fy, '-', 1)::int, 4, 1)
              and spent_on < make_date(split_part(p_fy, '-', 1)::int + 1, 4, 1))
  from public.payments
  where public.is_member() and status = 'confirmed' and fy = p_fy
$$;

-- ============ ROW LEVEL SECURITY ============
alter table public.chapters enable row level security;
alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_private enable row level security;
alter table public.people enable row level security;
alter table public.person_contacts enable row level security;
alter table public.events enable row level security;
alter table public.rsvps enable row level security;
alter table public.notices enable row level security;
alter table public.albums enable row level security;
alter table public.photos enable row level security;
alter table public.fee_years enable row level security;
alter table public.payments enable row level security;
alter table public.expenses enable row level security;
alter table public.listings enable row level security;
alter table public.scholarships enable row level security;
alter table public.scholarship_applications enable row level security;
alter table public.audit_log enable row level security;

-- chapters: anyone signed in can pick theirs while registering
create policy chapters_read on public.chapters for select to authenticated using (true);
create policy chapters_write on public.chapters for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy profiles_read on public.profiles for select to authenticated using (id = auth.uid() or public.is_staff());
create policy profiles_update on public.profiles for update to authenticated using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

create policy households_read on public.households for select to authenticated
  using (head_user_id = auth.uid() or public.household_visible(id));
create policy households_insert on public.households for insert to authenticated
  with check (head_user_id = auth.uid() and status = 'pending');
create policy households_update on public.households for update to authenticated
  using (head_user_id = auth.uid() or public.can_coordinate(chapter_id));
create policy households_delete on public.households for delete to authenticated using (public.is_admin());

create policy hprivate_read on public.household_private for select to authenticated
  using (public.household_owner(household_id) or exists (select 1 from public.households h where h.id = household_id and public.can_manage_chapter(h.chapter_id)));
create policy hprivate_write on public.household_private for all to authenticated
  using (public.household_editable(household_id)) with check (public.household_editable(household_id));

create policy people_read on public.people for select to authenticated using (public.household_visible(household_id));
create policy people_write on public.people for all to authenticated
  using (public.household_editable(household_id)) with check (public.household_editable(household_id));

create policy contacts_read on public.person_contacts for select to authenticated using (
  exists (select 1 from public.people p where p.id = person_id and (
      public.household_editable(p.household_id)
      or public.household_visible(p.household_id) and (visible or public.is_staff())
  )));
create policy contacts_write on public.person_contacts for all to authenticated
  using (exists (select 1 from public.people p where p.id = person_id and public.household_editable(p.household_id)))
  with check (exists (select 1 from public.people p where p.id = person_id and public.household_editable(p.household_id)));

create policy events_read on public.events for select to authenticated using (public.is_member());
create policy events_write on public.events for all to authenticated
  using (public.can_coordinate(chapter_id) or (chapter_id is null and public.is_admin()))
  with check (public.can_coordinate(chapter_id) or (chapter_id is null and public.is_admin()));

create policy rsvps_read on public.rsvps for select to authenticated using (public.is_member());
create policy rsvps_write on public.rsvps for all to authenticated
  using (user_id = auth.uid() and public.is_member()) with check (user_id = auth.uid() and public.is_member());

create policy notices_read on public.notices for select to authenticated using (public.is_member());
create policy notices_write on public.notices for all to authenticated
  using (public.can_coordinate(chapter_id) or (chapter_id is null and public.is_admin()))
  with check (public.can_coordinate(chapter_id) or (chapter_id is null and public.is_admin()));

create policy albums_read on public.albums for select to authenticated using (public.is_member());
create policy albums_write on public.albums for all to authenticated
  using (public.can_coordinate(chapter_id) or (chapter_id is null and public.is_admin()))
  with check (public.can_coordinate(chapter_id) or (chapter_id is null and public.is_admin()));
create policy photos_read on public.photos for select to authenticated using (public.is_member());
create policy photos_write on public.photos for all to authenticated
  using (exists (select 1 from public.albums a where a.id = album_id and (public.can_coordinate(a.chapter_id) or (a.chapter_id is null and public.is_admin()))))
  with check (exists (select 1 from public.albums a where a.id = album_id and (public.can_coordinate(a.chapter_id) or (a.chapter_id is null and public.is_admin()))));

create policy fees_read on public.fee_years for select to authenticated using (true);
create policy fees_write on public.fee_years for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy payments_read on public.payments for select to authenticated
  using (public.household_owner(household_id) or public.can_treasure(chapter_id));
create policy payments_insert on public.payments for insert to authenticated
  with check ((created_by = auth.uid() and public.household_owner(household_id) and status = 'pending')
              or public.can_treasure((select chapter_id from public.households where id = household_id)));
create policy payments_update on public.payments for update to authenticated using (public.can_treasure(chapter_id));

create policy expenses_read on public.expenses for select to authenticated using (public.can_treasure(chapter_id) or (chapter_id is null and public.is_admin()));
create policy expenses_write on public.expenses for all to authenticated
  using (public.can_treasure(chapter_id) or (chapter_id is null and public.is_admin()))
  with check (public.can_treasure(chapter_id) or (chapter_id is null and public.is_admin()));

create policy listings_read on public.listings for select to authenticated
  using (public.is_member() and (approved or created_by = auth.uid() or public.can_coordinate(chapter_id)));
create policy listings_insert on public.listings for insert to authenticated
  with check (public.is_member() and created_by = auth.uid() and (approved = false or public.can_coordinate(chapter_id)));
create policy listings_update on public.listings for update to authenticated using (public.can_coordinate(chapter_id));
create policy listings_delete on public.listings for delete to authenticated using (created_by = auth.uid() or public.can_coordinate(chapter_id));

create policy sch_read on public.scholarships for select to authenticated using (public.is_member());
create policy sch_write on public.scholarships for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy schapp_read on public.scholarship_applications for select to authenticated using (applicant_id = auth.uid() or public.is_staff());
create policy schapp_insert on public.scholarship_applications for insert to authenticated
  with check (applicant_id = auth.uid() and public.is_member() and status = 'submitted');
create policy schapp_update on public.scholarship_applications for update to authenticated using (public.is_admin());

create policy audit_read on public.audit_log for select to authenticated using (public.is_admin());

grant execute on function public.community_stats(), public.upcoming_birthdays(int),
  public.contribution_board(), public.finance_summary(text) to authenticated;

-- ============ SETTINGS AND FIRST-ADMIN SETUP ============
create table if not exists public.settings (
  key text primary key,
  value text
);
alter table public.settings enable row level security;
drop policy if exists settings_read on public.settings;
drop policy if exists settings_write on public.settings;
create policy settings_read on public.settings for select to authenticated using (true);
create policy settings_write on public.settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- true when at least one admin exists (callable before sign-in, reveals nothing else)
create or replace function public.has_admin() returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.profiles where role = 'admin') $$;
grant execute on function public.has_admin() to anon, authenticated;

-- the first person to call this, while no admin exists, becomes the admin
create or replace function public.claim_first_admin() returns boolean language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or exists (select 1 from public.profiles where role = 'admin') then return false; end if;
  perform set_config('app.bypass', '1', true);
  update public.profiles set role = 'admin' where id = auth.uid();
  return true;
end $$;
grant execute on function public.claim_first_admin() to authenticated;

-- ============ PROFILE REPAIR ============
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

-- ============ LINK REPAIR ============
create or replace function public.link_household() returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform set_config('app.bypass', '1', true);
  insert into public.profiles (id, email, full_name)
  select u.id, u.email, coalesce(u.raw_user_meta_data->>'full_name', '') from auth.users u where u.id = new.head_user_id
  on conflict (id) do nothing;
  update public.profiles set household_id = new.id, chapter_id = coalesce(chapter_id, new.chapter_id)
    where id = new.head_user_id;
  return new;
end $$;

-- links the signed-in person to the family they already registered
create or replace function public.link_my_household() returns boolean language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return false; end if;
  perform public.ensure_profile();
  perform set_config('app.bypass', '1', true);
  update public.profiles p set household_id = h.id, chapter_id = coalesce(p.chapter_id, h.chapter_id)
    from public.households h where h.head_user_id = p.id and p.id = auth.uid() and p.household_id is null;
  return found;
end $$;
grant execute on function public.link_my_household() to authenticated;

-- repair every account that is already in this state
update public.profiles p set household_id = h.id, chapter_id = coalesce(p.chapter_id, h.chapter_id)
from public.households h where h.head_user_id = p.id and p.household_id is null;

-- ============ STORAGE (private buckets) ============
insert into storage.buckets (id, name, public) values ('gallery', 'gallery', false), ('payments', 'payments', false)
  on conflict (id) do nothing;

create policy gallery_read on storage.objects for select to authenticated
  using (bucket_id = 'gallery' and public.is_member());
create policy gallery_write on storage.objects for insert to authenticated
  with check (bucket_id = 'gallery' and (public.is_admin() or public.my_role() = 'coordinator'));
create policy gallery_delete on storage.objects for delete to authenticated
  using (bucket_id = 'gallery' and (public.is_admin() or public.my_role() = 'coordinator'));

create policy payshots_write on storage.objects for insert to authenticated
  with check (bucket_id = 'payments' and (storage.foldername(name))[1] = auth.uid()::text);
create policy payshots_read on storage.objects for select to authenticated
  using (bucket_id = 'payments' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_staff()));
