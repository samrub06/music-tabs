-- Indexes for /songs user library queries (tab sorts + filters).

CREATE INDEX IF NOT EXISTS idx_songs_user_updated_at
  ON public.songs (user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_songs_user_view_count
  ON public.songs (user_id, view_count DESC)
  WHERE view_count > 0;

CREATE INDEX IF NOT EXISTS idx_songs_user_folder_updated
  ON public.songs (user_id, folder_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_songs_user_liked_updated
  ON public.songs (user_id, updated_at DESC)
  WHERE is_liked = true;
