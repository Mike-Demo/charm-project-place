DROP FUNCTION IF EXISTS public.get_confirmed_booking(uuid);
DROP FUNCTION IF EXISTS public.get_booking_token(uuid);
DROP FUNCTION IF EXISTS public.release_pending_appointment(uuid);

CREATE FUNCTION public.get_confirmed_booking(p_id uuid, p_secret text)
RETURNS TABLE (
  id uuid,
  client_name text,
  phone text,
  email text,
  booking_date date,
  time_slot text,
  pronouns text,
  status text,
  created_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  select a.id, a.client_name, a.phone, a.email, a.booking_date, a.time_slot,
         a.pronouns, a.status, a.created_at
  from public.appointments a
  where a.id = p_id and a.hold_secret = p_secret
    and a.status = 'confirmed' and a.payment_status = 'paid';
$$;
REVOKE ALL ON FUNCTION public.get_confirmed_booking(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_confirmed_booking(uuid, text) TO anon, authenticated, service_role;

CREATE FUNCTION public.get_booking_token(p_id uuid, p_secret text)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  select a.access_token from public.appointments a
  where a.id = p_id and a.hold_secret = p_secret
    and a.status = 'confirmed' and a.payment_status = 'paid';
$$;
REVOKE ALL ON FUNCTION public.get_booking_token(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_booking_token(uuid, text) TO anon, authenticated, service_role;

CREATE FUNCTION public.release_pending_appointment(p_id uuid, p_secret text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  update public.appointments set status = 'expired', payment_status = 'expired'
  where id = p_id and hold_secret = p_secret and status = 'pending';
$$;
REVOKE ALL ON FUNCTION public.release_pending_appointment(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.release_pending_appointment(uuid, text) TO anon, authenticated, service_role;
