import { containsHebrew } from '@/utils/rtl'
import { SITE_NAME } from './site'

export type SongSeoLocale = 'he' | 'en'

export type SongSeoCopy = {
  locale: SongSeoLocale
  title: string
  description: string
  h1: string
  byline: string
  ogLocale: 'he_IL' | 'en_US'
  inLanguage: SongSeoLocale
}

type SongSeoFields = {
  title: string
  author: string
  /** Optional lyrics sample used when title/author are ambiguous. */
  lyricsSample?: string
}

export function getSongSeoLocale(song: SongSeoFields): SongSeoLocale {
  const primary = `${song.title} ${song.author}`
  if (containsHebrew(primary)) return 'he'
  if (song.lyricsSample && containsHebrew(song.lyricsSample)) return 'he'
  return 'en'
}

export function songSeoCopy(song: SongSeoFields): SongSeoCopy {
  const locale = getSongSeoLocale(song)
  const title = song.title.trim()
  const author = song.author.trim() || (locale === 'he' ? 'לא ידוע' : 'Unknown')

  if (locale === 'he') {
    return {
      locale,
      title: `${title} אקורדים וטאבים של ${author}`,
      description: `אקורדים, טאבים ומילים לגיטרה לשיר "${title}" של ${author}. שנו טון, גללו אוטומטית ותרגלו ב-${SITE_NAME}.`,
      h1: `${title} אקורדים וטאבים`,
      byline: `של ${author}`,
      ogLocale: 'he_IL',
      inLanguage: 'he',
    }
  }

  return {
    locale,
    title: `${title} Chords & Tabs by ${author}`,
    description: `Guitar chords, tabs, and lyrics for "${title}" by ${author}. Transpose, autoscroll, and practice on ${SITE_NAME}.`,
    h1: `${title} Chords & Tabs`,
    byline: `by ${author}`,
    ogLocale: 'en_US',
    inLanguage: 'en',
  }
}

export function artistSeoCopy(author: string): SongSeoCopy {
  const trimmed = author.trim() || 'Unknown'
  const locale = getSongSeoLocale({ title: trimmed, author: trimmed })

  if (locale === 'he') {
    return {
      locale,
      title: `אקורדים וטאבים של ${trimmed}`,
      description: `אקורדים, טאבים ומילים לשירים של ${trimmed} ב-${SITE_NAME}.`,
      h1: `אקורדים וטאבים של ${trimmed}`,
      byline: trimmed,
      ogLocale: 'he_IL',
      inLanguage: 'he',
    }
  }

  return {
    locale,
    title: `${trimmed} Chords & Tabs`,
    description: `Browse guitar chords, tabs, and lyrics by ${trimmed} on ${SITE_NAME}.`,
    h1: `${trimmed} Chords & Tabs`,
    byline: trimmed,
    ogLocale: 'en_US',
    inLanguage: 'en',
  }
}
