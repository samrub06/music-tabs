-- Add display_order column to folders table
-- This column uses numeric/decimal to allow easy insertion between items using decimal values

ALTER TABLE public.folders 
ADD COLUMN display_order numeric;

-- Initialize existing folders with sequential integer values based on created_at
-- This ensures all existing folders have a display_order value
UPDATE public.folders
SET display_order = subquery.row_num
FROM (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at ASC)::numeric AS row_num
  FROM public.folders
) AS subquery
WHERE public.folders.id = subquery.id;

-- Set default value for new folders (will be set by application logic)
-- For now, we'll allow NULL and handle it in the application
-- Optionally, you could set a default like: ALTER TABLE public.folders ALTER COLUMN display_order SET DEFAULT 0;

-- Create index for better query performance when sorting by display_order
CREATE INDEX idx_folders_display_order ON public.folders(user_id, display_order NULLS LAST);



