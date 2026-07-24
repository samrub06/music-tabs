-- Add sheet_image_url to songs for the sheet-music / partition image
-- (shown in the song viewer to give richer content, e.g. the original score).
ALTER TABLE public.songs
  ADD COLUMN IF NOT EXISTS sheet_image_url text;
