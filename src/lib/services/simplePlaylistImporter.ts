import { parsePlaylistWithAI } from './aiParserService';
import { ScrapedSong, scrapeSongFromUrl, searchUltimateGuitarOnly, SearchResult } from './scraperService';
import { songRepo } from './songRepo';
import { folderRepo } from './folderRepo';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/db';

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

// Map to track genre folders (name -> id)
interface GenreFolderMap {
  [key: string]: string;
}

// Map to track concurrent folder creation (genre -> Promise<string>)
interface PendingFolderCreations {
  [key: string]: Promise<string>;
}

/**
 * Traite une chanson individuelle : recherche, scraping et import
 */
async function processSong(
  song: ParsedSong,
  folderMap: Map<string, string>,
  targetFolderId: string | undefined,
  userId: string,
  clientSupabase: any,
  genreToFolderId: GenreFolderMap,
  pendingFolderCreations: PendingFolderCreations
): Promise<{ 
  status: 'success' | 'failed' | 'duplicate'; 
  error?: string; 
  title: string; 
  artist: string 
}> {
  const searchQuery = `${song.artist} ${song.title}`;
  console.log(`🎵 Processing: "${song.title}" by "${song.artist}"`);

  try {
    // 1. Chercher sur Ultimate Guitar
    const searchResults = await searchUltimateGuitarOnly(searchQuery);
    
    if (searchResults.length === 0) {
      return { status: 'failed', error: 'No results found', title: song.title, artist: song.artist };
    }

    // Prendre la première version
    const bestVersion = searchResults[0];
    
    // 2. Scraper le contenu AVEC les métadonnées de recherche
    const scrapedSong = await scrapeSongFromUrl(bestVersion.url, bestVersion);
    
    if (!scrapedSong) {
      return { status: 'failed', error: 'Failed to scrape content', title: song.title, artist: song.artist };
    }

    // 3. Construire l'objet final
    const finalSong = {
      title: song.title, 
      author: song.artist,
      content: scrapedSong.content,
      source: 'Ultimate Guitar',
      url: bestVersion.url,
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
      sourceSite: scrapedSong.source,
      tabId: scrapedSong.tabId,
      songGenre: scrapedSong.songGenre
    };

    // 4. Déterminer le dossier
    // Priority: 
    // 1. Explicit mapping from AI (folderMap)
    // 2. Explicit target folder selected by user (targetFolderId)
    // 3. Genre-based auto-organization (if genre exists)
    let songFolderId = folderMap.get(`${song.title}|${song.artist}`) || targetFolderId;

    if (!songFolderId && finalSong.songGenre) {
      const genreKey = finalSong.songGenre.toLowerCase().trim();
      
      if (genreKey) {
        // Check if we already have a folder ID for this genre
        if (genreToFolderId[genreKey]) {
          songFolderId = genreToFolderId[genreKey];
        } else if (pendingFolderCreations[genreKey]) {
          // Wait for pending creation
          songFolderId = await pendingFolderCreations[genreKey];
        } else {
          // Create new folder for genre
          // Create promise immediately to block other concurrent requests for same genre
          const creationPromise = (async () => {
            try {
              console.log(`📁 Auto-creating folder for genre: ${finalSong.songGenre}`);
              const newFolder = await folderRepo(clientSupabase).createFolder({ 
                name: finalSong.songGenre!
              });
              
              const newId = newFolder.id;
              genreToFolderId[genreKey] = newId; // Update cache
              return newId;
            } catch (err) {
              console.error(`Failed to create genre folder ${finalSong.songGenre}:`, err);
              // Remove from pending so we can retry or fail gracefully next time, 
              // but here we just return undefined to skip folder assignment
              delete pendingFolderCreations[genreKey];
              return undefined as unknown as string;
            }
          })();
          
          pendingFolderCreations[genreKey] = creationPromise;
          songFolderId = await creationPromise;
        }
      }
    }

    // 5. Importer en DB
    const importStatus = await importSongToDatabase(
      finalSong, 
      userId, 
      songFolderId, 
      clientSupabase
    );

    if (importStatus === 'error') {
      return { status: 'failed', error: 'Database import failed', title: song.title, artist: song.artist };
    }

    return { status: importStatus, title: song.title, artist: song.artist };

  } catch (error) {
    return { 
      status: 'failed', 
      error: error instanceof Error ? error.message : 'Unknown error', 
      title: song.title, 
      artist: song.artist 
    };
  }
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

  // Initialize genre mapping state
  const genreToFolderId: GenreFolderMap = {};
  const pendingFolderCreations: PendingFolderCreations = {};

  try {
    // Pre-load existing folders to populate genreToFolderId
    if (clientSupabase) {
      try {
        const existingFolders = await folderRepo(clientSupabase).getAllFolders();
        existingFolders.forEach(f => {
          genreToFolderId[f.name.toLowerCase().trim()] = f.id;
        });
        console.log(`📁 Loaded ${existingFolders.length} existing folders for genre matching`);
      } catch (err) {
        console.warn('Failed to load existing folders:', err);
      }
    }

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
        current: 0,
        total: validSongs.length,
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
          // Check if folder already exists (via genre/name map) to avoid duplicates even here
          const folderNameKey = aiFolder.name.toLowerCase().trim();
          let folderId = genreToFolderId[folderNameKey];

          if (!folderId) {
             console.log(`📁 Creating folder: ${aiFolder.name} with ${aiFolder.songs.length} songs`);
             const folder = await folderRepo(clientSupabase).createFolder({ 
               name: aiFolder.name,
             });
             console.log(`✅ Folder created with ID: ${folder.id}`);
             folderId = folder.id;
             genreToFolderId[folderNameKey] = folderId; // Update cache

             // Ajouter le dossier aux résultats
            result.aiFolders!.push({
              id: folder.id,
              name: folder.name,
              songsCount: aiFolder.songs.length
            });
          } else {
             console.log(`📁 Using existing folder for group: ${aiFolder.name}`);
          }
          
          for (const song of aiFolder.songs) {
            folderMap.set(`${song.title}|${song.artist}`, folderId);
            console.log(`🎵 Mapped "${song.title}" by "${song.artist}" to folder "${aiFolder.name}"`);
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

    // Étape 3: Traitement par lots (Batching)
    console.log(`🎵 Step 3: Processing ${validSongs.length} songs with batching...`);
    const BATCH_SIZE = 3; // Limite de concurrence
    let processedCount = 0;

    for (let i = 0; i < validSongs.length; i += BATCH_SIZE) {
      const batch = validSongs.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i/BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(validSongs.length/BATCH_SIZE);
      
      console.log(`📦 Processing batch ${batchNum}/${totalBatches} (${batch.length} songs)`);
      
      onProgress?.({
        current: processedCount,
        total: validSongs.length,
        currentSong: `Traitement lot ${batchNum}/${totalBatches}...`,
        status: 'importing'
      });

      // Exécuter le lot en parallèle
      const batchResults = await Promise.all(batch.map(song => 
        processSong(song, folderMap, targetFolderId, userId, clientSupabase, genreToFolderId, pendingFolderCreations)
      ));

      // Agréger les résultats
      for (const res of batchResults) {
        processedCount++;
        if (res.status === 'success') {
          result.success++;
          console.log(`✅ Imported: ${res.title}`);
        } else if (res.status === 'duplicate') {
          result.duplicates++;
          console.log(`⚠️ Duplicate: ${res.title}`);
        } else {
          result.failed++;
          result.errors.push(`${res.title}: ${res.error}`);
          console.error(`❌ Failed: ${res.title} - ${res.error}`);
        }
        
        result.songs.push({
          title: res.title,
          artist: res.artist,
          status: res.status,
          error: res.error
        });
      }

      // Update progress after batch
      onProgress?.({
        current: processedCount,
        total: validSongs.length,
        currentSong: `Importé: ${processedCount}/${validSongs.length}`,
        status: 'importing'
      });

      // Petit délai entre les lots pour éviter le rate limiting
      if (i + BATCH_SIZE < validSongs.length) {
        await new Promise(resolve => setTimeout(resolve, 1500));
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
    console.error('Global import error:', error);
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
    const existingSongs = await songRepo(clientSupabase).searchSongs(
      `${scrapedSong.title} ${scrapedSong.author}`
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
      sourceSite: scrapedSong.source,
      tabId: scrapedSong.tabId ? scrapedSong.tabId.toString() : undefined,
      genre: scrapedSong.songGenre
    };
    
    console.log(`💾 Creating song with metadata:`, {
      key: newSongData.key,
      capo: newSongData.capo,
      rating: newSongData.rating,
      difficulty: newSongData.difficulty,
      reviews: newSongData.reviews
    });
    
    const createdSong = await songRepo(clientSupabase).createSong(newSongData);
    console.log(`✅ Successfully imported: ${createdSong.title} (ID: ${createdSong.id})`);
    return 'success';
    
  } catch (error) {
    console.error('Error importing song to database:', error);
    return 'error';
  }
}
