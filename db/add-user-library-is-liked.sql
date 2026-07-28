-- Per-user like on library membership (catalog-safe).
ALTER TABLE public.user_library
  ADD COLUMN IF NOT EXISTS is_liked boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_user_library_user_liked
  ON public.user_library(user_id)
  WHERE is_liked = true;
