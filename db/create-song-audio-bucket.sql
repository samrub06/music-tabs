-- =============================================
-- CREATE SONG-AUDIO STORAGE BUCKET (private)
-- =============================================
-- Path convention: {userId}/{songId}/{uuid}.webm

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'song-audio',
  'song-audio',
  false, -- Private; play via authenticated access / signed URLs
  10485760, -- 10MB
  ARRAY['audio/webm', 'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/x-m4a', 'audio/*']
)
ON CONFLICT (id) DO NOTHING;

-- Owner CRUD under their folder (first path segment = auth.uid())
DROP POLICY IF EXISTS "Users can upload own song audio" ON storage.objects;
CREATE POLICY "Users can upload own song audio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'song-audio'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can update own song audio" ON storage.objects;
CREATE POLICY "Users can update own song audio"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'song-audio'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete own song audio" ON storage.objects;
CREATE POLICY "Users can delete own song audio"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'song-audio'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Authenticated read of all song-audio objects (simplifies practice playback)
DROP POLICY IF EXISTS "Authenticated can read song audio" ON storage.objects;
CREATE POLICY "Authenticated can read song audio"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'song-audio');
