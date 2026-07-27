'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import {
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

/** Soft gloss sweep that hints the vignette is tappable (no chevron). */
function VignetteGlossHint({ active }: { active?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 z-[1] overflow-hidden rounded-[inherit]',
        active && 'opacity-40'
      )}
    >
      <span className="animate-vignette-gloss absolute inset-y-[-20%] left-0 w-[45%] -skew-x-12 bg-gradient-to-r from-transparent via-white/55 to-transparent" />
      <span className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/25 to-transparent" />
    </span>
  )
}

interface PlaylistGlassHeaderProps {
  coverUrl: string | null
  title: string
  songCount: number
  songs: Song[]
  onPlay: () => void
  /** When omitted, only Play is shown in the right stack. */
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

/**
 * Plan layout:
 * |======== ~80% vignette ========| | ADD  |
 * |                               | | PLAY |
 */
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

  const resolvedAddAria =
    addAriaLabel || addLabel || t('library.addPlaylistToFolders')

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
        <div
          className={cn(
            'mb-2 flex items-center justify-end gap-1',
            isLandscapeMobile && 'mb-1'
          )}
        >
          {toolbar}
        </div>
      ) : null}

      <div
        className={cn(
          'relative flex items-stretch',
          isLandscapeMobile ? 'gap-1.5' : 'gap-2'
        )}
      >
        {/* ~80% expandable cover vignette */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={title}
          className={cn(
            'group relative min-w-0 flex-[4] overflow-hidden text-left',
            'rounded-2xl border border-black/10 bg-muted dark:border-white/15',
            'shadow-[0_10px_28px_-12px_rgba(0,0,0,0.4)]',
            'ring-1 ring-inset ring-white/20 transition-all duration-300',
            'hover:ring-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            expanded
              ? isLandscapeMobile
                ? 'min-h-[7rem]'
                : 'min-h-[11rem] sm:min-h-[12.5rem]'
              : isLandscapeMobile
                ? 'min-h-[4.5rem]'
                : 'min-h-[6.5rem] sm:min-h-[7.5rem]'
          )}
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
                  isLandscapeMobile ? 'h-6 w-6' : 'h-9 w-9'
                )}
              />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/5" />
          <VignetteGlossHint active={expanded} />

          <div
            className={cn(
              'relative z-[2] flex h-full flex-col justify-end',
              isLandscapeMobile ? 'p-2' : 'p-3 sm:p-3.5'
            )}
          >
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
              {subtitle && !expanded ? (
                <div
                  className={cn(
                    'mt-0.5 line-clamp-1 text-white/70',
                    isLandscapeMobile ? 'text-[10px]' : 'text-xs'
                  )}
                >
                  {subtitle}
                </div>
              ) : null}
            </div>

            {expanded ? (
              <div
                className={cn(
                  'mt-2 min-h-0 overflow-y-auto overscroll-contain',
                  isLandscapeMobile ? 'max-h-14' : 'max-h-28 sm:max-h-36'
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
            ) : null}
          </div>
        </button>

        {/* ~10–20% stacked Add / Play glass tiles */}
        <div
          className={cn(
            'flex shrink-0 flex-col justify-stretch',
            isLandscapeMobile ? 'w-10 gap-1' : 'w-12 gap-1.5 sm:w-14 sm:gap-2'
          )}
        >
          {onAdd ? (
            <GlassActionTile
              onClick={onAdd}
              disabled={!canAdd || songCount === 0}
              loading={isAdding}
              compact={isLandscapeMobile}
              variant="clear"
              aria-label={resolvedAddAria}
              title={addLabel || resolvedAddAria}
              className="h-auto min-h-0 flex-1"
            >
              {addIcon ?? <FolderPlusIcon className="icon-hover-wiggle" />}
            </GlassActionTile>
          ) : null}
          <GlassActionTile
            onClick={onPlay}
            disabled={songs.length === 0 && songCount === 0}
            compact={isLandscapeMobile}
            aria-label={t('playlistView.startPlaylist')}
            variant="primary"
            className="h-auto min-h-0 flex-1"
          >
            <PlayIcon className="animate-play-icon-rotate" />
          </GlassActionTile>
        </div>
      </div>
    </div>
  )
}
