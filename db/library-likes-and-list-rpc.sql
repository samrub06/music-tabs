-- Library likes consolidation + paginated dual-read RPC
-- Apply in Supabase SQL editor before deploying code that depends on it.

-- 1) Ensure user_library.is_liked
ALTER TABLE public.user_library
  ADD COLUMN IF NOT EXISTS is_liked boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_user_library_user_liked
  ON public.user_library(user_id)
  WHERE is_liked = true;

-- 2) Migrate personal song likes → user_library (only if songs.is_liked still exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'songs'
      AND column_name = 'is_liked'
  ) THEN
    INSERT INTO public.user_library (user_id, song_id, folder_id, is_liked)
    SELECT s.user_id, s.id, s.folder_id, true
    FROM public.songs s
    WHERE s.is_liked = true
      AND s.user_id IS NOT NULL
    ON CONFLICT (user_id, song_id) DO UPDATE
      SET is_liked = true,
          folder_id = COALESCE(public.user_library.folder_id, EXCLUDED.folder_id),
          updated_at = timezone('utc'::text, now());
  END IF;
END $$;

-- 3) Drop songs.is_liked + related index
DROP INDEX IF EXISTS public.idx_songs_user_liked_updated;

ALTER TABLE public.songs
  DROP COLUMN IF EXISTS is_liked;

-- 4) Drop unused song columns (idempotent)
DROP INDEX IF EXISTS public.idx_songs_sounding_key;

ALTER TABLE public.songs
  DROP COLUMN IF EXISTS sounding_key,
  DROP COLUMN IF EXISTS chord_progression;

-- 5) Library list indexes
CREATE INDEX IF NOT EXISTS idx_user_library_user_created
  ON public.user_library(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_library_user_folder
  ON public.user_library(user_id, folder_id)
  WHERE folder_id IS NOT NULL;

-- 6) Paginated dual-read RPC
CREATE OR REPLACE FUNCTION public.get_user_library_songs(
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0,
  p_q text DEFAULT NULL,
  p_folder_id text DEFAULT NULL,
  p_liked_only boolean DEFAULT false,
  p_order text DEFAULT 'created_at',
  p_easy_chord boolean DEFAULT false,
  p_capo_filter text DEFAULT 'any'
)
RETURNS TABLE (
  id uuid,
  title text,
  author text,
  folder_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  rating double precision,
  difficulty text,
  capo integer,
  artist_image_url text,
  song_image_url text,
  view_count integer,
  version integer,
  version_description text,
  "key" text,
  first_chord text,
  last_chord text,
  tab_id text,
  genre text,
  bpm integer,
  is_liked boolean,
  cloned_from_id uuid,
  source_url text,
  total_count bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH covered_catalog AS (
    SELECT DISTINCT s.cloned_from_id AS catalog_id
    FROM public.songs s
    WHERE s.user_id = auth.uid()
      AND s.cloned_from_id IS NOT NULL
  ),
  personal AS (
    SELECT
      s.id,
      s.title,
      s.author,
      s.folder_id AS effective_folder_id,
      s.created_at,
      s.updated_at,
      s.rating,
      s.difficulty,
      s.capo,
      s.artist_image_url,
      s.song_image_url,
      s.view_count,
      s.version,
      s.version_description,
      s."key",
      s.first_chord,
      s.last_chord,
      s.tab_id,
      s.genre,
      s.bpm,
      COALESCE(ul.is_liked, false) AS is_liked,
      s.cloned_from_id,
      s.source_url
    FROM public.songs s
    LEFT JOIN public.user_library ul
      ON ul.user_id = auth.uid()
     AND ul.song_id = s.id
    WHERE s.user_id = auth.uid()
  ),
  linked AS (
    SELECT
      s.id,
      s.title,
      s.author,
      ul.folder_id AS effective_folder_id,
      s.created_at,
      s.updated_at,
      s.rating,
      s.difficulty,
      s.capo,
      s.artist_image_url,
      s.song_image_url,
      s.view_count,
      s.version,
      s.version_description,
      s."key",
      s.first_chord,
      s.last_chord,
      s.tab_id,
      s.genre,
      s.bpm,
      ul.is_liked,
      s.cloned_from_id,
      s.source_url
    FROM public.user_library ul
    INNER JOIN public.songs s ON s.id = ul.song_id
    WHERE ul.user_id = auth.uid()
      AND NOT EXISTS (
        SELECT 1 FROM personal p WHERE p.id = s.id
      )
      AND NOT EXISTS (
        SELECT 1 FROM covered_catalog c WHERE c.catalog_id = s.id
      )
  ),
  merged AS (
    SELECT * FROM personal
    UNION ALL
    SELECT * FROM linked
  ),
  filtered AS (
    SELECT m.*
    FROM merged m
    WHERE
      (
        p_q IS NULL
        OR length(trim(p_q)) = 0
        OR m.title ILIKE '%' || trim(p_q) || '%'
        OR COALESCE(m.author, '') ILIKE '%' || trim(p_q) || '%'
      )
      AND (
        NOT COALESCE(p_easy_chord, false)
        OR COALESCE(m.difficulty, '') ILIKE '%easy%'
        OR COALESCE(m.difficulty, '') ILIKE '%facile%'
        OR COALESCE(m.difficulty, '') ILIKE '%beginner%'
        OR COALESCE(m.difficulty, '') ILIKE '%débutant%'
        OR COALESCE(m.difficulty, '') ILIKE '%debutant%'
      )
      AND (
        COALESCE(p_capo_filter, 'any') = 'any'
        OR (
          p_capo_filter = 'with'
          AND m.capo IS NOT NULL
          AND m.capo > 0
        )
        OR (
          p_capo_filter = 'without'
          AND (m.capo IS NULL OR m.capo = 0)
        )
      )
      AND (
        NOT COALESCE(p_liked_only, false)
        OR m.is_liked = true
      )
      AND (
        p_folder_id IS NULL
        OR length(trim(p_folder_id)) = 0
        OR (
          p_folder_id = 'unorganized'
          AND m.effective_folder_id IS NULL
        )
        OR (
          p_folder_id <> 'unorganized'
          AND m.effective_folder_id::text = p_folder_id
        )
      )
      AND (
        COALESCE(p_order, 'created_at') <> 'view_count'
        OR (m.view_count IS NOT NULL AND m.view_count > 0)
      )
  ),
  counted AS (
    SELECT f.*, count(*) OVER() AS total_count
    FROM filtered f
  )
  SELECT
    c.id,
    c.title,
    c.author,
    c.effective_folder_id AS folder_id,
    c.created_at,
    c.updated_at,
    c.rating,
    c.difficulty,
    c.capo,
    c.artist_image_url,
    c.song_image_url,
    c.view_count,
    c.version,
    c.version_description,
    c."key",
    c.first_chord,
    c.last_chord,
    c.tab_id,
    c.genre,
    c.bpm,
    c.is_liked,
    c.cloned_from_id,
    c.source_url,
    c.total_count
  FROM counted c
  ORDER BY
    CASE WHEN COALESCE(p_order, 'created_at') = 'view_count' THEN c.view_count END DESC NULLS LAST,
    CASE WHEN COALESCE(p_order, 'created_at') = 'updated_at' THEN c.updated_at END DESC NULLS LAST,
    CASE WHEN COALESCE(p_order, 'created_at') = 'created_at' THEN c.created_at END DESC NULLS LAST,
    c.created_at DESC
  LIMIT GREATEST(COALESCE(p_limit, 100), 1)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
$$;

GRANT EXECUTE ON FUNCTION public.get_user_library_songs(
  integer, integer, text, text, boolean, text, boolean, text
) TO authenticated;

-- Lightweight IDs-only variant for select-all
CREATE OR REPLACE FUNCTION public.get_user_library_song_ids(
  p_q text DEFAULT NULL,
  p_folder_id text DEFAULT NULL,
  p_liked_only boolean DEFAULT false,
  p_order text DEFAULT 'created_at',
  p_easy_chord boolean DEFAULT false,
  p_capo_filter text DEFAULT 'any'
)
RETURNS TABLE (id uuid)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT s.id
  FROM public.get_user_library_songs(
    100000, -- practical upper bound for select-all
    0,
    p_q,
    p_folder_id,
    p_liked_only,
    p_order,
    p_easy_chord,
    p_capo_filter
  ) s;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_library_song_ids(
  text, text, boolean, text, boolean, text
) TO authenticated;
