import { songMetadata } from '@/lib/seo/metadata'
import SongPageData from './SongPageData'
import SongLoading from './loading'
import { getCachedSong } from './loadSong'
import type { Metadata } from 'next'
import { Suspense } from 'react'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const song = await getCachedSong(id)

  if (!song) {
    return { title: 'Song not found', robots: { index: false, follow: false } }
  }

  return songMetadata(song)
}

export default async function SongPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: songId } = await params

  return (
    <Suspense fallback={<SongLoading />}>
      <SongPageData songId={songId} />
    </Suspense>
  )
}
