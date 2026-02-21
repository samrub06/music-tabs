-- Update increment_view_count to also refresh updated_at when a song is viewed
CREATE OR REPLACE FUNCTION increment_view_count(song_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.songs 
  SET view_count = COALESCE(view_count, 0) + 1,
      updated_at = NOW()
  WHERE id = song_id;
END;
$$ LANGUAGE plpgsql;
