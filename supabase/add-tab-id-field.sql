-- Add tab_id (Ultimate Guitar or external tab identifier) to songs
ALTER TABLE public.songs 
ADD COLUMN IF NOT EXISTS tab_id TEXT;

-- Optional index for quick lookups by tab_id
CREATE INDEX IF NOT EXISTS idx_songs_tab_id ON public.songs(tab_id);
