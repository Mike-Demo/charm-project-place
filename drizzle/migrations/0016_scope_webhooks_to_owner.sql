ALTER TABLE public.webhook_subscriptions ADD COLUMN IF NOT EXISTS owner_hash text;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS agent_owner_hash text;
CREATE INDEX IF NOT EXISTS webhook_subscriptions_owner_hash_idx ON public.webhook_subscriptions(owner_hash);
COMMENT ON COLUMN public.webhook_subscriptions.owner_hash IS 'API-key caller hash; deliveries only go to bookings created with the same key. NULL = legacy, receives nothing.';