const cheerio = require('cheerio');

/**
 * Script de test pour le scrapping des playlists Ultimate Guitar
 * 
 * Pour utiliser ce script :
 * 1. Connectez-vous sur https://www.ultimate-guitar.com
 * 2. Allez sur https://www.ultimate-guitar.com/user/mytabs
 * 3. Ouvrez les outils de développement (F12)
 * 4. Copiez le contenu de la page (Ctrl+A, Ctrl+C)
 * 5. Collez le contenu dans un fichier test-mytabs-page.html
 * 6. Exécutez ce script : node test-playlist-scraping.js
 */

const fs = require('fs');
const path = require('path');

function decodeHTMLEntities(text) {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function extractPlaylistsFromHTML(html) {
  const $ = cheerio.load(html);
  const playlists = [];
  
  console.log('Analyzing page structure...');
  
  // 1. Chercher les données JSON dans .js-store
  const storeElements = $('.js-store');
  console.log(`Found ${storeElements.length} .js-store elements`);
  
  storeElements.each((i, elem) => {
    const $elem = $(elem);
    const dataContent = $elem.attr('data-content');
    
    if (dataContent) {
      console.log(`\nAnalyzing .js-store element ${i + 1}:`);
      console.log('Data content length:', dataContent.length);
      
      try {
        const decodedData = decodeHTMLEntities(dataContent);
        const data = JSON.parse(decodedData);
        
        console.log('JSON structure:');
        console.log('- store keys:', Object.keys(data.store || {}));
        
        if (data.store?.page?.data) {
          console.log('- page.data keys:', Object.keys(data.store.page.data));
        }
        
        // Chercher des playlists dans différentes structures possibles
        const possiblePaths = [
          'store.page.data.playlists',
          'store.page.data.user_tabs',
          'store.page.data.bookmarks',
          'store.page.data.favorites',
          'store.page.data.tabs'
        ];
        
        for (const path of possiblePaths) {
          const parts = path.split('.');
          let current = data;
          
          for (const part of parts) {
            if (current && typeof current === 'object' && part in current) {
              current = current[part];
            } else {
              current = null;
              break;
            }
          }
          
          if (current && Array.isArray(current)) {
            console.log(`Found array at ${path} with ${current.length} items`);
            if (current.length > 0) {
              console.log('Sample item:', JSON.stringify(current[0], null, 2));
            }
          }
        }
        
      } catch (error) {
        console.log('Error parsing JSON:', error.message);
      }
    }
  });
  
  // 2. Chercher les liens vers les tabs
  const songLinks = $('a[href*="/tab/"], a[href*="/tabs/"]');
  console.log(`\nFound ${songLinks.length} song links`);
  
  if (songLinks.length > 0) {
    const songs = [];
    
    songLinks.slice(0, 10).each((i, elem) => {
      const $link = $(elem);
      const href = $link.attr('href');
      const text = $link.text().trim();
      
      if (href && text && !text.includes('Pro') && !text.includes('Official')) {
        console.log(`Link ${i + 1}: ${text} -> ${href}`);
        
        const parts = text.split(' - ');
        const title = parts[0] || text;
        const artist = parts[1] || 'Unknown';
        
        songs.push({
          title,
          artist,
          url: href.startsWith('http') ? href : `https://www.ultimate-guitar.com${href}`
        });
      }
    });
    
    if (songs.length > 0) {
      playlists.push({
        name: 'My Tabs (from HTML links)',
        songs
      });
    }
  }
  
  // 3. Chercher d'autres structures possibles
  console.log('\nLooking for other possible structures...');
  
  // Chercher des éléments avec des classes qui pourraient contenir des playlists
  const possibleSelectors = [
    '.playlist',
    '.user-tabs',
    '.my-tabs',
    '.bookmarks',
    '.favorites',
    '[data-playlist]',
    '[data-tabs]'
  ];
  
  for (const selector of possibleSelectors) {
    const elements = $(selector);
    if (elements.length > 0) {
      console.log(`Found ${elements.length} elements with selector: ${selector}`);
    }
  }
  
  return playlists;
}

// Fonction principale
async function testPlaylistScraping() {
  const testFilePath = path.join(__dirname, 'test-mytabs-page.html');
  
  if (!fs.existsSync(testFilePath)) {
    console.log(`
❌ Fichier de test manquant: ${testFilePath}

Pour créer ce fichier :
1. Connectez-vous sur https://www.ultimate-guitar.com
2. Allez sur https://www.ultimate-guitar.com/user/mytabs
3. Ouvrez les outils de développement (F12)
4. Dans l'onglet "Elements", faites clic droit sur <html> et "Copy > Copy outerHTML"
5. Collez le contenu dans le fichier ${testFilePath}
6. Relancez ce script
    `);
    return;
  }
  
  console.log('📄 Loading test page...');
  const html = fs.readFileSync(testFilePath, 'utf8');
  
  console.log(`📊 Page size: ${html.length} characters`);
  
  const playlists = extractPlaylistsFromHTML(html);
  
  console.log('\n🎵 Results:');
  console.log(`Found ${playlists.length} playlists`);
  
  playlists.forEach((playlist, index) => {
    console.log(`\nPlaylist ${index + 1}: ${playlist.name}`);
    console.log(`  Songs: ${playlist.songs.length}`);
    
    if (playlist.songs.length > 0) {
      console.log('  Sample songs:');
      playlist.songs.slice(0, 3).forEach((song, songIndex) => {
        console.log(`    ${songIndex + 1}. ${song.title} - ${song.artist}`);
      });
    }
  });
  
  // Sauvegarder les résultats
  const resultsFile = path.join(__dirname, 'playlist-scraping-results.json');
  fs.writeFileSync(resultsFile, JSON.stringify(playlists, null, 2));
  console.log(`\n💾 Results saved to: ${resultsFile}`);
}

// Exécuter le test
testPlaylistScraping().catch(console.error);
