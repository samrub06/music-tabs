'use client'

import { useState, useTransition } from 'react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import type { Playlist } from '@/types'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface PlaylistChipSelectProps {
  songId: string
  songPlaylists: Playlist[]
  allPlaylists: Playlist[]
  onAdd: (songId: string, playlistId: string) => Promise<void>
  onRemove: (songId: string, playlistId: string) => Promise<void>
  t: (key: string) => string
}

export default function PlaylistChipSelect({
  songId,
  songPlaylists,
  allPlaylists,
  onAdd,
  onRemove,
  t,
}: PlaylistChipSelectProps) {
  const [pending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const memberIds = new Set(songPlaylists.map((p) => p.id))

  const handleToggle = (playlistId: string, checked: boolean) => {
    startTransition(async () => {
      try {
        if (checked) await onAdd(songId, playlistId)
        else await onRemove(songId, playlistId)
      } catch (error) {
        console.error('Failed to update song playlist:', error)
      }
    })
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={pending}
          aria-label={t('admin.managePlaylists')}
          className={cn(
            'flex max-w-[11rem] items-center gap-1 rounded-full border border-transparent px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-border hover:bg-muted/80 disabled:opacity-60',
            pending && 'opacity-60'
          )}
        >
          <span className="flex min-w-0 flex-wrap items-center justify-end gap-1">
            {songPlaylists.length > 0 ? (
              <>
                {songPlaylists.slice(0, 2).map((playlist) => (
                  <span
                    key={playlist.id}
                    className="max-w-[7.5rem] truncate rounded-full bg-muted/80 px-2 py-0.5"
                  >
                    {playlist.name}
                  </span>
                ))}
                {songPlaylists.length > 2 && (
                  <span className="rounded-full bg-muted/80 px-2 py-0.5">
                    +{songPlaylists.length - 2}
                  </span>
                )}
              </>
            ) : (
              <span className="text-muted-foreground/70">{t('admin.notInPlaylist')}</span>
            )}
          </span>
          <ChevronDownIcon className="h-3 w-3 shrink-0" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-72 w-56">
        <DropdownMenuLabel>{t('admin.managePlaylists')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {allPlaylists.map((playlist) => (
          <DropdownMenuCheckboxItem
            key={playlist.id}
            checked={memberIds.has(playlist.id)}
            disabled={pending}
            onSelect={(e) => e.preventDefault()}
            onCheckedChange={(checked) => handleToggle(playlist.id, checked)}
          >
            <span className="block truncate">{playlist.name}</span>
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
