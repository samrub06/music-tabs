# Guide d'import des playlists Ultimate Guitar

## 🎵 Fonctionnalité d'import des playlists

Cette fonctionnalité permet d'importer automatiquement toutes les chansons de vos playlists Ultimate Guitar dans votre application Music Tabs. Le système :

1. **Récupère vos playlists** depuis votre compte Ultimate Guitar
2. **Recherche la meilleure version** de chaque chanson (celle avec le plus de reviews)
3. **Importe automatiquement** les chansons dans votre bibliothèque

## 📋 Prérequis

- Un compte Ultimate Guitar avec des chansons sauvegardées
- Être connecté à votre compte dans l'application Music Tabs

## 🚀 Comment utiliser l'import des playlists

### Étape 1 : Accéder à la fonctionnalité

1. Connectez-vous à votre compte dans l'application
2. Cliquez sur votre avatar en haut à droite
3. Sélectionnez "Importer Ultimate Guitar"

### Étape 2 : Récupérer vos cookies

1. **Connectez-vous sur Ultimate Guitar** : https://www.ultimate-guitar.com
2. **Allez sur votre page My Tabs** : https://www.ultimate-guitar.com/user/mytabs
3. **Ouvrez les outils de développement** (F12)
4. **Allez dans l'onglet "Network"** puis rechargez la page
5. **Cliquez sur la première requête**, puis dans "Headers" copiez la valeur de "Cookie"
6. **Collez les cookies** dans le champ prévu à cet effet

### Étape 3 : Importer vos chansons

1. **Cliquez sur "Voir mes playlists"** pour prévisualiser vos playlists
2. **Cliquez sur "Importer toutes les chansons"** pour commencer l'import
3. **Attendez** que le processus se termine (peut prendre plusieurs minutes)

## 🔍 Comment ça marche techniquement

### Authentification
- Le système utilise vos cookies de session Ultimate Guitar pour accéder à vos données privées
- Aucun mot de passe n'est stocké, seuls les cookies temporaires sont utilisés

### Scrapping intelligent
- **Extraction des playlists** : Le système analyse la page `mytabs` pour extraire vos playlists
- **Recherche optimisée** : Pour chaque chanson, il recherche sur Ultimate Guitar la version avec le plus de reviews
- **Import automatique** : Les meilleures versions sont automatiquement ajoutées à votre bibliothèque

### Sélection des meilleures versions
Le système utilise plusieurs critères pour choisir la meilleure version :
- **Nombre de reviews/votes** (priorité principale)
- **Type de tablature** (Chords, Tab, etc.)
- **Disponibilité** (exclut les versions Pro payantes)

## ⚠️ Limitations et considérations

### Respect des conditions d'utilisation
- Cette fonctionnalité respecte les conditions d'utilisation d'Ultimate Guitar
- Elle utilise uniquement les données publiquement accessibles avec votre authentification
- Aucune donnée n'est stockée en permanence

### Performance
- L'import peut prendre du temps selon le nombre de chansons
- Le système traite les chansons par batch pour éviter de surcharger les serveurs
- Un délai est respecté entre les requêtes pour être respectueux

### Limitations techniques
- Nécessite des cookies valides (expirent après un certain temps)
- Dépend de la structure de la page Ultimate Guitar (peut nécessiter des mises à jour)
- Certaines chansons peuvent ne pas être trouvées si elles ne sont plus disponibles

## 🛠️ Dépannage

### Erreur d'authentification
- **Problème** : "User not authenticated"
- **Solution** : Vérifiez que vos cookies sont corrects et récents

### Aucune playlist trouvée
- **Problème** : "No playlists found"
- **Solution** : Vérifiez que vous avez des chansons sauvegardées sur Ultimate Guitar

### Import partiel
- **Problème** : Certaines chansons ne sont pas importées
- **Solution** : C'est normal, certaines chansons peuvent ne plus être disponibles

### Cookies expirés
- **Problème** : Les cookies ne fonctionnent plus
- **Solution** : Reconnectez-vous sur Ultimate Guitar et récupérez de nouveaux cookies

## 🔧 Pour les développeurs

### Structure du code

```
src/
├── lib/services/scraperService.ts    # Logique de scrapping
├── app/api/playlists/import/route.ts # API endpoint
├── components/PlaylistImporter.tsx   # Interface utilisateur
└── types/index.ts                    # Types TypeScript
```

### Fonctions principales

- `scrapeUltimateGuitarPlaylists()` : Scraper les playlists
- `importPlaylistSongs()` : Importer les chansons
- `searchUltimateGuitarOnly()` : Rechercher les meilleures versions

### Test et développement

Un script de test est disponible : `test-playlist-scraping.js`

```bash
# Pour tester le scrapping
node test-playlist-scraping.js
```

### Configuration

Les paramètres configurables :
- `maxConcurrent` : Nombre de chansons traitées simultanément (défaut: 3)
- `targetFolderId` : Dossier de destination pour les imports

## 📈 Améliorations futures

- [ ] Support d'autres sites de tablatures
- [ ] Import sélectif (choisir quelles playlists importer)
- [ ] Synchronisation automatique
- [ ] Gestion des doublons
- [ ] Import par URL de playlist spécifique

## 🆘 Support

Si vous rencontrez des problèmes :
1. Vérifiez que vos cookies sont corrects
2. Assurez-vous d'avoir des chansons sur Ultimate Guitar
3. Consultez les logs dans la console du navigateur
4. Créez une issue sur GitHub avec les détails de l'erreur
