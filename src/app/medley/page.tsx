import { redirect } from 'next/navigation';
import { createSafeServerClient } from '@/lib/supabase/server';
import { songRepo } from '@/lib/services/songRepo';
import { folderRepo } from '@/lib/services/folderRepo';
import MedleyPageClient from './MedleyPageClient';

export default async function MedleyPage() {
  const supabase = await createSafeServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  const [songs, folders] = await Promise.all([
    songRepo(supabase).getAllSongs(),
    folderRepo(supabase).getAllFolders()
  ]);

  return <MedleyPageClient songs={songs} folders={folders} />;
}
