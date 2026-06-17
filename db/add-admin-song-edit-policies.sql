-- Allow catalog admins to edit public/curated songs (user_id IS NULL or is_public = true).

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

DROP POLICY IF EXISTS "Admins can update public catalog songs" ON public.songs;
CREATE POLICY "Admins can update public catalog songs"
  ON public.songs FOR UPDATE
  USING (
    is_public = true
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
  );

DROP POLICY IF EXISTS "Admins can delete public catalog songs" ON public.songs;
CREATE POLICY "Admins can delete public catalog songs"
  ON public.songs FOR DELETE
  USING (
    is_public = true
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
  );
