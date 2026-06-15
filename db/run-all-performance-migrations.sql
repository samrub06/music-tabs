-- Paste into Supabase SQL Editor and run once.

-- Explore catalog indexes
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

-- User songs indexes
CREATE INDEX IF NOT EXISTS idx_songs_user_updated_at
  ON public.songs (user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_songs_user_view_count
  ON public.songs (user_id, view_count DESC)
  WHERE view_count > 0;

CREATE INDEX IF NOT EXISTS idx_songs_user_folder_updated
  ON public.songs (user_id, folder_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_songs_user_liked_updated
  ON public.songs (user_id, updated_at DESC)
  WHERE is_liked = true;

-- Folder song counts RPC
CREATE OR REPLACE FUNCTION public.get_folder_song_counts()
RETURNS TABLE(folder_key text, song_count bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COALESCE(folder_id::text, 'null'), COUNT(*)::bigint
  FROM public.songs
  WHERE user_id = auth.uid()
  GROUP BY folder_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_folder_song_counts() TO authenticated;

-- Playlist list RPC (counts without song_ids payload)
CREATE OR REPLACE FUNCTION public.get_playlist_list_lightweight()
RETURNS TABLE(
  id uuid,
  name text,
  created_at timestamptz,
  image_url text,
  song_count bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.name,
    p.created_at,
    p.image_url,
    COALESCE(array_length(p.song_ids, 1), 0)::bigint
  FROM public.playlists p
  WHERE p.user_id = auth.uid()
  ORDER BY p.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_playlist_list_lightweight() TO authenticated;
