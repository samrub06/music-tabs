# 🎸 Stratégie des Chansons Publiques vs Privées

## 🎯 **Concept**

L'application fonctionne maintenant avec **deux modes** :

### 1️⃣ **Mode Non Connecté (Visiteur)**
- ✅ Affiche les chansons **publiques** (`user_id = NULL`)
- ✅ Affiche les dossiers **publics** (`user_id = NULL`)
- ❌ Ne peut **pas créer** de nouvelles chansons
- ❌ Ne peut **pas modifier** ou **supprimer** les chansons
- 💡 Un **banner** encourage à se connecter

### 2️⃣ **Mode Connecté (Utilisateur)**
- ✅ Affiche **uniquement ses propres chansons** (via RLS)
- ✅ Affiche **uniquement ses propres dossiers** (via RLS)
- ✅ Peut **créer**, **modifier** et **supprimer** ses chansons
- ✅ Isolation complète : ne voit **jamais** les chansons des autres utilisateurs

## 📊 **Architecture des Données**

### **Base de données**

```
┌─────────────────────────────────────────────────────────┐
│                        SONGS                             │
├──────────────┬──────────────────────────────────────────┤
│ user_id      │ Propriétaire                             │
├──────────────┼──────────────────────────────────────────┤
│ NULL         │ Chanson publique (visible si non loggé) │
│ user123      │ Chanson privée de user123                │
│ user456      │ Chanson privée de user456                │
└──────────────┴──────────────────────────────────────────┘
```

### **Filtrage automatique**

```javascript
// Dans songService.ts
async getAllSongs() {
  const { data: { user } } = await supabase.auth.getUser();
  
  let query = supabase.from('songs').select('*');
  
  if (!user) {
    // Non connecté : chansons publiques uniquement
    query = query.is('user_id', null);
  }
  // Connecté : RLS filtre automatiquement par user_id
  
  return query;
}
```

## 🔒 **Sécurité (Row Level Security)**

### **Policies RLS**

```sql
-- Les utilisateurs voient leurs propres chansons
CREATE POLICY "Users can view own songs"
  ON songs FOR SELECT
  USING (auth.uid() = user_id);

-- Les utilisateurs créent avec leur user_id
CREATE POLICY "Users can create own songs"
  ON songs FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### **Contournement pour chansons publiques**

Les chansons avec `user_id = NULL` ne passent **pas** par RLS car elles n'ont pas de propriétaire. On les récupère explicitement avec `.is('user_id', null)` quand l'utilisateur n'est pas connecté.

## 🎨 **Interface Utilisateur**

### **Non Connecté**
```
┌─────────────────────────────────────────────────────────┐
│  🎸 Welcome to Music Tabs                               │
│  Sign in to save and organize your own songs!           │
│  [Sign in with Google]                                  │
└─────────────────────────────────────────────────────────┘
│                                                           │
│  [Search] (pas de bouton +Add)                           │
│                                                           │
│  Liste des chansons publiques (user_id = NULL)          │
└─────────────────────────────────────────────────────────┘
```

### **Connecté**
```
┌─────────────────────────────────────────────────────────┐
│  Header avec avatar et menu utilisateur                 │
└─────────────────────────────────────────────────────────┘
│                                                           │
│  [Search] [+ Add New Song]                               │
│                                                           │
│  Liste des chansons de l'utilisateur                     │
└─────────────────────────────────────────────────────────┘
```

## 🔄 **Workflow Complet**

### **Scénario 1 : Visiteur → Utilisateur**

1. **Visiteur arrive** sur l'app
   - Voit les chansons publiques
   - Peut naviguer et consulter
   
2. **Visiteur se connecte** avec Google
   - Profil créé automatiquement
   - Voit maintenant ses propres chansons (vide au début)
   - Ne voit plus les chansons publiques

3. **Utilisateur crée ses chansons**
   - Chansons liées à son `user_id`
   - Visibles uniquement par lui
   
4. **Utilisateur se déconnecte**
   - Revoit les chansons publiques
   - Ses chansons privées sont cachées

### **Scénario 2 : Migration des données existantes**

Si tu as des **anciennes chansons** dans ta DB :

**Option A : Les rendre publiques**
```sql
-- Laisser user_id = NULL
-- Elles seront visibles pour les visiteurs
```

**Option B : Les assigner à un utilisateur**
```sql
-- Assigner à ton compte
UPDATE songs 
SET user_id = 'ton-user-id' 
WHERE user_id IS NULL;
```

## 🧪 **Tests**

### **Test 1 : Mode Visiteur**
1. Se déconnecter (ou ouvrir en navigation privée)
2. Aller sur l'app
3. ✅ Devrait voir les chansons avec `user_id = NULL`
4. ❌ Pas de bouton "+ Add Song"
5. ✅ Banner "Sign in with Google"

### **Test 2 : Mode Utilisateur**
1. Se connecter avec Google
2. ✅ Voir uniquement ses chansons
3. ✅ Bouton "+ Add Song" visible
4. ✅ Créer une chanson → elle a `user_id`
5. ✅ Se déconnecter → la chanson disparaît

### **Test 3 : Multi-utilisateurs**
1. Se connecter avec Compte A
2. Créer des chansons
3. Se déconnecter
4. Se connecter avec Compte B
5. ✅ Ne devrait **pas** voir les chansons de A
6. ✅ Peut créer ses propres chansons

## 📝 **Résumé**

| État          | Chansons visibles              | Peut créer | Peut modifier |
|---------------|--------------------------------|------------|---------------|
| Non connecté  | Publiques (`user_id = NULL`)   | ❌         | ❌            |
| Connecté      | Siennes (`user_id = mon_id`)   | ✅         | ✅            |

**Isolation totale** entre utilisateurs grâce à RLS ✅

