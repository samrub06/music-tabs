-- Public curated playlist list: counts + metadata without transferring song_ids arrays.
-- Used by explorer / playlists hub (songs load only on playlist detail click).

CREATE INDEX IF NOT EXISTS idx_playlists_public_curated_order
  ON public.playlists (display_order ASC, created_at DESC)
  WHERE is_public = true AND curated_slug IS NOT NULL;

CREATE OR REPLACE FUNCTION public.get_public_playlist_list_lightweight()
RETURNS TABLE(
  id uuid,
  name text,
  image_url text,
  created_at timestamptz,
  curated_slug text,
  display_order integer,
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
    p.image_url,
    p.created_at,
    p.curated_slug,
    p.display_order,
    COALESCE(array_length(p.song_ids, 1), 0)::bigint
  FROM public.playlists p
  WHERE p.is_public = true
    AND p.curated_slug IS NOT NULL
  ORDER BY p.display_order ASC, p.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_playlist_list_lightweight() TO anon, authenticated;
