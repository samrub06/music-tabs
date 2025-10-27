import { parsePlaylistWithAI } from './aiParserService';
import { ScrapedSong, scrapeSongFromUrl, searchUltimateGuitarOnly } from './scraperService';
import { folderService, songService } from './songService';

export interface ParsedSong {
  title: string;
  artist: string;
}

export interface ImportResult {
  success: number;
  failed: number;
  duplicates: number;
  errors: string[];
  songs: {
    title: string;
    artist: string;
    status: 'success' | 'failed' | 'duplicate';
    error?: string;
  }[];
  aiFolders?: {
    id: string;
    name: string;
    songsCount: number;
  }[];
}

export interface ImportProgress {
  current: number;
  total: number;
  currentSong: string;
  status: 'idle' | 'parsing' | 'searching' | 'importing' | 'completed' | 'error';
}

/**
 * Importe une playlist depuis le texte copié de MyTabs
 * @param text - Le texte copié depuis MyTabs
 * @param userId - ID de l'utilisateur
 * @param targetFolderId - ID du dossier de destination (optionnel)
 * @param onProgress - Callback pour le progrès
 * @param clientSupabase - Client Supabase (optionnel)
 */
export async function importPlaylistFromText(
  text: string,
  userId: string,
  targetFolderId?: string,
  onProgress?: (progress: ImportProgress) => void,
  clientSupabase?: any,
  useAiOrganization?: boolean
): Promise<ImportResult> {
  console.log('🚀 Starting playlist import from text...');
  console.log(`📊 Parameters:`, {
    userId,
    targetFolderId,
    useAiOrganization,
    textLength: text.length,
    hasProgressCallback: !!onProgress,
    hasSupabaseClient: !!clientSupabase
  });
  
  const result: ImportResult = {
    success: 0,
    failed: 0,
    duplicates: 0,
    errors: [],
    songs: [],
    aiFolders: []
  };

  try {
    // Étape 1: Parser le texte avec l'IA
    console.log('🤖 Step 1: Starting AI parsing...');
    onProgress?.({
      current: 0,
      total: 0, // Sera mis à jour avec le nombre de chansons
      currentSong: 'Analyse IA de la playlist...',
      status: 'parsing'
    });

    const aiResult = await parsePlaylistWithAI(text);
    console.log('🤖 AI parsing result:', {
      success: aiResult.success,
      songsCount: aiResult.songs?.length || 0,
      error: aiResult.error
    });
    
    if (!aiResult.success || aiResult.songs.length === 0) {
      throw new Error(`Erreur lors de l'analyse IA: ${aiResult.error || 'Aucune chanson trouvée'}`);
    }

    // Convertir les résultats AI en format ParsedSong
    const validSongs: ParsedSong[] = aiResult.songs
      .filter(song => song.title && song.artist && song.title.length > 0 && song.artist.length > 0)
      .map(song => ({
        title: song.title,
        artist: song.artist
      }));

    console.log(`🤖 AI parsed ${validSongs.length} songs:`);
    validSongs.forEach((song, index) => {
      console.log(`${index + 1}. "${song.title}" by "${song.artist}"`);
    });

    onProgress?.({
      current: 0,
      total: validSongs.length,
      currentSong: `${validSongs.length} chansons analysées par l'IA`,
      status: 'parsing'
    });

    // Étape 2: Organisation IA si demandée
    let folderMap: Map<string, string> = new Map();
    if (useAiOrganization) {
      console.log('📁 Step 2: Starting AI folder organization...');
      onProgress?.({
        current: 30,
        total: 100,
        currentSong: 'Organisation IA des dossiers...',
        status: 'parsing'
      });

      try {
        console.log(`🤖 Starting AI folder organization for ${validSongs.length} songs...`);
        const { organizeSongsWithFallback } = await import('./folderOrganizerService');
        const aiFolders = await organizeSongsWithFallback(validSongs);
        
        console.log(`📁 AI suggested ${aiFolders.length} folders:`, aiFolders.map(f => f.name));
        
        // Créer les dossiers et mapper les chansons
        for (const aiFolder of aiFolders) {
          console.log(`📁 Creating folder: ${aiFolder.name} with ${aiFolder.songs.length} songs`);
          const folder = await folderService.createFolder({ 
            name: aiFolder.name,
          }, clientSupabase);
          console.log(`✅ Folder created with ID: ${folder.id}`);
          
          // Ajouter le dossier aux résultats
          result.aiFolders!.push({
            id: folder.id,
            name: folder.name,
            songsCount: aiFolder.songs.length
          });
          
          for (const song of aiFolder.songs) {
            folderMap.set(`${song.title}|${song.artist}`, folder.id);
            console.log(`🎵 Mapped "${song.title}" by "${song.artist}" to folder "${folder.name}"`);
          }
        }
        
        onProgress?.({
          current: 0,
          total: validSongs.length,
          currentSong: `${aiFolders.length} dossiers IA créés`,
          status: 'parsing'
        });
      } catch (error) {
        console.warn('AI organization failed, using default folder:', error);
      }
    }

    // Étape 3: Pour chaque chanson, chercher la meilleure version sur Ultimate Guitar
    console.log(`🎵 Step 3: Processing ${validSongs.length} songs...`);
    for (let i = 0; i < validSongs.length; i++) {
      const song = validSongs[i];
      const searchQuery = `${song.artist} ${song.title}`;
      console.log(`🎵 Processing song ${i + 1}/${validSongs.length}: "${song.title}" by "${song.artist}"`);
      
      onProgress?.({
        current: i,
        total: validSongs.length,
        currentSong: `Recherche (${i + 1}/${validSongs.length}): ${song.title} par ${song.artist}`,
        status: 'searching'
      });

      try {
        // Chercher sur Ultimate Guitar
        console.log(`🔍 Searching Ultimate Guitar for: "${searchQuery}"`);
        const searchResults = await searchUltimateGuitarOnly(searchQuery);
        console.log(`🔍 Search results: ${searchResults.length} versions found`);
        
        if (searchResults.length === 0) {
          console.log(`❌ No results found for: "${searchQuery}"`);
          result.failed++;
          result.errors.push(`No results found for: ${searchQuery}`);
          result.songs.push({
            title: song.title,
            artist: song.artist,
            status: 'failed',
            error: 'No results found'
          });
          continue;
        }

        // Prendre la première version (déjà triée par nombre de reviews)
        const bestVersion = searchResults[0];
        
        onProgress?.({
          current: i,
          total: validSongs.length,
          currentSong: `Import (${i + 1}/${validSongs.length}): ${song.title} (${bestVersion.reviews} avis)`,
          status: 'importing'
        });

        // Scraper le contenu de cette version
        const scrapedSong = await scrapeSongFromUrl(bestVersion.url);
        
        if (!scrapedSong) {
          result.failed++;
          result.errors.push(`Failed to scrape content for: ${searchQuery}`);
          result.songs.push({
            title: song.title,
            artist: song.artist,
            status: 'failed',
            error: 'Failed to scrape content'
          });
          continue;
        }

        // Créer la chanson finale en priorisant les données de la playlist
        // IMPORTANT: Passer TOUTES les métadonnées scrappées
        const finalSong = {
          title: song.title, // Priorité absolue au titre de la playlist
          author: song.artist, // Priorité absolue à l'artiste de la playlist
          content: scrapedSong.content, // Contenu scrappé depuis Ultimate Guitar
          source: 'Ultimate Guitar',
          url: bestVersion.url,
          // Passer toutes les métadonnées scrappées
          reviews: scrapedSong.reviews,
          capo: scrapedSong.capo,
          key: scrapedSong.key,
          rating: scrapedSong.rating,
          difficulty: scrapedSong.difficulty,
          version: scrapedSong.version,
          versionDescription: scrapedSong.versionDescription,
          artistUrl: scrapedSong.artistUrl,
          artistImageUrl: scrapedSong.artistImageUrl,
          songImageUrl: scrapedSong.songImageUrl,
          sourceUrl: scrapedSong.url,
          sourceSite: scrapedSong.source
        };

        console.log(`✅ Final song data: "${finalSong.title}" by "${finalSong.author}"`);
        console.log(`📊 Metadata: key=${finalSong.key}, capo=${finalSong.capo}, rating=${finalSong.rating}, difficulty=${finalSong.difficulty}`);

        // Déterminer le dossier de destination
        const songKey = `${song.title}|${song.artist}`;
        const songFolderId = folderMap.get(songKey) || targetFolderId;
        
        if (songFolderId && folderMap.has(songKey)) {
          console.log(`📁 Using AI folder for "${song.title}" by "${song.artist}"`);
        } else if (targetFolderId) {
          console.log(`📁 Using target folder for "${song.title}" by "${song.artist}"`);
        } else {
          console.log(`📁 Using root folder for "${song.title}" by "${song.artist}"`);
        }

        // Importer dans la base de données
        console.log(`💾 Importing song to database with folder ID: ${songFolderId || 'root'}`);
        const importStatus = await importSongToDatabase(
          finalSong, 
          userId, 
          songFolderId, 
          clientSupabase
        );
        console.log(`💾 Import result: ${importStatus}`);

        if (importStatus === 'success') {
          console.log(`✅ Successfully imported: "${song.title}" by "${song.artist}"`);
          result.success++;
          result.songs.push({
            title: song.title,
            artist: song.artist,
            status: 'success'
          });
        } else if (importStatus === 'duplicate') {
          console.log(`⚠️ Duplicate found: "${song.title}" by "${song.artist}"`);
          result.duplicates++;
          result.songs.push({
            title: song.title,
            artist: song.artist,
            status: 'duplicate'
          });
        } else {
          console.log(`❌ Failed to import: "${song.title}" by "${song.artist}"`);
          result.failed++;
          result.errors.push(`Database import failed for: ${searchQuery}`);
          result.songs.push({
            title: song.title,
            artist: song.artist,
            status: 'failed',
            error: 'Database import failed'
          });
        }

        // Délai entre les imports pour être respectueux
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        result.failed++;
        result.errors.push(`Error processing ${song.title}: ${error}`);
        result.songs.push({
          title: song.title,
          artist: song.artist,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log('🎉 Import completed!');
    console.log(`📊 Final results:`, {
      success: result.success,
      failed: result.failed,
      duplicates: result.duplicates,
      total: result.songs.length,
      errors: result.errors.length
    });
    
    onProgress?.({
      current: validSongs.length,
      total: validSongs.length,
      currentSong: `Import terminé: ${result.success} succès, ${result.failed} échecs`,
      status: 'completed'
    });

  } catch (error) {
    onProgress?.({
      current: 0,
      total: 0,
      currentSong: '',
      status: 'error'
    });
    
    result.errors.push(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * Importe une chanson scrappée dans la base de données Supabase
 */
async function importSongToDatabase(
  scrapedSong: ScrapedSong, 
  userId: string, 
  targetFolderId?: string, 
  clientSupabase?: any
): Promise<'success' | 'duplicate' | 'error'> {
  try {
    console.log(`📥 Importing to database: ${scrapedSong.title} by ${scrapedSong.author}`);
    
    // Vérifier si la chanson existe déjà pour cet utilisateur
    const existingSongs = await songService.searchSongs(
      `${scrapedSong.title} ${scrapedSong.author}`, 
      clientSupabase
    );
    
    const duplicate = existingSongs.find(song => 
      song.title.toLowerCase() === scrapedSong.title.toLowerCase() &&
      song.author.toLowerCase() === scrapedSong.author.toLowerCase()
    );
    
    if (duplicate) {
      console.log(`⚠️ Song already exists: ${scrapedSong.title} by ${scrapedSong.author}`);
      return 'duplicate';
    }
    
    // Créer la nouvelle chanson
    const newSongData = {
      title: scrapedSong.title,
      author: scrapedSong.author,
      content: scrapedSong.content,
      userId: userId,
      folderId: targetFolderId || undefined,
      reviews: scrapedSong.reviews,
      capo: scrapedSong.capo,
      key: scrapedSong.key,
      rating: scrapedSong.rating,
      difficulty: scrapedSong.difficulty,
      version: scrapedSong.version,
      versionDescription: scrapedSong.versionDescription,
      artistUrl: scrapedSong.artistUrl,
      artistImageUrl: scrapedSong.artistImageUrl,
      songImageUrl: scrapedSong.songImageUrl,
      sourceUrl: scrapedSong.url,
      sourceSite: scrapedSong.source
    };
    
    console.log(`💾 Creating song with metadata:`, {
      key: newSongData.key,
      capo: newSongData.capo,
      rating: newSongData.rating,
      difficulty: newSongData.difficulty,
      reviews: newSongData.reviews
    });
    
    const createdSong = await songService.createSong(newSongData, clientSupabase);
    console.log(`✅ Successfully imported: ${createdSong.title} (ID: ${createdSong.id})`);
    return 'success';
    
  } catch (error) {
    console.error('Error importing song to database:', error);
    return 'error';
  }
}

