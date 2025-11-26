import { redirect } from 'next/navigation';
import { createServerClientSupabase } from '@/lib/supabase/server';
import { songService } from '@/lib/services/songService';
import { folderService } from '@/lib/services/folderService';
import MedleyPageClient from './MedleyPageClient';

export default async function MedleyPage() {
  const supabase = await createServerClientSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  const [songsResult, folders] = await Promise.all([
    songService.getAllSongs(supabase),
    folderService.getAllFolders(supabase)
  ]);

  return <MedleyPageClient songs={songsResult.songs} folders={folders} />;
}
