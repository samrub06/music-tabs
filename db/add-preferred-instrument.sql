-- Add preferred instrument (piano | guitar) to user profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_instrument text
  CHECK (preferred_instrument IS NULL OR preferred_instrument IN ('piano', 'guitar'));
