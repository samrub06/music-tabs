-- Partial indexes for /explore catalog queries (user_id IS NULL system songs).
-- Speeds up ORDER BY created_at DESC with optional genre/difficulty/decade filters.

CREATE INDEX IF NOT EXISTS idx_songs_catalog_created
  ON public.songs (created_at DESC)
  WHERE user_id IS NULL AND (is_trending = true OR is_public = true);

CREATE INDEX IF NOT EXISTS idx_songs_catalog_genre_created
  ON public.songs (genre, created_at DESC)
  WHERE user_id IS NULL AND (is_trending = true OR is_public = true) AND genre IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_songs_catalog_difficulty_created
  ON public.songs (difficulty, created_at DESC)
  WHERE user_id IS NULL AND (is_trending = true OR is_public = true) AND difficulty IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_songs_catalog_decade_created
  ON public.songs (decade, created_at DESC)
  WHERE user_id IS NULL AND (is_trending = true OR is_public = true) AND decade IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_songs_catalog_view_count
  ON public.songs (view_count DESC)
  WHERE user_id IS NULL AND (is_trending = true OR is_public = true) AND view_count > 0;
