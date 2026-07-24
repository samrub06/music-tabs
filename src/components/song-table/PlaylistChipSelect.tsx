'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
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
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const memberIds = new Set(songPlaylists.map((p) => p.id))

  useEffect(() => {
    if (!open) return
    const id = setTimeout(() => inputRef.current?.focus(), 0)
    return () => clearTimeout(id)
  }, [open])

  const filteredPlaylists = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return allPlaylists
    return allPlaylists.filter((p) => p.name.toLowerCase().includes(q))
  }, [allPlaylists, query])

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
    <DropdownMenu
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setQuery('')
      }}
    >
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
      <DropdownMenuContent align="end" className="w-56 overflow-hidden">
        <DropdownMenuLabel>{t('admin.managePlaylists')}</DropdownMenuLabel>
        <div className="px-1 pb-1">
          <div className="relative">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder={t('common.search')}
              className="w-full rounded-md border border-border bg-background py-1.5 pl-7 pr-2 text-xs outline-none focus:border-primary"
            />
          </div>
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-56 overflow-y-auto">
          {filteredPlaylists.length > 0 ? (
            filteredPlaylists.map((playlist) => (
              <DropdownMenuCheckboxItem
                key={playlist.id}
                checked={memberIds.has(playlist.id)}
                disabled={pending}
                onSelect={(e) => e.preventDefault()}
                onCheckedChange={(checked) => handleToggle(playlist.id, checked)}
              >
                <span className="block truncate">{playlist.name}</span>
              </DropdownMenuCheckboxItem>
            ))
          ) : (
            <p className="px-2 py-3 text-center text-xs text-muted-foreground">
              {t('folders.noResults')}
            </p>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
