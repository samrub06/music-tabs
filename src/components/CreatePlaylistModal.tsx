'use client'

import { useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useLanguage } from '@/context/LanguageContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface CreatePlaylistModalProps {
  isOpen: boolean
  onClose: () => void
  songCount: number
  onCreate: (name: string) => Promise<void>
}

export default function CreatePlaylistModal({
  isOpen,
  onClose,
  songCount,
  onCreate,
}: CreatePlaylistModalProps) {
  const { t } = useLanguage()
  const [name, setName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  if (!isOpen) return null

  const handleCreate = async () => {
    const trimmed = name.trim()
    if (!trimmed || isCreating) return
    setIsCreating(true)
    try {
      await onCreate(trimmed)
      setName('')
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
        className="w-full max-w-md rounded-t-2xl border border-border bg-background p-5 shadow-lg sm:rounded-2xl"
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
