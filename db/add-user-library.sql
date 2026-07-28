-- =============================================
-- USER LIBRARY LINKS (catalog song membership)
-- Prefer linking to shared catalog songs instead of cloning content.
-- =============================================

CREATE TABLE IF NOT EXISTS public.user_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  song_id uuid NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  folder_id uuid REFERENCES public.folders(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT user_library_user_song_unique UNIQUE (user_id, song_id)
);

CREATE INDEX IF NOT EXISTS idx_user_library_user_id
  ON public.user_library(user_id);

CREATE INDEX IF NOT EXISTS idx_user_library_song_id
  ON public.user_library(song_id);

CREATE INDEX IF NOT EXISTS idx_user_library_folder_id
  ON public.user_library(folder_id)
  WHERE folder_id IS NOT NULL;

ALTER TABLE public.user_library ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_library_select_own" ON public.user_library;
CREATE POLICY "user_library_select_own"
  ON public.user_library FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_library_insert_own" ON public.user_library;
CREATE POLICY "user_library_insert_own"
  ON public.user_library FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_library_update_own" ON public.user_library;
CREATE POLICY "user_library_update_own"
  ON public.user_library FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_library_delete_own" ON public.user_library;
CREATE POLICY "user_library_delete_own"
  ON public.user_library FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
