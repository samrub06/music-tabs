-- Store Spotify refresh token server-side (never expose to client selects)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS spotify_refresh_token text;
