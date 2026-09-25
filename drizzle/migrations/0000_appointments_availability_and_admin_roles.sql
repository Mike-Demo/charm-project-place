create type public.app_role as enum ('admin');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Users can read their own roles" on public.user_roles
  for select to authenticated using (auth.uid() = user_id);
create policy "Admins can read all roles" on public.user_roles
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  phone text not null,
  email text not null,
  booking_date date not null,
  time_slot text not null,
  status text not null default 'confirmed',
  notes text,
  created_at timestamptz not null default now()
);
create unique index appointments_unique_active_slot
  on public.appointments (booking_date, time_slot)
  where status <> 'cancelled';

grant select, insert, update, delete on public.appointments to authenticated;
grant all on public.appointments to service_role;
alter table public.appointments enable row level security;

create policy "Admins manage appointments" on public.appointments
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create table public.blocked_slots (
  id uuid primary key default gen_random_uuid(),
  blocked_date date not null,
  time_slot text,
  reason text,
  created_at timestamptz not null default now()
);
create unique index blocked_slots_unique on public.blocked_slots (blocked_date, coalesce(time_slot, '*'));

grant select, insert, update, delete on public.blocked_slots to authenticated;
grant all on public.blocked_slots to service_role;
alter table public.blocked_slots enable row level security;

create policy "Admins manage blocked slots" on public.blocked_slots
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create or replace function public.get_unavailable_slots(p_from date, p_to date)
returns table (slot_date date, time_slot text, kind text)
language sql stable security definer set search_path = public as $$
  select a.booking_date, a.time_slot, 'booked'::text
  from public.appointments a
  where a.status <> 'cancelled' and a.booking_date between p_from and p_to
  union all
  select b.blocked_date, b.time_slot, 'blocked'::text
  from public.blocked_slots b
  where b.blocked_date between p_from and p_to
$$;
grant execute on function public.get_unavailable_slots(date, date) to anon, authenticated;

create or replace function public.book_appointment(
  p_name text, p_phone text, p_email text, p_date date, p_time_slot text
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if length(trim(p_name)) < 2 then raise exception 'Please enter a name.'; end if;
  if length(regexp_replace(p_phone, '\D', '', 'g')) < 10 then raise exception 'Please enter a valid phone number.'; end if;
  if p_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$' then raise exception 'Please enter a valid email address.'; end if;
  if p_date < current_date then raise exception 'That date has already passed.'; end if;

  if exists (
    select 1 from public.blocked_slots b
    where b.blocked_date = p_date and (b.time_slot is null or b.time_slot = p_time_slot)
  ) then
    raise exception 'That time is no longer available.';
  end if;

  insert into public.appointments (client_name, phone, email, booking_date, time_slot)
  values (trim(p_name), trim(p_phone), lower(trim(p_email)), p_date, p_time_slot)
  returning id into v_id;
  return v_id;
exception when unique_violation then
  raise exception 'That time was just taken. Please pick another slot.';
end;
$$;
grant execute on function public.book_appointment(text, text, text, date, text) to anon, authenticated;

create or replace function public.claim_admin()
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Sign in first.'; end if;
  if exists (select 1 from public.user_roles where role = 'admin') then return false; end if;
  insert into public.user_roles (user_id, role) values (auth.uid(), 'admin');
  return true;
end;
$$;
grant execute on function public.claim_admin() to authenticated;