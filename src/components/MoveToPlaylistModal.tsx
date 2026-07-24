'use client'

import { useEffect, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import type { Playlist } from '@/types'

interface MoveToPlaylistModalProps {
  isOpen: boolean
  onClose: () => void
  playlists: Playlist[]
  onMove: (playlistIds: string[], removeFromSource: boolean) => Promise<void>
  songCount: number
  currentPlaylistId?: string | null
  /** How many of the selected songs already belong to each playlist (by playlist id). */
  membershipCounts?: Map<string, number>
}

export default function MoveToPlaylistModal({
  isOpen,
  onClose,
  playlists,
  onMove,
  songCount,
  currentPlaylistId,
  membershipCounts,
}: MoveToPlaylistModalProps) {
  const { t } = useLanguage()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [removeFromSource, setRemoveFromSource] = useState(false)
  const [isMoving, setIsMoving] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setSelectedIds(new Set())
    }
    setRemoveFromSource(Boolean(currentPlaylistId))
  }, [isOpen, currentPlaylistId])

  if (!isOpen) return null

  const toggle = (playlistId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(playlistId)) next.delete(playlistId)
      else next.add(playlistId)
      return next
    })
  }

  const handleMove = async () => {
    if (selectedIds.size === 0 || isMoving) return
    setIsMoving(true)
    try {
      await onMove(Array.from(selectedIds), removeFromSource)
      onClose()
    } catch (error) {
      console.error('Error moving songs to playlist:', error)
    } finally {
      setIsMoving(false)
    }
  }

  const renderMembershipBadge = (playlistId: string) => {
    const count = membershipCounts?.get(playlistId) ?? 0
    if (count <= 0) return null
    const allIn = songCount > 0 && count >= songCount
    const label = allIn
      ? t('admin.alreadyInAll')
      : t('admin.alreadyInSome')
          .replace('{count}', String(count))
          .replace('{total}', String(songCount))
    return (
      <span
        className={cn(
          'ml-auto shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium',
          allIn
            ? 'bg-primary/15 text-primary'
            : 'bg-muted text-muted-foreground'
        )}
      >
        {label}
      </span>
    )
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
          <div className="max-h-[260px] space-y-1 overflow-y-auto">
            {playlists.map((playlist) => {
              const checked = selectedIds.has(playlist.id)
              return (
                <button
                  key={playlist.id}
                  type="button"
                  role="checkbox"
                  aria-checked={checked}
                  onClick={() => toggle(playlist.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition-colors',
                    checked ? 'bg-primary/10 ring-1 ring-primary/30' : 'hover:bg-muted'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors',
                      checked
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border'
                    )}
                    aria-hidden
                  >
                    {checked && <CheckIcon className="h-3.5 w-3.5" strokeWidth={3} />}
                  </span>
                  <span className="truncate">{playlist.name}</span>
                  {renderMembershipBadge(playlist.id)}
                </button>
              )
            })}
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
            disabled={isMoving || selectedIds.size === 0}
            className="min-h-11"
          >
            {isMoving ? t('songs.moving') : t('songs.move')}
          </Button>
        </div>
      </div>
    </div>
  )
}
