-- Playlist list: return song counts without transferring song_ids arrays.

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
