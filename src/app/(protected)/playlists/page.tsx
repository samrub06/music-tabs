import { redirect } from 'next/navigation';
import { createSafeServerClient } from '@/lib/supabase/server';
import { songRepo } from '@/lib/services/songRepo';
import { playlistRepo } from '@/lib/services/playlistRepo';
import PlaylistsClient from './PlaylistsClient';

export default async function PlaylistsPage() {
  const supabase = await createSafeServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  // Use lightweight version for playlists - only load id, name, songCount
  // Songs will be loaded when user clicks on a playlist
  const playlistsLightweight = await playlistRepo(supabase).getAllPlaylistsLightweight();
  
  // Convert to Playlist format with songCount for compatibility
  const playlistsFormatted = playlistsLightweight.map(p => ({
    id: p.id,
    name: p.name,
    description: undefined,
    createdAt: p.createdAt,
    updatedAt: p.createdAt,
    songIds: [], // Will be loaded when playlist is clicked
    songCount: p.songCount // Add songCount for display
  }));

  // Don't load all songs initially - they'll be loaded when needed
  return <PlaylistsClient songs={[]} playlists={playlistsFormatted as any} />;
}

