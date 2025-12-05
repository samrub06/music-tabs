-- Migration to add is_trending field and allow public songs

-- 1. Add is_trending column
ALTER TABLE public.songs 
ADD COLUMN IF NOT EXISTS is_trending boolean DEFAULT false;

-- 2. Make user_id nullable to support system songs
ALTER TABLE public.songs 
ALTER COLUMN user_id DROP NOT NULL;

-- 3. Update RLS policies for songs

-- Drop existing select policy
DROP POLICY IF EXISTS "Users can view own songs" ON public.songs;

-- Create new select policy allowing own songs OR public songs
CREATE POLICY "Users can view own or public songs"
  ON public.songs FOR SELECT
  USING (
    auth.uid() = user_id -- Own songs
    OR 
    is_public = true -- Public/Trending songs
  );

-- Ensure update/delete is still restricted to owner (no change needed usually if previous policy was specific, but let's be safe)
-- The existing policies "Users can update own songs" and "Users can delete own songs" use (auth.uid() = user_id), which is safe since user_id is null for public songs (so no match) or matches a specific user.

-- 4. Create index for is_trending and is_public for performance
CREATE INDEX IF NOT EXISTS idx_songs_trending_public ON public.songs(is_trending, is_public);

