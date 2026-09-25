CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE TABLE public.cron_tokens (
  name text PRIMARY KEY,
  token_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.cron_tokens TO service_role;
ALTER TABLE public.cron_tokens ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.check_reminder_cron_token(p_token text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  select exists (
    select 1 from public.cron_tokens
    where name = 'send-reminders' and length(p_token) >= 32
      and token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
  );
$$;

REVOKE ALL ON FUNCTION public.check_reminder_cron_token(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_reminder_cron_token(text) TO service_role;