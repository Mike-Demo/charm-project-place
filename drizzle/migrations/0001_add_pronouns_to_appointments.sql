ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS pronouns text;

CREATE OR REPLACE FUNCTION public.book_appointment(
  p_name text, p_phone text, p_email text, p_date date, p_time_slot text, p_pronouns text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
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

  insert into public.appointments (client_name, phone, email, booking_date, time_slot, pronouns)
  values (trim(p_name), trim(p_phone), lower(trim(p_email)), p_date, p_time_slot, nullif(trim(coalesce(p_pronouns, '')), ''))
  returning id into v_id;
  return v_id;
exception when unique_violation then
  raise exception 'That time was just taken. Please pick another slot.';
end;
$function$;

GRANT EXECUTE ON FUNCTION public.book_appointment(text, text, text, date, text, text) TO anon, authenticated;