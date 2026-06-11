-- Folder list: aggregate song counts in one query instead of scanning all rows client-side.

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
