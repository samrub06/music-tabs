-- Add unique constraint on (name, section) for chords table
-- This allows ON CONFLICT to work properly when inserting chords
-- First, remove any duplicates if they exist

-- Remove duplicates, keeping the first occurrence
DELETE FROM public.chords a
USING public.chords b
WHERE a.id > b.id
  AND a.name = b.name
  AND a.section = b.section;

-- Now add the unique constraint
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chords_name_section_unique'
  ) THEN
    ALTER TABLE public.chords
    ADD CONSTRAINT chords_name_section_unique UNIQUE (name, section);
  END IF;
END $$;

