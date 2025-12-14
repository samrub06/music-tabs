import * as cheerio from 'cheerio';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/db';
import { scrapeSongFromUrl, ScrapedSong } from './scraperService';
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

export interface ExploreFilter {
  genre?: string;
  difficulty?: string;
  decade?: number;
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
      // Construire l'URL avec les paramètres de filtre
      const baseUrl = 'https://www.ultimate-guitar.com/explore?order=hitstotal_desc&type[]=Tabs';
      const params = new URLSearchParams();
      
      if (filter?.genre) {
        params.append('genres[]', filter.genre);
      }
      if (filter?.difficulty) {
        params.append('difficulty[]', filter.difficulty);
      }
      if (filter?.decade) {
        params.append('decade[]', String(filter.decade));
      }
      
      const exploreUrl = params.toString() 
        ? `${baseUrl}&${params.toString()}`
        : baseUrl;
      
      console.log(`🔍 Fetching trending songs from: ${exploreUrl}`);
      const response = await fetch(exploreUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch trending songs: ${response.status}`);
      }

      const html = await response.text();
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
          // Vérifier si existe déjà (par titre/artiste)
          const { data: existingSongs } = await (supabase
            .from('songs') as any)
            .select('id, is_trending, is_public')
            .ilike('title', song.title)
            .ilike('author', song.artist)
            .limit(1);

          if (existingSongs && existingSongs.length > 0) {
            // Existe déjà : mettre à jour le flag trending
            const existing = existingSongs[0];
            await (supabase
              .from('songs') as any)
              .update({ is_trending: true, is_public: true } as any)
              .eq('id', existing.id);
            
            stats.updated++;
            console.log(`Updated trending flag for: ${song.title}`);
          } else {
            // N'existe pas : scraper et créer
            console.log(`New trending song found: ${song.title}. Scraping...`);
            
            // Créer un SearchResult complet avec toutes les métadonnées extraites depuis la page Explore
            // Cela garantit que scrapeUltimateGuitar() utilise d'abord ces données (priorité)
            const searchResult = {
              title: song.title,
              author: song.artist,
              url: song.url,
              source: 'Ultimate Guitar',
              reviews: song.reviews,
              version: song.version,
              rating: song.rating,
              difficulty: song.difficulty,
              artistUrl: song.artistUrl,
              artistImageUrl: song.artistImageUrl,
              songImageUrl: song.songImageUrl,
              versionDescription: song.versionDescription,
            };
            
            console.log(`🔍 Scraping with full metadata:`, {
              title: searchResult.title,
              hasRating: !!searchResult.rating,
              hasReviews: !!searchResult.reviews,
              hasDifficulty: !!searchResult.difficulty,
              hasVersion: !!searchResult.version,
              hasArtistUrl: !!searchResult.artistUrl,
              hasArtistImage: !!searchResult.artistImageUrl,
              hasSongImage: !!searchResult.songImageUrl,
            });
            
            const scrapedSong = await scrapeSongFromUrl(song.url, searchResult);

            if (scrapedSong) {
              try {
                await songRepo(supabase).createSystemSong({
                  title: scrapedSong.title,
                  author: scrapedSong.author,
                  content: scrapedSong.content,
                  rating: scrapedSong.rating,
                  difficulty: scrapedSong.difficulty,
                  reviews: scrapedSong.reviews,
                  key: scrapedSong.key,
                  capo: scrapedSong.capo,
                  version: scrapedSong.version,
                  artistUrl: scrapedSong.artistUrl,
                  artistImageUrl: scrapedSong.artistImageUrl,
                  songImageUrl: scrapedSong.songImageUrl,
                  sourceUrl: scrapedSong.url,
                  sourceSite: 'Ultimate Guitar',
                }, {
                  isTrending: true,
                  isPublic: true
                });
                
                stats.added++;
                console.log(`Added new trending song: ${song.title}`);
              } catch (insertError) {
                console.error('Error inserting trending song:', insertError);
                stats.errors++;
              }
            } else {
              console.error(`Failed to scrape content for: ${song.title}`);
              stats.errors++;
            }
          }
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
      // Définir les catégories
      const genres = [
        { id: '4', name: 'Rock' },
        { id: '14', name: 'Pop' },
        { id: '666', name: 'Folk' },
        { id: '45', name: 'World Music' },
        { id: '1781', name: 'Reggae' },
      ];
      
      const difficulties = [
        { id: '1', name: 'Absolute Beginner' },
        { id: '2', name: 'Beginner' },
      ];
      
      const decades = [
        { year: 2020, name: '2020s' },
        { year: 2010, name: '2010s' },
      ];

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
          // Vérifier si existe déjà (par titre/artiste)
          const { data: existingSongs } = await (supabase
            .from('songs') as any)
            .select('id, is_trending, is_public')
            .ilike('title', song.title)
            .ilike('author', song.artist)
            .limit(1);

          if (existingSongs && existingSongs.length > 0) {
            // Existe déjà : mettre à jour le flag trending et les métadonnées
            const existing = existingSongs[0];
            const updateData: any = { is_trending: true, is_public: true };
            if (metadata.genre) updateData.genre = metadata.genre;
            if (metadata.difficulty) updateData.difficulty = metadata.difficulty;
            if (metadata.decade) updateData.decade = metadata.decade;
            
            await (supabase
              .from('songs') as any)
              .update(updateData)
              .eq('id', existing.id);
            
            stats.updated++;
            console.log(`Updated trending flag for: ${song.title}`);
          } else {
            // N'existe pas : scraper et créer
            console.log(`New trending song found: ${song.title}. Scraping...`);
            
            // Créer un SearchResult complet avec toutes les métadonnées extraites
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
            };
            
            const scrapedSong = await scrapeSongFromUrl(song.url, searchResult);

            if (scrapedSong) {
              try {
                await songRepo(supabase).createSystemSong({
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
                }, {
                  isTrending: true,
                  isPublic: true,
                  genre: metadata.genre,
                  decade: metadata.decade,
                });
                
                stats.added++;
                console.log(`Added new trending song: ${song.title}`);
              } catch (insertError) {
                console.error('Error inserting trending song:', insertError);
                stats.errors++;
              }
            } else {
              console.error(`Failed to scrape content for: ${song.title}`);
              stats.errors++;
            }
          }
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

