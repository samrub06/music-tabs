import * as cheerio from 'cheerio';
import { fetchUltimateGuitarHtml } from './ugFetch';
import { songService } from './songService';

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
  reviews?: number;
  capo?: number;
  key?: string;
  version?: number;
  versionDescription?: string;
  rating?: number;
  difficulty?: string;
  artistUrl?: string;
  artistImageUrl?: string;
  songImageUrl?: string;
  tabId?: number;
  songGenre?: string;
  bpm?: number;
}

export interface SearchResult {
  title: string;
  author: string;
  url: string;
  source: string;
  reviews?: number; // Nombre de reviews/évaluations
  version?: number;
  rating?: number;
  difficulty?: string;
  artistUrl?: string;
  artistImageUrl?: string;
  songImageUrl?: string;
  versionDescription?: string;
}

const UG_HOMEPAGE = 'https://www.ultimate-guitar.com/';

const UG_USE_MOBILE_UA =
  process.env.UG_USE_MOBILE_UA === '1' || process.env.UG_USE_MOBILE_UA === 'true';

/**
 * Headers type navigateur pour réduire la détection bot sur Ultimate Guitar.
 * Utilisé par scraperService et trendingService.
 * Si UG_USE_MOBILE_UA=1 : Safari iPhone (certains sites sont moins stricts avec le trafic mobile).
 */
export function getUltimateGuitarFetchHeaders(options?: { referer?: string }): Record<string, string> {
  const referer = options?.referer ?? UG_HOMEPAGE;
  if (UG_USE_MOBILE_UA) {
    return {
      'User-Agent':
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      Referer: referer,
      'sec-ch-ua': '"Apple";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
      'sec-ch-ua-mobile': '?1',
      'sec-ch-ua-platform': '"iOS"',
      'sec-fetch-site': referer === UG_HOMEPAGE ? 'none' : 'same-origin',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-dest': 'document',
      'sec-fetch-user': '?1',
      'Upgrade-Insecure-Requests': '1',
    };
  }
  return {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    Referer: referer,
    'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"',
    'sec-fetch-site': referer === UG_HOMEPAGE ? 'none' : 'same-origin',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-dest': 'document',
    'sec-fetch-user': '?1',
    'Upgrade-Insecure-Requests': '1',
  };
}

/**
 * Délai aléatoire avant une requête UG pour éviter les rafales (anti-bot).
 * Exporté pour utilisation dans trendingService.
 */
export function delayBeforeUgRequest(): Promise<void> {
  const minMs = process.env.VERCEL === '1' ? 100 : 300;
  const maxMs = process.env.VERCEL === '1' ? 300 : 800;
  return new Promise((r) => setTimeout(r, minMs + Math.random() * (maxMs - minMs)));
}

/** Cache de cookies UG (session) pour réduire la détection bot. */
let ugSessionCookies: string | null = null;
let ugSessionCookiesTime = 0;
const UG_SESSION_TTL_MS = 20 * 60 * 1000; // 20 min

/**
 * Récupère ou rafraîchit les cookies de session UG (GET homepage puis réutilisation).
 * À appeler avant search/scrape pour simuler une visite préalable.
 */
export async function getOrRefreshUgCookies(): Promise<string> {
  if (ugSessionCookies && Date.now() - ugSessionCookiesTime < UG_SESSION_TTL_MS) {
    return ugSessionCookies;
  }
  await delayBeforeUgRequest();
  const res = await fetchUltimateGuitarHtml(UG_HOMEPAGE, {
    headers: getUltimateGuitarFetchHeaders(),
  });
  if (!res.ok) {
    ugSessionCookies = '';
    ugSessionCookiesTime = Date.now();
    return ugSessionCookies;
  }
  const cookieString = res.setCookies
    .map((s) => s.split(';')[0].trim())
    .filter(Boolean)
    .join('; ');
  ugSessionCookies = cookieString;
  ugSessionCookiesTime = Date.now();
  return ugSessionCookies;
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

// Fonction pour détecter la tonalité (key) dans le contenu
function detectKey(content: string): string | undefined {
  if (!content) return undefined;
  
  // Patterns de détection de la tonalité
  const keyPatterns = [
    /key\s*:?\s*([A-G](?:#|b)?m?)/i,
  ];
  
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    for (const pattern of keyPatterns) {
      const match = trimmedLine.match(pattern);
      if (match) {
        const key = match[1].trim();
        // S'assurer que la première lettre est en majuscule
        const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
        console.log(`🎵 Key détectée: ${capitalizedKey} (ligne: "${trimmedLine}")`);
        return capitalizedKey;
      }
    }
  }
  
  return undefined;
}

// Fonction pour détecter le capo dans le contenu
function detectCapo(content: string): number | undefined {
  if (!content) return undefined;
  
  // Fonction pour convertir les chiffres romains en chiffres arabes
  const romanToArabic = (roman: string): number => {
    const romanNumerals: { [key: string]: number } = {
      'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5,
      'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10,
      'XI': 11, 'XII': 12
    };
    return romanNumerals[roman.toUpperCase()] || 0;
  };
  
  // Patterns de détection du capo (plusieurs variantes)
  const capoPatterns = [
    // Chiffres arabes
    /capo\s*:?\s*(\d+)/i,
    /capo\s+(\d+)/i,
    /🎸?\s*capo\s+(\d+)/i,
    /capo\s+on\s+fret\s+(\d+)/i,
    /fret\s+(\d+)/i,
    /capo\s+(\d+)\s+fret/i,
    /(\d+)\s+capo/i,
    /capo\s*(\d+)/i,
    /capo\s*=\s*(\d+)/i,
    /capo\s*:?\s*(\d+)\s*fret/i,
    /fret\s*(\d+)/i,
    /capo\s+(\d+)\s*st/i,
    /(\d+)\s*st\s+capo/i,
    // Patterns avec "th" (1st, 2nd, 3rd, 4th, etc.)
    /capo\s*:?\s*(\d+)(?:st|nd|rd|th)\s+fret/i,
    /capo\s+(\d+)(?:st|nd|rd|th)\s+fret/i,
    /(\d+)(?:st|nd|rd|th)\s+fret/i,
    // Chiffres romains
    /capo\s*:?\s*(I{1,3}|IV|V|VI{0,3}|IX|X|XI|XII)\b/i,
    /capo\s+(I{1,3}|IV|V|VI{0,3}|IX|X|XI|XII)\b/i,
    /🎸?\s*capo\s+(I{1,3}|IV|V|VI{0,3}|IX|X|XI|XII)\b/i,
    /capo\s+on\s+fret\s+(I{1,3}|IV|V|VI{0,3}|IX|X|XI|XII)\b/i,
    /fret\s+(I{1,3}|IV|V|VI{0,3}|IX|X|XI|XII)\b/i,
    /capo\s+(I{1,3}|IV|V|VI{0,3}|IX|X|XI|XII)\s+fret/i,
    /(I{1,3}|IV|V|VI{0,3}|IX|X|XI|XII)\s+capo/i,
    /capo\s*(I{1,3}|IV|V|VI{0,3}|IX|X|XI|XII)\b/i,
    /capo\s*=\s*(I{1,3}|IV|V|VI{0,3}|IX|X|XI|XII)\b/i,
    /capo\s*:?\s*(I{1,3}|IV|V|VI{0,3}|IX|X|XI|XII)\s*fret/i,
    /fret\s*(I{1,3}|IV|V|VI{0,3}|IX|X|XI|XII)\b/i,
    /capo\s+(I{1,3}|IV|V|VI{0,3}|IX|X|XI|XII)\s*st/i,
    /(I{1,3}|IV|V|VI{0,3}|IX|X|XI|XII)\s*st\s+capo/i,
  ];
  
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Vérifier chaque pattern
    for (const pattern of capoPatterns) {
      const match = trimmedLine.match(pattern);
      if (match) {
        let capoValue: number;
        
        // Vérifier si c'est un chiffre romain ou arabe
        if (isNaN(parseInt(match[1], 10))) {
          // C'est un chiffre romain
          capoValue = romanToArabic(match[1]);
        } else {
          // C'est un chiffre arabe
          capoValue = parseInt(match[1], 10);
        }
        
        if (capoValue >= 0 && capoValue <= 12) { // Capo valide entre 0 et 12
          console.log(`🎸 Capo détecté: ${capoValue} (${match[1]}) (ligne: "${trimmedLine}")`);
          return capoValue;
        }
      }
    }
  }
  
  return undefined;
}

/**
 * Scraper spécialisé pour les tabs de guitare
 * Utilise des données JSON dans l'attribut data-content
 */
async function scrapeUltimateGuitar(url: string, searchResult?: SearchResult): Promise<ScrapedSong | null> {
  try {
    await delayBeforeUgRequest();
    const cookies = await getOrRefreshUgCookies();
    console.log('🎸 scrapeUltimateGuitar called with:', { url, searchResult });
    const response = await fetchUltimateGuitarHtml(url, {
      headers: getUltimateGuitarFetchHeaders({ referer: UG_HOMEPAGE }),
      cookie: cookies || undefined,
    });

    if (!response.ok) {
      return null;
    }

    const html = response.body;
    const $ = cheerio.load(html);

    // Les données sont stockées dans l'attribut data-content
    const dataContent = $('.js-store').attr('data-content');
    
    if (!dataContent) {
      return null;
    }

    // Décoder les entités HTML et parser le JSON
    const decodedData = decodeHTMLEntities(dataContent);
    const data = JSON.parse(decodedData);

    // Extraire les données depuis data.store.page.data.tab_view
    const tabView = data.store?.page?.data?.tab_view;
    
    if (!tabView) {
      console.log('❌ No tab_view found in data structure');
      console.log('🔍 Available keys in data.store.page.data:', Object.keys(data.store?.page?.data || {}));
      return null;
    }

    // Extraire les données de strumming
    let strummingInfo = '';
    let bpm: number | undefined;

    if (tabView.strummings && Array.isArray(tabView.strummings) && tabView.strummings.length > 0) {
      // Extraire BPM du premier pattern (généralement tous les patterns ont le même BPM)
      if (tabView.strummings[0]?.bpm) {
        bpm = tabView.strummings[0].bpm;
      }
      
      // Construire une description textuelle pour tous les patterns de strumming
      const allPatterns: string[] = [];
      
      tabView.strummings.forEach((strummingData: any, index: number) => {
        if (!strummingData) return;
        
        const patternParts: string[] = [];
        
        // Ajouter le nom de la partie si disponible
        if (strummingData.part !== undefined && strummingData.part !== '') {
          patternParts.push(`${strummingData.part}:`);
        } else {
          patternParts.push(`Pattern ${index + 1}:`);
        }
        
        // Ajouter les détails du pattern
        if (strummingData.bpm) {
          patternParts.push(`  BPM: ${strummingData.bpm}`);
        }
        if (strummingData.denuminator) {
          patternParts.push(`  Denominator: ${strummingData.denuminator}`);
        }
        if (strummingData.is_triplet !== undefined) {
          patternParts.push(`  Triplet: ${strummingData.is_triplet === 1 || strummingData.is_triplet === true ? 'Yes' : 'No'}`);
        }
        
        // Extraire les mesures si elles existent
        if (strummingData.measures && Array.isArray(strummingData.measures) && strummingData.measures.length > 0) {
          const measureValues = strummingData.measures.map((m: any) => {
            // Handle both {measure: X} and direct number formats
            return typeof m === 'object' && m.measure !== undefined ? m.measure : m;
          });
          patternParts.push(`  Measures: [${measureValues.join(', ')}]`);
        }
        
        if (patternParts.length > 0) {
          allPatterns.push(patternParts.join('\n'));
        }
      });
      
      if (allPatterns.length > 0) {
        strummingInfo = 'Strumming Patterns:\n' + allPatterns.join('\n\n');
      }
    }
    
    // Debug: afficher toutes les clés disponibles dans tabView
    console.log('🔍 TabView structure:', {
      hasWikiTab: !!tabView.wiki_tab,
      hasMeta: !!tabView.meta,
      allKeys: Object.keys(tabView).slice(0, 10) // Premiers 10 keys seulement
    });
    
    const tab = tabView.wiki_tab;
    
    if (!tab?.content) {
      console.log('❌ No wiki_tab content found');
      return null;
    }

    const content = tab.content;
    
    // Essayer d'extraire les métadonnées de la page pour trouver le capo
    let metadataContent = '';
    
    // Chercher dans les métadonnées de la page
    if (tabView.meta) {
      const metaKeys = Object.keys(tabView.meta);
      console.log('🔍 Métadonnées disponibles:', metaKeys);
          // tabView.meta.genre= pop
          // tabView.meta.difficulty= 2020
          
      // Construire une chaîne de métadonnées pour la recherche de capo
      metadataContent = Object.entries(tabView.meta)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
    }
    
    // Chercher aussi dans les informations de tuning et autres métadonnées
    if (tabView.meta.tuning) {
      metadataContent += `\nTuning: ${tab.tuning}`;
    }
    /* if (tabView.meta.tonality) {
      const capitalizedKey = tab.key.charAt(0).toUpperCase() + tab.key.slice(1);
      metadataContent += `\nKey: ${capitalizedKey}`;
    } */
    if (tabView.meta.difficulty) {
      metadataContent += `\nDifficulty: ${tab.difficulty}`;
    }
    if (tabView.meta.song_genre) {
      metadataContent += `\nGenre: ${tabView.meta.song_genre}`;
    }
 
 
    // Combiner le contenu principal avec les métadonnées
    const fullContent = metadataContent + '\n\n' + content;
    
    // Debug: afficher le début du contenu pour voir ce qui est extrait
    console.log('🔍 Contenu extrait (premiers 500 caractères):', fullContent.substring(0, 500));
    console.log('🔍 Contenu extrait (derniers 500 caractères):', fullContent.substring(Math.max(0, fullContent.length - 500)));
    
    // Extraire le titre et l'auteur avec plusieurs fallbacks
    let title = searchResult?.title || 'Sans titre';
    let author = searchResult?.author || 'Auteur inconnu';
    
    // Extraire les données supplémentaires - PRIORITÉ AUX DONNÉES DE RECHERCHE
    const version = searchResult?.version || tab?.version || tabView.version;
    const versionDescription = searchResult?.versionDescription || tab?.version_description || tabView.version_description;
    const rating = searchResult?.rating || tab?.rating || tabView.rating;
    const difficulty = searchResult?.difficulty || tab?.difficulty || tabView.ug_difficulty;
    const artistUrl = searchResult?.artistUrl || tab?.artist_url || tabView.artist_url;
    const artistImageUrl = searchResult?.artistImageUrl || tab?.artist_cover?.web_artist_cover?.small || tabView.artist_cover?.web_artist_cover?.small;
    const songImageUrl = searchResult?.songImageUrl || tab?.album_cover?.web_album_cover?.small || tabView.album_cover?.web_album_cover?.small;
    const tabId = data.store?.page?.data?.tab?.id;
    const songGenre = tabView.meta?.song_genre || tabView.meta?.genre || undefined;
    
    // Combiner la description de version avec les infos de strumming si elles existent
    let finalVersionDescription = versionDescription || '';
    if (strummingInfo) {
      if (finalVersionDescription) {
        finalVersionDescription += '\n\n' + strummingInfo;
      } else {
        finalVersionDescription = strummingInfo;
      }
    }
    
    // Ajouter la description de version au début du contenu si elle existe
    let finalContent = content;
    if (finalVersionDescription) {
      finalContent = `[Version Description]\n${finalVersionDescription}\n\n${content}`;
    }

    // Détecter la tonalité et le capo dans le contenu complet (métadonnées + contenu)
    const key = detectKey(fullContent);
    const capo = detectCapo(fullContent);
    
    console.log(`🎵 Extracted from Ultimate Guitar: "${title}" by "${author}"${key ? ` (Key: ${key})` : ''}${capo ? ` (Capo: ${capo})` : ''}${version ? ` (Version: ${version})` : ''}${rating ? ` (Rating: ${rating})` : ''}${difficulty ? ` (Difficulty: ${difficulty})` : ''}`);
    console.log('🔍 Final extracted data:', { rating, difficulty, version, artistUrl, artistImageUrl, songImageUrl, songGenre });
    
    // Debug: montrer ce qu'on a trouvé
    if (title === 'Sans titre' || author === 'Auteur inconnu') {
      console.log('⚠️ Missing data. Available in meta:', {
        meta: tabView.meta ? Object.keys(tabView.meta) : 'none',
        wikiTab: tab ? Object.keys(tab).filter(k => k !== 'content').slice(0, 5) : 'none'
      });
    }

    return {
      title,
      author,
      content: cleanSongContent(finalContent),
      source: 'Ultimate Guitar',
      url,
      reviews: searchResult?.reviews || 0,
      capo,
      key,
      version,
      versionDescription: finalVersionDescription,
      rating,
      difficulty,
      artistUrl,
      artistImageUrl,
      songImageUrl,
      tabId,
      songGenre,
      bpm
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
    await delayBeforeUgRequest();
    const cookies = await getOrRefreshUgCookies();
    const searchUrl = `https://www.ultimate-guitar.com/search.php?search_type=title&value=${encodeURIComponent(query)}`;
    const response = await fetchUltimateGuitarHtml(searchUrl, {
      headers: getUltimateGuitarFetchHeaders({ referer: UG_HOMEPAGE }),
      cookie: cookies || undefined,
    });

    if (!response.ok) {
      console.error('Ultimate Guitar search failed:', response.statusCode, query, {
        blocked: response.blocked,
        via: response.via,
      });
      return results;
    }

    const html = response.body;
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
    console.log('🔍 Search results of the first 5 results:', JSON.stringify(searchResults.slice(0, 5), null, 2));

    // Filtrer uniquement les tabs gratuites (pas les tabs Pro)
    const filteredResults = searchResults
      .filter((result: any) => {
        // Exclure les tabs Pro
        return result.tab_url && 
               !result.tab_url.includes('/pro/') && 
               (result.type === 'Chords' || result.type === 'Tab' || result.type);
      })
      .map((result: any) => {
        // Construire le titre avec la version si disponible
        let title = result.song_name || 'Sans titre';
        if (result.version && result.version > 1) {
          title += ` (version ${result.version})`;
        }
        
        return {
          title,
          author: result.artist_name || 'Inconnu',
          url: result.tab_url,
          source: 'Guitar Tabs',
          reviews: result.votes || 0, // Nombre de votes/avis
          version: result.version,
          rating: result.rating,
          difficulty: result.difficulty,
          artistUrl: result.artist_url,
          artistImageUrl: result.artist_cover?.web_artist_cover?.small,
          songImageUrl: result.album_cover?.web_album_cover?.small,
        };
      })
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
async function scrapeTab4U(url: string, searchResult?: SearchResult): Promise<ScrapedSong | null> {
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

    // Extraire le titre depuis h1 (utiliser searchResult comme fallback)
    let title = searchResult?.title || $('h1').first().text().trim();
    // Nettoyer le titre (ex: "אקורדים לשיר XXX של YYY" -> "XXX")
    if (!searchResult?.title) {
      title = title.replace(/^אקורדים לשיר\s+/, '').replace(/\s+של\s+.*$/, '');
    }

    // Extraire l'auteur (artiste) (utiliser searchResult comme fallback)
    let author = searchResult?.author || '';
    if (!author) {
      const artistLink = $('a.artistTitle').first();
      author = artistLink.text().trim();
      
      // Alternative: chercher dans les métadonnées
      if (!author) {
        const artistMeta = $('[class*="artist"]').first().text().trim();
        author = artistMeta;
      }
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

    // Détecter la tonalité et le capo dans le contenu
    const key = detectKey(content);
    const capo = detectCapo(content);
    
    console.log(`🎵 Extracted from Tab4U: "${title || 'Sans titre'}" by "${author || 'Auteur inconnu'}"${key ? ` (Key: ${key})` : ''}${capo ? ` (Capo: ${capo})` : ''}`);

    return {
      title: title || 'Sans titre',
      author: author || 'Auteur inconnu',
      content: cleanSongContent(content),
      source: 'Tab4U',
      url,
      reviews: searchResult?.reviews || 0,
      capo,
      key
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
export async function scrapeSongFromUrl(url: string, searchResult?: SearchResult): Promise<ScrapedSong | null> {
  try {
    console.log('🔍 scrapeSongFromUrl called with:', { url, searchResult });
    
    // Détecter le site et utiliser le scraper approprié
    const hostname = new URL(url).hostname;

    // Guitar tabs
    if (hostname.includes('ultimate-guitar.com') || hostname.includes('tabs.ultimate-guitar.com')) {
      return await scrapeUltimateGuitar(url, searchResult);
    }

    // Tab4U
    if (hostname.includes('tab4u.com')) {
      return await scrapeTab4U(url, searchResult);
    }

    // Pour les autres sites, utiliser le scraper générique
    const response = await fetch(url, {
      headers: getUltimateGuitarFetchHeaders({ referer: UG_HOMEPAGE }),
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
    const song = await scrapeSongFromUrl(firstResult.url, firstResult);

    return song;
  } catch (error) {
    console.error('Error in searchAndScrapeSong:', error);
    return null;
  }
}

/**
 * Interface pour les playlists Ultimate Guitar
 */
export interface PlaylistSong {
  title: string;
  artist: string;
  url?: string;
  playlistName?: string;
}

export interface PlaylistData {
  name: string;
  songs: PlaylistSong[];
}

/**
 * Scraper pour les playlists Ultimate Guitar (page mytabs)
 * Nécessite des cookies d'authentification
 */
export async function scrapeUltimateGuitarPlaylists(
  cookies: string,
  userAgent?: string
): Promise<PlaylistData[]> {
  try {
    await delayBeforeUgRequest();
    const ugHeaders = getUltimateGuitarFetchHeaders({
      referer: 'https://www.ultimate-guitar.com/user/mytabs',
    });
    const response = await fetchUltimateGuitarHtml('https://www.ultimate-guitar.com/user/mytabs', {
      headers: ugHeaders,
      cookie: cookies,
      userAgent: userAgent ?? ugHeaders['User-Agent'],
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.statusCode}`);
    }

    const html = response.body;
    const $ = cheerio.load(html);

    // Vérifier si l'utilisateur est connecté
    if (html.includes('Please log in') || html.includes('login')) {
      throw new Error('User not authenticated. Please provide valid cookies.');
    }

    const playlists: PlaylistData[] = [];
    
    // Chercher les différentes sections de playlists
    // Structure possible: playlists, bookmarks, favorites, etc.
    const playlistSections = [
      { selector: '.js-store', name: 'My Tabs' },
      { selector: '[data-content*="bookmarks"]', name: 'Bookmarks' },
      { selector: '[data-content*="favorites"]', name: 'Favorites' },
    ];

    for (const section of playlistSections) {
      const sectionElement = $(section.selector);
      
      if (sectionElement.length > 0) {
        // Extraire les données JSON comme pour la recherche normale
        const dataContent = sectionElement.attr('data-content');
        
        if (dataContent) {
          try {
            const decodedData = decodeHTMLEntities(dataContent);
            const data = JSON.parse(decodedData);
            
            // Analyser la structure des données pour extraire les playlists
            const playlistsData = extractPlaylistsFromData(data);
            
            if (playlistsData.length > 0) {
              playlists.push(...playlistsData.map(p => ({
                ...p,
                name: p.name || section.name
              })));
            }
          } catch (parseError) {
            console.warn(`Error parsing data for section ${section.name}:`, parseError);
          }
        }
      }
    }

    // Alternative: scraper basé sur le HTML si les données JSON ne sont pas disponibles
    if (playlists.length === 0) {
      const htmlPlaylists = scrapePlaylistsFromHTML($);
      playlists.push(...htmlPlaylists);
    }

    return playlists;

  } catch (error) {
    console.error('Error scraping Ultimate Guitar playlists:', error);
    throw error;
  }
}

/**
 * Extrait les playlists depuis les données JSON
 */
function extractPlaylistsFromData(data: any): PlaylistData[] {
  const playlists: PlaylistData[] = [];
  
  // Structure réelle découverte : data.store.page.data.list.list
  if (data.store?.page?.data?.list?.list && Array.isArray(data.store.page.data.list.list)) {
    const songs = data.store.page.data.list.list;
    
    console.log(`🎵 Found ${songs.length} favorite songs`);
    
    // Convertir les chansons favorites en playlist
    const playlistSongs = songs.map((song: any) => ({
      title: song.song_name || 'Unknown',
      artist: song.band_name || 'Unknown',
      url: song.song_url,
      playlistName: 'My Favorites'
    }));
    
    if (playlistSongs.length > 0) {
      playlists.push({
        name: 'My Favorites',
        songs: playlistSongs
      });
    }
  }
  
  // Structure alternative pour les playlists classiques (si elles existent)
  if (data.store?.page?.data?.playlists) {
    const playlistsData = data.store.page.data.playlists;
    
    if (Array.isArray(playlistsData)) {
      for (const playlist of playlistsData) {
        if (playlist.songs && Array.isArray(playlist.songs)) {
          playlists.push({
            name: playlist.name || 'Unnamed Playlist',
            songs: playlist.songs.map((song: any) => ({
              title: song.song_name || song.title || 'Unknown',
              artist: song.artist_name || song.artist || 'Unknown',
              url: song.tab_url || song.url,
            }))
          });
        }
      }
    }
  }
  
  return playlists;
}

/**
 * Scraper alternatif basé sur le HTML
 */
function scrapePlaylistsFromHTML($: cheerio.CheerioAPI): PlaylistData[] {
  const playlists: PlaylistData[] = [];
  
  // Chercher les liens vers les tabs dans la page
  const songLinks = $('a[href*="/tab/"], a[href*="/tabs/"]');
  
  if (songLinks.length > 0) {
    const songs: PlaylistSong[] = [];
    
    songLinks.each((i, elem) => {
      const $link = $(elem);
      const href = $link.attr('href');
      const text = $link.text().trim();
      
      if (href && text && !text.includes('Pro') && !text.includes('Official')) {
        // Extraire le titre et l'artiste du texte
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
        name: 'My Tabs',
        songs
      });
    }
  }
  
  return playlists;
}

/**
 * Importe automatiquement les meilleures versions des chansons d'une playlist
 */
export async function importPlaylistSongs(
  playlistData: PlaylistData,
  userId: string,
  targetFolderId?: string,
  maxConcurrent: number = 3,
  clientSupabase?: any
): Promise<{ success: number; failed: number; duplicates: number; errors: string[] }> {
  const results = { success: 0, failed: 0, duplicates: 0, errors: [] as string[] };
  
  // Traiter les chansons par batch pour éviter de surcharger le serveur
  for (let i = 0; i < playlistData.songs.length; i += maxConcurrent) {
    const batch = playlistData.songs.slice(i, i + maxConcurrent);
    
    const promises = batch.map(async (song) => {
      try {
        // Utiliser directement l'URL de la chanson favorite si disponible
        if (song.url) {
          console.log(`🎵 Scraping favorite song: ${song.title} by ${song.artist}`);
          console.log(`🔗 URL: ${song.url}`);
          
          // Scraper directement le contenu de la chanson favorite
          const scrapedSong = await scrapeSongFromUrl(song.url);
          
          if (!scrapedSong) {
            console.log(`❌ Failed to scrape favorite song: ${song.title}`);
            results.errors.push(`Failed to scrape favorite song: ${song.title}`);
            results.failed++;
            return;
          }
          
          // PRIORITÉ AUX DONNÉES DE LA PLAYLIST (on les a déjà !)
          const finalSong = {
            ...scrapedSong,
            title: song.title || scrapedSong.title || 'Sans titre',
            author: song.artist || scrapedSong.author || 'Auteur inconnu'
          };
          
          console.log(`✅ Successfully scraped: ${finalSong.title} by ${finalSong.author}`);
          
            // Importer dans la base de données Supabase
            const importStatus = await importSongToDatabase(finalSong, userId, targetFolderId, clientSupabase);
            
            if (importStatus === 'success') {
              results.success++;
            } else if (importStatus === 'duplicate') {
              results.duplicates++;
            } else {
              results.failed++;
              results.errors.push(`Database import failed for ${song.title}`);
            }
          
        } else {
          // Fallback: rechercher si pas d'URL disponible
          const searchQuery = `${song.artist} ${song.title}`;
          console.log(`🔍 No URL available, searching for: ${searchQuery}`);
          
          const searchResults = await searchUltimateGuitarOnly(searchQuery);
          
          if (searchResults.length === 0) {
            results.errors.push(`No results found for: ${searchQuery}`);
            results.failed++;
            return;
          }
          
          // Prendre la première version (déjà triée par reviews)
          const bestVersion = searchResults[0];
          
          // Scraper le contenu de cette version
          const scrapedSong = await scrapeSongFromUrl(bestVersion.url);
          
          if (!scrapedSong) {
            results.errors.push(`Failed to scrape content for: ${searchQuery}`);
            results.failed++;
            return;
          }
          
            // Importer dans la base de données Supabase
            const importStatus = await importSongToDatabase(scrapedSong, userId, targetFolderId, clientSupabase);
            
            if (importStatus === 'success') {
              results.success++;
            } else if (importStatus === 'duplicate') {
              results.duplicates++;
            } else {
              results.failed++;
              results.errors.push(`Database import failed for ${searchQuery}`);
            }
        }
        
      } catch (error) {
        results.errors.push(`Error processing ${song.title}: ${error}`);
        results.failed++;
      }
    });
    
    await Promise.all(promises);
    
    // Délai entre les batches pour être respectueux
    if (i + maxConcurrent < playlistData.songs.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}

/**
 * Importe une chanson scrappée dans la base de données Supabase
 */
async function importSongToDatabase(scrapedSong: ScrapedSong, userId: string, targetFolderId?: string, clientSupabase?: any): Promise<'success' | 'duplicate' | 'error'> {
  try {
    console.log(`📥 Importing to database: ${scrapedSong.title} by ${scrapedSong.author}`);
    
    // Vérifier si la chanson existe déjà pour cet utilisateur avec le bon client
    const existingSongs = await songService.searchSongs(`${scrapedSong.title} ${scrapedSong.author}`, clientSupabase);
    const duplicate = existingSongs.find(song => 
      song.title.toLowerCase() === scrapedSong.title.toLowerCase() &&
      song.author.toLowerCase() === scrapedSong.author.toLowerCase()
    );
    
    if (duplicate) {
      console.log(`⚠️ Song already exists: ${scrapedSong.title} by ${scrapedSong.author} (ID: ${duplicate.id})`);
      return 'duplicate'; // Skip duplicate
    }
    
    // Créer la nouvelle chanson avec le userId et toutes les données Ultimate Guitar
    const newSongData = {
      title: scrapedSong.title,
      author: scrapedSong.author,
      content: scrapedSong.content,
      userId: userId,
      folderId: targetFolderId || undefined,
      reviews: scrapedSong.reviews,
      capo: scrapedSong.capo,
      key: scrapedSong.key,
      // Nouveaux champs Ultimate Guitar
      version: scrapedSong.version,
      versionDescription: scrapedSong.versionDescription,
      rating: scrapedSong.rating,
      difficulty: scrapedSong.difficulty,
      artistUrl: scrapedSong.artistUrl,
      artistImageUrl: scrapedSong.artistImageUrl,
      songImageUrl: scrapedSong.songImageUrl,
      sourceUrl: scrapedSong.url,
      sourceSite: scrapedSong.source,
      tabId: scrapedSong.tabId ? scrapedSong.tabId.toString() : undefined,
      genre: scrapedSong.songGenre || undefined,
      bpm: scrapedSong.bpm
    };
    
    console.log(`💾 Saving song with genre: "${newSongData.genre}" and tabId: "${newSongData.tabId}"`);
    
    const createdSong = await songService.createSong(newSongData, clientSupabase);
    console.log(`✅ Successfully imported: ${createdSong.title} (ID: ${createdSong.id})`);
    return 'success';
    
  } catch (error) {
    console.error('Error importing song to database:', error);
    return 'error';
  }
}

/**
 * Scraper personnalisé pour un site spécifique
 * Vous pouvez créer des fonctions spécifiques pour vos sites autorisés
 */
export async function scrapeFromCustomSite(url: string): Promise<ScrapedSong | null> {
  try {
    const response = await fetch(url, {
      headers: getUltimateGuitarFetchHeaders(),
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

