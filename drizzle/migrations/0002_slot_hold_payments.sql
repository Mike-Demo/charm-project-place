alter table public.appointments add column if not exists payment_status text not null default 'paid';
alter table public.appointments add column if not exists hold_expires_at timestamptz;
alter table public.appointments add column if not exists paddle_transaction_id text;

drop index if exists public.appointments_unique_active_slot;
create unique index appointments_unique_active_slot
  on public.appointments (booking_date, time_slot)
  where status not in ('cancelled', 'expired');

create or replace function public.get_unavailable_slots(p_from date, p_to date)
 returns table(slot_date date, time_slot text, kind text)
 language sql stable security definer set search_path to 'public'
as $$
  select a.booking_date, a.time_slot, 'booked'::text
  from public.appointments a
  where a.booking_date between p_from and p_to
    and (a.status = 'confirmed' or a.status = 'completed'
         or (a.status = 'pending' and a.hold_expires_at > now()))
  union all
  select b.blocked_date, b.time_slot, 'blocked'::text
  from public.blocked_slots b
  where b.blocked_date between p_from and p_to
$$;

create or replace function public.create_pending_appointment(p_name text, p_phone text, p_email text, p_date date, p_time_slot text, p_pronouns text)
 returns uuid language plpgsql security definer set search_path to 'public'
as $$
declare v_id uuid;
begin
  if length(trim(p_name)) < 2 then raise exception 'Please enter a name.'; end if;
  if length(regexp_replace(p_phone, '\D', '', 'g')) < 10 then raise exception 'Please enter a valid phone number.'; end if;
  if p_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$' then raise exception 'Please enter a valid email address.'; end if;
  if p_date < current_date then raise exception 'That date has already passed.'; end if;
  if exists (select 1 from public.blocked_slots b where b.blocked_date = p_date and (b.time_slot is null or b.time_slot = p_time_slot)) then
    raise exception 'That time is no longer available.';
  end if;

  update public.appointments set status = 'expired', payment_status = 'expired'
  where booking_date = p_date and time_slot = p_time_slot
    and status = 'pending' and hold_expires_at <= now();

  insert into public.appointments (client_name, phone, email, booking_date, time_slot, pronouns, status, payment_status, hold_expires_at)
  values (trim(p_name), trim(p_phone), lower(trim(p_email)), p_date, p_time_slot,
          nullif(trim(coalesce(p_pronouns, '')), ''), 'pending', 'pending', now() + interval '15 minutes')
  returning id into v_id;
  return v_id;
exception when unique_violation then
  raise exception 'That time was just taken. Please pick another slot.';
end;
$$;

create or replace function public.release_pending_appointment(p_id uuid)
 returns void language sql security definer set search_path to 'public'
as $$
  update public.appointments set status = 'expired', payment_status = 'expired'
  where id = p_id and status = 'pending';
$$;

create or replace function public.get_booking_status(p_id uuid)
 returns text language sql stable security definer set search_path to 'public'
as $$
  select case
    when status = 'pending' and hold_expires_at <= now() then 'expired'
    else status end
  from public.appointments where id = p_id;
$$;

grant execute on function public.create_pending_appointment(text, text, text, date, text, text) to anon, authenticated;
grant execute on function public.release_pending_appointment(uuid) to anon, authenticated;
grant execute on function public.get_booking_status(uuid) to anon, authenticated;