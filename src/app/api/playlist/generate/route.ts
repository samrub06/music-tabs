import { NextRequest, NextResponse } from 'next/server';
import { songService } from '@/lib/services/songService';
import { createClient } from '@supabase/supabase-js';
import {
  generatePlaylistSequence,
  getSongsFromFolders,
  getRandomSongs,
  PlaylistOptions,
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
      maxSongs = 10,
    }: PlaylistOptions = body;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: 'Playlist generation is not configured' },
        { status: 503 }
      );
    }

    const serverClient = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });
    const songsResult = await songService.getAllSongs(serverClient);
    const songs = songsResult.songs ?? [];

    if (songs.length === 0) {
      return NextResponse.json({
        songs: [],
        totalScore: 0,
        keyProgression: [],
        estimatedDuration: 0,
      });
    }

    let candidateSongs = songs;

    if (selectedFolders.length > 0) {
      candidateSongs = getSongsFromFolders(songs, selectedFolders);
    }

    if (selectedSongs.length > 0) {
      candidateSongs = candidateSongs.filter((song) =>
        selectedSongs.includes(song.id)
      );
    }

    if (useRandomSelection) {
      candidateSongs = getRandomSongs(candidateSongs, maxSongs);
    }

    const playlistResult = generatePlaylistSequence(candidateSongs, {
      targetKey,
      selectedFolders,
      selectedSongs,
      genre,
      useRandomSelection,
      maxSongs,
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
