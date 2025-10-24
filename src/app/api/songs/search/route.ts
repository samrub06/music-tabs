import { scrapeSongFromUrl, searchAndScrapeSong, searchSong, searchTab4UOnly, searchUltimateGuitarOnly } from '@/lib/services/scraperService';
import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route pour rechercher des partitions
 * GET /api/songs/search?q=titre+de+la+chanson
 * GET /api/songs/search?q=titre&source=ultimate-guitar
 * GET /api/songs/search?q=titre&source=tab4u
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const url = searchParams.get('url');
    const fullScrape = searchParams.get('fullScrape') === 'true';
    const source = searchParams.get('source'); // 'ultimate-guitar' ou 'tab4u'

    if (!query && !url) {
      return NextResponse.json(
        { error: 'Le paramètre "q" (query) ou "url" est requis' },
        { status: 400 }
      );
    }

    // Si une URL est fournie, scraper directement depuis cette URL
    if (url) {
      // Essayer de récupérer les données de recherche depuis les paramètres
      const searchResultData = searchParams.get('searchResult');
      let searchResult = null;
      
      if (searchResultData) {
        try {
          searchResult = JSON.parse(decodeURIComponent(searchResultData));
        } catch (e) {
          console.warn('Could not parse searchResult data:', e);
        }
      }
      
      const song = await scrapeSongFromUrl(url, searchResult);
      
      if (!song) {
        return NextResponse.json(
          { error: 'Impossible de récupérer la partition depuis cette URL' },
          { status: 404 }
        );
      }

      return NextResponse.json({ song });
    }

    // Si fullScrape est activé, rechercher et scraper directement
    if (fullScrape && query) {
      const song = await searchAndScrapeSong(query);
      
      if (!song) {
        return NextResponse.json(
          { error: 'Aucune partition trouvée pour cette recherche' },
          { status: 404 }
        );
      }

      return NextResponse.json({ song });
    }

    // Recherche avec source spécifique
    if (query) {
      let results;

      if (source === 'ultimate-guitar') {
        results = await searchUltimateGuitarOnly(query);
      } else if (source === 'tab4u') {
        results = await searchTab4UOnly(query);
      } else {
        // Par défaut, recherche sur les deux sites
        results = await searchSong(query);
      }

      if (results.length === 0) {
        return NextResponse.json(
          { error: 'Aucun résultat trouvé', results: [] },
          { status: 404 }
        );
      }

      return NextResponse.json({ results });
    }

    return NextResponse.json(
      { error: 'Requête invalide' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in search API:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la recherche', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

