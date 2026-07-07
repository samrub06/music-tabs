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
      en: 'tutorial guitar',
      fr: 'tutoriel guitare',
      he: 'מדריך גיטרה',
    },
    piano: {
      en: 'tutorial piano',
      fr: 'tutoriel piano',
      he: 'מדריך פסנתר',
    },
  }

  const parts = [cleanTitle]
  if (cleanAuthor) parts.push(cleanAuthor)
  parts.push(instrumentTerms[instrument][language] ?? instrumentTerms[instrument].en)

  return parts.join(' ')
}

export function buildYoutubeSearchEmbedUrl(query: string): string {
  return `https://www.youtube.com/embed/videoseries?listType=search&list=${encodeURIComponent(query)}`
}

export function buildYoutubeSearchPageUrl(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
}
