# 🔐 Configuration Supabase pour Music Tabs

## 📋 **Étapes de configuration**

### 1️⃣ **Configuration de l'authentification Google**

1. **Dans Supabase Dashboard** :
   - Va dans `Authentication` → `Providers`
   - Active **Google** provider
   - Tu as déjà configuré ton **Google OAuth Client ID** et **Client Secret**

2. **URL de redirection autorisée** :
   - Assure-toi que l'URL suivante est dans ta configuration Google OAuth :
   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```
   - Pour le développement local :
   ```
   http://localhost:3000/
   ```

### 2️⃣ **Créer les tables dans Supabase**

1. Va dans `SQL Editor` dans ton dashboard Supabase
2. Copie et colle le contenu du fichier `supabase-setup.sql`
3. Clique sur "Run" pour exécuter le script

Ce script va créer :
- ✅ Table `profiles` (profils utilisateur)
- ✅ Table `folders` (dossiers de chansons)
- ✅ Table `songs` (chansons)
- ✅ Toutes les policies RLS (Row Level Security)
- ✅ Triggers automatiques pour créer les profils
- ✅ Index pour les performances

### 3️⃣ **Variables d'environnement**

Assure-toi que ton fichier `.env.local` contient :

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

⚠️ **Important** : N'utilise que la clé **anon** (publique), jamais la clé **service_role** côté client.

### 4️⃣ **Vérification**

Après avoir exécuté le script SQL, vérifie dans Supabase :

1. **Tables** : `profiles`, `folders`, `songs` doivent exister
2. **Policies** : Chaque table doit avoir 4 policies (SELECT, INSERT, UPDATE, DELETE)
3. **Triggers** : Le trigger `on_auth_user_created` doit être actif

## 🏗️ **Architecture de la base de données**

### **Schéma des relations**

```
auth.users (Supabase Auth)
    ↓
profiles (public)
    ↓
    ├── folders (public)
    │       ↓
    └── songs (public)
            ↑ (folder_id nullable)
```

### **Sécurité (RLS)**

- ✅ Chaque utilisateur ne peut voir que **ses propres** données
- ✅ Les policies RLS empêchent tout accès non autorisé
- ✅ Les triggers créent automatiquement un profil à l'inscription

## 🧪 **Test de l'authentification**

1. Lance l'application : `npm run dev`
2. Clique sur "Sign in with Google" dans le header
3. Connecte-toi avec ton compte Google
4. Tu devrais voir ton avatar et ton nom dans le header
5. Un profil devrait être créé automatiquement dans la table `profiles`

## 🐛 **Dépannage**

### Erreur "Invalid API key"
- Vérifie que `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` sont corrects
- Redémarre le serveur après avoir modifié `.env.local`

### L'authentification ne fonctionne pas
- Vérifie que le provider Google est activé dans Supabase
- Vérifie les URLs de redirection autorisées
- Regarde les logs dans Supabase Dashboard → Logs

### Profil non créé après connexion
- Vérifie que le trigger `on_auth_user_created` existe et est actif
- Vérifie les permissions de la fonction `handle_new_user()`

## 📚 **Prochaines étapes**

Après avoir configuré l'authentification :

1. ✅ Mettre à jour `AppContext` pour filtrer les données par utilisateur
2. ✅ Modifier les services (`songService.ts`) pour inclure `user_id`
3. ✅ Ajouter une page de protection pour les routes privées
4. ✅ Tester l'isolation des données entre utilisateurs

## 🎯 **Résumé rapide**

```bash
# 1. Exécute le script SQL dans Supabase
# 2. Vérifie les variables d'environnement
# 3. Redémarre le serveur
npm run dev
# 4. Teste la connexion Google
# 5. Vérifie que le profil est créé dans Supabase
```

🎉 **C'est tout ! L'authentification est prête.**

