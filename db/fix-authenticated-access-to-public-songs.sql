-- ============================================================
-- FIX: Allow authenticated users to see ANY public song
-- ============================================================

-- 1. Drop the existing policy that might be too restrictive
-- We try to drop known policy names to be safe
DROP POLICY IF EXISTS "songs_select_owner_or_public" ON public.songs;
DROP POLICY IF EXISTS "Users can view own songs and public content" ON public.songs;

-- 2. Create a truly permissive policy for SELECT
-- "Applied to: authenticated" means this runs for logged-in users.
-- We want them to see:
--   a) Their own songs (user_id = auth.uid())
--   b) ANY song that is marked public (is_public = true)
--   c) ANY song that is marked trending (is_trending = true)
--   d) Legacy public songs (user_id IS NULL)

CREATE POLICY "songs_select_authenticated_permissive"
  ON public.songs
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id          -- My songs
    OR is_public = true           -- Public songs by anyone
    OR is_trending = true         -- Trending songs
    OR user_id IS NULL            -- System songs
  );

-- 3. Ensure the 'anon' policy also covers public songs (just in case)
-- Often there is a separate policy for 'anon' or 'public' role.
-- If you have one, it should look like this (safe to run if not exists):
DROP POLICY IF EXISTS "songs_select_anon_public" ON public.songs;

CREATE POLICY "songs_select_anon_public"
  ON public.songs
  FOR SELECT
  TO anon
  USING (
    is_public = true
    OR is_trending = true
    OR user_id IS NULL
  );




