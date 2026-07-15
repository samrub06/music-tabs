-- User suggestions to push personal copy changes back into the shared catalog
CREATE TABLE IF NOT EXISTS public.song_edit_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_song_id uuid NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  from_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_song_id uuid NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_song_edit_suggestions_status
  ON public.song_edit_suggestions(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_song_edit_suggestions_user
  ON public.song_edit_suggestions(from_user_id);

ALTER TABLE public.song_edit_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own song edit suggestions" ON public.song_edit_suggestions;
CREATE POLICY "Users can insert own song edit suggestions"
  ON public.song_edit_suggestions FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = from_user_id
    AND EXISTS (
      SELECT 1 FROM public.songs s
      WHERE s.id = from_song_id AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view own song edit suggestions" ON public.song_edit_suggestions;
CREATE POLICY "Users can view own song edit suggestions"
  ON public.song_edit_suggestions FOR SELECT
  TO authenticated
  USING (
    auth.uid() = from_user_id
    OR public.auth_user_is_admin()
  );

DROP POLICY IF EXISTS "Admins can update song edit suggestions" ON public.song_edit_suggestions;
CREATE POLICY "Admins can update song edit suggestions"
  ON public.song_edit_suggestions FOR UPDATE
  TO authenticated
  USING (public.auth_user_is_admin())
  WITH CHECK (public.auth_user_is_admin());
