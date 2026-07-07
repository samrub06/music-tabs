-- Shared song stories (one per canonical song + language, not per user)
CREATE TABLE IF NOT EXISTS public.song_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_key text NOT NULL,
  title text NOT NULL,
  author text NOT NULL,
  language text NOT NULL CHECK (language IN ('en', 'fr', 'he')),
  about text NOT NULL,
  meaning text NOT NULL,
  anecdotes text NOT NULL,
  chords_insight text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (canonical_key, language)
);

CREATE INDEX IF NOT EXISTS idx_song_stories_canonical_language
  ON public.song_stories (canonical_key, language);

ALTER TABLE public.song_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read song stories"
  ON public.song_stories FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert song stories"
  ON public.song_stories FOR INSERT
  TO authenticated
  WITH CHECK (true);
