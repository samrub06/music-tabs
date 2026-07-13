'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PlaylistGenerator from '@/components/PlaylistGenerator'
import PlaylistView from '@/components/PlaylistView'
import { PlaylistResult } from '@/lib/services/playlistGeneratorService'
import { Song, Folder } from '@/types'
import { createPlaylistFromGeneratedPlaylistAction } from '@/app/(protected)/dashboard/actions'
import { useLanguage } from '@/context/LanguageContext'

interface PlaylistPageClientProps {
  songs: Song[]
  folders: Folder[]
}

export default function PlaylistPageClient({ songs, folders }: PlaylistPageClientProps) {
  const router = useRouter()
  const { t } = useLanguage()
  const [generatedPlaylist, setGeneratedPlaylist] = useState<PlaylistResult | null>(null)
  const [generatorGenreId, setGeneratorGenreId] = useState<string | undefined>()

  const handlePlaylistGenerated = (result: PlaylistResult, meta?: { genreId?: string }) => {
    setGeneratedPlaylist(result)
    setGeneratorGenreId(meta?.genreId)
  }

  const handleSongSelect = (song: { id: string }) => {
    router.push(`/song/${song.id}`)
  }

  const handleCreatePlaylist = async (name: string, playlist: PlaylistResult, coverSlug?: string) => {
    await createPlaylistFromGeneratedPlaylistAction(name, playlist, coverSlug, generatorGenreId)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-background p-4 sm:p-6">
      <div className="mx-auto w-full max-w-xl space-y-5">
        <div className="space-y-1.5">
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {t('createMenu.createPlaylist')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('createMenu.createPlaylistDescription')}
          </p>
        </div>

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
  )
}
