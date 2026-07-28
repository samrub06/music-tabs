-- =============================================
-- SONG LYRIC SYNCS (YouTube Practice: click line → seek)
-- Shared timed lyric maps for catalog songs.
-- =============================================

CREATE TABLE IF NOT EXISTS public.song_lyric_syncs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id uuid NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  youtube_video_id text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'ready', 'failed')),
  lines jsonb NOT NULL DEFAULT '[]'::jsonb,
  model text,
  error text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (song_id, youtube_video_id)
);

CREATE INDEX IF NOT EXISTS idx_song_lyric_syncs_song_id
  ON public.song_lyric_syncs(song_id);

CREATE INDEX IF NOT EXISTS idx_song_lyric_syncs_status
  ON public.song_lyric_syncs(status);

ALTER TABLE public.song_lyric_syncs ENABLE ROW LEVEL SECURITY;

-- Anyone can read syncs for public catalog songs (shared Practice experience)
DROP POLICY IF EXISTS "song_lyric_syncs_select_public_song" ON public.song_lyric_syncs;
CREATE POLICY "song_lyric_syncs_select_public_song"
  ON public.song_lyric_syncs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.songs s
      WHERE s.id = song_id
        AND (s.is_public = true OR s.user_id = auth.uid() OR public.auth_user_is_admin())
    )
  );

-- Writes: admins only via authenticated client; scripts use service role (bypasses RLS)
DROP POLICY IF EXISTS "song_lyric_syncs_admin_write" ON public.song_lyric_syncs;
CREATE POLICY "song_lyric_syncs_admin_insert"
  ON public.song_lyric_syncs FOR INSERT
  TO authenticated
  WITH CHECK (public.auth_user_is_admin());

CREATE POLICY "song_lyric_syncs_admin_update"
  ON public.song_lyric_syncs FOR UPDATE
  TO authenticated
  USING (public.auth_user_is_admin())
  WITH CHECK (public.auth_user_is_admin());

CREATE POLICY "song_lyric_syncs_admin_delete"
  ON public.song_lyric_syncs FOR DELETE
  TO authenticated
  USING (public.auth_user_is_admin());
