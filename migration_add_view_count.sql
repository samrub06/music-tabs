-- Add view_count column to songs table
ALTER TABLE public.songs 
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Add index for view_count for better performance
CREATE INDEX IF NOT EXISTS idx_songs_view_count ON public.songs(view_count);

-- Add comment to the column
COMMENT ON COLUMN public.songs.view_count IS 'Number of times the song has been viewed';

-- Create function to increment view count
CREATE OR REPLACE FUNCTION increment_view_count(song_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.songs 
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = song_id;
END;
$$ LANGUAGE plpgsql;
