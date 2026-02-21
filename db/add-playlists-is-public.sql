-- Add is_public and image_url to playlists for Library public playlists

-- Add columns
ALTER TABLE public.playlists
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;

ALTER TABLE public.playlists
  ADD COLUMN IF NOT EXISTS image_url text;

-- Index for listing public playlists
CREATE INDEX IF NOT EXISTS idx_playlists_is_public ON public.playlists(is_public) WHERE is_public = true;

-- Policy: anyone can read playlists that are public
CREATE POLICY "Public playlists viewable by anyone"
  ON public.playlists
  FOR SELECT
  TO authenticated, anon
  USING (is_public = true);
