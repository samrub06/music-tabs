-- Favorite / liked songs for the current user library
ALTER TABLE songs
  ADD COLUMN IF NOT EXISTS is_liked boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_songs_user_liked
  ON songs (user_id)
  WHERE is_liked = true;
