-- Add key and soundingKey fields to songs table
ALTER TABLE public.songs 
ADD COLUMN IF NOT EXISTS key TEXT,
ADD COLUMN IF NOT EXISTS sounding_key TEXT;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_songs_key ON public.songs(key);
CREATE INDEX IF NOT EXISTS idx_songs_sounding_key ON public.songs(sounding_key);

-- Update existing songs to have NULL keys by default
UPDATE public.songs 
SET key = NULL, sounding_key = NULL 
WHERE key IS NULL OR sounding_key IS NULL;
