# 🌶️ TABasco - Application de Gestion de Partitions

Une application moderne de gestion de partitions et tablatures musicales construite avec Next.js 15, TypeScript et Tailwind CSS.

## ✨ Fonctionnalités

### 📚 Gestion de Bibliothèque
- **Organisation par dossiers** : Créez et gérez des dossiers pour organiser vos chansons
- **Recherche avancée** : Recherchez dans les titres, auteurs et contenu des chansons
- **Import/Export** : Importez des playlists depuis MyTabs (Ultimate Guitar) avec organisation IA
- **Synchronisation cloud** : Toutes vos données sont sauvegardées dans Supabase avec authentification
- **Chansons publiques** : Partagez vos chansons publiquement (optionnel)

### 🎵 Visualisation des Chansons
- **Interface responsive** : Optimisée pour desktop et mobile
- **Accords cliquables** : Cliquez sur n'importe quel accord pour voir son diagramme
- **Transposition** : Transposez vos chansons de -6 à +6 demi-tons
- **Auto-scroll** : Défilement automatique avec vitesse ajustable pour les performances

### 🎹 Diagrammes d'Accords
- **Piano** : Visualisation des touches avec plusieurs voicings
- **Guitare** : Diagrammes de frettes avec positions des doigts
- **Commutation facile** : Basculez entre piano et guitare d'un clic

### 📱 Design Responsive
- **Mobile-first** : Interface adaptée aux smartphones et tablettes
- **Sidebar collapsible** : Navigation optimisée pour tous les écrans
- **Thème moderne** : Design épuré avec Tailwind CSS

## 🚀 Installation et Démarrage

### Prérequis
- Node.js 18+ 
- npm ou yarn
- Compte Supabase (pour la base de données)

### Configuration

1. **Cloner le repository**
```bash
git clone https://github.com/samrub06/music-tabs.git
cd music-tabs
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer les variables d'environnement**
Créez un fichier `.env.local` :
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Configurer la base de données**
Exécutez les migrations SQL dans le dossier `db/` dans votre projet Supabase :
- `db/supabase-setup.sql` (schéma de base)
- `db/fix-public-songs-rls.sql` (policies RLS)

5. **Démarrer en mode développement**
```bash
npm run dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

### Scripts Disponibles
```bash
npm run dev      # Démarrage en mode développement
npm run build    # Build de production
npm run start    # Démarrage du serveur de production
npm run lint     # Vérification ESLint
```

## 🛠️ Technologies Utilisées

- **Frontend** : Next.js 15 (App Router)
- **Language** : TypeScript
- **Styling** : Tailwind CSS
- **Icons** : Heroicons
- **State Management** : React Context + useReducer
- **Database** : Supabase (PostgreSQL avec RLS)
- **Authentication** : Supabase Auth

## 📖 Guide d'Utilisation

### Ajouter une Chanson
1. Cliquez sur "Ajouter une chanson"
2. Remplissez le titre, auteur (optionnel) et le contenu
3. Sélectionnez un dossier (optionnel)
4. Cliquez sur "Ajouter la chanson"

### Organiser avec des Dossiers
1. Utilisez la sidebar pour créer de nouveaux dossiers
2. Glissez-déposez ou éditez les chansons pour les assigner à un dossier
3. Naviguez entre les dossiers via la sidebar

### Utiliser la Transposition
1. Ouvrez une chanson
2. Utilisez les boutons +/- pour transposer
3. Les accords sont automatiquement convertis

### Auto-scroll pour Performances
1. Ouvrez une chanson
2. Cliquez sur le bouton play pour démarrer l'auto-scroll
3. Ajustez la vitesse avec le slider
4. Utilisez "Haut" pour revenir au début

## 📁 Structure du Projet

```
music-tabs/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── (protected)/    # Routes protégées
│   │   │   └── dashboard/  # Dashboard utilisateur
│   │   │       ├── page.tsx        # Server Component (RSC)
│   │   │       ├── actions.ts      # Server Actions
│   │   │       └── DashboardClient.tsx  # Client Component
│   │   ├── song/[id]/      # Page de visualisation
│   │   └── api/            # API Routes
│   ├── components/         # Composants React
│   │   ├── containers/     # Client Components avec logique
│   │   ├── presentational/ # Composants "dumb"
│   │   └── ...
│   ├── lib/
│   │   ├── supabase/       # Clients Supabase
│   │   │   └── server.ts  # Client SSR (serveur uniquement)
│   │   ├── supabase.ts     # Client navigateur
│   │   └── services/       # Data Access Layer
│   │       ├── songRepo.ts      # Repo explicite (client-injected)
│   │       ├── folderService.ts # Service dossiers
│   │       └── ...
│   ├── types/              # Types TypeScript
│   │   └── index.ts
│   └── utils/              # Utilitaires purs
│       └── ...
├── db/                     # Migrations SQL
│   └── *.sql
├── docs/                   # Documentation
│   └── architecture-and-conventions.md  # Architecture détaillée
└── ...
```

> 📖 **Pour comprendre l'architecture en détail**, consultez [`docs/architecture-and-conventions.md`](./docs/architecture-and-conventions.md)

## 🎼 Format des Chansons

L'application reconnaît automatiquement les accords et sections :

```
[Intro]
C   G   Am  F

[Verse 1]
C                          G
I'm going under and this time
Am                         F
I fear there's no one to save me

[Chorus]
C                    G                    Am                F
Now the day bleeds into nightfall, and you're not here
```

### Accords Supportés
- **Majeurs** : C, D, E, F, G, A, B
- **Mineurs** : Cm, Dm, Em, etc.
- **7èmes** : C7, Dm7, Cmaj7, etc.
- **Altérations** : C#, Bb, F#m, etc.
- **Accords complexes** : Cadd9, Gsus4, etc.

## 🤝 Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. Fork le projet
2. Créez une branche pour votre fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📝 License

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🐛 Signaler un Bug

Si vous trouvez un bug, merci d'ouvrir une [issue](https://github.com/samrub06/music-tabs/issues) avec :
- Une description claire du problème
- Les étapes pour reproduire le bug
- Votre environnement (OS, navigateur, etc.)

## ⭐ Remerciements

- [Next.js](https://nextjs.org/) pour le framework
- [Tailwind CSS](https://tailwindcss.com/) pour le styling
- [Heroicons](https://heroicons.com/) pour les icônes
- La communauté open source pour l'inspiration

---

**Développé avec ❤️ pour les musiciens**
