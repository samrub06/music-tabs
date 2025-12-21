import { NextRequest, NextResponse } from 'next/server';
import { songService } from '@/lib/services/songService';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { 
  generatePlaylistSequence, 
  getSongsFromFolders, 
  getRandomSongs,
  PlaylistOptions 
} from '@/lib/services/playlistGeneratorService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      targetKey, 
      selectedFolders = [], 
      selectedSongs = [], 
      genre,
      useRandomSelection = false,
      maxSongs = 10 
    }: PlaylistOptions = body;

    // Try to get songs from Supabase first, fallback to local file
    let songs = [];
    try {
      console.log('Attempting to fetch songs from Supabase (server-side)...');
      // Use service role on server to read songs regardless of client session
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
      if (!supabaseUrl || !serviceKey) {
        throw new Error('Missing Supabase env vars');
      }
      const serverClient = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
      const songsResult = await songService.getAllSongs(serverClient);
      songs = songsResult.songs;
      console.log('✅ Songs fetched from Supabase:', songs?.length || 0, 'songs');
      
      // If no songs from Supabase, try fallback
      if (!songs || songs.length === 0) {
        console.log('❌ No songs from Supabase, falling back to local file');
        const DATA_FILE_PATH = path.join(process.cwd(), 'src/data/sampleData.json');
        const fileContents = fs.readFileSync(DATA_FILE_PATH, 'utf8');
        const data = JSON.parse(fileContents);
        songs = data.songs || [];
        console.log('✅ Songs fetched from local file:', songs?.length || 0, 'songs');
      }
    } catch (error: any) {
      console.log('❌ Supabase failed, falling back to local file:', error.message);
      // Fallback to local file
      const DATA_FILE_PATH = path.join(process.cwd(), 'src/data/sampleData.json');
      const fileContents = fs.readFileSync(DATA_FILE_PATH, 'utf8');
      const data = JSON.parse(fileContents);
      songs = data.songs || [];
      console.log('✅ Songs fetched from local file:', songs?.length || 0, 'songs');
    }

    console.log('First song sample:', songs);

    if (!songs || songs.length === 0) {
      console.log('No songs found in database');
      return NextResponse.json({ 
        songs: [], 
        totalScore: 0, 
        keyProgression: [], 
        estimatedDuration: 0 
      });
    }

    let candidateSongs = songs;
    console.log('Initial candidate songs:', candidateSongs.length);

    // Filter by folders if specified
    if (selectedFolders.length > 0) {
      candidateSongs = getSongsFromFolders(songs, selectedFolders);
      console.log('After folder filtering:', candidateSongs.length);
    }

    // Filter by specific songs if specified
    if (selectedSongs.length > 0) {
      candidateSongs = candidateSongs.filter((song: any) => 
        selectedSongs.includes(song.id)
      );
      console.log('After song filtering:', candidateSongs.length);
    }

    // Use random selection if requested
    if (useRandomSelection) {
      console.log('Using random selection, maxSongs:', maxSongs);
      candidateSongs = getRandomSongs(candidateSongs, maxSongs);
      console.log('After random selection:', candidateSongs.length);
    }

    console.log('Final candidate songs for playlist:', candidateSongs.length);
    console.log('Sample candidate songs:', candidateSongs.slice(0, 3).map((s: any) => ({ 
      id: s.id, 
      title: s.title, 
      key: s.key, 
      firstChord: s.firstChord, 
      lastChord: s.lastChord,
      genre: s.genre
    })));

    console.log(targetKey)
    console.log(candidateSongs)

    // Generate playlist sequence
    const playlistResult = generatePlaylistSequence(candidateSongs, {
      targetKey,
      selectedFolders,
      selectedSongs,
      genre,
      useRandomSelection,
      maxSongs
    });

    console.log('Generated playlist result:', {
      songsCount: playlistResult.songs.length,
      totalScore: playlistResult.totalScore,
      keyProgression: playlistResult.keyProgression
    });

    return NextResponse.json(playlistResult);

  } catch (error) {
    console.error('Error generating playlist:', error);
    return NextResponse.json(
      { error: 'Failed to generate playlist' }, 
      { status: 500 }
    );
  }
}

