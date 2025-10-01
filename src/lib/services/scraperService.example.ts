/**
 * FICHIER D'EXEMPLE - Configuration de scrapers personnalisés
 * 
 * Ce fichier montre comment configurer des scrapers pour vos sites autorisés.
 * Copiez et adaptez ces exemples dans scraperService.ts
 */

import * as cheerio from 'cheerio';

// ==========================================
// EXEMPLE 1 : Site Simple avec Structure Standard
// ==========================================

export async function scrapeSimpleSite(url: string) {
  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerio.load(html);

  return {
    title: $('h1.song-title').text().trim(),
    author: $('.artist-name').text().trim(),
    content: $('pre.tab-content').text().trim(),
    source: 'Mon Site',
    url,
  };
}

// ==========================================
// EXEMPLE 2 : Site avec Recherche
// ==========================================

const myCustomSite = {
  name: 'Mon Site de Tabs',
  searchUrl: (query: string) => 
    `https://mon-site.com/search?q=${encodeURIComponent(query)}`,
  selectors: {
    searchResults: '.search-result',
    songTitle: 'h3.title',
    songAuthor: 'span.artist',
    songLink: 'a.tab-link',
  }
};

// ==========================================
// EXEMPLE 3 : Site avec Pagination
// ==========================================

export async function scrapeWithPagination(query: string) {
  const results: any[] = [];
  const maxPages = 3;

  for (let page = 1; page <= maxPages; page++) {
    const url = `https://site.com/search?q=${encodeURIComponent(query)}&page=${page}`;
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    $('.result').each((_: number, element: any) => {
      const $el = $(element);
      results.push({
        title: $el.find('.title').text().trim(),
        author: $el.find('.author').text().trim(),
        url: $el.find('a').attr('href') || '',
        source: 'Site with Pagination',
      });
    });

    // Vérifier s'il y a une page suivante
    if ($('.next-page').length === 0) break;
  }

  return results;
}

// ==========================================
// EXEMPLE 4 : Site avec Authentification
// ==========================================

export async function scrapeWithAuth(url: string, apiKey: string) {
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'User-Agent': 'Mozilla/5.0...',
    },
  });

  const html = await response.text();
  const $ = cheerio.load(html);

  return {
    title: $('.title').text().trim(),
    author: $('.author').text().trim(),
    content: $('pre').text().trim(),
    source: 'Authenticated Site',
    url,
  };
}

// ==========================================
// EXEMPLE 5 : Site avec JSON API
// ==========================================

export async function scrapeJsonApi(query: string) {
  const response = await fetch(
    `https://api.site.com/tabs/search?q=${encodeURIComponent(query)}`
  );
  
  const data = await response.json();

  return data.results.map((item: any) => ({
    title: item.name,
    author: item.artist,
    url: `https://site.com/tab/${item.id}`,
    source: 'JSON API Site',
  }));
}

// ==========================================
// EXEMPLE 6 : Extraction Avancée avec Regex
// ==========================================

export async function scrapeWithRegex(url: string) {
  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerio.load(html);

  // Récupérer tout le contenu
  const fullContent = $('body').text();

  // Extraire le titre avec regex
  const titleMatch = fullContent.match(/Title:\s*(.+?)(?:\n|$)/);
  const title = titleMatch ? titleMatch[1].trim() : 'Sans titre';

  // Extraire l'auteur
  const authorMatch = fullContent.match(/Artist:\s*(.+?)(?:\n|$)/);
  const author = authorMatch ? authorMatch[1].trim() : 'Inconnu';

  // Extraire les accords (lignes contenant A-G)
  const chordLines = fullContent
    .split('\n')
    .filter(line => /\b[A-G][#b]?(m|maj|min)?[0-9]?\b/.test(line));

  return {
    title,
    author,
    content: chordLines.join('\n'),
    source: 'Regex Scraper',
    url,
  };
}

// ==========================================
// EXEMPLE 7 : Site avec Sections Multiples
// ==========================================

export async function scrapeMultiSection(url: string) {
  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerio.load(html);

  const sections: string[] = [];

  // Parcourir chaque section
  $('.song-section').each((_: number, element: any) => {
    const $section = $(element);
    const sectionName = $section.find('.section-name').text().trim();
    const sectionContent = $section.find('.section-content').text().trim();
    
    sections.push(`[${sectionName}]\n${sectionContent}`);
  });

  return {
    title: $('h1').text().trim(),
    author: $('.artist').text().trim(),
    content: sections.join('\n\n'),
    source: 'Multi-Section Site',
    url,
  };
}

// ==========================================
// EXEMPLE 8 : Nettoyage Avancé du Contenu
// ==========================================

export function cleanAdvanced(content: string): string {
  return content
    // Supprimer les lignes vides multiples
    .replace(/\n{3,}/g, '\n\n')
    // Supprimer les espaces en fin de ligne
    .replace(/[ \t]+$/gm, '')
    // Normaliser les sauts de ligne
    .replace(/\r\n/g, '\n')
    // Supprimer les caractères non imprimables
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Supprimer les publicités communes
    .replace(/\[.*?(ad|advertisement|sponsor).*?\]/gi, '')
    // Trim général
    .trim();
}

// ==========================================
// EXEMPLE 9 : Gestion des Erreurs Robuste
// ==========================================

export async function scrapeWithRetry(
  url: string, 
  maxRetries = 3
): Promise<any> {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0...',
        },
        signal: AbortSignal.timeout(10000), // 10s timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      return {
        title: $('h1').text().trim(),
        author: $('.artist').text().trim(),
        content: $('pre').text().trim(),
        source: 'Robust Scraper',
        url,
      };

    } catch (error) {
      lastError = error;
      console.log(`Retry ${i + 1}/${maxRetries} failed:`, error);
      
      // Attendre avant de réessayer (backoff exponentiel)
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, i) * 1000)
      );
    }
  }

  throw lastError;
}

// ==========================================
// EXEMPLE 10 : Configuration Complète
// ==========================================

export const myCompleteConfig = {
  // Sites à scraper
  sites: [
    {
      name: 'Site Principal',
      baseUrl: 'https://mon-site.com',
      searchUrl: (q: string) => `https://mon-site.com/search?q=${q}`,
      selectors: {
        searchResults: '.tab-result',
        title: 'h3',
        author: '.artist',
        link: 'a.tab-link',
        content: 'pre.tab',
      },
    },
    {
      name: 'Site Secondaire',
      baseUrl: 'https://autre-site.com',
      searchUrl: (q: string) => `https://autre-site.com/tabs?search=${q}`,
      selectors: {
        searchResults: '.song-item',
        title: '.song-name',
        author: '.artist-name',
        link: 'a',
        content: '.chord-sheet',
      },
    },
  ],

  // Options
  options: {
    maxResults: 10,
    timeout: 10000,
    retries: 3,
    delay: 1000, // Délai entre requêtes
  },

  // Headers personnalisés
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    'Accept': 'text/html,application/xhtml+xml',
    'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
  },
};

// ==========================================
// COMMENT UTILISER CES EXEMPLES
// ==========================================

/*
1. Copiez l'exemple qui correspond à votre besoin
2. Adaptez les sélecteurs CSS à votre site
3. Ajoutez-le dans scraperService.ts
4. Testez avec différentes URLs/requêtes

ASTUCE : Utilisez l'inspecteur du navigateur (F12) pour :
- Trouver les sélecteurs CSS corrects
- Vérifier la structure HTML
- Tester les sélecteurs dans la console
*/

// ==========================================
// TESTER VOS SÉLECTEURS
// ==========================================

/*
Dans la console du navigateur :

// Tester un sélecteur
document.querySelector('.song-title').textContent

// Compter les résultats
document.querySelectorAll('.search-result').length

// Voir tous les éléments
document.querySelectorAll('.search-result').forEach(el => {
  console.log(el.textContent);
});
*/

