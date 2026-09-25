ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS hold_secret text;

DROP FUNCTION IF EXISTS public.create_pending_appointment(text, text, text, date, text, text);
CREATE FUNCTION public.create_pending_appointment(p_name text, p_phone text, p_email text, p_date date, p_time_slot text, p_pronouns text)
 RETURNS TABLE(id uuid, hold_secret text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_id uuid; v_secret text := public.gen_access_token();
begin
  if length(trim(p_name)) < 2 then raise exception 'Please enter a name.'; end if;
  if length(regexp_replace(p_phone, '\D', '', 'g')) < 10 then raise exception 'Please enter a valid phone number.'; end if;
  if p_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$' then raise exception 'Please enter a valid email address.'; end if;
  if p_date < current_date then raise exception 'That date has already passed.'; end if;
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
GRANT EXECUTE ON FUNCTION public.create_pending_appointment(text, text, text, date, text, text) TO anon, authenticated;

CREATE TABLE public.sketch_usage (
  bucket_key text NOT NULL,
  usage_day date NOT NULL DEFAULT current_date,
  uses integer NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket_key, usage_day)
);
GRANT ALL ON public.sketch_usage TO service_role;
ALTER TABLE public.sketch_usage ENABLE ROW LEVEL SECURITY;

CREATE FUNCTION public.consume_sketch_quota(p_key text, p_limit integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_uses integer;
begin
  insert into public.sketch_usage (bucket_key, usage_day, uses) values (p_key, current_date, 1)
  on conflict (bucket_key, usage_day) do update set uses = sketch_usage.uses + 1
  returning uses into v_uses;
  return v_uses <= p_limit;
end;
$function$;
REVOKE ALL ON FUNCTION public.consume_sketch_quota(text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_sketch_quota(text, integer) TO service_role;