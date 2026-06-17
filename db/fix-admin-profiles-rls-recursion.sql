-- Fix infinite recursion: admin policies must not SELECT from profiles inside profiles RLS.
-- Run this if you already applied add-admin-portal-policies.sql and see error 42P17.

CREATE OR REPLACE FUNCTION public.auth_user_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

REVOKE ALL ON FUNCTION public.auth_user_is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.auth_user_is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.auth_user_is_admin() TO service_role;

CREATE OR REPLACE FUNCTION public.protect_profiles_is_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
    IF NOT public.auth_user_is_admin() THEN
      NEW.is_admin := OLD.is_admin;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.auth_user_is_admin());

DROP POLICY IF EXISTS "Admins can view all songs" ON public.songs;
CREATE POLICY "Admins can view all songs"
  ON public.songs FOR SELECT
  USING (public.auth_user_is_admin());

DROP POLICY IF EXISTS "Admins can insert catalog songs" ON public.songs;
CREATE POLICY "Admins can insert catalog songs"
  ON public.songs FOR INSERT
  WITH CHECK (
    user_id IS NULL
    AND is_public = true
    AND public.auth_user_is_admin()
  );

DROP POLICY IF EXISTS "Admins can update any song" ON public.songs;
CREATE POLICY "Admins can update any song"
  ON public.songs FOR UPDATE
  USING (public.auth_user_is_admin());

DROP POLICY IF EXISTS "Admins can delete any song" ON public.songs;
CREATE POLICY "Admins can delete any song"
  ON public.songs FOR DELETE
  USING (public.auth_user_is_admin());

DROP POLICY IF EXISTS "Admins can update public playlists" ON public.playlists;
CREATE POLICY "Admins can update public playlists"
  ON public.playlists FOR UPDATE
  USING (
    is_public = true
    AND user_id IS NULL
    AND public.auth_user_is_admin()
  );

-- Older catalog-only admin song policies (from add-admin-song-edit-policies.sql)
DROP POLICY IF EXISTS "Admins can update public catalog songs" ON public.songs;
CREATE POLICY "Admins can update public catalog songs"
  ON public.songs FOR UPDATE
  USING (is_public = true AND public.auth_user_is_admin());

DROP POLICY IF EXISTS "Admins can delete public catalog songs" ON public.songs;
CREATE POLICY "Admins can delete public catalog songs"
  ON public.songs FOR DELETE
  USING (is_public = true AND public.auth_user_is_admin());
