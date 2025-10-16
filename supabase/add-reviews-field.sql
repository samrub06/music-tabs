-- Add reviews field to songs table
ALTER TABLE public.songs 
ADD COLUMN IF NOT EXISTS reviews INTEGER DEFAULT 0;

-- Add index for reviews field for better performance
CREATE INDEX IF NOT EXISTS idx_songs_reviews ON public.songs(reviews);

-- Update existing songs to have 0 reviews by default
UPDATE public.songs 
SET reviews = 0 
WHERE reviews IS NULL;
