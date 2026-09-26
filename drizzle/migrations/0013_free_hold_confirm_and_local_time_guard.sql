-- Confirm a held slot with no payment (proof-of-concept $0 booking).
CREATE OR REPLACE FUNCTION public.confirm_free_hold(p_id uuid, p_secret text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare v_id uuid;
begin
  if p_secret is null or length(p_secret) < 16 then raise exception 'Booking not found.'; end if;
  update public.appointments
  set status = 'confirmed', payment_status = 'paid', hold_expires_at = null
  where id = p_id and hold_secret = p_secret and status = 'pending' and hold_expires_at > now()
  returning id into v_id;
  if v_id is null then
    select id into v_id from public.appointments
    where id = p_id and hold_secret = p_secret and status = 'confirmed';
  end if;
  if v_id is null then raise exception 'That hold expired. Please pick a new time.'; end if;
  return v_id;
end;
$function$;

GRANT EXECUTE ON FUNCTION public.confirm_free_hold(uuid, text) TO anon, authenticated, service_role;

-- Studio-local (America/Chicago) date + same-day time validation for new holds.
CREATE OR REPLACE FUNCTION public.create_pending_appointment(p_name text, p_phone text, p_email text, p_date date, p_time_slot text, p_pronouns text)
RETURNS TABLE(id uuid, hold_secret text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  v_id uuid;
  v_secret text := public.gen_access_token();
  v_local timestamp := (now() at time zone 'America/Chicago');
  v_slot time;
begin
  if length(trim(p_name)) < 2 then raise exception 'Please enter a name.'; end if;
  if length(regexp_replace(p_phone, '\D', '', 'g')) < 10 then raise exception 'Please enter a valid phone number.'; end if;
  if p_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$' then raise exception 'Please enter a valid email address.'; end if;
  if p_date < v_local::date then raise exception 'That date has already passed.'; end if;

  begin
    v_slot := to_timestamp(p_time_slot, 'HH12:MI AM')::time;
  exception when others then
    v_slot := null;
  end;
  if p_date = v_local::date and v_slot is not null and v_slot <= v_local::time then
    raise exception 'That time has already passed today. Please pick a later slot.';
  end if;

  if exists (select 1 from public.blocked_slots b where b.blocked_date = p_date and (b.time_slot is null or b.time_slot = p_time_slot)) then
    raise exception 'That time is no longer available.';
  end if;

  update public.appointments a set status = 'expired', payment_status = 'expired'
  where a.booking_date = p_date and a.time_slot = p_time_slot
    and a.status = 'pending' and a.hold_expires_at <= now();

  insert into public.appointments (client_name, phone, email, booking_date, time_slot, pronouns, status, payment_status, hold_expires_at, hold_secret)
  values (trim(p_name), trim(p_phone), lower(trim(p_email)), p_date, p_time_slot,
          nullif(trim(coalesce(p_pronouns, '')), ''), 'pending', 'pending', now() + interval '15 minutes', v_secret)
  returning appointments.id into v_id;
  return query select v_id, v_secret;
exception when unique_violation then
  raise exception 'That time was just taken. Please pick another slot.';
end;
$function$;