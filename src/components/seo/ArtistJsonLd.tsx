import { absoluteArtistUrl, absoluteUrl } from '@/lib/seo/songPath'
import { artistSeoCopy } from '@/lib/seo/songSeoCopy'
import { SITE_NAME } from '@/lib/seo/site'

type ArtistJsonLdProps = {
  author: string
  authorSlug: string
  songCount: number
}

export function ArtistJsonLd({ author, authorSlug, songCount }: ArtistJsonLdProps) {
  const copy = artistSeoCopy(author)
  const pageUrl = absoluteArtistUrl(authorSlug)

  const data = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: copy.title,
    description: copy.description,
    inLanguage: copy.inLanguage,
    url: pageUrl,
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: absoluteUrl('/'),
    },
    about: {
      '@type': 'MusicGroup',
      name: author,
      url: pageUrl,
    },
    numberOfItems: songCount,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
