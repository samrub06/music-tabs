'use client'

import { useEffect, useRef, useState } from 'react'
import { BookOpenIcon } from '@heroicons/react/24/outline'
import { getSongStoryAction } from '@/app/song/[id]/actions'
import { useLanguage } from '@/context/LanguageContext'
import { buildSongStoryCanonicalKey } from '@/utils/songStoryKey'
import type { SongStory } from '@/types'
import { cn } from '@/lib/utils'
import { UI_TEXT_ALIGN } from '@/utils/rtl'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

const CACHE_PREFIX = 'song-story:v2:'

interface SongStoryCardProps {
  songId: string
  title: string
  author: string
  tabId?: string | null
  genre?: string
  songKey?: string
  chordProgression?: string[]
}

function cacheKey(
  title: string,
  author: string,
  tabId: string | null | undefined,
  language: string
): string {
  return `${CACHE_PREFIX}${buildSongStoryCanonicalKey(title, author, tabId)}:${language}`
}

function readCachedStory(
  title: string,
  author: string,
  tabId: string | null | undefined,
  language: string
): SongStory | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(cacheKey(title, author, tabId, language))
    if (!raw) return null
    const parsed = JSON.parse(raw) as SongStory
    if (parsed.anecdotes && parsed.about) return parsed
  } catch {
  }
  return null
}

function writeCachedStory(
  title: string,
  author: string,
  tabId: string | null | undefined,
  language: string,
  story: SongStory
) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(
      cacheKey(title, author, tabId, language),
      JSON.stringify(story)
    )
  } catch {
  }
}

export function SongStoryCard({
  songId,
  title,
  author,
  tabId,
  genre,
  songKey,
  chordProgression,
}: SongStoryCardProps) {
  const { t, language, isRtl } = useLanguage()
  const [open, setOpen] = useState(false)
  const [story, setStory] = useState<SongStory | null>(() =>
    readCachedStory(title, author, tabId, language)
  )
  const [loading, setLoading] = useState(
    () => !readCachedStory(title, author, tabId, language)
  )
  const [failed, setFailed] = useState(false)
  const fetchedRef = useRef(false)

  useEffect(() => {
    fetchedRef.current = false
    const cached = readCachedStory(title, author, tabId, language)
    if (cached) {
      setStory(cached)
      setLoading(false)
      setFailed(false)
      return
    }

    setStory(null)
    setFailed(false)
    setLoading(true)
    setOpen(false)

    const schedule =
      typeof window.requestIdleCallback === 'function'
        ? window.requestIdleCallback
        : (cb: () => void) => window.setTimeout(cb, 120)

    const cancel =
      typeof window.cancelIdleCallback === 'function'
        ? window.cancelIdleCallback
        : window.clearTimeout

    let idleId: number | undefined
    let cancelled = false

    idleId = schedule(() => {
      if (cancelled || fetchedRef.current) return
      fetchedRef.current = true
      setLoading(true)

      getSongStoryAction({
        songId,
        title,
        author,
        tabId,
        genre,
        key: songKey,
        chordProgression,
        language,
      })
        .then(({ story: next }) => {
          if (cancelled) return
          if (next) {
            setStory(next)
            writeCachedStory(title, author, tabId, language, next)
          } else {
            setFailed(true)
          }
        })
        .catch((error) => {
          console.error('Failed to load song story:', error)
          if (!cancelled) setFailed(true)
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }) as number

    return () => {
      cancelled = true
      if (idleId !== undefined) cancel(idleId)
    }
  }, [songId, title, author, tabId, genre, songKey, chordProgression, language])

  if (failed && !story) return null

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="w-full">
      <CollapsibleTrigger asChild>
        <div
          role="button"
          tabIndex={0}
          className={cn(
            'flex w-full min-h-[48px] cursor-pointer select-none items-center touch-manipulation rounded-md bg-muted px-4 py-3 text-start font-semibold text-foreground hover:bg-muted/80',
            UI_TEXT_ALIGN
          )}
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          <BookOpenIcon className="me-2 h-5 w-5 shrink-0" />
          <span className="min-w-0 flex-1">{t('songStory.title')}</span>
          {loading && !story ? (
            <span className="text-xs font-medium text-muted-foreground animate-pulse">
              {t('songStory.loading')}
            </span>
          ) : null}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div
          className={cn(
            'mt-2 space-y-3 rounded-md bg-muted/40 px-4 py-3 text-sm',
            UI_TEXT_ALIGN
          )}
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          {loading && !story ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-3 rounded bg-muted" />
              <div className="h-3 w-5/6 rounded bg-muted" />
              <div className="h-3 w-4/6 rounded bg-muted" />
            </div>
          ) : story ? (
            <>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">
                  {t('songStory.anecdotes')}
                </p>
                <p className="text-foreground leading-relaxed whitespace-pre-line">{story.anecdotes}</p>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('songStory.about')}
                </p>
                <p className="text-foreground leading-relaxed">{story.about}</p>
              </div>
              {story.meaning ? (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t('songStory.meaning')}
                  </p>
                  <p className="text-foreground leading-relaxed">{story.meaning}</p>
                </div>
              ) : null}
              {story.chordsInsight ? (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t('songStory.chordsInsight')}
                  </p>
                  <p className="text-foreground leading-relaxed">
                    {story.chordsInsight}
                  </p>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
