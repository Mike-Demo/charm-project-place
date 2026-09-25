CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS access_token text,
  ADD COLUMN IF NOT EXISTS reschedule_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rescheduled_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS appointments_access_token_key ON public.appointments(access_token);

CREATE OR REPLACE FUNCTION public.gen_access_token()
RETURNS text LANGUAGE sql VOLATILE SET search_path = public, extensions AS $$
  select translate(rtrim(encode(extensions.gen_random_bytes(32), 'base64'), '='), '+/', '-_');
$$;

UPDATE public.appointments SET access_token = public.gen_access_token() WHERE access_token IS NULL;

ALTER TABLE public.appointments ALTER COLUMN access_token SET DEFAULT public.gen_access_token();

CREATE OR REPLACE FUNCTION public.get_booking_token(p_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  select access_token from public.appointments
  where id = p_id and status = 'confirmed' and payment_status = 'paid';
$$;

CREATE OR REPLACE FUNCTION public.get_booking_by_token(p_token text)
RETURNS TABLE(id uuid, client_name text, phone text, email text, booking_date date, time_slot text, pronouns text, status text, created_at timestamptz, reschedule_count integer, rescheduled_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  select a.id, a.client_name, a.phone, a.email, a.booking_date, a.time_slot, a.pronouns, a.status, a.created_at, a.reschedule_count, a.rescheduled_at
  from public.appointments a
  where a.access_token = p_token and length(p_token) >= 32
    and a.status = 'confirmed' and a.payment_status = 'paid';
$$;

CREATE OR REPLACE FUNCTION public.reschedule_booking(p_token text, p_date date, p_time_slot text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
declare r public.appointments%rowtype;
begin
  select * into r from public.appointments
  where access_token = p_token and length(p_token) >= 32 and status = 'confirmed' and payment_status = 'paid'
  for update;
  if not found then raise exception 'Booking not found.'; end if;
  if r.reschedule_count >= 3 then raise exception 'This booking has already been moved 3 times. Please contact the studio.'; end if;
  if (r.booking_date::timestamp) - now() < interval '24 hours' then
    raise exception 'Rescheduling closes 24 hours before your session. Please contact the studio.';
  end if;
  if p_date < current_date then raise exception 'That date has already passed.'; end if;
  if exists (select 1 from public.blocked_slots b where b.blocked_date = p_date and (b.time_slot is null or b.time_slot = p_time_slot)) then
    raise exception 'That time is no longer available.';
  end if;
  update public.appointments set status = 'expired', payment_status = 'expired'
  where booking_date = p_date and time_slot = p_time_slot and status = 'pending' and hold_expires_at <= now();
  update public.appointments
  set booking_date = p_date, time_slot = p_time_slot,
      reschedule_count = reschedule_count + 1, rescheduled_at = now()
  where id = r.id;
exception when unique_violation then
  raise exception 'That time was just taken. Please pick another slot.';
end;
$$;

GRANT EXECUTE ON FUNCTION public.get_booking_token(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_booking_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reschedule_booking(text, date, text) TO anon, authenticated;