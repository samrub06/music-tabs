-- Add capo field to songs table
ALTER TABLE public.songs 
ADD COLUMN IF NOT EXISTS capo INTEGER;

-- Add index for capo field for better performance
CREATE INDEX IF NOT EXISTS idx_songs_capo ON public.songs(capo);

-- Update existing songs to have NULL capo by default (no capo)
UPDATE public.songs 
SET capo = NULL 
WHERE capo IS NULL;
