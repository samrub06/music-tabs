import * as cheerio from 'cheerio';
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

    // Extraire les données depuis data.store.page.data.tab_view
    const tabView = data.store?.page?.data?.tab_view;
    
    if (!tabView) {
      console.log('❌ No tab_view found in data structure');
      console.log('🔍 Available keys in data.store.page.data:', Object.keys(data.store?.page?.data || {}));
      return null;
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
    
    // Extraire le titre et l'auteur avec plusieurs fallbacks
    let title = 'Sans titre';
    let author = 'Auteur inconnu';
    
    // Essayer différentes sources pour le titre
    if (tabView.meta?.title) {
      title = tabView.meta.title;
    } else if (tab.song_name) {
      title = tab.song_name;
    } else if (tabView.song_name) {
      title = tabView.song_name;
    }
    
    // Essayer différentes sources pour l'auteur
    if (tabView.meta?.artist) {
      author = tabView.meta.artist;
    } else if (tab.artist_name) {
      author = tab.artist_name;
    } else if (tabView.artist_name) {
      author = tabView.artist_name;
    } else if (tab.band_name) {
      author = tab.band_name;
    } else if (tabView.band_name) {
      author = tabView.band_name;
    }

    console.log(`🎵 Extracted from Ultimate Guitar: "${title}" by "${author}"`);
    
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
      content: cleanSongContent(content),
      source: 'Ultimate Guitar',
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
    const response = await fetch('https://www.ultimate-guitar.com/user/mytabs', {
      headers: {
        'User-Agent': userAgent || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Cookie': cookies,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
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
    
    // Créer la nouvelle chanson avec le userId
    const newSongData = {
      title: scrapedSong.title,
      author: scrapedSong.author,
      content: scrapedSong.content,
      userId: userId,
      folderId: targetFolderId || undefined
    };
    
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

