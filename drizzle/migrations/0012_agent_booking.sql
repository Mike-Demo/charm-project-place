ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'web';

CREATE TABLE public.agent_hold_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caller_hash text NOT NULL,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.agent_hold_log TO service_role;
ALTER TABLE public.agent_hold_log ENABLE ROW LEVEL SECURITY;
CREATE INDEX agent_hold_log_caller_idx ON public.agent_hold_log (caller_hash, created_at);

-- Checkout page for agent-held slots: requires the hold secret.
CREATE OR REPLACE FUNCTION public.get_hold_for_checkout(p_id uuid, p_secret text)
RETURNS TABLE(email text, client_name text, booking_date date, time_slot text, status text, hold_expires_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  select a.email, a.client_name, a.booking_date, a.time_slot,
    case when a.status = 'pending' and a.hold_expires_at <= now() then 'expired' else a.status end,
    a.hold_expires_at
  from public.appointments a
  where a.id = p_id and a.hold_secret is not null and a.hold_secret = p_secret;
$$;
REVOKE ALL ON FUNCTION public.get_hold_for_checkout(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_hold_for_checkout(uuid, text) TO anon, authenticated;