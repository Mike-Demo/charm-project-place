create or replace function public.get_confirmed_booking(p_id uuid)
 returns table (
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
 language sql
 stable
 security definer
 set search_path to 'public'
as $$
  select a.id, a.client_name, a.phone, a.email, a.booking_date, a.time_slot,
         a.pronouns, a.status, a.created_at
  from public.appointments a
  where a.id = p_id
    and a.status = 'confirmed'
    and a.payment_status = 'paid';
$$;

grant execute on function public.get_confirmed_booking(uuid) to anon, authenticated;