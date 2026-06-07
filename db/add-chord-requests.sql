-- User requests for missing chord diagrams
CREATE TABLE IF NOT EXISTS public.chord_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chord_name text NOT NULL,
  instrument text NOT NULL CHECK (instrument IN ('guitar', 'piano')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, chord_name, instrument)
);

ALTER TABLE public.chord_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own chord requests"
  ON public.chord_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own chord requests"
  ON public.chord_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_chord_requests_chord_name ON public.chord_requests(chord_name);
