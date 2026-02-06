# Plan : UX page Song (barre du haut + barre du bas redimensionnable)

## Objectifs

- **Une seule ligne en haut** : Transpose, Auto-scroll, Métronome (icône + popover), Outils.
- **Pas de bottom sheet**, **pas de menu déroulant**, **pas de modal** pour les réglages.
- **Barre du bas redimensionnable** (style Sefaria) : l’utilisateur peut agrandir ou réduire la barre pour voir en même temps la partition et les outils.
- **Métronome** : uniquement une icône dans la barre, avec un popover (Play/Pause + BPM + « Définir BPM »).
- **Zoom au pinch** : sur la partition, pinch à deux doigts modifie la taille du texte.

---

## 1. Barre du haut (SongHeader)

**Ligne 1** (inchangée)  
Retour | pochette + titre/artiste | prev/next | « Dans la bibliothèque » | menu ⋯ (Éditer, Supprimer, Ajouter à la bibliothèque).

**Ligne 2 — une seule ligne**  
- **Transpose** : boutons - / valeur / + (comme aujourd’hui).
- **Auto-scroll** : play/pause, vitesse (-/+), reset « Haut ».
- **Métronome** (si `song.bpm || onSetManualBpm`) : **icône** (ex. MusicalNoteIcon) ; au clic → **popover** avec :
  - Bouton Play/Pause métronome + affichage BPM.
  - Bouton « Définir BPM » (ferme le popover et ouvre le sélecteur BPM existant).
- **Outils** : un **bouton** « Outils » qui ouvre/ferme la **barre du bas** (callback `onToggleToolsBar`). Pas de Sheet, pas de Dropdown, pas de Dialog.

Fichier : `src/components/presentational/SongHeader.tsx`.  
Supprimer tout bloc Sheet/Dropdown/Modal « Outils ». Ajouter la prop `onToggleToolsBar?: () => void`.  
Remplacer le contenu « Outils » actuel par un simple bouton qui appelle `onToggleToolsBar?.()`.

---

## 2. Barre du bas redimensionnable (style Sefaria)

**Principe**  
Une barre fixée en bas de la zone song, avec une **poignée** en haut. En tirant la poignée vers le haut, la barre s’agrandit ; vers le bas, elle se réduit. La partition reste visible au-dessus.

**Layout (SongViewer)**  
- Header (flex-shrink-0).
- Zone centrale : partition (flex-1, scrollable).
- Barre du bas : hauteur = state `bottomBarHeight` (px). Min ~48px quand ouverte, max ~60 % de la hauteur. 0 = fermée.

**Contenu de la barre**  
Ton (Select), Capo (si `song.capo`), Instrument (Piano/Guitare), Accords faciles (si pas que des accords faciles), Taille du texte (+/-/reset), Éditer, Supprimer.

**Interaction**  
- Poignée : `pointerdown` → suivre `pointermove` → mettre à jour la hauteur (différence en Y). Limiter entre min et max.
- Bouton « Fermer » (X) : met la hauteur à 0.
- Le bouton « Outils » du header : si barre fermée, ouvre avec une hauteur par défaut (ex. 200px).

**Fichiers**  
- `src/components/presentational/SongViewer.tsx` : layout Header + zone partition (flex-1) + barre du bas conditionnelle (`bottomBarHeight > 0`).
- Nouveau composant `src/components/presentational/ToolsBottomBar.tsx` : poignée + zone scrollable avec le contenu (Ton, Capo, Instrument, etc.). Props : song, états et callbacks existants (transpose, capo, instrument, fontSize, easyChordMode, onToggleEdit, onDelete, etc.).
- Container `SongViewerContainerSSR` : state `bottomBarHeight`, `setBottomBarHeight`, `onToggleToolsBar` ; passer en props à SongViewer.

---

## 3. Métronome : icône + popover

Dans SongHeader, ligne 2 :  
- Bouton icône (visible si `song.bpm || onSetManualBpm`).  
- Au clic : afficher un petit panneau (state `metronomePopoverOpen`) en position absolute sous le bouton : Play/Pause métronome, BPM actuel, bouton « Définir BPM ».  
- « Définir BPM » ferme ce panneau et ouvre le BPM popover existant (absolute en bas du header).  
- Supprimer la section Métronome de l’ancien Sheet/Outils (elle sera uniquement dans ce popover + dans la barre du bas pour cohérence, ou uniquement dans le popover si on ne duplique pas dans la barre du bas — au choix : soit uniquement en haut dans le popover, soit aussi dans la barre du bas ; le plan privilégie « uniquement en haut » pour éviter la redondance).

---

## 4. Zoom au pinch (taille du texte)

**Objectif**  
Sur la zone de la partition (contenu scrollable), un pinch à deux doigts modifie la taille du texte.

**useFontSize** (`src/lib/hooks/useFontSize.ts`)  
- Ajouter `setFontSize(value: number)` : clamp 10–24, optionnellement arrondi au pas de 2 pour rester aligné avec les boutons +/-.

**Container**  
- Utiliser `setFontSize` du hook.  
- Passer à SongViewer une callback `onFontSizeChange?: (value: number) => void`.

**SongViewer**  
- Passer `onFontSizeChange` à SongContent.

**SongContent**  
- Sur le `div` scrollable (celui avec `contentRef`), écouter `touchstart` / `touchmove` / `touchend`.  
- Détecter 2 doigts : calculer la distance entre les deux doigts, en déduire un scale par rapport à la distance initiale.  
- Mapper le scale à la taille : `newFontSize = clamp(initialFontSize * scale, 10, 24)` et appeler `onFontSizeChange(newFontSize)`.  
- Throttle (ex. 50–80 ms) pour limiter les mises à jour.  
- Sur `touchmove` avec 2 doigts, appeler `preventDefault()` pour éviter le zoom natif du navigateur.

**Props**  
- SongContent : `onFontSizeChange?: (value: number) => void`.  
- SongViewer : transmettre la prop.  
- Container : brancher sur `setFontSize`.

---

## 5. Ordre d’implémentation suggéré

1. **useFontSize** : ajouter `setFontSize(value)` (clamp 10–24, step 2 si souhaité).
2. **SongHeader** :  
   - Ajouter Métronome (icône + popover).  
   - Remplacer le bloc Outils (Sheet/Dropdown/Modal) par un bouton « Outils » qui appelle `onToggleToolsBar`.  
   - Supprimer la state `sheetOpen` et tout le contenu du Sheet.
3. **Container** : state `bottomBarHeight`, `setBottomBarHeight`, `onToggleToolsBar` ; passer en props à SongViewer.
4. **ToolsBottomBar** : créer le composant (poignée de drag + contenu Ton, Capo, Instrument, Accords faciles, Taille, Éditer, Supprimer).
5. **SongViewer** : layout Header + partition (flex-1) + barre du bas (conditionnelle) ; passer `onToggleToolsBar`, `bottomBarHeight`, `setBottomBarHeight` au header et au composant barre.
6. **onFontSizeChange** : wiring container → SongViewer → SongContent.
7. **SongContent** : détection du pinch (touch events), throttle, `onFontSizeChange`, `preventDefault` sur pinch.

---

## 6. Récapitulatif

| Élément            | Comportement |
|--------------------|--------------|
| Barre du haut      | Une ligne : Transpose, Auto-scroll, Métronome (icône+popover), Outils (bouton). |
| Outils             | Ouvre/ferme la barre du bas (pas de sheet, dropdown, modal). |
| Barre du bas       | Redimensionnable (drag poignée), contient Ton, Capo, Instrument, Accords faciles, Taille, Éditer, Supprimer. |
| Métronome          | Icône + popover (Play/Pause, BPM, « Définir BPM »). |
| Partition          | Pinch = zoom sur la taille du texte (setFontSize via onFontSizeChange). |

Aucun changement de contrat des props côté container pour les handlers existants ; ajout uniquement de `onToggleToolsBar`, `bottomBarHeight`, `setBottomBarHeight`, `onFontSizeChange`.
