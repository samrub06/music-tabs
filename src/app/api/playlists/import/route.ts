import {
    importPlaylistSongs,
    scrapeUltimateGuitarPlaylists
} from '@/lib/services/scraperService';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cookies, targetFolderId, maxConcurrent = 3 } = body;

    if (!cookies) {
      return NextResponse.json(
        { error: 'Cookies are required for authentication' },
        { status: 400 }
      );
    }

    // 1. Scraper les playlists depuis Ultimate Guitar
    console.log('Scraping Ultimate Guitar playlists...');
    const playlists = await scrapeUltimateGuitarPlaylists(cookies);
    
    if (playlists.length === 0) {
      return NextResponse.json(
        { error: 'No playlists found or authentication failed' },
        { status: 404 }
      );
    }

    console.log(`Found ${playlists.length} playlists`);

    // 2. Importer les chansons de la première playlist (ou toutes si demandé)
    const results = {
      totalPlaylists: playlists.length,
      playlists: [] as any[],
      summary: {
        totalSongs: 0,
        successfulImports: 0,
        failedImports: 0,
        errors: [] as string[]
      }
    };

    for (const playlist of playlists) {
      console.log(`Processing playlist: ${playlist.name} (${playlist.songs.length} songs)`);
      
      const playlistResults = await importPlaylistSongs(
        playlist, 
        targetFolderId, 
        maxConcurrent
      );

      results.playlists.push({
        name: playlist.name,
        songCount: playlist.songs.length,
        success: playlistResults.success,
        failed: playlistResults.failed,
        errors: playlistResults.errors
      });

      results.summary.totalSongs += playlist.songs.length;
      results.summary.successfulImports += playlistResults.success;
      results.summary.failedImports += playlistResults.failed;
      results.summary.errors.push(...playlistResults.errors);
    }

    return NextResponse.json({
      message: 'Playlist import completed',
      results
    });

  } catch (error) {
    console.error('Error importing playlists:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to import playlists',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint pour récupérer les playlists sans les importer
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cookies = searchParams.get('cookies');

    if (!cookies) {
      return NextResponse.json(
        { error: 'Cookies parameter is required' },
        { status: 400 }
      );
    }

    // Scraper les playlists sans les importer
    const playlists = await scrapeUltimateGuitarPlaylists(cookies);
    
    // Retourner seulement les métadonnées des playlists
    const playlistMetadata = playlists.map(playlist => ({
      name: playlist.name,
      songCount: playlist.songs.length,
      songs: playlist.songs.map(song => ({
        title: song.title,
        artist: song.artist,
        url: song.url
      }))
    }));

    return NextResponse.json({
      playlists: playlistMetadata,
      totalPlaylists: playlists.length
    });

  } catch (error) {
    console.error('Error fetching playlists:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch playlists',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
