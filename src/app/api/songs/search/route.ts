import { scrapeSongFromUrl, searchAndScrapeSong, searchNeginaOnly, searchSong, searchTab4UOnly, searchUltimateGuitarOnly } from '@/lib/services/scraperService';
import { wasUgLastFetchBlocked, getLastUgFetchMeta, buildUgSearchErrorMessage } from '@/lib/services/ugFetch';
import {
  mergeCatalogAndExternalResults,
  searchCatalogSongs,
} from '@/lib/services/catalogSearch';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * API Route pour rechercher des partitions
 * GET /api/songs/search?q=titre+de+la+chanson
 * GET /api/songs/search?q=titre&source=ultimate-guitar
 * GET /api/songs/search?q=titre&source=tab4u
 * GET /api/songs/search?q=titre&source=negina
 *
 * Catalog (public library) is always searched first with fuzzy matching and
 * ranked above scraper hits; duplicates by tabId/url/title+author are dropped.
 */
function isHebrewQuery(query: string): boolean {
  return /[\u0590-\u05FF]/.test(query);
}

async function searchExternal(query: string, source: string | null) {
  if (source === 'ultimate-guitar') {
    return searchUltimateGuitarOnly(query);
  }
  if (source === 'negina') {
    return searchNeginaOnly(query);
  }
  if (source === 'tab4u') {
    let results = await searchTab4UOnly(query);
    if (results.length === 0 && isHebrewQuery(query)) {
      results = await searchNeginaOnly(query);
    }
    return results;
  }
  return searchSong(query);
}

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

    // Catalog first (fuzzy) + external, merged/deduped by source identity
    if (query) {
      let catalogResults: Awaited<ReturnType<typeof searchCatalogSongs>> = [];
      let externalResults: Awaited<ReturnType<typeof searchExternal>> = [];
      let externalError: string | null = null;

      const catalogPromise = (async () => {
        try {
          const catalogClient = createServiceRoleClient();
          return await searchCatalogSongs(catalogClient, query, { limit: 20 });
        } catch (catalogError) {
          console.warn('Catalog search failed, continuing with external only:', catalogError);
          return [];
        }
      })();

      const externalPromise = (async () => {
        try {
          return await searchExternal(query, source);
        } catch (err) {
          console.warn('External search failed:', err);
          externalError = err instanceof Error ? err.message : 'external search failed';
          return [];
        }
      })();

      ;[catalogResults, externalResults] = await Promise.all([
        catalogPromise,
        externalPromise,
      ]);

      const results = mergeCatalogAndExternalResults(
        catalogResults,
        externalResults
      );

      if (results.length === 0) {
        const meta = source === 'ultimate-guitar' ? getLastUgFetchMeta() : null;
        const blocked = source === 'ultimate-guitar' && wasUgLastFetchBlocked();
        return NextResponse.json(
          {
            error:
              source === 'ultimate-guitar' && meta
                ? buildUgSearchErrorMessage(meta)
                : 'Aucun résultat trouvé',
            results: [],
            blocked,
            ...(externalError ? { externalError } : {}),
            ...(meta
              ? {
                  debug: {
                    proxyConfigured: meta.proxyConfigured,
                    via: meta.via,
                    statusCode: meta.statusCode,
                    hasJsStore: meta.hasJsStore,
                    cloudflare: meta.cloudflare,
                  },
                }
              : {}),
          },
          { status: 200 }
        );
      }

      return NextResponse.json({
        results,
        catalogCount: catalogResults.length,
        externalCount: externalResults.length,
        ...(externalError ? { externalError } : {}),
      });
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
