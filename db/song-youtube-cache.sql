-- =============================================
-- SONG YOUTUBE CACHE
-- Persist resolved embeddable video IDs so we skip YouTube search.
-- Modes: original | tutorial:guitar | tutorial:piano
-- =============================================

CREATE TABLE IF NOT EXISTS public.song_youtube_cache (
  song_id uuid NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  mode text NOT NULL
    CHECK (mode IN ('original', 'tutorial:guitar', 'tutorial:piano')),
  video_id text NOT NULL,
  title text,
  channel_title text,
  query text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (song_id, mode)
);

CREATE INDEX IF NOT EXISTS idx_song_youtube_cache_video_id
  ON public.song_youtube_cache(video_id);

ALTER TABLE public.song_youtube_cache ENABLE ROW LEVEL SECURITY;

-- Readable for catalog songs / own songs / admin (same spirit as lyric syncs)
DROP POLICY IF EXISTS "song_youtube_cache_select" ON public.song_youtube_cache;
CREATE POLICY "song_youtube_cache_select"
  ON public.song_youtube_cache FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.songs s
      WHERE s.id = song_id
        AND (s.is_public = true OR s.user_id = auth.uid() OR public.auth_user_is_admin())
    )
  );

-- Writes via service role from API (bypasses RLS). No authenticated client writes.
