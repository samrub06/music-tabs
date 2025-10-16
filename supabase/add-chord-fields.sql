-- Add chord analysis fields to songs table
ALTER TABLE public.songs
ADD COLUMN IF NOT EXISTS first_chord TEXT,
ADD COLUMN IF NOT EXISTS last_chord TEXT,
ADD COLUMN IF NOT EXISTS chord_progression TEXT[];

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_songs_first_chord ON public.songs(first_chord);
CREATE INDEX IF NOT EXISTS idx_songs_last_chord ON public.songs(last_chord);

-- Update existing songs to have NULL values for new fields
UPDATE public.songs
SET first_chord = NULL,
    last_chord = NULL,
    chord_progression = NULL
WHERE first_chord IS NULL OR last_chord IS NULL OR chord_progression IS NULL;
