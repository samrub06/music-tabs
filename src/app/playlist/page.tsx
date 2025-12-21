import { redirect } from 'next/navigation';
import { createSafeServerClient } from '@/lib/supabase/server';
import { songRepo } from '@/lib/services/songRepo';
import { folderRepo } from '@/lib/services/folderRepo';
import PlaylistPageClient from './PlaylistPageClient';

export default async function PlaylistPage() {
  const supabase = await createSafeServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  const [songs, folders] = await Promise.all([
    songRepo(supabase).getAllSongs(),
    folderRepo(supabase).getAllFolders()
  ]);

  return <PlaylistPageClient songs={songs} folders={folders} />;
}

