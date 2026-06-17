-- Allow catalog admins to edit public/curated songs (user_id IS NULL or is_public = true).
-- Requires auth_user_is_admin() from add-admin-portal-policies.sql (or fix-admin-profiles-rls-recursion.sql).

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

DROP POLICY IF EXISTS "Admins can update public catalog songs" ON public.songs;
CREATE POLICY "Admins can update public catalog songs"
  ON public.songs FOR UPDATE
  USING (
    is_public = true
    AND public.auth_user_is_admin()
  );

DROP POLICY IF EXISTS "Admins can delete public catalog songs" ON public.songs;
CREATE POLICY "Admins can delete public catalog songs"
  ON public.songs FOR DELETE
  USING (
    is_public = true
    AND public.auth_user_is_admin()
  );
