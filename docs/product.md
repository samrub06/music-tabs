# TABasco — Product Overview

## 1. Compréhension du projet

### 1.1 Qu'est-ce que TABasco ?

TABasco est une application web de partitions et tablatures pour musiciens.
Elle permet de **trouver**, **lire**, **transposer** et **organiser** des chansons
dans une interface simple, mobile-first et sans publicité intrusive.

L'app s'appuie sur **plusieurs pipelines de contenu** au sein d'**un seul hub** (`/`) :
- **Songbook / Shabbat** — zemirot, liturgie, répertoire kfar / événements
- **Israeli** — artistes locaux (Karduner, Mizrahi, pop israélienne moderne)
- **International** — pop, rock, classiques (Ultimate Guitar, explore)

**Principe UX (priorité produit) :** **une home pour tout le monde** — pas deux apps
ni deux homes parallèles. L'utilisateur arrive sur `/` et doit **voir immédiatement**
trois zones distinctes (titres, onglets, couleurs ou sections), pas un scroll anonyme.
Aujourd'hui les contenus coexistent sur `/` mais restent peu distingués ; l'objectif
est de structurer ce hub unique. `/explore` reste l'**approfondissement** international
(tendances, filtres), pas une seconde porte d'entrée.

**Communauté :** produit pensé pour les **Israéliens** (natifs et olim) et les **Juifs**
qui jouent en hébreu (diaspora). **Contenu ouvert à tous** — pas de gate religieux.

**Marché :** Israël first.
**Langue UI :** English first (FR et HE supportées).

### 1.2 Utilisateur cible

**Qui on vise :**
- **Israéliens natifs** qui jouent en hébreu et en international
- **Olim hadachim** (nouveaux immigrants) — souvent plus à l'aise en anglais qu'en hébreu
- **Juifs dans la diaspora** (US, UK, France, etc.) qui chantent en hébreu à shabbat,
  au camp / synagogue / kfar, en groupe, tout en gardant un répertoire international

**Profil :** passionné·e de **guitare** (piano en extension — voir accords).

**Pourquoi English first :** langue commune entre olim anglophones, diaspora et une
partie des Israéliens bilingues ; HE et FR restent disponibles pour le répertoire
et les utilisateurs locaux.

**Accès sans compte :**

| Accessible | Non accessible (compte requis) |
|------------|--------------------------------|
| `/`, `/search` — hub, recherche | `/songs` — bibliothèque personnelle |
| `/explore` — tendances internationales (approfondissement) | `/folders`, `/playlists`, `/chords` |
| `/library/[id]` — playlists publiques curatées (Songbook, Karduner, etc.) | `/leaderboard`, import, édition |
| `/song/[id]` — lecteur (chansons publiques) | |

Gratuit **avec compte** pour bibliothèque, dossiers, playlists et outils complets.

Les **modes d'usage** détaillés sont en section 2.

### 1.3 Problème que l'on résout

Aujourd'hui, les musiciens **jonglent entre plusieurs apps et sources** :
Tab4U pour l'hébreu, Ultimate Guitar pour l'international, PDF, WhatsApp, notes…

Résultat : pas de **flux unique** pour trouver, jouer, transposer et organiser
songbook, pop israélienne et international au même endroit — surtout pour
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

**Hub unique : `/`** — toutes les zones ci-dessous y convergent.

| Zone | Contenu | Où aujourd'hui | Source / état |
|------|---------|----------------|---------------|
| **Songbook / Shabbat** | Zemirot, liturgie, songbook | `/` — curated « Jewish » (Songbook) ; `/library/[id]` | Tab4U, songbook — enrichissement progressif |
| **Israeli** | Karduner, Mizrahi, pop israélienne | `/` — curated « Jewish » ; `/library/[id]` | Tab4U, curation manuelle |
| **International** | Pop, rock, tendances | Aperçu sur `/` (genre, décennie) ; détail sur `/explore` | Ultimate Guitar, import utilisateur |

L'utilisateur ne change pas d'app : il navigue dans **un seul hub** où chaque zone
est **visuellement identifiable**. `/explore` = « See all international » depuis la zone International.

### 1.5 Objectif business

**Convertir les utilisateurs gratuits en abonnés annuels.**

Modèle visé : **freemium**
- **Gratuit (pour l'instant)** → acquisition : compte + catalogue de base + outils essentiels (lecture, transpose, playlists, organisation)
- **Premium (abonnement annuel, à venir)** → rétention et revenus : catalogue étendu, fonctionnalités avancées, etc.

> Détail free vs premium : à définir (section monétisation, plus tard).

### 1.6 Vision en une phrase

> TABasco is the app for Israeli natives, new olim, and Jewish musicians worldwide
> who want Hebrew and international songs in one place — **building toward** clear
> zones on a single home hub — transpose, build playlists, and discover new music.

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

**Besoin :** découvrir de nouvelles chansons depuis le **hub unique** `/`.

**Comportements :**
- **Songbook / Shabbat & Israeli :** playlists curatées sur `/` et `/library/[id]`
- **International :** aperçu sur `/`, approfondissement sur `/explore` (tendances, filtres)
- **Recommandations** « For You » sur `/` (artiste favori, suggestions)
- **Engagement :** streak et classement sur `/leaderboard` *(rétention, pas découverte)*

**Écrans clés :**
- Hub principal → `/` (zones Songbook, Israeli, International)
- Playlists publiques → `/library/[id]`
- International (détail) → `/explore`
- Reco → `/`

**Critère de succès :** trouver une nouvelle chanson pertinente (hébreu ou international) et l'ajouter à sa bibliothèque.

---

## 3. Hub UX — structure de `/` (cible)

Objectif : **un seul écran d'accueil** où l'utilisateur repère en un coup d'œil
Songbook / Shabbat, Israeli et International — sans quitter l'app.

### 3.1 État actuel vs cible

| Point produit | Statut (juin 2026) | Reste à faire |
|---------------|-------------------|---------------|
| Hebrew content first (Songbook → Israeli → International) | **Fait** — `LibrarySections` réordonné | — |
| Deux sous-zones Songbook / Israeli (plus `jewish` unique) | **Fait** — `hubZone` dans `curatedPlaylists.ts` | Mizrahi dédié si catalogue étoffé |
| Genres / décennies / difficulté sous International | **Fait** | Limiter l’aperçu genre sur `/` (ex. 6 cartes) si scroll trop long |
| En-têtes de zone | **Fait** — `HubZoneHeader` (titres seuls, sans accent couleur) | Couleurs d’accent : volontairement retirées (feedback UX) |
| Lien See all → `/explore` | **Fait** — `ExploreHubCta` pleine largeur | — |
| Onglets sticky + ancres scroll | **Fait** — `HubZoneNav` | Affiner `scroll-mt` / offset header si collision mobile |
| Sections transversales sous les 3 zones | **Fait** — Recent → Featured → For You → Popular ; Spotify en bas | Trending explicite sur `/` (aujourd’hui via Popular) |
| Filtre recherche par zone (All / Songbook / Israeli / Intl) | **Non fait** (Phase 2b) | Nécessite logique métier (UG vs Tab4U vs catalogue) — pas un simple filtre UI |
| Cartes playlists (image + titre dessous, pas de compteur) | **Fait** — `CuratedPlaylistRow` | — |

Ordre actuel sur `/` : zones hub (avec nav sticky) → Recent → Featured → For You → Popular → Spotify.

**Écart wireframe vs réalité :** pas de limite « 6 genres » sur l’aperçu International ; le sticky nav compense partiellement la longueur du scroll.

### 3.2 Wireframe cible (mobile-first)

```
┌─────────────────────────────────────────┐
│  🔍 Search songs, artists, chords…      │  ← filtre optionnel par zone
├─────────────────────────────────────────┤
│  [ Songbook ] [ Israeli ] [ Intl ]      │  ← onglets sticky OU ancres scroll
├─────────────────────────────────────────┤
│  ▼ SONGBOOK & SHABBAT                   │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐           │
│  │Song│ │Nig │ │Hass│ │Car │  → scroll │
│  │book│ │unim│ │id  │ │leb │           │
│  └────┘ └────┘ └────┘ └────┘           │
│  Playlists: Songbook, Piyutim, …        │
│  → /library/jewish-songbook             │
├─────────────────────────────────────────┤
│  ▼ ISRAELI                              │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐           │
│  │Kard│ │Akiv│ │Mod │ │Miz │  → scroll │
│  │uner│ │a   │ │ern │ │rahi│           │
│  └────┘ └────┘ └────┘ └────┘           │
│  → /library/yosef-karduner, etc.        │
├─────────────────────────────────────────┤
│  ▼ INTERNATIONAL                        │
│  Trending · Rock · Pop · 60s · 70s…     │
│  [ See all on Explore → ]               │  ← /explore
├─────────────────────────────────────────┤
│  For You (connecté) · Recent · Popular  │  ← transversal, sous les zones
└─────────────────────────────────────────┘
```

**Desktop :** même structure ; les 3 zones peuvent être côte à côte en colonnes
ou garder le scroll vertical avec nav sticky.

### 3.3 Mapping contenu → zones

Réutiliser les playlists curatées existantes (`curatedPlaylists.ts`), reclassées :

| Zone product | Playlists / sections actuelles |
|--------------|--------------------------------|
| **Songbook / Shabbat** | `jewish-songbook`, `chabad-nigunim`, `hassidic`, `carlebach`, `moroccan-piyut`, `tunisian` |
| **Israeli** | `yosef-karduner`, `akiva`, `modern-israeli` (+ Mizrahi si ajouté) |
| **International** | section `genre`, `decade`, `difficulty` + trending/popular + lien `/explore` |

Pas de duplication de données : **changement de présentation** sur `/`, pas un nouveau catalogue.

### 3.4 Comportements clés

**Navigation**
- Onglets ou chips en haut : tap → scroll vers la zone (ancre) ou filtre le hub.
- Chaque zone a un **titre**, une **couleur d'accent** distincte (ex. teal = Songbook, blue = Israeli, neutral/violet = International).

**Recherche**
- Barre globale en haut (existant `SearchClient`).
- Phase 2 : filtre **All | Songbook | Israeli | International** sur les résultats.

**Playlists publiques**
- Cartes → `/library/[slug]` (accessible sans compte).
- CTA « Add to library » si connecté.

**International**
- Aperçu limité sur `/` (ex. 6 genres + trending).
- Bouton **See all on Explore** → `/explore` (filtres genre, decade, difficulty, recherche).

**Sections transversales** (sous les 3 zones)
- **Recent** — dernières chansons consultées
- **For You** — si connecté
- **Popular** — catalogue global
- **Featured** — une chanson mise en avant

### 3.5 Parcours Noam (validation UX)

| Moment | Action | Zone |
|--------|--------|------|
| Vendredi 18h | Ouvre `/`, tap **Songbook**, playlist Songbook → zemirot | Songbook / Shabbat |
| Samedi soir | Tap **International**, Rock → cover | International |
| Semaine | Search « Karduner », transpose, save | Israeli + bibliothèque |
| Découverte | **See all on Explore** → filtre 2000s | International |

**Succès :** Noam ne ouvre jamais Tab4U ni UG — tout part de `/`.

### 3.6 Implémentation (ordre suggéré)

1. ~~**Réordonner** `LibrarySections`~~ — fait.
2. ~~**Ajouter** `HubZoneHeader`~~ — fait (titres uniquement).
3. ~~**Scinder** jewish en `songbook` + `israeli` via `hubZone`~~ — fait.
4. ~~**Ajouter** CTA `/explore`~~ — fait.
5. ~~**Phase 2a :** onglets sticky + ancres (`HubZoneNav`)~~ — fait.
6. **Phase 2b (à prioriser ensuite) :** filtre recherche par zone + plafond genres sur `/`.
7. **Phase 3 (optionnel) :** couleurs d’accent par zone si tests utilisateurs le demandent.

> Voir : `LibrarySections.tsx`, `HubZoneNav.tsx`, `curatedPlaylists.ts`, `SearchClient.tsx`.

