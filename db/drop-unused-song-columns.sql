-- Drop unused song columns (always-null in production).
-- Domain may still compute chordProgression from all_chords in memory.

DROP INDEX IF EXISTS public.idx_songs_sounding_key;

ALTER TABLE public.songs
  DROP COLUMN IF EXISTS sounding_key,
  DROP COLUMN IF EXISTS chord_progression;
