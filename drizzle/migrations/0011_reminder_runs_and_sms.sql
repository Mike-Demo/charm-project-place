CREATE TABLE public.reminder_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ran_at timestamptz NOT NULL DEFAULT now(),
  skipped_reason text,
  sent integer NOT NULL DEFAULT 0,
  suppressed integer NOT NULL DEFAULT 0,
  failed integer NOT NULL DEFAULT 0,
  sms_simulated integer NOT NULL DEFAULT 0
);
GRANT SELECT ON public.reminder_runs TO authenticated;
GRANT ALL ON public.reminder_runs TO service_role;
ALTER TABLE public.reminder_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read reminder runs" ON public.reminder_runs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
ALTER TABLE public.appointments ADD COLUMN sms_reminder_status text, ADD COLUMN sms_reminder_at timestamptz;