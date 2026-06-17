-- Admin portal: profiles read-all, songs CRUD, public playlist updates, is_admin guard.
-- Uses auth_user_is_admin() SECURITY DEFINER to avoid profiles RLS recursion (42P17).

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

-- Prevent non-admins from self-promoting is_admin on their profile.
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

DROP TRIGGER IF EXISTS protect_profiles_is_admin_trigger ON public.profiles;
CREATE TRIGGER protect_profiles_is_admin_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profiles_is_admin();

-- Admins can read all profiles.
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.auth_user_is_admin());

-- Admins can read all songs.
DROP POLICY IF EXISTS "Admins can view all songs" ON public.songs;
CREATE POLICY "Admins can view all songs"
  ON public.songs FOR SELECT
  USING (public.auth_user_is_admin());

-- Admins can insert catalog (system) songs.
DROP POLICY IF EXISTS "Admins can insert catalog songs" ON public.songs;
CREATE POLICY "Admins can insert catalog songs"
  ON public.songs FOR INSERT
  WITH CHECK (
    user_id IS NULL
    AND is_public = true
    AND public.auth_user_is_admin()
  );

-- Admins can update any song (extends catalog-only policy).
DROP POLICY IF EXISTS "Admins can update any song" ON public.songs;
CREATE POLICY "Admins can update any song"
  ON public.songs FOR UPDATE
  USING (public.auth_user_is_admin());

-- Admins can delete any song (extends catalog-only policy).
DROP POLICY IF EXISTS "Admins can delete any song" ON public.songs;
CREATE POLICY "Admins can delete any song"
  ON public.songs FOR DELETE
  USING (public.auth_user_is_admin());

-- Admins can update public curated playlists.
DROP POLICY IF EXISTS "Admins can update public playlists" ON public.playlists;
CREATE POLICY "Admins can update public playlists"
  ON public.playlists FOR UPDATE
  USING (
    is_public = true
    AND user_id IS NULL
    AND public.auth_user_is_admin()
  );
