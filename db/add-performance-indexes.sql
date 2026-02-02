-- Performance indexes for faster queries
-- Run this migration to improve query performance

-- Indexes for songs table
CREATE INDEX IF NOT EXISTS idx_songs_user_id ON songs(user_id);
CREATE INDEX IF NOT EXISTS idx_songs_folder_id ON songs(folder_id);
CREATE INDEX IF NOT EXISTS idx_songs_created_at ON songs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_songs_user_id_created_at ON songs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_songs_user_id_folder_id ON songs(user_id, folder_id);

-- Indexes for folders table
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_display_order ON folders(user_id, display_order);

-- Indexes for playlists table
CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_playlists_created_at ON playlists(created_at DESC);

-- Indexes for user_stats table (gamification)
CREATE INDEX IF NOT EXISTS idx_user_stats_total_xp ON user_stats(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);

-- Indexes for daily_song_views table
CREATE INDEX IF NOT EXISTS idx_daily_song_views_user_song_date ON daily_song_views(user_id, song_id, viewed_date);

-- Composite index for common song queries
CREATE INDEX IF NOT EXISTS idx_songs_user_folder_created ON songs(user_id, folder_id, created_at DESC);
