import * as cheerio from 'cheerio';

/**
 * Configuration pour différents sites de partitions
 * Vous pouvez ajouter vos propres sites ici
 */
interface ScraperConfig {
  name: string;
  searchUrl: (query: string) => string;
  selectors: {
    searchResults?: string;
    songTitle?: string;
    songAuthor?: string;
    songContent?: string;
    songLink?: string;
  };
}

// Exemple de configuration pour différents sites
// À adapter selon les sites que vous souhaitez scraper
const scraperConfigs: ScraperConfig[] = [
  {
    name: 'Guitar Tabs',
    searchUrl: (query) => `https://www.ultimate-guitar.com/search.php?search_type=title&value=${encodeURIComponent(query)}`,
    selectors: {
      searchResults: '.js-search-result',
      songTitle: 'h3.title',
      songAuthor: '.artist',
      songLink: 'a[href*="/tab/"]',
    }
  },
  {
    name: 'Tabs4Acoustic',
    searchUrl: (query) => `https://www.tabs4acoustic.com/en/guitar-tabs/${encodeURIComponent(query)}`,
    selectors: {
      songTitle: '.song-title',
      songAuthor: '.artist-name',
      songContent: 'pre.tab-content, .chord-sheet',
    }
  },
  // Ajoutez vos propres configurations de sites ici
];

export interface ScrapedSong {
  title: string;
  author: string;
  content: string;
  source: string;
  url?: string;
}

export interface SearchResult {
  title: string;
  author: string;
  url: string;
  source: string;
  reviews?: number; // Nombre de reviews/évaluations
}

/**
 * Nettoie et formate le contenu de la partition
 */
function cleanSongContent(content: string): string {
  // Nettoyer les balises [ch] et [/ch] des tabs
  let cleaned = content.replace(/\[ch\]/g, '').replace(/\[\/ch\]/g, '');
  cleaned = cleaned.replace(/\[tab\]/g, '').replace(/\[\/tab\]/g, '');
  
  return cleaned
    .trim()
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+|\s+$/g, '');
}

/**
 * Décode les entités HTML
 */
function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

/**
 * Scraper spécialisé pour les tabs de guitare
 * Utilise des données JSON dans l'attribut data-content
 */
async function scrapeUltimateGuitar(url: string): Promise<ScrapedSong | null> {
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

    // Les données sont stockées dans l'attribut data-content
    const dataContent = $('.js-store').attr('data-content');
    
    if (!dataContent) {
      return null;
    }

    // Décoder les entités HTML et parser le JSON
    const decodedData = decodeHTMLEntities(dataContent);
    const data = JSON.parse(decodedData);

    // Extraire les données de la tab
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
      source: 'Guitar Tabs',
      url,
    };
  } catch (error) {
    console.error('Error scraping guitar tabs:', error);
    return null;
  }
}

/**
 * Recherche sur les tabs de guitare
 */
export async function searchUltimateGuitarOnly(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

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

    // Extraire les données JSON
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

    // Filtrer uniquement les tabs gratuites (pas les tabs Pro)
    const filteredResults = searchResults
      .filter((result: any) => {
        // Exclure les tabs Pro
        return result.tab_url && 
               !result.tab_url.includes('/pro/') && 
               (result.type === 'Chords' || result.type === 'Tab' || result.type);
      })
      .map((result: any) => ({
        title: result.song_name || 'Sans titre',
        author: result.artist_name || 'Inconnu',
        url: result.tab_url,
        source: 'Guitar Tabs',
        reviews: result.votes || 0, // Nombre de votes/avis
      }))
      .sort((a, b) => b.reviews - a.reviews) // Trier par nombre de reviews (décroissant)
      .slice(0, 10); // Limiter à 10 résultats

    results.push(...filteredResults);

  } catch (error) {
    console.error('Error searching guitar tabs:', error);
  }

  return results;
}

/**
 * Scraper spécialisé pour Tab4U (site israélien)
 * Tab4U structure le contenu dans des tables avec des spans pour les accords
 */
async function scrapeTab4U(url: string): Promise<ScrapedSong | null> {
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
    // Nettoyer le titre (ex: "אקורדים לשיר XXX של YYY" -> "XXX")
    title = title.replace(/^אקורדים לשיר\s+/, '').replace(/\s+של\s+.*$/, '');

    // Extraire l'auteur (artiste)
    const artistLink = $('a.artistTitle').first();
    let author = artistLink.text().trim();
    
    // Alternative: chercher dans les métadonnées
    if (!author) {
      const artistMeta = $('[class*="artist"]').first().text().trim();
      author = artistMeta;
    }

    // Extraire le contenu depuis les tables
    let content = '';
    const tables = $('table');
    
    tables.each((i: number, elem: any) => {
      const $table = $(elem);
      const tableText = $table.text();
      
      // Vérifier si cette table contient des accords
      const chordCount = (tableText.match(/\b[A-G][#b]?(m|maj|min|dim|aug|sus)?[0-9]?\b/g) || []).length;
      
      if (chordCount > 5) {
        // Extraire le contenu ligne par ligne
        const rows = $table.find('tr');
        
        rows.each((j: number, row: any) => {
          const $row = $(row);
          const cells = $row.find('td');
          
          cells.each((k: number, cell: any) => {
            const $cell = $(cell);
            const cellText = $cell.text().trim();
            
            if (cellText) {
              content += cellText + '\n';
            }
          });
        });
      }
    });

    // Alternative: chercher dans div#songContentTPL
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

/**
 * Recherche sur Tab4U (site israélien)
 */
export async function searchTab4UOnly(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

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

    // Tab4U structure: <a href="tabs/songs/...">Title / Artist</a>
    const songLinks = $('a[href*="tabs/songs/"]');
    
    songLinks.slice(0, 10).each((i: number, elem: any) => {
      const $link = $(elem);
      const href = $link.attr('href');
      const fullText = $link.text().trim();
      
      // Ignorer les liens avec "ללא אקורדים" (sans accords)
      if (fullText.includes('ללא אקורדים')) {
        return;
      }
      
      // Format du texte: "Titre / Artiste" ou "Titre - Artiste"
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
          reviews: 0, // Tab4U ne fournit pas de données de reviews
        });
      }
    });

  } catch (error) {
    console.error('Error searching Tab4U:', error);
  }

  return results;
}

/**
 * Recherche une chanson sur différents sites
 */
export async function searchSong(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  // 1. Recherche sur les tabs de guitare (priorité car meilleure qualité)
  try {
    const ugResults = await searchUltimateGuitarOnly(query);
    results.push(...ugResults);
  } catch (error) {
    console.error('Error searching guitar tabs:', error);
  }

  // 2. Si pas assez de résultats, chercher sur Tab4U
  if (results.length < 5) {
    try {
      const tab4uResults = await searchTab4UOnly(query);
      results.push(...tab4uResults);
    } catch (error) {
      console.error('Error searching Tab4U:', error);
    }
  }

  return results;
}

/**
 * Récupère le contenu d'une partition depuis une URL
 */
export async function scrapeSongFromUrl(url: string): Promise<ScrapedSong | null> {
  try {
    // Détecter le site et utiliser le scraper approprié
    const hostname = new URL(url).hostname;

    // Guitar tabs
    if (hostname.includes('ultimate-guitar.com') || hostname.includes('tabs.ultimate-guitar.com')) {
      return await scrapeUltimateGuitar(url);
    }

    // Tab4U
    if (hostname.includes('tab4u.com')) {
      return await scrapeTab4U(url);
    }

    // Pour les autres sites, utiliser le scraper générique
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Essayez différents sélecteurs communs
    let title = '';
    let author = '';
    let content = '';

    // Sélecteurs génériques pour le titre
    const titleSelectors = [
      'h1',
      '.song-title',
      '.title',
      '[class*="song-name"]',
      '[class*="track-name"]',
    ];

    for (const selector of titleSelectors) {
      const text = $(selector).first().text().trim();
      if (text && text.length > 0) {
        title = text;
        break;
      }
    }

    // Sélecteurs génériques pour l'auteur
    const authorSelectors = [
      '.artist',
      '.author',
      '.artist-name',
      '[class*="artist"]',
      'h2',
    ];

    for (const selector of authorSelectors) {
      const text = $(selector).first().text().trim();
      if (text && text.length > 0 && text !== title) {
        author = text;
        break;
      }
    }

    // Sélecteurs génériques pour le contenu
    const contentSelectors = [
      'pre',
      '.tab-content',
      '.chord-sheet',
      '[class*="tab"]',
      '[class*="chord"]',
      '.song-content',
      'code',
    ];

    for (const selector of contentSelectors) {
      const text = $(selector).first().text();
      if (text && text.length > 100) {
        content = cleanSongContent(text);
        break;
      }
    }

    // Si on n'a pas trouvé de contenu structuré, essayez de récupérer tout le texte
    if (!content) {
      const bodyText = $('body').text();
      // Chercher des patterns d'accords (C, G, Am, etc.)
      const chordPattern = /\b[A-G][#b]?(m|maj|min|dim|aug|sus|add)?[0-9]?\b/g;
      const matches = bodyText.match(chordPattern);
      
      if (matches && matches.length > 5) {
        // Il semble y avoir des accords, essayons de récupérer le contexte
        content = cleanSongContent(bodyText.substring(0, 3000));
      }
    }

    if (!content) {
      throw new Error('Impossible de trouver le contenu de la partition');
    }

    return {
      title: title || 'Sans titre',
      author: author || 'Auteur inconnu',
      content,
      source: hostname,
      url,
    };
  } catch (error) {
    console.error('Error scraping song:', error);
    return null;
  }
}

/**
 * Recherche et récupère directement une chanson (meilleur résultat)
 */
export async function searchAndScrapeSong(query: string): Promise<ScrapedSong | null> {
  try {
    // Rechercher la chanson
    const searchResults = await searchSong(query);

    if (searchResults.length === 0) {
      return null;
    }

    // Prendre le premier résultat et récupérer son contenu
    const firstResult = searchResults[0];
    const song = await scrapeSongFromUrl(firstResult.url);

    return song;
  } catch (error) {
    console.error('Error in searchAndScrapeSong:', error);
    return null;
  }
}

/**
 * Scraper personnalisé pour un site spécifique
 * Vous pouvez créer des fonctions spécifiques pour vos sites autorisés
 */
export async function scrapeFromCustomSite(url: string): Promise<ScrapedSong | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // PERSONNALISEZ ICI selon votre site
    // Exemple :
    const title = $('h1.song-title').text().trim();
    const author = $('.artist-name').text().trim();
    const content = $('pre.song-content').text().trim();

    return {
      title: title || 'Sans titre',
      author: author || 'Auteur inconnu',
      content: cleanSongContent(content),
      source: new URL(url).hostname,
      url,
    };
  } catch (error) {
    console.error('Error scraping custom site:', error);
    return null;
  }
}

