'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ForwardChevronIcon } from '@/components/icons/DirectionalIcons'
import { SongThumbnail } from './SongThumbnail'
import { useLanguage } from '@/context/LanguageContext'
import { getLibrarySongRefsAction } from '@/app/song/[id]/actions'
import {
  getArtistSongsFromLibrary,
  pickAlternativeSong,
  type LibrarySongRef,
} from '@/utils/songSuggestions'
import { cn } from '@/lib/utils'
import { UI_TEXT_ALIGN } from '@/utils/rtl'

export type NextSongRef = {
  id: string
  title: string
  author?: string
  genre?: string
  songImageUrl?: string
  artistImageUrl?: string
}

interface SongEndSuggestionsProps {
  currentSongId: string
  currentAuthor: string
  currentGenre?: string
  nextSong: NextSongRef | null
  onPlayNext?: () => void
}

function SuggestionCard({
  label,
  title,
  subtitle,
  songImageUrl,
  artistImageUrl,
  genre,
  href,
  onNavigate,
}: {
  label: string
  title: string
  subtitle?: string
  songImageUrl?: string
  artistImageUrl?: string
  genre?: string
  href: string
  onNavigate?: () => void
}) {
  const { isRtl } = useLanguage()

  return (
    <Link
      href={href}
      onClick={() => onNavigate?.()}
      className={cn(
        'group flex items-center gap-3 rounded-xl border border-border bg-card p-4',
        'transition-colors hover:border-primary/30 hover:bg-muted/40'
      )}
    >
      <SongThumbnail
        songImageUrl={songImageUrl}
        artistImageUrl={artistImageUrl}
        genre={genre}
        alt={title}
        size="sm"
      />
      <div
        className={cn('min-w-0 flex-1', UI_TEXT_ALIGN)}
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-base font-semibold text-foreground">{title}</p>
        {subtitle && (
          <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      <ForwardChevronIcon
        className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-foreground"
      />
    </Link>
  )
}

function ArtistSongRow({ song }: { song: LibrarySongRef }) {
  const { isRtl } = useLanguage()

  return (
    <Link
      href={`/song/${song.id}`}
      className="flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-muted/50"
    >
      <SongThumbnail
        songImageUrl={song.songImageUrl}
        artistImageUrl={song.artistImageUrl}
        genre={song.genre}
        alt={song.title}
        size="sm"
      />
      <div
        className={cn('min-w-0 flex-1', UI_TEXT_ALIGN)}
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <p className="truncate text-sm font-medium text-foreground">{song.title}</p>
        <p className="truncate text-xs text-muted-foreground">{song.author}</p>
      </div>
      <ForwardChevronIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  )
}

export function SongEndSuggestions({
  currentSongId,
  currentAuthor,
  currentGenre,
  nextSong,
  onPlayNext,
}: SongEndSuggestionsProps) {
  const { t, isRtl } = useLanguage()
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [librarySongs, setLibrarySongs] = useState<LibrarySongRef[]>([])
  const [shouldLoadLibrary, setShouldLoadLibrary] = useState(false)

  useEffect(() => {
    setLibrarySongs([])
    setShouldLoadLibrary(false)
  }, [currentSongId])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoadLibrary(true)
          observer.disconnect()
        }
      },
      { rootMargin: '320px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [currentSongId])

  useEffect(() => {
    if (!shouldLoadLibrary) return

    let cancelled = false
    getLibrarySongRefsAction()
      .then((refs) => {
        if (!cancelled) setLibrarySongs(refs)
      })
      .catch((error) => {
        console.error('Failed to load library song refs:', error)
      })

    return () => {
      cancelled = true
    }
  }, [shouldLoadLibrary, currentSongId])

  const excludeIds = useMemo(() => {
    const ids = new Set<string>([currentSongId])
    if (nextSong) ids.add(nextSong.id)
    return ids
  }, [currentSongId, nextSong])

  const artistSongs = useMemo(() => {
    if (librarySongs.length === 0 || !currentAuthor.trim()) return []
    return getArtistSongsFromLibrary(
      { id: currentSongId, author: currentAuthor },
      librarySongs,
      excludeIds
    )
  }, [currentSongId, currentAuthor, librarySongs, excludeIds])

  const genreAlternative = useMemo(() => {
    if (librarySongs.length === 0) return null
    const genreExclude = new Set(excludeIds)
    artistSongs.forEach((s) => genreExclude.add(s.id))
    return pickAlternativeSong(
      { id: currentSongId, author: currentAuthor, genre: currentGenre },
      librarySongs,
      genreExclude
    )
  }, [
    currentSongId,
    currentAuthor,
    currentGenre,
    librarySongs,
    excludeIds,
    artistSongs,
  ])

  if (!nextSong && artistSongs.length === 0 && !genreAlternative) {
    return <div ref={sentinelRef} className="h-px" aria-hidden />
  }

  return (
    <div ref={sentinelRef} className="mt-8 space-y-3 pt-6">
      <h3
        className={cn('text-sm font-semibold text-foreground', UI_TEXT_ALIGN)}
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {t('songEnd.continueListening')}
      </h3>

      {nextSong && (
        <SuggestionCard
          label={t('songEnd.nextInList')}
          title={nextSong.title}
          subtitle={nextSong.author}
          songImageUrl={nextSong.songImageUrl}
          artistImageUrl={nextSong.artistImageUrl}
          genre={nextSong.genre}
          href={`/song/${nextSong.id}`}
          onNavigate={onPlayNext}
        />
      )}

      {artistSongs.length > 0 && (
        <div className="rounded-xl border border-border bg-card">
          <div
            className={cn(
              'flex items-center gap-2 border-b border-border px-4 py-3',
              UI_TEXT_ALIGN
            )}
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            <span className="min-w-0 flex-1 text-sm font-semibold text-foreground">
              {t('songEnd.moreByArtist').replace('{artist}', currentAuthor)}
            </span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {artistSongs.length}
            </span>
          </div>
          <ul className="px-2 py-1">
            {artistSongs.map((song) => (
              <li key={song.id}>
                <ArtistSongRow song={song} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {genreAlternative && (
        <SuggestionCard
          label={t('songEnd.sameGenre').replace(
            '{genre}',
            genreAlternative.genre ?? currentGenre ?? ''
          )}
          title={genreAlternative.title}
          subtitle={genreAlternative.author}
          songImageUrl={genreAlternative.songImageUrl}
          artistImageUrl={genreAlternative.artistImageUrl}
          genre={genreAlternative.genre}
          href={`/song/${genreAlternative.id}`}
        />
      )}
    </div>
  )
}
