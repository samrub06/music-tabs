# Diagramme de Flux de Données

## Vue d'Ensemble ASCII

```
┌─────────────────────────────────────────────────────────────────┐
│                         UI LAYER                                │
│                                                                  │
│  ┌──────────────────────┐      ┌──────────────────────┐      │
│  │ Server Components    │      │ Client Components     │      │
│  │ (RSC)                │      │ (use client)          │      │
│  │                      │      │                       │      │
│  │ app/**/page.tsx      │      │ components/**         │      │
│  └──────────┬───────────┘      └───────────┬──────────┘      │
│             │                               │                  │
└─────────────┼───────────────────────────────┼──────────────────┘
              │                               │
              │ (1) Initial fetch              │ (8) User action
              │                               │
┌─────────────▼───────────────────────────────▼──────────────────┐
│                      SERVER LAYER                               │
│                                                                  │
│  ┌──────────────────────┐      ┌──────────────────────┐      │
│  │ Server Actions       │      │ Supabase SSR Client   │      │
│  │ (use server)         │      │                      │      │
│  │                      │      │ lib/supabase/server.ts│      │
│  │ app/**/actions.ts    │      └──────────┬───────────┘      │
│  └──────────┬───────────┘                 │                  │
│             │                               │                  │
│             │ (9) Create client            │ (2) Create client │
│             │                               │                  │
│             └───────────┬───────────────────┘                  │
│                         │                                      │
│                         │ (3) Query                            │
│                         │                                      │
│              ┌──────────▼───────────┐                          │
│              │ Data Access Layer    │                          │
│              │                      │                          │
│              │ lib/services/        │                          │
│              │  - songRepo.ts       │                          │
│              │  - folderService.ts  │                          │
│              │  - songService.ts    │                          │
│              └──────────┬───────────┘                          │
└─────────────────────────┼──────────────────────────────────────┘
                          │
                          │ (4) SQL Query
                          │
┌─────────────────────────▼──────────────────────────────────────┐
│                      DATABASE LAYER                             │
│                                                                  │
│  ┌──────────────────────┐      ┌──────────────────────┐      │
│  │ Supabase Tables      │      │ RLS Policies         │      │
│  │                      │      │                      │      │
│  │ - songs              │      │ - Filter by user_id  │      │
│  │ - folders            │      │ - Public songs        │      │
│  │ - playlists          │      │ - Auth checks        │      │
│  └──────────┬───────────┘      └──────────┬───────────┘      │
│             │                               │                  │
│             └───────────┬───────────────────┘                  │
│                         │                                      │
│                         │ (5) Filtered data                    │
└─────────────────────────┼──────────────────────────────────────┘
                          │
                          │ (6) Mapped data (snake_case → camelCase)
                          │
┌─────────────────────────▼──────────────────────────────────────┐
│                         BACK TO UI                              │
│                                                                  │
│  Server Component reçoit les données                            │
│  ↓                                                               │
│  Passe les props au Client Component                            │
│  ↓                                                               │
│  UI se met à jour                                                │
└─────────────────────────────────────────────────────────────────┘
```

## Flux de Lecture (Initial Render)

```
1. Browser Request
   ↓
2. Next.js Server Component (RSC) se charge
   ↓
3. RSC crée client Supabase SSR
   │   createServerClientSupabase()
   ↓
4. RSC appelle repo/service
   │   songService.getAllSongs(supabase)
   ↓
5. Repo exécute requête Supabase
   │   client.from('songs').select('*')
   ↓
6. RLS filtre automatiquement
   │   (auth.uid() = user_id OR user_id IS NULL)
   ↓
7. Données retournées (snake_case)
   │   { folder_id, created_at, ... }
   ↓
8. Repo mappe vers domain (camelCase)
   │   { folderId, createdAt, ... }
   ↓
9. RSC reçoit données mappées
   ↓
10. RSC passe props au Client Component
    <DashboardClient songs={songs} />
   ↓
11. UI s'affiche
```

## Flux de Mutation (User Action)

```
1. User clique sur bouton
   ↓
2. Client Component appelle Server Action
   │   addSongAction(payload)
   ↓
3. Server Action crée client Supabase SSR
   │   const supabase = await createServerClientSupabase()
   ↓
4. Server Action crée repo avec client
   │   const repo = songRepo(supabase)
   ↓
5. Repo exécute mutation
   │   repo.createSong(payload)
   ↓
6. RLS vérifie permissions
   │   (auth.uid() = user_id)
   ↓
7. Mutation s'exécute
   │   INSERT INTO songs ...
   ↓
8. Server Action appelle revalidatePath()
   │   revalidatePath('/dashboard')
   ↓
9. Next.js re-fetch la page
   ↓
10. RSC re-fetch les données
    ↓
11. UI se met à jour avec nouvelles données
```

## Séparation des Responsabilités

```
┌─────────────────────────────────────────────────────────────┐
│ UI Layer                                                     │
│  - Affichage                                                 │
│  - Interactions utilisateur                                  │
│  - State local (UI state)                                    │
└─────────────────────────────────────────────────────────────┘
                          ↓ props / actions
┌─────────────────────────────────────────────────────────────┐
│ Server Layer                                                 │
│  - Orchestration                                             │
│  - Validation                                                │
│  - Revalidation (revalidatePath)                             │
└─────────────────────────────────────────────────────────────┘
                          ↓ client injection
┌─────────────────────────────────────────────────────────────┐
│ Data Access Layer                                            │
│  - Requêtes DB                                               │
│  - Mapping DB → Domain                                       │
│  - Logique de transformation                                │
└─────────────────────────────────────────────────────────────┘
                          ↓ SQL queries
┌─────────────────────────────────────────────────────────────┐
│ Database Layer                                               │
│  - Stockage                                                  │
│  - RLS (sécurité)                                            │
│  - Contraintes                                               │
└─────────────────────────────────────────────────────────────┘
```

## Conventions de Nommage - Quick Reference

```
Fichiers:
├── app/**/page.tsx          → Server Component (RSC)
├── app/**/actions.ts         → Server Actions (use server)
├── app/**/*Client.tsx        → Client Component (use client)
├── components/**/*.tsx       → Client Components (use client)
├── lib/services/*Repo.ts     → Repos (client-injected)
└── lib/services/*Service.ts  → Services (client requis)

Fonctions:
├── Server Actions:           <verb><Entity>Action
│   ├── addSongAction
│   ├── updateSongAction
│   └── deleteFolderAction
│
├── Repos:                    <entity>Repo(client)
│   ├── songRepo(supabase)
│   └── folderRepo(supabase)
│
└── Méthodes Repo:            <verb><Entity>
    ├── createSong
    ├── updateSong
    └── deleteSong
```

