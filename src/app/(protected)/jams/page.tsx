import { redirect } from 'next/navigation';
import { createSafeServerClient } from '@/lib/supabase/server';
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
    songIds: [],
    imageUrl: p.imageUrl,
    songCount: p.songCount,
  }));

  // Songs load on playlist detail; list view only needs playlist names + counts
  return <PlaylistsClient playlists={playlistsFormatted as any} />;
}

