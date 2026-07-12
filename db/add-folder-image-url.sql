-- Add image_url to folders for playlist covers (UI: Playlists)
ALTER TABLE public.folders
  ADD COLUMN IF NOT EXISTS image_url text;
