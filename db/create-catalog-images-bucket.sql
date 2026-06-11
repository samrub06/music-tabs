-- =============================================
-- CREATE CATALOG IMAGES STORAGE BUCKET
-- =============================================
-- Public bucket for curated catalog song cover art (system-seeded assets).

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'catalog-images',
  'catalog-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Public read access
CREATE POLICY "Public can view catalog images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'catalog-images');
