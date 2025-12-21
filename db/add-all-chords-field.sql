-- Add all_chords field to songs table to store all unique chords used in a song
-- This allows efficient filtering by chord difficulty

ALTER TABLE public.songs 
ADD COLUMN IF NOT EXISTS all_chords TEXT[];

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_songs_all_chords ON public.songs USING GIN (all_chords);

