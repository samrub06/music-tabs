'use client'

import { useEffect, useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useLanguage } from '@/context/LanguageContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PlaylistCoverPicker } from '@/components/PlaylistCoverPicker'
import { resolveAutoCoverSlug } from '@/utils/playlistCover'

interface CreatePlaylistModalProps {
  isOpen: boolean
  onClose: () => void
  songCount: number
  onCreate: (name: string, coverSlug?: string) => Promise<void>
  genreId?: string
  songs?: { genre?: string }[]
}

export default function CreatePlaylistModal({
  isOpen,
  onClose,
  songCount,
  onCreate,
  genreId,
  songs,
}: CreatePlaylistModalProps) {
  const { t } = useLanguage()
  const [name, setName] = useState('')
  const [coverSlug, setCoverSlug] = useState<string | null>(null)
  const [coverTouched, setCoverTouched] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setName('')
      setCoverSlug(null)
      setCoverTouched(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (coverTouched) return
    const auto = resolveAutoCoverSlug({ name, genreId, songs })
    if (auto) setCoverSlug(auto)
  }, [name, genreId, songs, coverTouched])

  if (!isOpen) return null

  const handleCreate = async () => {
    const trimmed = name.trim()
    if (!trimmed || isCreating) return
    setIsCreating(true)
    try {
      await onCreate(trimmed, coverSlug ?? undefined)
      setName('')
      setCoverSlug(null)
      setCoverTouched(false)
      onClose()
    } catch (error) {
      console.error('Error creating playlist:', error)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-border bg-background p-5 shadow-lg sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-playlist-title"
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <h3 id="create-playlist-title" className="text-lg font-semibold text-foreground">
            {t('songs.createPlaylistTitle')}
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isCreating}
            className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={t('songs.cancel')}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-sm text-muted-foreground">
          {t('songs.createPlaylistDescription').replace('{count}', String(songCount))}
        </p>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="playlist-name">{t('songs.playlistName')}</Label>
            <Input
              id="playlist-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('songs.playlistNamePlaceholder')}
              className="h-11 rounded-xl"
              disabled={isCreating}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleCreate()
              }}
            />
          </div>

          <PlaylistCoverPicker
            value={coverSlug}
            onChange={(slug) => {
              setCoverTouched(true)
              setCoverSlug(slug)
            }}
            disabled={isCreating}
          />
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={isCreating} className="min-h-11">
            {t('songs.cancel')}
          </Button>
          <Button
            type="button"
            onClick={() => void handleCreate()}
            disabled={isCreating || !name.trim()}
            className="min-h-11"
          >
            {isCreating ? t('songs.creatingPlaylist') : t('songs.createPlaylist')}
          </Button>
        </div>
      </div>
    </div>
  )
}
