-- SEO slugs for public catalog songs (/song/{slug})
ALTER TABLE public.songs
  ADD COLUMN IF NOT EXISTS slug text;

CREATE UNIQUE INDEX IF NOT EXISTS songs_catalog_slug_uidx
  ON public.songs (slug)
  WHERE user_id IS NULL AND slug IS NOT NULL;

COMMENT ON COLUMN public.songs.slug IS 'Public SEO slug for catalog songs; unique among user_id IS NULL';
