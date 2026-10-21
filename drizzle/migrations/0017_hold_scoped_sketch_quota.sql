CREATE OR REPLACE FUNCTION public.consume_hold_sketch(p_id uuid, p_secret text, p_limit integer)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
declare n integer;
begin
  update public.appointments
     set sketch_attempts = sketch_attempts + 1
   where id = p_id and hold_secret is not null and p_secret is not null and hold_secret = p_secret
     and status = 'pending' and hold_expires_at > now() and sketch_attempts < p_limit
  returning sketch_attempts into n;
  return n is not null;
end;
$$;
REVOKE ALL ON FUNCTION public.consume_hold_sketch(uuid, text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_hold_sketch(uuid, text, integer) TO service_role;