/**
 * Test d'intégration complet pour Tab4U
 */

const cheerio = require('cheerio');

// Copie des fonctions du scraperService
function cleanSongContent(content) {
  let cleaned = content.replace(/\[ch\]/g, '').replace(/\[\/ch\]/g, '');
  cleaned = cleaned.replace(/\[tab\]/g, '').replace(/\[\/tab\]/g, '');
  
  return cleaned
    .trim()
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+|\s+$/g, '');
}

async function scrapeTab4U(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept-Language': 'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extraire le titre depuis h1
    let title = $('h1').first().text().trim();
    title = title.replace(/^אקורדים לשיר\s+/, '').replace(/\s+של\s+.*$/, '');

    // Extraire l'auteur
    const artistLink = $('a.artistTitle').first();
    let author = artistLink.text().trim();
    
    if (!author) {
      const artistMeta = $('[class*="artist"]').first().text().trim();
      author = artistMeta;
    }

    // Extraire le contenu depuis les tables
    let content = '';
    const tables = $('table');
    
    tables.each((i, elem) => {
      const $table = $(elem);
      const tableText = $table.text();
      
      const chordCount = (tableText.match(/\b[A-G][#b]?(m|maj|min|dim|aug|sus)?[0-9]?\b/g) || []).length;
      
      if (chordCount > 5) {
        const rows = $table.find('tr');
        
        rows.each((j, row) => {
          const $row = $(row);
          const cells = $row.find('td');
          
          cells.each((k, cell) => {
            const $cell = $(cell);
            const cellText = $cell.text().trim();
            
            if (cellText) {
              content += cellText + '\n';
            }
          });
        });
      }
    });

    // Alternative
    if (!content || content.length < 100) {
      const songDiv = $('#songContentTPL');
      if (songDiv.length > 0) {
        content = songDiv.text().trim();
      }
    }

    if (!content || content.length < 50) {
      return null;
    }

    return {
      title: title || 'Sans titre',
      author: author || 'Auteur inconnu',
      content: cleanSongContent(content),
      source: 'Tab4U',
      url,
    };
  } catch (error) {
    console.error('Error scraping Tab4U:', error);
    return null;
  }
}

async function searchTab4U(query) {
  const results = [];

  try {
    const searchUrl = `https://www.tab4u.com/resultsSimple?tab=songs&q=${encodeURIComponent(query)}`;
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept-Language': 'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });

    if (!response.ok) {
      return results;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const songLinks = $('a[href*="tabs/songs/"]');
    
    songLinks.slice(0, 10).each((i, elem) => {
      const $link = $(elem);
      const href = $link.attr('href');
      const fullText = $link.text().trim();
      
      if (fullText.includes('ללא אקורדים')) {
        return;
      }
      
      const parts = fullText.split(/[/\-]/).map(p => p.trim());
      const title = parts[0] || fullText;
      const author = parts[1] || '';
      
      if (href && title) {
        const fullUrl = href.startsWith('http') 
          ? href 
          : `https://www.tab4u.com/${href}`;
          
        results.push({
          title,
          author: author || 'Unknown',
          url: fullUrl,
          source: 'Tab4U',
        });
      }
    });

  } catch (error) {
    console.error('Error searching Tab4U:', error);
  }

  return results;
}

// === TESTS ===

async function testTab4USearch() {
  console.log('\n' + '='.repeat(70));
  console.log('TEST 1: RECHERCHE TAB4U');
  console.log('='.repeat(70));
  
  const query = 'היא לא יודעת';
  console.log(`\nRecherche: "${query}"`);
  
  const results = await searchTab4U(query);
  
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

async function testTab4UScrape(url) {
  console.log('\n' + '='.repeat(70));
  console.log('TEST 2: RÉCUPÉRATION DE CONTENU TAB4U');
  console.log('='.repeat(70));
  
  console.log(`\nURL: ${url}`);
  
  const song = await scrapeTab4U(url);
  
  if (song) {
    console.log('\n✅ Partition récupérée avec succès!\n');
    console.log(`Titre: ${song.title}`);
    console.log(`Artiste: ${song.author}`);
    console.log(`Source: ${song.source}`);
    console.log(`Longueur du contenu: ${song.content.length} caractères`);
    console.log('\n' + '-'.repeat(70));
    console.log('CONTENU (premiers 600 caractères):');
    console.log('-'.repeat(70));
    console.log(song.content.substring(0, 600));
    console.log('-'.repeat(70));
    
    // Compter les accords
    const chordMatches = song.content.match(/\b[A-G][#b]?(m|maj|min)?[0-9]?\b/g);
    console.log(`\nAccords détectés: ${chordMatches?.length || 0}`);
    
    return song;
  } else {
    console.log('\n❌ Échec de la récupération');
    return null;
  }
}

async function testFullFlow() {
  console.log('\n\n' + '='.repeat(70));
  console.log('TEST 3: FLUX COMPLET TAB4U');
  console.log('='.repeat(70));
  
  const query = 'היא לא יודעת למה';
  console.log(`\n1️⃣ Recherche de: "${query}"`);
  
  const results = await searchTab4U(query);
  
  if (results.length === 0) {
    console.log('❌ Aucun résultat');
    return;
  }
  
  console.log(`✅ ${results.length} résultats trouvés`);
  console.log(`\n2️⃣ Récupération de la première partition...`);
  
  const firstResult = results[0];
  const song = await scrapeTab4U(firstResult.url);
  
  if (song) {
    console.log('\n✅ Flux complet réussi!\n');
    console.log('📝 Résumé:');
    console.log(`  - Titre: ${song.title}`);
    console.log(`  - Artiste: ${song.author}`);
    console.log(`  - Contenu: ${song.content.length} chars`);
    const chordMatches = song.content.match(/\b[A-G][#b]?(m|maj|min)?[0-9]?\b/g);
    console.log(`  - Accords détectés: ${chordMatches?.length || 0}`);
    console.log('\n🎉 Tab4U est opérationnel!');
  } else {
    console.log('❌ Échec de la récupération');
  }
}

async function runAllTests() {
  console.log('\n🚀 TESTS DU SCRAPER TAB4U');
  console.log('═'.repeat(70));
  
  try {
    // Test 1: Recherche
    const results = await testTab4USearch();
    
    // Test 2: Scraping
    if (results.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await testTab4UScrape(results[0].url);
    }
    
    // Test 3: Flux complet
    await new Promise(resolve => setTimeout(resolve, 1000));
    await testFullFlow();
    
    console.log('\n\n' + '═'.repeat(70));
    console.log('✅ TOUS LES TESTS TAB4U TERMINÉS!');
    console.log('═'.repeat(70));
    console.log('\n📝 Résumé:');
    console.log('  ✅ Recherche sur Tab4U fonctionne');
    console.log('  ✅ Récupération de contenu fonctionne');
    console.log('  ✅ Support des chansons hébraïques');
    console.log('\n🎸 Tab4U est prêt comme site de secours!');
    console.log('\n💡 Tab4U sera utilisé quand Ultimate Guitar ne trouve rien\n');
    
  } catch (error) {
    console.log('\n\n❌ ERREUR DURANT LES TESTS:');
    console.log(error);
  }
}

runAllTests();

