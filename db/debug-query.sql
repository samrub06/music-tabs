-- DEBUG : Vérifier les chansons dans la base de données

-- 1. Compter toutes les chansons
SELECT COUNT(*) as total_songs FROM public.songs;

-- 2. Compter les chansons publiques (user_id = NULL)
SELECT COUNT(*) as public_songs FROM public.songs WHERE user_id IS NULL;

-- 3. Compter les chansons privées (user_id != NULL)
SELECT COUNT(*) as private_songs FROM public.songs WHERE user_id IS NOT NULL;

-- 4. Voir toutes les chansons avec leur user_id
SELECT 
  id,
  title,
  author,
  user_id,
  created_at
FROM public.songs
ORDER BY created_at DESC
LIMIT 10;

-- 5. Voir les détails des colonnes de la table songs
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'songs'
ORDER BY ordinal_position;

