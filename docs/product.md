# TABasco — Product Overview

## 1. Compréhension du projet

### 1.1 Qu'est-ce que TABasco ?

TABasco est une application web de partitions et tablatures pour musiciens.
Elle permet de **trouver**, **lire**, **transposer** et **organiser** des chansons
dans une interface simple, mobile-first et sans publicité intrusive.

L'app s'appuie sur **deux pipelines de contenu** au sein d'une seule expérience :
- **Catalogue israélien / hébreu** — songbook, artistes locaux, répertoire shabbat / kfar
- **Catalogue international** — pop, rock, classiques (Ultimate Guitar, explore)

**Principe UX (priorité produit) :** l'utilisateur doit **voir clairement** qu'il existe
deux univers de musique — pas un seul flux anonyme. Aujourd'hui les deux coexistent
sur la home (`/`) mais restent peu distingués ; l'objectif est de renforcer cette
séparation visuelle et navigationnelle (sections, onglets, filtres, entrées dédiées).

**Marché :** Israël first — utilisateurs juifs partout dans le monde.
**Langue UI :** English first (FR et HE supportées).

### 1.2 Utilisateur cible

**Qui on vise :**
- **Israéliens natifs** qui jouent en hébreu et en international
- **Olim hadachim** (nouveaux immigrants) — souvent plus à l'aise en anglais qu'en hébreu
- **Juifs dans la diaspora** (US, UK, France, etc.) qui chantent en hébreu à shabbat,
  au kfar, en groupe, tout en gardant un répertoire international

**Profil :** passionné·e de **guitare** (piano en extension — voir accords).

**Pourquoi English first :** langue commune entre olim anglophones, diaspora et une
partie des Israéliens bilingues ; HE et FR restent disponibles pour le répertoire
et les utilisateurs locaux.

**Accès sans compte :**

| Accessible | Non accessible (compte requis) |
|------------|--------------------------------|
| `/`, `/search` — recherche et home | `/songs` — bibliothèque personnelle |
| `/explore` — tendances internationales | `/folders`, `/playlists`, `/chords` |
| `/song/[id]` — lecteur (chansons publiques) | `/leaderboard`, import, édition |

Gratuit **avec compte** pour bibliothèque, dossiers, playlists et outils complets.

Les **modes d'usage** détaillés sont en section 2.

### 1.3 Problème que l'on résout

Aujourd'hui, les musiciens **jonglent entre plusieurs apps et sources** :
Tab4U pour l'hébreu, Ultimate Guitar pour l'international, PDF, WhatsApp, notes…

Résultat : pas de **flux unique** pour trouver, jouer, transposer et organiser
les deux répertoires (israélien + international) au même endroit — surtout pour
quelqu'un qui vit entre hébreu (shabbat, kfar) et pop internationale.

TABasco vise à **unifier** cette expérience, avec un avantage clair sur Ultimate Guitar :
**le répertoire israélien/hébreu au même niveau que l'international**, pas en annexe.

Usages essentiels (gratuits avec compte) :
- **jouer** une chanson (partitions avec accords)
- **transposer** facilement
- créer des **playlists**
- **organiser** son répertoire (dossiers, ordre, recherche)
- recevoir des **recommandations** *(moteur en amélioration continue)*

### 1.4 Catalogues proposés

| Catalogue | Contenu | Où aujourd'hui | Source / état |
|-----------|---------|----------------|---------------|
| **Israélien / hébreu** | Songbook, Karduner, Mizrahi, shabbat, kfar | `/` — sections curated « Jewish » | Tab4U, songbook, curation manuelle — enrichissement progressif |
| **International** | Pop, rock, tendances | `/explore` + sections genre/décennie sur `/` | Ultimate Guitar, import utilisateur |

Les deux catalogues vivent dans **une seule app**, sans changer d'outil — mais l'UX
doit évoluer pour que l'utilisateur **choisisse consciemment** entre « Hebrew / Israeli »
et « International », au lieu de tout mélanger dans un scroll unique.

### 1.5 Objectif business

**Convertir les utilisateurs gratuits en abonnés annuels.**

Modèle visé : **freemium**
- **Gratuit (pour l'instant)** → acquisition : compte + catalogue de base + outils essentiels (lecture, transpose, playlists, organisation)
- **Premium (abonnement annuel, à venir)** → rétention et revenus : catalogue étendu, fonctionnalités avancées, etc.

> Détail free vs premium : à définir (section monétisation, plus tard).

### 1.6 Vision en une phrase

> TABasco is the app for Israeli natives, new olim, and Jewish musicians worldwide
> who want Hebrew and international songs in one place — with clear paths to each
> catalog — transpose, build playlists, and discover new music.

---

## 2. Modes d'usage

**Persona type — Noam :** 24 ans, olim depuis 2 ans, joue de la guitare au kfar et
en soirée. Cherche des zemirot en hébreu le vendredi et des covers internationales
le reste de la semaine. Veut une app en anglais, sans jongler Tab4U + Ultimate Guitar.

Ce ne sont pas trois utilisateurs différents : un même musicien peut passer d'un
mode à l'autre (répéter le soir, organiser avant shabbat, explorer le week-end).

### 2.1 Musicien en répétition

**Besoin :** jouer une chanson tout de suite, sans friction.

**Comportements :**
- Cherche une chanson rapidement (recherche `/`, bibliothèque `/songs`, dernières consultées)
- Utilise le lecteur `/song/[id]` : transpose, auto-scroll, zoom texte (pinch)
- Consulte les diagrammes d'accords guitare au clic ; piano en extension via `/chords`
- Utilise surtout **mobile** ou **tablette**

**Écrans clés :** `/`, `/songs`, `/song/[id]`, `/chords`

**Critère de succès :** trouver et ouvrir une chanson rapidement, commencer à jouer.

### 2.2 Organisateur de répertoire

**Besoin :** structurer son répertoire pour un groupe, un événement (shabbat, kfar) ou la semaine.

**Comportements :**
- Crée des **dossiers** et des **playlists** (ex. setlist shabbat vs setlist covers)
- Importe depuis Ultimate Guitar / MyTabs (import IA, `/ai-playlist`)
- Ajoute, édite et classe ses chansons
- Partage éventuellement des chansons **publiques**

**Écrans clés :** `/folders`, `/folders/[id]`, `/playlists`, `/playlist/[id]`, `/add-song`, `/ai-playlist`

**Critère de succès :** avoir une setlist prête et ordonnée avant la répétition ou l'événement.

### 2.3 Explorateur

**Besoin :** découvrir de nouvelles chansons dans **les deux** catalogues.

**Comportements :**
- **International :** tendances et filtres sur `/explore`
- **Israélien / hébreu :** playlists curatées sur `/` (Songbook, Karduner, Mizrahi, etc.)
- **Recommandations** « For You » sur `/` (artiste favori, suggestions)
- **Engagement :** streak et classement sur `/leaderboard` *(rétention, pas découverte)*

**Écrans clés :**
- Israélien → `/` (sections Jewish / curated)
- International → `/explore`
- Reco → `/`

**Critère de succès :** trouver une nouvelle chanson pertinente (hébreu ou international) et l'ajouter à sa bibliothèque.
