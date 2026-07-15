-- Link personal library copies back to the shared catalog song
ALTER TABLE public.songs
  ADD COLUMN IF NOT EXISTS cloned_from_id uuid REFERENCES public.songs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_songs_cloned_from
  ON public.songs(cloned_from_id)
  WHERE cloned_from_id IS NOT NULL;
