ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS idea_description text,
  ADD COLUMN IF NOT EXISTS reference_image_path text,
  ADD COLUMN IF NOT EXISTS concept_sketch_path text,
  ADD COLUMN IF NOT EXISTS sketch_attempts integer NOT NULL DEFAULT 0;

CREATE POLICY "Admins read tattoo ideas" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'tattoo-ideas' AND public.has_role(auth.uid(), 'admin'));