-- =============================================
-- MUSIC TABS - MIGRATION POUR AUTHENTIFICATION
-- =============================================
-- Ce script ajoute user_id aux tables existantes
-- et configure l'authentification multi-utilisateur

-- 1. Créer la table profiles (si elle n'existe pas déjà)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Ajouter la colonne user_id à la table folders
ALTER TABLE public.folders 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 3. Ajouter la colonne user_id à la table songs
ALTER TABLE public.songs 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 4. Créer un utilisateur par défaut pour les données existantes (optionnel)
-- Si tu veux migrer les données existantes vers un utilisateur spécifique,
-- remplace 'YOUR_USER_ID' par l'ID de ton compte Google après première connexion
-- Sinon, commente ces lignes et supprime les données existantes

-- UPDATE public.folders SET user_id = 'YOUR_USER_ID' WHERE user_id IS NULL;
-- UPDATE public.songs SET user_id = 'YOUR_USER_ID' WHERE user_id IS NULL;

-- 5. Rendre user_id obligatoire (après avoir migré les données)
-- Décommente ces lignes après avoir migré les données existantes
-- ALTER TABLE public.folders ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE public.songs ALTER COLUMN user_id SET NOT NULL;

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Activer RLS sur toutes les tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- SUPPRIMER LES ANCIENNES POLICIES (si elles existent)
-- =============================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own folders" ON public.folders;
DROP POLICY IF EXISTS "Users can create own folders" ON public.folders;
DROP POLICY IF EXISTS "Users can update own folders" ON public.folders;
DROP POLICY IF EXISTS "Users can delete own folders" ON public.folders;
DROP POLICY IF EXISTS "Users can view own songs" ON public.songs;
DROP POLICY IF EXISTS "Users can create own songs" ON public.songs;
DROP POLICY IF EXISTS "Users can update own songs" ON public.songs;
DROP POLICY IF EXISTS "Users can delete own songs" ON public.songs;

-- =============================================
-- POLICIES POUR PROFILES
-- =============================================

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =============================================
-- POLICIES POUR FOLDERS
-- =============================================

CREATE POLICY "Users can view own folders"
  ON public.folders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own folders"
  ON public.folders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folders"
  ON public.folders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own folders"
  ON public.folders FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- POLICIES POUR SONGS
-- =============================================

CREATE POLICY "Users can view own songs"
  ON public.songs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own songs"
  ON public.songs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own songs"
  ON public.songs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own songs"
  ON public.songs FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Fonction pour créer automatiquement le profil à l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour appeler handle_new_user lors de l'inscription
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at (si pas déjà existants)
DROP TRIGGER IF EXISTS handle_profiles_updated_at ON public.profiles;
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_folders_updated_at ON public.folders;
CREATE TRIGGER handle_folders_updated_at
  BEFORE UPDATE ON public.folders
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_songs_updated_at ON public.songs;
CREATE TRIGGER handle_songs_updated_at
  BEFORE UPDATE ON public.songs
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- =============================================
-- INDEXES POUR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON public.folders(user_id);
CREATE INDEX IF NOT EXISTS idx_songs_user_id ON public.songs(user_id);
CREATE INDEX IF NOT EXISTS idx_songs_folder_id ON public.songs(folder_id);

-- =============================================
-- VÉRIFICATION
-- =============================================

-- Afficher le résumé des tables
SELECT 
  'profiles' as table_name,
  COUNT(*) as row_count
FROM public.profiles
UNION ALL
SELECT 
  'folders' as table_name,
  COUNT(*) as row_count
FROM public.folders
UNION ALL
SELECT 
  'songs' as table_name,
  COUNT(*) as row_count
FROM public.songs;

-- Afficher les colonnes ajoutées
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('folders', 'songs')
  AND column_name = 'user_id';

