'use client'

import { useEffect, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { XMarkIcon } from '@heroicons/react/24/outline'
import type { Playlist } from '@/types'

interface MoveToPlaylistModalProps {
  isOpen: boolean
  onClose: () => void
  playlists: Playlist[]
  onMove: (playlistId: string, removeFromSource: boolean) => Promise<void>
  songCount: number
  currentPlaylistId?: string | null
}

export default function MoveToPlaylistModal({
  isOpen,
  onClose,
  playlists,
  onMove,
  songCount,
  currentPlaylistId,
}: MoveToPlaylistModalProps) {
  const { t } = useLanguage()
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | undefined>(undefined)
  const [removeFromSource, setRemoveFromSource] = useState(false)
  const [isMoving, setIsMoving] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setSelectedPlaylistId(undefined)
      setRemoveFromSource(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleMove = async () => {
    if (!selectedPlaylistId || isMoving) return
    setIsMoving(true)
    try {
      await onMove(selectedPlaylistId, removeFromSource)
      onClose()
    } catch (error) {
      console.error('Error moving songs to playlist:', error)
    } finally {
      setIsMoving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div
        className="flex max-h-[85vh] w-full max-w-md flex-col rounded-t-2xl border border-border bg-background shadow-lg sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between gap-2 border-b border-border p-5">
          <h3 className="text-lg font-semibold text-foreground">
            {t('admin.moveSongsTitle').replace('{count}', String(songCount))}
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isMoving}
            className="rounded-full p-2 text-muted-foreground hover:bg-muted"
            aria-label={t('common.cancel')}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <p className="mb-3 text-sm text-muted-foreground">
            {t('admin.selectDestinationPlaylist')}
          </p>
          <div className="max-h-[220px] space-y-1 overflow-y-auto">
            {playlists.map((playlist) => (
              <button
                key={playlist.id}
                type="button"
                onClick={() => setSelectedPlaylistId(playlist.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition-colors',
                  selectedPlaylistId === playlist.id
                    ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
                    : 'hover:bg-muted'
                )}
              >
                <span className="truncate">{playlist.name}</span>
              </button>
            ))}
          </div>

          {currentPlaylistId && (
            <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={removeFromSource}
                onChange={(e) => setRemoveFromSource(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              {t('admin.removeFromCurrentPlaylist')}
            </label>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-border p-5 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={isMoving} className="min-h-11">
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            onClick={() => void handleMove()}
            disabled={isMoving || !selectedPlaylistId}
            className="min-h-11"
          >
            {isMoving ? t('songs.moving') : t('songs.move')}
          </Button>
        </div>
      </div>
    </div>
  )
}
