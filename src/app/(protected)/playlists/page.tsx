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

  const [songs, playlists] = await Promise.all([
    songRepo(supabase).getAllSongs(),
    playlistRepo(supabase).getAllPlaylists()
  ]);

  return <PlaylistsClient songs={songs} playlists={playlists} />;
}

