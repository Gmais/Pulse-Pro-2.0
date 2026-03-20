-- Create a bucket for academy logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Set up access policy for logos
-- Allow public read access
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'logos');

-- Allow anyone to upload (since we are using an admin panel without full RLS for now)
CREATE POLICY "Allow Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'logos');

-- Allow anyone to update/delete (for editing)
CREATE POLICY "Allow Update" ON storage.objects FOR UPDATE USING (bucket_id = 'logos');
CREATE POLICY "Allow Delete" ON storage.objects FOR DELETE USING (bucket_id = 'logos');
