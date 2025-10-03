# 🔄 Guide de Migration - Authentification Multi-Utilisateur

## 📋 **Étapes à suivre**

### 1️⃣ **Sauvegarder tes données (Important !)**

Avant de commencer, exporte tes données existantes :

1. Va dans Supabase Dashboard
2. Table Editor → Clique sur chaque table
3. Export → Download as CSV

### 2️⃣ **Exécuter le script de migration**

1. Va dans **SQL Editor** dans Supabase
2. Copie/colle le contenu de `supabase-migration.sql`
3. Clique sur **"Run"**

⚠️ **Ce script va :**
- ✅ Créer la table `profiles`
- ✅ Ajouter `user_id` à `folders` et `songs`
- ✅ Activer Row Level Security (RLS)
- ✅ Créer toutes les policies de sécurité
- ✅ Créer les triggers automatiques

### 3️⃣ **Option A : Supprimer les données existantes (Recommandé pour dev)**

Si tu es en développement et que tes données de test ne sont pas importantes :

```sql
-- Supprimer toutes les données existantes
DELETE FROM public.songs;
DELETE FROM public.folders;
```

Ensuite, rends `user_id` obligatoire :

```sql
ALTER TABLE public.folders ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.songs ALTER COLUMN user_id SET NOT NULL;
```

### 3️⃣ **Option B : Migrer les données existantes**

Si tu veux garder tes données existantes :

1. **Connecte-toi avec Google** dans l'app
2. **Récupère ton User ID** :
   ```sql
   SELECT id, email FROM auth.users;
   ```
3. **Assigne tes données à ton compte** :
   ```sql
   -- Remplace 'YOUR_USER_ID' par ton ID
   UPDATE public.folders 
   SET user_id = 'YOUR_USER_ID' 
   WHERE user_id IS NULL;
   
   UPDATE public.songs 
   SET user_id = 'YOUR_USER_ID' 
   WHERE user_id IS NULL;
   ```
4. **Rends user_id obligatoire** :
   ```sql
   ALTER TABLE public.folders ALTER COLUMN user_id SET NOT NULL;
   ALTER TABLE public.songs ALTER COLUMN user_id SET NOT NULL;
   ```

### 4️⃣ **Vérifier la migration**

Exécute ces requêtes pour vérifier :

```sql
-- Vérifier que user_id a été ajouté
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('folders', 'songs')
  AND column_name = 'user_id';

-- Vérifier les policies
SELECT 
  schemaname,
  tablename,
  policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Vérifier les triggers
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;
```

## 🎯 **Schéma Final**

Après la migration, voici ton nouveau schéma :

```sql
-- Table profiles (nouvelle)
profiles
  - id (uuid, référence auth.users) 🔑 PRIMARY KEY
  - email (text, unique)
  - full_name (text, nullable)
  - avatar_url (text, nullable)
  - created_at (timestamp)
  - updated_at (timestamp)

-- Table folders (modifiée)
folders
  - id (uuid) 🔑 PRIMARY KEY
  - user_id (uuid, référence profiles.id) ⭐ NOUVEAU
  - name (varchar)
  - parent_id (uuid, nullable, référence folders.id)
  - created_at (timestamp)
  - updated_at (timestamp)

-- Table songs (modifiée)
songs
  - id (uuid) 🔑 PRIMARY KEY
  - user_id (uuid, référence profiles.id) ⭐ NOUVEAU
  - title (varchar)
  - author (varchar)
  - folder_id (uuid, nullable, référence folders.id)
  - format (varchar, default 'structured')
  - sections (jsonb)
  - created_at (timestamp)
  - updated_at (timestamp)
```

## 🔐 **Sécurité (RLS)**

Après la migration :
- ✅ Chaque utilisateur voit **uniquement ses propres données**
- ✅ Impossible d'accéder aux données d'un autre utilisateur
- ✅ Les nouvelles données sont automatiquement liées à l'utilisateur connecté

## 🧪 **Tester**

1. **Connecte-toi** avec Google
2. **Crée un dossier** → Vérifie dans Supabase que `user_id` est rempli
3. **Crée une chanson** → Vérifie que `user_id` correspond à ton compte
4. **Déconnecte-toi et reconnecte-toi** avec un autre compte Google
5. **Vérifie** que tu ne vois pas les données du premier compte

## ⚠️ **Points d'attention**

1. **RLS est activé** : Les anciennes requêtes sans filtre `user_id` ne fonctionneront plus
2. **Auth obligatoire** : Les utilisateurs non connectés ne pourront rien voir
3. **Migration unique** : Ce script peut être exécuté plusieurs fois (DROP IF EXISTS)

## 🐛 **Dépannage**

### Erreur "user_id cannot be null"
- Tu as rendu `user_id` obligatoire sans migrer les données
- Solution : Exécute les UPDATE ou supprime les données

### "No rows returned"
- RLS bloque l'accès car `user_id` ne correspond pas
- Solution : Vérifie que l'utilisateur est connecté

### "permission denied for table"
- Les policies ne sont pas correctement configurées
- Solution : Ré-exécute le script de migration

## 📊 **Checklist Complète**

- [ ] Sauvegarder les données existantes
- [ ] Exécuter `supabase-migration.sql`
- [ ] Choisir Option A (supprimer) ou B (migrer)
- [ ] Rendre `user_id` obligatoire
- [ ] Vérifier les policies RLS
- [ ] Tester avec un compte Google
- [ ] Vérifier l'isolation des données

## 🚀 **Prochaine étape**

Après cette migration, il faudra mettre à jour le code :
1. ✅ Modifier `songService.ts` pour utiliser `user_id`
2. ✅ Mettre à jour `AppContext.tsx`
3. ✅ Ajouter la protection des routes

**Tu es prêt à exécuter la migration ?** 🎸

