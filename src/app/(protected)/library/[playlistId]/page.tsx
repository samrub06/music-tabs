import { playlistMetadata } from '@/lib/seo/metadata'
import { createSafeServerClient } from '@/lib/supabase/server'
import PublicPlaylistSongsData from './PublicPlaylistSongsData'
import {
  PublicPlaylistDetailShell,
  PublicPlaylistSongListSkeleton,
} from './PublicPlaylistDetailClient'
import { getCachedPublicPlaylist } from './loadPublicPlaylist'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ playlistId: string }>
}): Promise<Metadata> {
  const { playlistId } = await params

  try {
    const playlist = await getCachedPublicPlaylist(playlistId)
    return playlistMetadata({
      name: playlist.name,
      description: playlist.description,
      imageUrl: playlist.imageUrl,
      songCount: playlist.songIds.length,
    })
  } catch {
    return { title: 'Playlist not found', robots: { index: false, follow: false } }
  }
}

export default async function PublicPlaylistDetailPage({
  params,
}: {
  params: Promise<{ playlistId: string }>
}) {
  const { playlistId } = await params
  const supabase = await createSafeServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  try {
    const playlist = await getCachedPublicPlaylist(playlistId)

    return (
      <div className="flex-1 overflow-y-auto pb-20 lg:pb-6">
        <PublicPlaylistDetailShell
          playlist={playlist}
          songCount={playlist.songIds.length}
        />
        <Suspense fallback={<PublicPlaylistSongListSkeleton />}>
          <PublicPlaylistSongsData playlist={playlist} userId={user?.id} />
        </Suspense>
      </div>
    )
  } catch {
    notFound()
  }
}
