ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS client_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS day_of_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS aftercare_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS social_sent_at timestamptz;

CREATE OR REPLACE FUNCTION public.confirm_attendance(p_token text)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
declare v_at timestamptz;
begin
  update public.appointments
  set client_confirmed_at = coalesce(client_confirmed_at, now())
  where access_token = p_token and length(p_token) >= 32
    and status = 'confirmed' and payment_status = 'paid'
  returning client_confirmed_at into v_at;
  if v_at is null then raise exception 'Booking not found.'; end if;
  return v_at;
end;
$$;
GRANT EXECUTE ON FUNCTION public.confirm_attendance(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_booking_confirmation(p_token text)
RETURNS TABLE(reminder_sent_at timestamptz, client_confirmed_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  select a.reminder_sent_at, a.client_confirmed_at from public.appointments a
  where a.access_token = p_token and length(p_token) >= 32 and a.status = 'confirmed' and a.payment_status = 'paid';
$$;
GRANT EXECUTE ON FUNCTION public.get_booking_confirmation(text) TO anon, authenticated;