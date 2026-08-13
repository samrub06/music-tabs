-- Fuzzy public-catalog search (typo-tolerant) for song search UI
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS songs_catalog_title_trgm_idx
  ON public.songs USING gin (lower(title) gin_trgm_ops)
  WHERE user_id IS NULL;

CREATE INDEX IF NOT EXISTS songs_catalog_author_trgm_idx
  ON public.songs USING gin (lower(coalesce(author, '')) gin_trgm_ops)
  WHERE user_id IS NULL;

CREATE OR REPLACE FUNCTION public.search_public_catalog_songs(
  search_query text,
  result_limit integer DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  title text,
  author text,
  source_url text,
  tab_id text,
  source_site text,
  rating numeric,
  reviews integer,
  difficulty text,
  version integer,
  version_description text,
  artist_url text,
  artist_image_url text,
  song_image_url text,
  view_count integer,
  slug text,
  score double precision
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH params AS (
    SELECT
      nullif(trim(search_query), '') AS raw,
      lower(nullif(trim(search_query), '')) AS q,
      greatest(1, least(coalesce(result_limit, 20), 50)) AS lim
  ),
  tokens AS (
    SELECT array_agg(t) FILTER (WHERE length(t) >= 2) AS toks
    FROM params p,
    LATERAL unnest(regexp_split_to_array(coalesce(p.q, ''), '\s+')) AS t
  ),
  candidates AS (
    SELECT
      s.id,
      s.title,
      s.author,
      s.source_url,
      s.tab_id,
      s.source_site,
      s.rating,
      s.reviews,
      s.difficulty,
      s.version,
      s.version_description,
      s.artist_url,
      s.artist_image_url,
      s.song_image_url,
      s.view_count,
      s.slug,
      lower(coalesce(s.title, '')) AS title_l,
      lower(coalesce(s.author, '')) AS author_l,
      lower(coalesce(s.title, '') || ' ' || coalesce(s.author, '')) AS hay_l
    FROM public.songs s
    CROSS JOIN params p
    CROSS JOIN tokens tk
    WHERE s.user_id IS NULL
      AND p.q IS NOT NULL
      AND (
        s.title ILIKE '%' || p.raw || '%'
        OR coalesce(s.author, '') ILIKE '%' || p.raw || '%'
        OR lower(s.title) % p.q
        OR lower(coalesce(s.author, '')) % p.q
        OR lower(coalesce(s.title, '') || ' ' || coalesce(s.author, '')) % p.q
        OR (
          tk.toks IS NOT NULL
          AND EXISTS (
            SELECT 1
            FROM unnest(tk.toks) tok
            WHERE lower(s.title) % tok
               OR lower(coalesce(s.author, '')) % tok
               OR s.title ILIKE '%' || tok || '%'
               OR coalesce(s.author, '') ILIKE '%' || tok || '%'
          )
        )
      )
  ),
  scored AS (
    SELECT
      c.*,
      greatest(
        similarity(c.title_l, p.q),
        similarity(c.author_l, p.q),
        similarity(c.hay_l, p.q),
        CASE
          WHEN tk.toks IS NULL OR cardinality(tk.toks) = 0 THEN 0
          ELSE (
            SELECT avg(
              greatest(
                similarity(c.title_l, tok),
                similarity(c.author_l, tok),
                CASE WHEN c.title_l LIKE '%' || tok || '%' OR c.author_l LIKE '%' || tok || '%' THEN 0.55 ELSE 0 END
              )
            )
            FROM unnest(tk.toks) tok
          )
        END
      )::double precision AS sim,
      CASE
        WHEN c.title_l = p.q THEN 3
        WHEN c.title_l LIKE p.q || '%' THEN 2
        WHEN c.title_l LIKE '%' || p.q || '%' THEN 1
        ELSE 0
      END AS exact_boost
    FROM candidates c
    CROSS JOIN params p
    CROSS JOIN tokens tk
  )
  SELECT
    s.id,
    s.title,
    s.author,
    s.source_url,
    s.tab_id,
    s.source_site,
    s.rating,
    s.reviews,
    s.difficulty,
    s.version,
    s.version_description,
    s.artist_url,
    s.artist_image_url,
    s.song_image_url,
    s.view_count,
    s.slug,
    (s.sim + s.exact_boost * 0.35)::double precision AS score
  FROM scored s
  CROSS JOIN params p
  WHERE s.sim >= 0.18 OR s.exact_boost > 0
  ORDER BY s.exact_boost DESC, s.sim DESC, coalesce(s.view_count, 0) DESC, s.title ASC
  LIMIT (SELECT lim FROM params);
$$;

REVOKE ALL ON FUNCTION public.search_public_catalog_songs(text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_public_catalog_songs(text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.search_public_catalog_songs(text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_public_catalog_songs(text, integer) TO anon;
