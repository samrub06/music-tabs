-- =============================================
-- SONG RECORDINGS (practice mode audio)
-- =============================================

CREATE TABLE IF NOT EXISTS public.song_recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id uuid NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  duration_ms integer,
  line_markers jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_song_recordings_song_id
  ON public.song_recordings(song_id);

CREATE INDEX IF NOT EXISTS idx_song_recordings_user_id
  ON public.song_recordings(user_id);

CREATE INDEX IF NOT EXISTS idx_song_recordings_song_public
  ON public.song_recordings(song_id)
  WHERE is_public = true;

ALTER TABLE public.song_recordings ENABLE ROW LEVEL SECURITY;

-- Own rows: full CRUD
DROP POLICY IF EXISTS "song_recordings_select_own_or_public" ON public.song_recordings;
CREATE POLICY "song_recordings_select_own_or_public"
  ON public.song_recordings FOR SELECT
  USING (
    auth.uid() = user_id
    OR is_public = true
    OR public.auth_user_is_admin()
  );

DROP POLICY IF EXISTS "song_recordings_insert_own" ON public.song_recordings;
CREATE POLICY "song_recordings_insert_own"
  ON public.song_recordings FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR public.auth_user_is_admin()
  );

DROP POLICY IF EXISTS "song_recordings_update_own" ON public.song_recordings;
CREATE POLICY "song_recordings_update_own"
  ON public.song_recordings FOR UPDATE
  USING (
    auth.uid() = user_id
    OR public.auth_user_is_admin()
  )
  WITH CHECK (
    auth.uid() = user_id
    OR public.auth_user_is_admin()
  );

DROP POLICY IF EXISTS "song_recordings_delete_own" ON public.song_recordings;
CREATE POLICY "song_recordings_delete_own"
  ON public.song_recordings FOR DELETE
  USING (
    auth.uid() = user_id
    OR public.auth_user_is_admin()
  );
