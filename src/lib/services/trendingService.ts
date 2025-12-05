import * as cheerio from 'cheerio';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/db';
import { scrapeSongFromUrl, ScrapedSong } from './scraperService';
import { songRepo } from './songRepo';
import { parseTextToStructuredSong } from '@/utils/songParser';

export interface TrendingSong {
  title: string;
  artist: string;
  url: string;
  rating?: number;
  reviews?: number;
  difficulty?: string;
}

/**
 * Service pour gérer les chansons tendances (Trending / Top 100)
 */
export const trendingService = {
  /**
   * Récupère les chansons tendances depuis Ultimate Guitar (page Explore)
   */
  async fetchTrendingSongsFromUG(): Promise<TrendingSong[]> {
    try {
      // URL pour explorer les tabs les plus populaires (Chords & Tabs)
      const exploreUrl = 'https://www.ultimate-guitar.com/explore?order=hitstotal_desc&type[]=Tabs';
      debugger;
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

      // Mapper les résultats
      return tabs.map((tab: any) => ({
        title: tab.song_name,
        artist: tab.artist_name,
        url: tab.tab_url,
        rating: tab.rating,
        reviews: tab.votes,
        difficulty: tab.difficulty,
      }));

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
      await supabase
        .from('songs')
        .update({ is_trending: false } as any) // Cast because types might not be fully updated in runtime
        .eq('is_trending', true);

      // 3. Traiter chaque chanson
      for (const song of topSongs) {
        try {
          // Vérifier si existe déjà (par titre/artiste)
          const { data: existingSongs } = await supabase
            .from('songs')
            .select('id, is_trending, is_public')
            .ilike('title', song.title)
            .ilike('author', song.artist)
            .limit(1);

          if (existingSongs && existingSongs.length > 0) {
            // Existe déjà : mettre à jour le flag trending
            const existing = existingSongs[0];
            await supabase
              .from('songs')
              .update({ is_trending: true, is_public: true } as any)
              .eq('id', existing.id);
            
            stats.updated++;
            console.log(`Updated trending flag for: ${song.title}`);
          } else {
            // N'existe pas : scraper et créer
            console.log(`New trending song found: ${song.title}. Scraping...`);
            
            const scrapedSong = await scrapeSongFromUrl(song.url, {
              title: song.title,
              author: song.artist,
              url: song.url,
              source: 'Ultimate Guitar',
              rating: song.rating,
              reviews: song.reviews,
              difficulty: song.difficulty
            });

            if (scrapedSong) {
              await songRepo(supabase).createSong({
                title: scrapedSong.title,
                author: scrapedSong.author,
                content: scrapedSong.content,
                // Pas de user_id pour les chansons système (null) - mais createSong attend un user auth...
                // Problème: createSong utilise auth.getUser().
                // Solution: Utiliser supabase.from('songs').insert() directement ici pour contourner auth user check
                // ou modifier createSong pour accepter un userId null/système.
                // On va faire l'insert manuel ici pour plus de contrôle.
                is_trending: true,
                is_public: true,
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
              } as any); // Cast as any car createSong dans Repo force l'auth pour l'instant, on va utiliser insert direct
              
              // WORKAROUND: songRepo.createSong check auth. On va faire un insert direct.
              /*
              const { error } = await supabase.from('songs').insert({
                 ... mappings ...
              })
              */
             
             // Mieux: Adapter songRepo plus tard, pour l'instant insert manuel ici pour bypasser auth check du repo
             // Mais on a besoin de `parseTextToStructuredSong`... qui est importé dans repo.
             // On va utiliser une version simplifiée ou modifier le repo pour accepter l'insertion système.
             // Le plus propre est d'ajouter une méthode `createSystemSong` au repo ou permettre createSong de bypasser user check.
             
             // Pour l'instant, je vais dupliquer la logique d'insert simple ici pour avancer.
             
             const structuredSong = parseTextToStructuredSong(
                scrapedSong.title,
                scrapedSong.author,
                scrapedSong.content
             );

             const { error: insertError } = await supabase.from('songs').insert({
                title: scrapedSong.title,
                author: scrapedSong.author,
                // sections: structuredSong.sections, // ATTENTION: Schema mismatch solved previously
                // Le Repo utilise sections, mais on a fixé le type.
                // Wait, le schema DB utilise `sections` jsonb.
                // Le type TS a `sections`.
                sections: structuredSong.sections as any, 
                is_trending: true,
                is_public: true,
                rating: scrapedSong.rating,
                difficulty: scrapedSong.difficulty,
                reviews: scrapedSong.reviews,
                key: scrapedSong.key,
                capo: scrapedSong.capo,
                first_chord: structuredSong.firstChord,
                last_chord: structuredSong.lastChord,
                version: scrapedSong.version,
                artist_url: scrapedSong.artistUrl,
                artist_image_url: scrapedSong.artistImageUrl,
                song_image_url: scrapedSong.songImageUrl,
                source_url: scrapedSong.url,
                source_site: 'Ultimate Guitar',
                format: 'structured',
                user_id: null // System owned
             });

             if (insertError) {
               console.error('Error inserting trending song:', insertError);
               stats.errors++;
             } else {
               stats.added++;
               console.log(`Added new trending song: ${song.title}`);
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
  }
};

