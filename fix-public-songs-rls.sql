-- =============================================
-- FIX : Autoriser la lecture des chansons publiques
-- =============================================

-- 1. Supprimer l'ancienne policy de lecture restrictive
DROP POLICY IF EXISTS "Users can view own songs" ON public.songs;

-- 2. Créer une nouvelle policy qui autorise :
--    - Les utilisateurs à voir leurs propres chansons
--    - Tout le monde (même non connecté) à voir les chansons publiques (user_id = NULL)
CREATE POLICY "Users can view own songs and public songs"
  ON public.songs FOR SELECT
  USING (
    auth.uid() = user_id  -- Utilisateur connecté voit ses chansons
    OR 
    user_id IS NULL       -- Tout le monde voit les chansons publiques
  );

-- =============================================
-- Même chose pour les folders
-- =============================================

-- 1. Supprimer l'ancienne policy de lecture restrictive
DROP POLICY IF EXISTS "Users can view own folders" ON public.folders;

-- 2. Créer une nouvelle policy qui autorise :
--    - Les utilisateurs à voir leurs propres dossiers
--    - Tout le monde (même non connecté) à voir les dossiers publics (user_id = NULL)
CREATE POLICY "Users can view own folders and public folders"
  ON public.folders FOR SELECT
  USING (
    auth.uid() = user_id  -- Utilisateur connecté voit ses dossiers
    OR 
    user_id IS NULL       -- Tout le monde voit les dossiers publics
  );

-- =============================================
-- VÉRIFICATION
-- =============================================

-- Afficher toutes les policies sur songs
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'songs';

-- Afficher toutes les policies sur folders
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'folders';

