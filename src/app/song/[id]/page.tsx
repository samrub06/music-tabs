import { redirect } from 'next/navigation';
import { createSafeServerClient } from '@/lib/supabase/server';
import { songService } from '@/lib/services/songService';
import SongViewerContainerSSR from '@/components/containers/SongViewerContainerSSR';
import { updateSongAction, deleteSongAction } from './actions';

export default async function SongPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createSafeServerClient();
  const { id } = await params;
  const songId = id;

  // Load song from database
  const song = await songService.getSongById(songId, supabase);

  if (!song) {
    redirect('/library');
  }

  return (
    <SongViewerContainerSSR 
      song={song} 
      onUpdate={updateSongAction}
      onDelete={deleteSongAction}
    />
  );
}
