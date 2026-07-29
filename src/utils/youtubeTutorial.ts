export type YoutubeVideoMode = 'tutorial' | 'original' | 'audio'

export function buildYoutubeTutorialQuery(
  title: string,
  author: string,
  instrument: 'piano' | 'guitar',
  language: 'en' | 'fr' | 'he' = 'en'
): string {
  const cleanTitle = title.trim()
  const cleanAuthor = author.trim()

  const instrumentTerms: Record<'piano' | 'guitar', Record<'en' | 'fr' | 'he', string>> = {
    guitar: {
      en: 'guitar tutorial',
      fr: 'tuto guitare',
      he: 'שיעור גיטרה',
    },
    piano: {
      en: 'piano tutorial',
      fr: 'tuto piano',
      he: 'שיעור פסנתר',
    },
  }

  const parts = [cleanTitle]
  if (cleanAuthor) parts.push(cleanAuthor)
  parts.push(instrumentTerms[instrument][language] ?? instrumentTerms[instrument].en)

  return parts.join(' ')
}

export function buildYoutubeOriginalQuery(
  title: string,
  author: string,
  language: 'en' | 'fr' | 'he' = 'en'
): string {
  const cleanTitle = title.trim()
  const cleanAuthor = author.trim()

  const originalTerms: Record<'en' | 'fr' | 'he', string> = {
    en: 'official audio OR official video OR lyrics',
    fr: 'audio officiel OR clip officiel OR paroles',
    he: 'רשמי OR מילים OR אודיו',
  }

  const parts = [cleanTitle]
  if (cleanAuthor) parts.push(cleanAuthor)
  parts.push(originalTerms[language] ?? originalTerms.en)

  return parts.join(' ')
}

export function buildYoutubeSearchQuery(
  mode: YoutubeVideoMode,
  title: string,
  author: string,
  instrument: 'piano' | 'guitar',
  language: 'en' | 'fr' | 'he' = 'en'
): string {
  // Audio = same track as Original, but UI starts as listen-only bubble
  if (mode === 'original' || mode === 'audio') {
    return buildYoutubeOriginalQuery(title, author, language)
  }
  return buildYoutubeTutorialQuery(title, author, instrument, language)
}

/** Modes that use lyric-line seek (Practice). */
export function isLyricPracticeYoutubeMode(mode: YoutubeVideoMode): boolean {
  return mode === 'original' || mode === 'audio'
}

export function buildYoutubeVideoEmbedUrl(videoId: string, autoplay = false): string {
  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
    enablejsapi: '1',
    fs: '1',
  })
  if (autoplay) {
    params.set('autoplay', '1')
  }

  if (typeof window !== 'undefined') {
    params.set('origin', window.location.origin)
  }

  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?${params.toString()}`
}

export function buildYoutubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`
}

export function buildYoutubeSearchPageUrl(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
}
