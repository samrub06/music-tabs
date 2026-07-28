'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import {
  FolderPlusIcon,
  ListBulletIcon,
  MusicalNoteIcon,
  PlayIcon,
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/context/LanguageContext'
import { GlassActionTile } from '@/components/library/GlassActionTile'
import {
  deriveRelatedArtists,
  VignetteGlossHint,
} from '@/components/library/PlaylistGlassHeader'
import type { Song } from '@/types'

export interface PlaylistCarouselDockProps {
  /** Active song title (center). */
  activeTitle: ReactNode
  activeSubtitle?: ReactNode
  coverUrl: string | null
  playlistTitle: string
  songCount: number
  songs: Song[]
  onPlay: () => void
  onShowList: () => void
  onAdd?: () => void
  canAdd?: boolean
  isAdding?: boolean
  addAriaLabel?: string
}

/**
 * Landscape disk-rack footer — single row:
 * List view | song title | cover vignette + separate Add / Play
 * Expanded cover: related artists; click outside / vignette again to shrink.
 */
export function PlaylistCarouselDock({
  activeTitle,
  activeSubtitle,
  coverUrl,
  playlistTitle,
  songCount,
  songs,
  onPlay,
  onShowList,
  onAdd,
  canAdd = true,
  isAdding = false,
  addAriaLabel,
}: PlaylistCarouselDockProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const vignetteRef = useRef<HTMLDivElement>(null)

  const relatedArtists = useMemo(() => deriveRelatedArtists(songs), [songs])

  useEffect(() => {
    if (!expanded) return

    const onPointerDown = (event: PointerEvent) => {
      const node = vignetteRef.current
      if (!node) return
      if (event.target instanceof Node && !node.contains(event.target)) {
        setExpanded(false)
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setExpanded(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [expanded])

  const resolvedAddAria = addAriaLabel || t('library.addPlaylistToFolders')
  const songCountLabel =
    songCount === 1
      ? `1 ${t('playlistView.songs').slice(0, -1)}`
      : `${songCount} ${t('playlistView.songs')}`
  const artistCount = relatedArtists.length
  const artistCountLabel =
    artistCount === 1
      ? t('library.relatedArtistsCountOne')
      : t('library.relatedArtistsCount').replace('{count}', String(artistCount))

  return (
    <div
      className={cn(
        'relative shrink-0 bg-transparent px-3 pb-0 pt-0.5',
        // Below the rack (z-20) so carousel shadows can fall over this row
        expanded ? 'z-[90]' : 'z-10'
      )}
    >
      {expanded ? (
        <button
          type="button"
          aria-label={t('common.close')}
          className="fixed inset-0 z-[75] cursor-default bg-transparent"
          onClick={() => setExpanded(false)}
        />
      ) : null}

      <div className="relative z-[80] flex items-center gap-2">
        <button
          type="button"
          onClick={onShowList}
          className={cn(
            'inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-2.5',
            'border border-border/70 bg-background/80 text-foreground',
            'text-xs font-medium backdrop-blur-md transition-colors',
            'hover:bg-muted active:scale-[0.98]'
          )}
          aria-label={t('library.showListView')}
          title={t('library.showListView')}
        >
          <ListBulletIcon className="h-4 w-4 shrink-0" />
          <span className="truncate">{t('library.showListView')}</span>
        </button>

        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-sm font-semibold leading-tight tracking-tight text-foreground sm:text-base">
            {activeTitle}
          </p>
          {activeSubtitle ? (
            <p className="truncate text-[11px] leading-snug text-muted-foreground sm:text-xs">
              {activeSubtitle}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <div className="relative h-10 w-10 shrink-0">
            <div
              ref={vignetteRef}
              className={cn(
                'absolute bottom-0 right-0 z-[80] overflow-hidden rounded-xl bg-muted text-left',
                'border border-white/45 shadow-[0_18px_40px_-8px_rgba(0,0,0,0.55)]',
                'ring-1 ring-inset ring-white/30 transition-[width,height] duration-300 ease-out',
                expanded ? 'h-56 w-[min(18rem,70vw)] rounded-2xl' : 'h-10 w-10'
              )}
            >
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
                aria-label={playlistTitle}
                className="absolute inset-0 z-[2]"
              />

              {coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverUrl}
                  alt=""
                  className={cn(
                    'pointer-events-none absolute inset-0 h-full w-full object-cover transition-transform duration-300',
                    expanded ? 'scale-105' : 'scale-100'
                  )}
                />
              ) : (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/80 to-primary">
                  <MusicalNoteIcon className="h-5 w-5 text-primary-foreground/90" />
                </div>
              )}

              <div
                className={cn(
                  'pointer-events-none absolute inset-0',
                  expanded
                    ? 'bg-gradient-to-t from-black/90 via-black/55 to-black/25'
                    : 'bg-gradient-to-t from-black/50 via-transparent to-transparent'
                )}
              />

              <VignetteGlossHint active={expanded} />

              {expanded ? (
                <div className="pointer-events-none relative z-[3] flex h-full flex-col justify-end p-2.5">
                  <div className="mb-auto self-stretch text-left">
                    <p className="truncate text-sm font-bold text-white drop-shadow">
                      {playlistTitle}
                    </p>
                    <p className="truncate text-[11px] text-white/85">
                      {songCountLabel}
                      {artistCount > 0 ? ` · ${artistCountLabel}` : null}
                    </p>
                  </div>

                  <div
                    className="pointer-events-auto mt-2 min-h-0 max-h-28 overflow-y-auto overscroll-contain"
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <p className="mb-1.5 text-[10px] font-medium text-white/90">
                      {t('library.relatedArtists')}
                    </p>
                    {relatedArtists.length === 0 ? (
                      <p className="text-[10px] text-white/65">
                        {t('library.relatedArtistsEmpty')}
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {relatedArtists.map((artist) => (
                          <button
                            key={artist.name}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(
                                `/search?q=${encodeURIComponent(artist.name)}`
                              )
                            }}
                            className={cn(
                              'inline-flex max-w-full items-center gap-1.5 rounded-full',
                              'border border-white/25 bg-white/15 backdrop-blur-md',
                              'px-1.5 py-0.5 text-left text-[10px] text-white transition-colors',
                              'hover:bg-white/25'
                            )}
                          >
                            <span className="relative h-5 w-5 shrink-0 overflow-hidden rounded-full bg-white/20">
                              {artist.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={artist.imageUrl}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="flex h-full w-full items-center justify-center text-[8px] font-bold">
                                  {artist.name.slice(0, 1).toUpperCase()}
                                </span>
                              )}
                            </span>
                            <span className="truncate">{artist.name}</span>
                            <span className="shrink-0 text-white/60">
                              {artist.songCount}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {onAdd ? (
            <GlassActionTile
              onClick={onAdd}
              disabled={!canAdd || songCount === 0}
              loading={isAdding}
              compact
              variant="clear"
              aria-label={resolvedAddAria}
              title={resolvedAddAria}
              className="!h-10 !w-10 !rounded-xl"
            >
              <FolderPlusIcon className="h-4 w-4" />
            </GlassActionTile>
          ) : null}
          <GlassActionTile
            onClick={onPlay}
            disabled={songCount === 0}
            compact
            variant="primary"
            aria-label={t('playlistView.startPlaylist')}
            className="!h-10 !w-10 !rounded-xl relative z-[50]"
          >
            <PlayIcon className="h-4 w-4" />
          </GlassActionTile>
        </div>
      </div>
    </div>
  )
}
