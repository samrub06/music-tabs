'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronDownIcon,
  FolderPlusIcon,
  MusicalNoteIcon,
  PlayIcon,
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/context/LanguageContext'
import { useLandscapeMobile } from '@/lib/hooks/useLandscapeMobile'
import { GlassActionTile } from '@/components/library/GlassActionTile'
import type { Song } from '@/types'

export interface RelatedArtistChip {
  name: string
  imageUrl: string | null
  songCount: number
}

function normalizeAuthor(author: string): string {
  return author.trim().replace(/\s+/g, ' ')
}

export function deriveRelatedArtists(songs: Song[], limit = 12): RelatedArtistChip[] {
  const byAuthor = new Map<
    string,
    { name: string; imageUrl: string | null; songCount: number }
  >()

  for (const song of songs) {
    const name = normalizeAuthor(song.author || '')
    if (!name) continue
    const key = name.toLowerCase()
    const existing = byAuthor.get(key)
    const imageUrl = song.artistImageUrl || song.songImageUrl || null
    if (!existing) {
      byAuthor.set(key, { name, imageUrl, songCount: 1 })
    } else {
      existing.songCount += 1
      if (!existing.imageUrl && imageUrl) existing.imageUrl = imageUrl
    }
  }

  return Array.from(byAuthor.values())
    .sort((a, b) => b.songCount - a.songCount || a.name.localeCompare(b.name))
    .slice(0, limit)
}

const glassPanelClass = cn(
  'relative overflow-hidden rounded-2xl border border-white/30 dark:border-white/15',
  'bg-white/55 dark:bg-white/10 backdrop-blur-xl',
  'shadow-[0_8px_24px_-10px_rgba(0,0,0,0.28)]',
  'ring-1 ring-inset ring-white/35 dark:ring-white/10'
)

interface PlaylistGlassHeaderProps {
  coverUrl: string | null
  title: string
  songCount: number
  songs: Song[]
  onPlay: () => void
  /** When omitted, the Add box is hidden (Play stays as its own box). */
  onAdd?: () => void
  addLabel?: string
  addAriaLabel?: string
  addIcon?: ReactNode
  canAdd?: boolean
  isAdding?: boolean
  toolbar?: ReactNode
  className?: string
  subtitle?: ReactNode
}

export function PlaylistGlassHeader({
  coverUrl,
  title,
  songCount,
  songs,
  onPlay,
  onAdd,
  addLabel,
  addAriaLabel,
  addIcon,
  canAdd = true,
  isAdding = false,
  toolbar,
  className,
  subtitle,
}: PlaylistGlassHeaderProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const isLandscapeMobile = useLandscapeMobile()
  const [expanded, setExpanded] = useState(false)

  const relatedArtists = useMemo(() => deriveRelatedArtists(songs), [songs])
  const artistCount = relatedArtists.length

  const songCountLabel =
    songCount === 1
      ? `1 ${t('playlistView.songs').slice(0, -1)}`
      : `${songCount} ${t('playlistView.songs')}`

  const artistCountLabel =
    artistCount === 1
      ? t('library.relatedArtistsCountOne')
      : t('library.relatedArtistsCount').replace('{count}', String(artistCount))

  const resolvedAddLabel = addLabel || t('library.addPlaylistToFolders')
  const resolvedAddAria = addAriaLabel || resolvedAddLabel

  // Prefer playlist cover; fall back to first song art so the left box is never empty glass.
  const displayCoverUrl =
    coverUrl ||
    songs.find((s) => s.songImageUrl || s.artistImageUrl)?.songImageUrl ||
    songs.find((s) => s.artistImageUrl)?.artistImageUrl ||
    null

  return (
    <div
      className={cn(
        'shrink-0',
        isLandscapeMobile ? 'px-2 pt-1.5' : 'px-3 pt-3 sm:px-4 md:px-6',
        className
      )}
    >
      {toolbar ? (
        <div className={cn('mb-2 flex items-center justify-end gap-1', isLandscapeMobile && 'mb-1')}>
          {toolbar}
        </div>
      ) : null}

      {/* Three separate UI boxes */}
      <div
        className={cn(
          'flex items-stretch',
          isLandscapeMobile ? 'gap-1.5' : 'gap-2 sm:gap-2.5'
        )}
      >
        {/* Box 1 — cover image fills the whole square (~20% → expands ~80%) */}
        <div
          className={cn(
            'relative overflow-hidden rounded-2xl border border-black/10 dark:border-white/15',
            'bg-muted shadow-[0_8px_24px_-10px_rgba(0,0,0,0.28)]',
            'transition-all duration-300',
            expanded
              ? cn(
                  'min-w-0 flex-[4]',
                  isLandscapeMobile ? 'min-h-[7.5rem]' : 'min-h-[11rem] sm:min-h-[12.5rem]'
                )
              : cn(
                  'aspect-square shrink-0 self-stretch',
                  isLandscapeMobile
                    ? 'w-[20%] min-w-[3.5rem] max-w-[5rem]'
                    : 'w-[20%] min-w-[5rem] max-w-[7rem]'
                )
          )}
        >
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-label={title}
            className="group absolute inset-0 w-full overflow-hidden text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
          >
            {displayCoverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displayCoverUrl}
                alt={title}
                className={cn(
                  'absolute inset-0 h-full w-full object-cover transition-transform duration-500',
                  expanded ? 'scale-105' : 'scale-100 group-hover:scale-[1.03]'
                )}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/80 to-primary">
                <MusicalNoteIcon
                  className={cn(
                    'text-primary-foreground/90',
                    isLandscapeMobile ? 'h-5 w-5' : 'h-7 w-7'
                  )}
                />
              </div>
            )}

            {expanded ? (
              <>
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/5" />
                <div
                  className={cn(
                    'relative z-[1] flex h-full flex-col justify-end',
                    isLandscapeMobile ? 'p-2' : 'p-3 sm:p-3.5'
                  )}
                >
                  <div className="flex items-end justify-between gap-2">
                    <div className="min-w-0">
                      <h1
                        className={cn(
                          'truncate font-bold tracking-tight text-white drop-shadow',
                          isLandscapeMobile ? 'text-sm' : 'text-lg sm:text-xl'
                        )}
                      >
                        {title}
                      </h1>
                      <p
                        className={cn(
                          'text-white/85',
                          isLandscapeMobile ? 'text-[10px]' : 'text-xs sm:text-sm'
                        )}
                      >
                        {songCountLabel}
                        {artistCount > 0 ? ` · ${artistCountLabel}` : null}
                      </p>
                    </div>
                    <ChevronDownIcon
                      className={cn(
                        'shrink-0 rotate-180 text-white/90',
                        isLandscapeMobile ? 'h-4 w-4' : 'h-5 w-5'
                      )}
                    />
                  </div>

                  <div
                    className={cn(
                      'mt-2 min-h-0 overflow-y-auto overscroll-contain',
                      isLandscapeMobile ? 'max-h-16' : 'max-h-28 sm:max-h-36'
                    )}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p
                      className={cn(
                        'mb-1.5 font-medium text-white/90',
                        isLandscapeMobile ? 'text-[10px]' : 'text-xs'
                      )}
                    >
                      {t('library.relatedArtists')}
                    </p>
                    {relatedArtists.length === 0 ? (
                      <p className="text-[10px] text-white/65 sm:text-xs">
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
                              router.push(`/search?q=${encodeURIComponent(artist.name)}`)
                            }}
                            className={cn(
                              'inline-flex max-w-full items-center gap-1.5 rounded-full',
                              'border border-white/25 bg-white/15 backdrop-blur-md',
                              'px-1.5 py-0.5 text-left text-white transition-colors',
                              'hover:bg-white/25',
                              isLandscapeMobile ? 'text-[10px]' : 'text-xs'
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
                            <span className="shrink-0 text-white/60">{artist.songCount}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <span
                aria-hidden
                className="absolute bottom-1 end-1 z-[1] flex h-5 w-5 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm"
              >
                <ChevronDownIcon className="h-3 w-3" />
              </span>
            )}
          </button>
        </div>

        {/* Box 2 — Add (glass), or title meta when no onAdd */}
        {onAdd ? (
          <div
            className={cn(
              glassPanelClass,
              'flex min-w-0 flex-1 flex-col',
              isLandscapeMobile ? 'p-1.5' : 'p-2 sm:p-2.5'
            )}
          >
            {!expanded ? (
              <div className="mb-1.5 min-w-0 px-0.5 sm:mb-2">
                <h1
                  className={cn(
                    'truncate font-bold tracking-tight text-foreground',
                    isLandscapeMobile ? 'text-sm' : 'text-base sm:text-lg'
                  )}
                >
                  {title}
                </h1>
                <p
                  className={cn(
                    'truncate text-muted-foreground',
                    isLandscapeMobile ? 'text-[10px]' : 'text-xs'
                  )}
                >
                  {songCountLabel}
                  {artistCount > 0 ? ` · ${artistCountLabel}` : null}
                </p>
                {subtitle ? (
                  <div
                    className={cn(
                      'mt-0.5 line-clamp-1 text-muted-foreground/80',
                      isLandscapeMobile ? 'text-[10px]' : 'text-xs'
                    )}
                  >
                    {subtitle}
                  </div>
                ) : null}
              </div>
            ) : null}
            <button
              type="button"
              onClick={onAdd}
              disabled={!canAdd || songCount === 0 || isAdding}
              aria-label={resolvedAddAria}
              title={resolvedAddLabel}
              className={cn(
                'group/wiggle mt-auto flex w-full flex-1 items-center justify-center gap-1.5 rounded-xl',
                'bg-primary/90 text-primary-foreground shadow-sm transition-all',
                'hover:bg-primary disabled:cursor-not-allowed disabled:opacity-45',
                isLandscapeMobile ? 'min-h-[2.25rem] px-1.5' : 'min-h-[2.75rem] px-2 sm:min-h-[3.25rem]'
              )}
            >
              {isAdding ? (
                <span
                  className={cn(
                    'animate-spin rounded-full border-2 border-current border-t-transparent',
                    isLandscapeMobile ? 'h-3.5 w-3.5' : 'h-4 w-4'
                  )}
                />
              ) : (
                <>
                  {addIcon ?? (
                    <FolderPlusIcon
                      className={cn(
                        'icon-hover-wiggle shrink-0',
                        isLandscapeMobile ? 'h-4 w-4' : 'h-5 w-5'
                      )}
                    />
                  )}
                  <span
                    className={cn(
                      'truncate font-semibold',
                      isLandscapeMobile ? 'sr-only' : 'text-xs sm:text-sm'
                    )}
                  >
                    {resolvedAddLabel}
                  </span>
                </>
              )}
            </button>
          </div>
        ) : !expanded ? (
          <div
            className={cn(
              glassPanelClass,
              'flex min-w-0 flex-1 flex-col justify-center',
              isLandscapeMobile ? 'px-2 py-1.5' : 'px-3 py-2'
            )}
          >
            <h1
              className={cn(
                'truncate font-bold tracking-tight text-foreground',
                isLandscapeMobile ? 'text-sm' : 'text-base sm:text-lg'
              )}
            >
              {title}
            </h1>
            <p
              className={cn(
                'truncate text-muted-foreground',
                isLandscapeMobile ? 'text-[10px]' : 'text-xs'
              )}
            >
              {songCountLabel}
              {artistCount > 0 ? ` · ${artistCountLabel}` : null}
            </p>
            {subtitle ? (
              <div
                className={cn(
                  'mt-0.5 line-clamp-1 text-muted-foreground/80',
                  isLandscapeMobile ? 'text-[10px]' : 'text-xs'
                )}
              >
                {subtitle}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="min-w-0 flex-1" aria-hidden />
        )}

        {/* Box 3 — Play (glass square) */}
        <div
          className={cn(
            glassPanelClass,
            'flex shrink-0 items-stretch justify-center p-1',
            isLandscapeMobile ? 'w-11' : 'w-14 sm:w-16'
          )}
        >
          <GlassActionTile
            onClick={onPlay}
            disabled={songs.length === 0 && songCount === 0}
            compact={isLandscapeMobile}
            aria-label={t('playlistView.startPlaylist')}
            variant="primary"
            className="h-auto min-h-0 w-full flex-1 !rounded-xl !border-0 !bg-transparent !shadow-none !ring-0 hover:!bg-primary/10"
          >
            <PlayIcon className="animate-play-icon-rotate" />
          </GlassActionTile>
        </div>
      </div>
    </div>
  )
}
