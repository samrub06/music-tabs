import { permanentRedirect } from 'next/navigation'
import { songMetadata } from '@/lib/seo/metadata'
import { SongJsonLd } from '@/components/seo/SongJsonLd'
import SongPageData from './SongPageData'
import SongLoading from './loading'
import { getSongForOpenGraph } from './loadSong'
import { isUuid } from '@/utils/slugify'
import { songPath } from '@/lib/seo/songPath'
import type { Metadata } from 'next'
import { Suspense } from 'react'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const song = await getSongForOpenGraph(id)

  if (!song) {
    return { title: 'Song not found', robots: { index: false, follow: false } }
  }

  return songMetadata({ ...song, id: song.id, slug: song.slug })
}

export default async function SongPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: songParam } = await params
  const decoded = decodeURIComponent(songParam).trim()
  const song = await getSongForOpenGraph(decoded)

  // Canonicalize UUID URLs to slug for public catalog songs
  if (song && !song.userId && song.slug && isUuid(decoded) && decoded === song.id) {
    permanentRedirect(songPath(song))
  }

  return (
    <>
      {song && !song.userId ? <SongJsonLd song={song} /> : null}
      <Suspense fallback={<SongLoading />}>
        <SongPageData songId={decoded} />
      </Suspense>
    </>
  )
}
