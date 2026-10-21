DROP FUNCTION IF EXISTS public.get_confirmed_booking(uuid);
CREATE FUNCTION public.get_confirmed_booking(p_id uuid, p_secret text)
RETURNS TABLE(id uuid, client_name text, phone text, email text, booking_date date, time_slot text, pronouns text, status text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  select a.id, a.client_name, a.phone, a.email, a.booking_date, a.time_slot, a.pronouns, a.status, a.created_at
  from public.appointments a
  where a.id = p_id and a.hold_secret is not null and p_secret is not null
    and a.hold_secret = p_secret
    and a.status = 'confirmed' and a.payment_status = 'paid';
$$;
REVOKE ALL ON FUNCTION public.get_confirmed_booking(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_confirmed_booking(uuid, text) TO anon, authenticated;