'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PlaylistGenerator from '@/components/PlaylistGenerator';
import PlaylistView from '@/components/PlaylistView';
import { PlaylistResult } from '@/lib/services/playlistGeneratorService';
import { Song, Folder } from '@/types';
import { createPlaylistFromGeneratedPlaylistAction } from '@/app/(protected)/dashboard/actions';

interface PlaylistPageClientProps {
  songs: Song[];
  folders: Folder[];
}

export default function PlaylistPageClient({ songs, folders }: PlaylistPageClientProps) {
  const router = useRouter();
  const [generatedPlaylist, setGeneratedPlaylist] = useState<PlaylistResult | null>(null);
  const [generatorGenreId, setGeneratorGenreId] = useState<string | undefined>();

  const handlePlaylistGenerated = (result: PlaylistResult, meta?: { genreId?: string }) => {
    setGeneratedPlaylist(result);
    setGeneratorGenreId(meta?.genreId);
  };

  const handleSongSelect = (song: { id: string }) => {
    router.push(`/song/${song.id}`);
  };

  const handleCreatePlaylist = async (name: string, playlist: PlaylistResult, coverSlug?: string) => {
    await createPlaylistFromGeneratedPlaylistAction(name, playlist, coverSlug, generatorGenreId);
  };

  return (
    <div className="flex flex-1 flex-col min-h-0 overflow-y-auto bg-background p-4 sm:p-6">
      <div className="mx-auto w-full max-w-xl space-y-4">
        <PlaylistGenerator
          songs={songs}
          folders={folders}
          onPlaylistGenerated={handlePlaylistGenerated}
        />
        {generatedPlaylist && (
          <PlaylistView
            playlist={generatedPlaylist}
            onSongSelect={handleSongSelect}
            onCreatePlaylist={handleCreatePlaylist}
            genreId={generatorGenreId}
          />
        )}
      </div>
    </div>
  );
}
