-- Spotify integration: store linked Spotify account id on profile (separate from app auth)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS spotify_id text;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_spotify_id_unique_idx
  ON public.profiles (spotify_id)
  WHERE spotify_id IS NOT NULL;
