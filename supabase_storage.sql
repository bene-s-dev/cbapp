-- 1. Create the 'avatars' bucket if it doesn't exist
-- Note: In the Supabase Dashboard, you might need to click 'Storage' -> 'New Bucket' -> name it 'avatars' and set it to 'Public'.
-- If you want to do it via SQL (requires certain extensions/permissions):

-- 2. Security Policies for the 'avatars' bucket
-- These ensure users can only upload their own files and everyone can read public avatars.

-- Allow public read access to all files in the 'avatars' bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- Allow authenticated users to upload files to the 'avatars' bucket
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own files
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
