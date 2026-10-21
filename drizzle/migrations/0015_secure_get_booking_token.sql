DROP FUNCTION IF EXISTS public.get_booking_token(uuid);
CREATE FUNCTION public.get_booking_token(p_id uuid, p_secret text)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  select access_token from public.appointments
  where id = p_id and hold_secret is not null and p_secret is not null
    and hold_secret = p_secret and status = 'confirmed' and payment_status = 'paid';
$$;
REVOKE ALL ON FUNCTION public.get_booking_token(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_booking_token(uuid, text) TO anon, authenticated;