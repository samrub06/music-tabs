-- Add difficulty and learning_order columns to chords table

ALTER TABLE public.chords 
ADD COLUMN IF NOT EXISTS difficulty text CHECK (difficulty IN ('beginner', 'intermediate', 'advanced'));

ALTER TABLE public.chords 
ADD COLUMN IF NOT EXISTS learning_order integer;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chords_difficulty ON public.chords(difficulty);
CREATE INDEX IF NOT EXISTS idx_chords_learning_order ON public.chords(learning_order);

-- Update existing chords with default values if needed
UPDATE public.chords 
SET difficulty = 'beginner', learning_order = 0 
WHERE difficulty IS NULL OR learning_order IS NULL;

