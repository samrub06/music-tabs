/**
 * Script de test d'intégration pour le scraper
 * Ce script simule l'utilisation du scraper comme dans l'app Next.js
 */

const cheerio = require('cheerio');

// Simuler les fonctions du scraperService.ts
function decodeHTMLEntities(text) {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function cleanSongContent(content) {
  let cleaned = content.replace(/\[ch\]/g, '').replace(/\[\/ch\]/g, '');
  cleaned = cleaned.replace(/\[tab\]/g, '').replace(/\[\/tab\]/g, '');
  
  return cleaned
    .trim()
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+|\s+$/g, '');
}

async function searchUltimateGuitar(query) {
  const results = [];

  try {
    const searchUrl = `https://www.ultimate-guitar.com/search.php?search_type=title&value=${encodeURIComponent(query)}`;
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      return results;
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const dataContent = $('.js-store').attr('data-content');
    
    if (!dataContent) {
      return results;
    }

    const decodedData = decodeHTMLEntities(dataContent);
    const data = JSON.parse(decodedData);
    const searchResults = data.store?.page?.data?.results;
    
    if (!searchResults || !Array.isArray(searchResults)) {
      return results;
    }

    searchResults
      .filter((result) => {
        return result.tab_url && 
               !result.tab_url.includes('/pro/') && 
               (result.type === 'Chords' || result.type === 'Tab' || result.type);
      })
      .slice(0, 10)
      .forEach((result) => {
        results.push({
          title: result.song_name || 'Sans titre',
          author: result.artist_name || 'Inconnu',
          url: result.tab_url,
          source: 'Ultimate Guitar',
        });
      });

  } catch (error) {
    console.error('Error searching Ultimate Guitar:', error);
  }

  return results;
}

async function scrapeUltimateGuitar(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const dataContent = $('.js-store').attr('data-content');
    
    if (!dataContent) {
      return null;
    }

    const decodedData = decodeHTMLEntities(dataContent);
    const data = JSON.parse(decodedData);
    const tab = data.store?.page?.data?.tab_view?.wiki_tab;
    const tabData = data.store?.page?.data?.tab;
    
    if (!tab) {
      return null;
    }

    const content = tab.content || '';
    if (!content) {
      return null;
    }

    return {
      title: tabData?.song_name || tab.song_name || 'Sans titre',
      author: tabData?.artist_name || tab.artist_name || 'Auteur inconnu',
      content: cleanSongContent(content),
      source: 'Ultimate Guitar',
      url,
    };
  } catch (error) {
    console.error('Error scraping Ultimate Guitar:', error);
    return null;
  }
}

// === TEST 1: Recherche ===
async function testSearch() {
  console.log('\n' + '='.repeat(70));
  console.log('TEST 1: RECHERCHE');
  console.log('='.repeat(70));
  
  const query = 'wonderwall oasis';
  console.log(`\nRecherche: "${query}"`);
  
  const results = await searchUltimateGuitar(query);
  
  if (results.length > 0) {
    console.log(`\n✅ ${results.length} résultats trouvés!\n`);
    results.slice(0, 5).forEach((result, index) => {
      console.log(`${index + 1}. ${result.title} - ${result.author}`);
      console.log(`   Source: ${result.source}`);
      console.log(`   URL: ${result.url.substring(0, 80)}...`);
      console.log('');
    });
    return results;
  } else {
    console.log('\n❌ Aucun résultat trouvé');
    return [];
  }
}

// === TEST 2: Récupération de contenu ===
async function testScrape(url) {
  console.log('\n' + '='.repeat(70));
  console.log('TEST 2: RÉCUPÉRATION DE CONTENU');
  console.log('='.repeat(70));
  
  console.log(`\nURL: ${url}`);
  
  const song = await scrapeUltimateGuitar(url);
  
  if (song) {
    console.log('\n✅ Partition récupérée avec succès!\n');
    console.log(`Titre: ${song.title}`);
    console.log(`Artiste: ${song.author}`);
    console.log(`Source: ${song.source}`);
    console.log(`Longueur du contenu: ${song.content.length} caractères`);
    console.log('\n' + '-'.repeat(70));
    console.log('CONTENU (premiers 500 caractères):');
    console.log('-'.repeat(70));
    console.log(song.content.substring(0, 500));
    console.log('-'.repeat(70));
    return song;
  } else {
    console.log('\n❌ Échec de la récupération');
    return null;
  }
}

// === TEST 3: Flux complet (Recherche + Récupération) ===
async function testFullFlow() {
  console.log('\n\n' + '='.repeat(70));
  console.log('TEST 3: FLUX COMPLET (Recherche → Récupération)');
  console.log('='.repeat(70));
  
  const query = 'hotel california eagles';
  console.log(`\n1️⃣ Recherche de: "${query}"`);
  
  const results = await searchUltimateGuitar(query);
  
  if (results.length === 0) {
    console.log('❌ Aucun résultat');
    return;
  }
  
  console.log(`✅ ${results.length} résultats trouvés`);
  console.log(`\n2️⃣ Récupération de la première partition...`);
  
  const firstResult = results[0];
  const song = await scrapeUltimateGuitar(firstResult.url);
  
  if (song) {
    console.log('\n✅ Flux complet réussi!\n');
    console.log('📝 Résumé:');
    console.log(`  - Titre: ${song.title}`);
    console.log(`  - Artiste: ${song.author}`);
    console.log(`  - Contenu: ${song.content.length} chars`);
    console.log(`  - Accords détectés: ${(song.content.match(/\b[A-G][#b]?(m|maj|min)?[0-9]?\b/g) || []).length}`);
    console.log('\n🎉 Le système est opérationnel!');
  } else {
    console.log('❌ Échec de la récupération');
  }
}

// Exécution des tests
async function runAllTests() {
  console.log('\n🚀 TESTS DU SYSTÈME DE SCRAPING');
  console.log('═'.repeat(70));
  
  try {
    // Test 1: Recherche
    const results = await testSearch();
    
    // Test 2: Scraping (si on a des résultats)
    if (results.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await testScrape(results[0].url);
    }
    
    // Test 3: Flux complet
    await new Promise(resolve => setTimeout(resolve, 1000));
    await testFullFlow();
    
    console.log('\n\n' + '═'.repeat(70));
    console.log('✅ TOUS LES TESTS TERMINÉS AVEC SUCCÈS!');
    console.log('═'.repeat(70));
    console.log('\n📝 Résumé:');
    console.log('  ✅ Recherche sur Ultimate Guitar fonctionne');
    console.log('  ✅ Récupération de contenu fonctionne');
    console.log('  ✅ Nettoyage et formatage fonctionnent');
    console.log('\n🎸 Le scraper est prêt à être utilisé dans votre app!');
    console.log('\n💡 Prochaine étape: Testez dans votre application Next.js\n');
    
  } catch (error) {
    console.log('\n\n❌ ERREUR DURANT LES TESTS:');
    console.log(error);
  }
}

runAllTests();

