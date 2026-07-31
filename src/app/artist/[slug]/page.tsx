import { notFound } from 'next/navigation'
import { unstable_noStore as noStore } from 'next/cache'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createPublicCatalogClient } from '@/lib/supabase/server'
import { songRepo } from '@/lib/services/songRepo'
import { artistMetadata } from '@/lib/seo/metadata'
import { ArtistJsonLd } from '@/components/seo/ArtistJsonLd'
import { artistSeoCopy } from '@/lib/seo/songSeoCopy'
import { songPath } from '@/lib/seo/songPath'
import { SongThumbnail } from '@/components/presentational/SongThumbnail'
import { SITE_NAME } from '@/lib/seo/site'

type ArtistPageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ArtistPageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = createPublicCatalogClient()
  const repo = songRepo(supabase)
  const author = await repo.getPublicAuthorBySlug(slug)

  if (!author) {
    return { title: 'Artist not found', robots: { index: false, follow: false } }
  }

  const songs = await repo.getPublicSongsByAuthorLightweight(author, 100)
  return artistMetadata({
    author,
    authorSlug: decodeURIComponent(slug).trim(),
    songCount: songs.length,
  })
}

export default async function ArtistPage({ params }: ArtistPageProps) {
  noStore()
  const { slug } = await params
  const decodedSlug = decodeURIComponent(slug).trim()
  const supabase = createPublicCatalogClient()
  const repo = songRepo(supabase)
  const author = await repo.getPublicAuthorBySlug(decodedSlug)

  if (!author) {
    notFound()
  }

  const songs = await repo.getPublicSongsByAuthorLightweight(author, 100)
  const copy = artistSeoCopy(author)

  return (
    <main
      lang={copy.locale}
      dir={copy.locale === 'he' ? 'rtl' : 'ltr'}
      className="mx-auto min-h-screen w-full max-w-3xl px-4 py-8"
    >
      <ArtistJsonLd author={author} authorSlug={decodedSlug} songCount={songs.length} />

      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          {SITE_NAME}
        </Link>
        <span className="mx-2" aria-hidden>
          /
        </span>
        <span className="text-foreground">{author}</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {copy.h1}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{copy.description}</p>
      </header>

      <ul className="divide-y divide-border/60 rounded-2xl border border-border/60 bg-card/40">
        {songs.map((song) => (
          <li key={song.id}>
            <Link
              href={songPath(song)}
              className="flex items-center gap-3 px-3 py-3 transition-colors hover:bg-muted/40 sm:px-4"
            >
              <SongThumbnail
                songImageUrl={song.songImageUrl}
                artistImageUrl={song.artistImageUrl}
                genre={song.genre}
                alt={song.title}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{song.title}</p>
                <p className="truncate text-xs text-muted-foreground">{song.author}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
