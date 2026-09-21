CREATE POLICY "auth read attachments" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'attachments');
CREATE POLICY "auth insert attachments" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'attachments');
CREATE POLICY "auth update attachments" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'attachments');
CREATE POLICY "auth delete attachments" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'attachments');