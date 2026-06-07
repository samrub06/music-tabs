import * as cheerio from 'cheerio';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/db';
import {
  buildUltimateGuitarExploreUrl,
  EXPLORE_DECADES,
  EXPLORE_DIFFICULTIES,
  EXPLORE_GENRES,
  type UltimateGuitarExploreFilter,
} from '@/data/exploreCategories';
import { delayBeforeUgRequest, getOrRefreshUgCookies, getUltimateGuitarFetchHeaders, scrapeSongFromUrl, ScrapedSong } from './scraperService';
import { fetchUltimateGuitarHtml } from './ugFetch';
import { songRepo } from './songRepo';

export interface TrendingSong {
  title: string;
  artist: string;
  url: string;
  rating?: number;
  reviews?: number;
  difficulty?: string;
  version?: number;
  versionDescription?: string;
  artistUrl?: string;
  artistImageUrl?: string;
  songImageUrl?: string;
  tabId?: number;
}

export type ExploreFilter = UltimateGuitarExploreFilter;

type TrendingCatalogMetadata = {
  genre?: string
  difficulty?: string
  decade?: number
}

async function upsertTrendingCatalogSong(
  supabase: SupabaseClient<Database>,
  song: TrendingSong,
  metadata: TrendingCatalogMetadata = {}
): Promise<'added' | 'updated' | 'error'> {
  const repo = songRepo(supabase)
  const existing = await repo.findExistingSystemCatalogSong({
    tabId: song.tabId,
    sourceUrl: song.url,
    title: song.title,
    author: song.artist,
  })

  const updateData: Record<string, unknown> = {
    is_trending: true,
    is_public: true,
  }
  if (metadata.genre) updateData.genre = metadata.genre
  if (metadata.difficulty) updateData.difficulty = metadata.difficulty
  if (metadata.decade) updateData.decade = metadata.decade
  if (song.tabId != null) updateData.tab_id = String(song.tabId)
  if (song.url) updateData.source_url = song.url

  if (existing) {
    await (supabase.from('songs') as any).update(updateData).eq('id', existing.id)
    console.log(`Updated trending catalog song: ${song.title}`)
    return 'updated'
  }

  console.log(`New trending song found: ${song.title}. Scraping...`)

  const searchResult = {
    title: song.title,
    author: song.artist,
    url: song.url,
    source: 'Ultimate Guitar',
    reviews: song.reviews,
    version: song.version,
    rating: song.rating,
    difficulty: metadata.difficulty || song.difficulty,
    artistUrl: song.artistUrl,
    artistImageUrl: song.artistImageUrl,
    songImageUrl: song.songImageUrl,
    versionDescription: song.versionDescription,
  }

  const scrapedSong = await scrapeSongFromUrl(song.url, searchResult)
  if (!scrapedSong) {
    console.error(`Failed to scrape content for: ${song.title}`)
    return 'error'
  }

  try {
    await repo.createSystemSong(
      {
        title: scrapedSong.title,
        author: scrapedSong.author,
        content: scrapedSong.content,
        rating: scrapedSong.rating,
        difficulty: metadata.difficulty || scrapedSong.difficulty,
        reviews: scrapedSong.reviews,
        key: scrapedSong.key,
        capo: scrapedSong.capo,
        version: scrapedSong.version,
        artistUrl: scrapedSong.artistUrl,
        artistImageUrl: scrapedSong.artistImageUrl,
        songImageUrl: scrapedSong.songImageUrl,
        sourceUrl: scrapedSong.url,
        sourceSite: 'Ultimate Guitar',
        tabId:
          song.tabId != null
            ? String(song.tabId)
            : scrapedSong.tabId != null
              ? String(scrapedSong.tabId)
              : undefined,
      },
      {
        isTrending: true,
        isPublic: true,
        genre: metadata.genre,
        decade: metadata.decade,
      }
    )
    console.log(`Added new trending song: ${song.title}`)
    return 'added'
  } catch (insertError) {
    console.error('Error inserting trending song:', insertError)
    return 'error'
  }
}

/**
 * Service pour gérer les chansons tendances (Trending / Top 100)
 */
export const trendingService = {
  /**
   * Récupère les chansons tendances depuis Ultimate Guitar (page Explore)
   * @param filter Filtres optionnels pour genre, difficulty, decade
   */
  async fetchTrendingSongsFromUG(filter?: ExploreFilter): Promise<TrendingSong[]> {
    try {
      const exploreUrl = buildUltimateGuitarExploreUrl(filter);

      console.log(`🔍 Fetching trending songs from: ${exploreUrl}`);
      await delayBeforeUgRequest();
      const cookies = await getOrRefreshUgCookies();
      const headers = {
        ...getUltimateGuitarFetchHeaders({ referer: 'https://www.ultimate-guitar.com/explore' }),
        ...(cookies && { Cookie: cookies }),
      };
      const response = await fetchUltimateGuitarHtml(exploreUrl, { headers });

      if (!response.ok || response.blocked) {
        throw new Error(`Failed to fetch trending songs: ${response.statusCode}`);
      }

      const html = response.body;
      const $ = cheerio.load(html);

      // Extraire les données JSON du store (comme dans scraperService)
      const dataContent = $('.js-store').attr('data-content');
      
      if (!dataContent) {
        console.error('No data content found on Explore page');
        return [];
      }

      // Décoder les entités HTML
      const decodedData = dataContent
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&#39;/g, "'")
        .replace(/&#x27;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');

      const data = JSON.parse(decodedData);
      const tabs = data?.store?.page?.data?.data?.tabs;

      if (!tabs || !Array.isArray(tabs)) {
        console.error('No tabs found in Explore data');
        return [];
      }

      // Mapper les résultats avec toutes les métadonnées disponibles
      const mappedTabs = tabs.map((tab: any) => {
        const trendingSong: TrendingSong = {
          title: tab.song_name,
          artist: tab.artist_name,
          url: tab.tab_url,
          rating: tab.rating,
          reviews: tab.votes,
          difficulty: tab.difficulty,
          version: tab.version,
          versionDescription: tab.version_description,
          artistUrl: tab.artist_url,
          artistImageUrl: tab.artist_cover?.web_artist_cover?.small,
          songImageUrl: tab.album_cover?.web_album_cover?.small,
          tabId: tab.tab_id,
        };
        
        // Log pour debug: afficher les métadonnées extraites
        console.log(`📊 Extracted trending song: ${trendingSong.title} by ${trendingSong.artist}`, {
          hasRating: !!trendingSong.rating,
          hasReviews: !!trendingSong.reviews,
          hasDifficulty: !!trendingSong.difficulty,
          hasVersion: !!trendingSong.version,
          hasArtistUrl: !!trendingSong.artistUrl,
          hasArtistImage: !!trendingSong.artistImageUrl,
          hasSongImage: !!trendingSong.songImageUrl,
        });
        
        return trendingSong;
      });
      
      return mappedTabs;

    } catch (error) {
      console.error('Error fetching trending songs:', error);
      return [];
    }
  },

  /**
   * Met à jour la base de données avec les chansons tendances
   * - Scrape les détails si la chanson n'existe pas
   * - Marque comme is_trending = true
   */
  async updateTrendingDatabase(
    supabase: SupabaseClient<Database>,
    limit: number = 20 // Limiter pour éviter les timeouts serverless
  ): Promise<{ added: number; updated: number; errors: number }> {
    const stats = { added: 0, updated: 0, errors: 0 };
    
    try {
      // 1. Récupérer la liste des tendances
      console.log('Fetching trending list from UG...');
      const trendingList = await this.fetchTrendingSongsFromUG();
      
      if (trendingList.length === 0) {
        console.log('No trending songs found.');
        return stats;
      }

      // Prendre seulement les N premiers
      const topSongs = trendingList.slice(0, limit);
      console.log(`Processing top ${topSongs.length} trending songs...`);

      // 2. Réinitialiser le flag is_trending pour toutes les chansons (optionnel, ou garder l'historique ?)
      // Pour l'instant, on garde l'historique ou on pourrait faire un reset. 
      // Reset est mieux pour avoir vraiment les "actuelles".
      await (supabase
        .from('songs') as any)
        .update({ is_trending: false } as any)
        .eq('is_trending', true);

      // 3. Traiter chaque chanson
      for (const song of topSongs) {
        try {
          const result = await upsertTrendingCatalogSong(supabase, song)
          if (result === 'added') stats.added++
          else if (result === 'updated') stats.updated++
          else stats.errors++
        } catch (itemError) {
          console.error(`Error processing item ${song.title}:`, itemError);
          stats.errors++;
        }
      }

      return stats;

    } catch (error) {
      console.error('Global error in updateTrendingDatabase:', error);
      throw error;
    }
  },

  /**
   * Met à jour la base de données avec les chansons tendances par catégories
   * Récupère 15 chansons pour chaque catégorie (genres, niveaux, décennies)
   */
  async updateTrendingDatabaseByCategories(
    supabase: SupabaseClient<Database>,
    limitPerCategory: number = 15
  ): Promise<{ added: number; updated: number; errors: number }> {
    const stats = { added: 0, updated: 0, errors: 0 };
    
    try {
      const genres = EXPLORE_GENRES;
      const difficulties = EXPLORE_DIFFICULTIES;
      const decades = EXPLORE_DECADES;

      // Réinitialiser le flag is_trending pour toutes les chansons
      await (supabase
        .from('songs') as any)
        .update({ is_trending: false } as any)
        .eq('is_trending', true);

      // Traiter les genres
      for (const genre of genres) {
        console.log(`\n🎵 Processing genre: ${genre.name} (${genre.id})`);
        const filter: ExploreFilter = { genre: genre.id };
        const categoryStats = await this.processCategory(
          supabase,
          filter,
          limitPerCategory,
          { genre: genre.id }
        );
        stats.added += categoryStats.added;
        stats.updated += categoryStats.updated;
        stats.errors += categoryStats.errors;
      }

      // Traiter les niveaux
      for (const difficulty of difficulties) {
        console.log(`\n🎸 Processing difficulty: ${difficulty.name} (${difficulty.id})`);
        const filter: ExploreFilter = { difficulty: difficulty.id };
        const categoryStats = await this.processCategory(
          supabase,
          filter,
          limitPerCategory,
          { difficulty: difficulty.id }
        );
        stats.added += categoryStats.added;
        stats.updated += categoryStats.updated;
        stats.errors += categoryStats.errors;
      }

      // Traiter les décennies
      for (const decade of decades) {
        console.log(`\n📅 Processing decade: ${decade.name} (${decade.year})`);
        const filter: ExploreFilter = { decade: decade.year };
        const categoryStats = await this.processCategory(
          supabase,
          filter,
          limitPerCategory,
          { decade: decade.year }
        );
        stats.added += categoryStats.added;
        stats.updated += categoryStats.updated;
        stats.errors += categoryStats.errors;
      }

      return stats;

    } catch (error) {
      console.error('Global error in updateTrendingDatabaseByCategories:', error);
      throw error;
    }
  },

  /**
   * Traite une catégorie spécifique (genre, difficulty ou decade)
   */
  async processCategory(
    supabase: SupabaseClient<Database>,
    filter: ExploreFilter,
    limit: number,
    metadata: { genre?: string; difficulty?: string; decade?: number }
  ): Promise<{ added: number; updated: number; errors: number }> {
    const stats = { added: 0, updated: 0, errors: 0 };
    
    try {
      // Récupérer la liste des tendances pour cette catégorie
      const trendingList = await this.fetchTrendingSongsFromUG(filter);
      
      if (trendingList.length === 0) {
        console.log(`No trending songs found for category.`);
        return stats;
      }

      // Prendre seulement les N premiers
      const topSongs = trendingList.slice(0, limit);
      console.log(`Processing top ${topSongs.length} trending songs for category...`);

      // Traiter chaque chanson
      for (const song of topSongs) {
        try {
          const result = await upsertTrendingCatalogSong(supabase, song, metadata)
          if (result === 'added') stats.added++
          else if (result === 'updated') stats.updated++
          else stats.errors++
        } catch (itemError) {
          console.error(`Error processing item ${song.title}:`, itemError);
          stats.errors++;
        }
      }

      return stats;

    } catch (error) {
      console.error('Error processing category:', error);
      return stats;
    }
  }
};

