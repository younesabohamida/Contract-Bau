DO $$
DECLARE t text;
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "public full access" ON public.%I', t);
    EXECUTE format('CREATE POLICY "public full access" ON public.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO anon, authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "anon attachments all" ON storage.objects;
CREATE POLICY "anon attachments all" ON storage.objects FOR ALL TO anon, authenticated
USING (bucket_id = 'attachments') WITH CHECK (bucket_id = 'attachments');