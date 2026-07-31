import { renderStructuredSong } from '@/utils/structuredSong'
import { songSeoCopy } from '@/lib/seo/songSeoCopy'
import type { Song } from '@/types'

type SongSeoContentProps = {
  song: Song
  /** When true, visually hide after client hydration via sibling client wrapper. */
  className?: string
}

/**
 * Crawlable plain-text chords + lyrics for catalog songs.
 * Must match viewer content (original key); progressive enhancement hides this after hydrate.
 */
export function SongSeoContent({ song, className }: SongSeoContentProps) {
  const copy = songSeoCopy(song)
  const plain = renderStructuredSong(song, { maxWidth: 80, wordWrap: false })

  return (
    <article
      lang={copy.locale}
      dir={copy.locale === 'he' ? 'rtl' : 'ltr'}
      className={className}
      data-seo-song-content
    >
      <h1>{copy.h1}</h1>
      <p>{copy.byline}</p>
      <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">{plain}</pre>
    </article>
  )
}
