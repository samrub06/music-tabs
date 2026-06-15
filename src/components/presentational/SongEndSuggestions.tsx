'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ForwardChevronIcon } from '@/components/icons/DirectionalIcons'
import { SongThumbnail } from './SongThumbnail'
import { useLanguage } from '@/context/LanguageContext'
import { getLibrarySongRefsAction } from '@/app/song/[id]/actions'
import {
  pickAlternativeSong,
  type LibrarySongRef,
} from '@/utils/songSuggestions'
import { cn } from '@/lib/utils'

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
  isInLibrary?: boolean
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
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p
          className="truncate text-base font-semibold text-foreground"
          dir={/[\u0590-\u05FF]/.test(title) ? 'rtl' : 'ltr'}
        >
          {title}
        </p>
        {subtitle && (
          <p
            className="truncate text-sm text-muted-foreground"
            dir={/[\u0590-\u05FF]/.test(subtitle) ? 'rtl' : 'ltr'}
          >
            {subtitle}
          </p>
        )}
      </div>
      <ForwardChevronIcon
        className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-foreground"
      />
    </Link>
  )
}

export function SongEndSuggestions({
  currentSongId,
  currentAuthor,
  currentGenre,
  isInLibrary = false,
  nextSong,
  onPlayNext,
}: SongEndSuggestionsProps) {
  const { t } = useLanguage()
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [librarySongs, setLibrarySongs] = useState<LibrarySongRef[]>([])
  const [shouldLoadLibrary, setShouldLoadLibrary] = useState(false)

  useEffect(() => {
    if (!isInLibrary) {
      setLibrarySongs([])
      setShouldLoadLibrary(false)
      return
    }

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
  }, [isInLibrary, currentSongId])

  useEffect(() => {
    if (!shouldLoadLibrary || !isInLibrary) return

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
  }, [shouldLoadLibrary, isInLibrary, currentSongId])

  const alternative = useMemo(() => {
    if (librarySongs.length === 0) return null
    const exclude = new Set<string>([currentSongId])
    if (nextSong) exclude.add(nextSong.id)
    return pickAlternativeSong(
      { id: currentSongId, author: currentAuthor, genre: currentGenre },
      librarySongs,
      exclude
    )
  }, [
    currentSongId,
    currentAuthor,
    currentGenre,
    librarySongs,
    nextSong,
  ])

  if (!nextSong && !isInLibrary) return null

  return (
    <div ref={sentinelRef} className="mt-8 space-y-3 border-t border-border pt-6">
      <h3 className="text-sm font-semibold text-foreground">
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
      {alternative && (
        <SuggestionCard
          label={
            alternative.reason === 'artist'
              ? t('songEnd.sameArtist').replace('{artist}', currentAuthor)
              : t('songEnd.sameGenre').replace(
                  '{genre}',
                  alternative.genre ?? currentGenre ?? ''
                )
          }
          title={alternative.title}
          subtitle={alternative.author}
          songImageUrl={alternative.songImageUrl}
          artistImageUrl={alternative.artistImageUrl}
          genre={alternative.genre}
          href={`/song/${alternative.id}`}
        />
      )}
    </div>
  )
}
