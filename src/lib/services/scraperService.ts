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
    name: 'Ultimate Guitar',
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
}

/**
 * Nettoie et formate le contenu de la partition
 */
function cleanSongContent(content: string): string {
  // Nettoyer les balises [ch] et [/ch] d'Ultimate Guitar
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
 * Scraper spécialisé pour Ultimate Guitar
 * Ultimate Guitar utilise React avec des données JSON dans l'attribut data-content
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

    // Ultimate Guitar stocke les données dans l'attribut data-content
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
      source: 'Ultimate Guitar',
      url,
    };
  } catch (error) {
    console.error('Error scraping Ultimate Guitar:', error);
    return null;
  }
}

/**
 * Recherche sur Ultimate Guitar
 */
async function searchUltimateGuitar(query: string): Promise<SearchResult[]> {
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
    searchResults
      .filter((result: any) => {
        // Exclure les tabs Pro
        return result.tab_url && 
               !result.tab_url.includes('/pro/') && 
               (result.type === 'Chords' || result.type === 'Tab' || result.type);
      })
      .slice(0, 10) // Limiter à 10 résultats
      .forEach((result: any) => {
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

/**
 * Recherche une chanson sur différents sites
 */
export async function searchSong(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  // 1. Recherche sur Ultimate Guitar (priorité car meilleure qualité)
  try {
    const ugResults = await searchUltimateGuitar(query);
    results.push(...ugResults);
  } catch (error) {
    console.error('Error searching Ultimate Guitar:', error);
  }

  // 2. Essayez les autres sites (TODO: ajouter d'autres scrapers)
  // ... autres sites à implémenter

  return results;
}

/**
 * Récupère le contenu d'une partition depuis une URL
 */
export async function scrapeSongFromUrl(url: string): Promise<ScrapedSong | null> {
  try {
    // Détecter le site et utiliser le scraper approprié
    const hostname = new URL(url).hostname;

    // Ultimate Guitar
    if (hostname.includes('ultimate-guitar.com') || hostname.includes('tabs.ultimate-guitar.com')) {
      return await scrapeUltimateGuitar(url);
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

