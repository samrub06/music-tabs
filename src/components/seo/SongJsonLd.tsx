import { absoluteSongUrl, absoluteArtistUrl, absoluteUrl } from '@/lib/seo/songPath'
import { songSeoCopy } from '@/lib/seo/songSeoCopy'
import { artistSlugFromAuthor } from '@/utils/slugify'
import { SITE_NAME } from '@/lib/seo/site'

type SongJsonLdProps = {
  song: {
    id: string
    slug?: string | null
    title: string
    author: string
    songImageUrl?: string
    artistImageUrl?: string
  }
}

export function SongJsonLd({ song }: SongJsonLdProps) {
  const copy = songSeoCopy(song)
  const pageUrl = absoluteSongUrl(song)
  const authorSlug = artistSlugFromAuthor(song.author)
  const image = song.songImageUrl || song.artistImageUrl

  const musicComposition = {
    '@context': 'https://schema.org',
    '@type': 'MusicComposition',
    name: song.title,
    description: copy.description,
    inLanguage: copy.inLanguage,
    url: pageUrl,
    composer: {
      '@type': 'MusicGroup',
      name: song.author,
      url: absoluteArtistUrl(authorSlug),
    },
    ...(image ? { image } : {}),
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: absoluteUrl('/'),
    },
  }

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: SITE_NAME,
        item: absoluteUrl('/'),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: song.author,
        item: absoluteArtistUrl(authorSlug),
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: copy.h1,
        item: pageUrl,
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(musicComposition) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
    </>
  )
}
