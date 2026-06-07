-- Curated public playlists for the explorer page (Rock, 90s, Pop, etc.)

ALTER TABLE public.playlists
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.playlists
  ADD COLUMN IF NOT EXISTS curated_slug text;

ALTER TABLE public.playlists
  ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS idx_playlists_curated_slug
  ON public.playlists(curated_slug)
  WHERE curated_slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_playlists_display_order
  ON public.playlists(display_order)
  WHERE is_public = true;

-- Required for curated playlist song filters (genre / decade)
ALTER TABLE public.songs
  ADD COLUMN IF NOT EXISTS genre text;

ALTER TABLE public.songs
  ADD COLUMN IF NOT EXISTS decade integer;

CREATE INDEX IF NOT EXISTS idx_songs_genre ON public.songs(genre) WHERE genre IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_songs_decade ON public.songs(decade) WHERE decade IS NOT NULL;
