import { playlistMetadata } from '@/lib/seo/metadata'
import { createSafeServerClient } from '@/lib/supabase/server'
import { getCachedLibraryCatalogSections } from '@/lib/services/libraryCatalogCache'
import PublicPlaylistSongsData from './PublicPlaylistSongsData'
import {
  PublicPlaylistDetailShell,
  PublicPlaylistPageFrame,
  PublicPlaylistSearchProvider,
  PublicPlaylistSongListSkeleton,
} from './PublicPlaylistDetailClient'
import { getCachedPublicPlaylist } from './loadPublicPlaylist'
import type { PlaylistStripItem } from '@/components/playlists/PlaylistSwitcherStrip'
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
  searchParams,
}: {
  params: Promise<{ playlistId: string }>
  searchParams: Promise<{ from?: string }>
}) {
  const { playlistId } = await params
  const { from } = await searchParams
  const supabase = await createSafeServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const fromPlaylists = from === 'playlists'
  const backHref = fromPlaylists ? '/playlists' : '/'

  try {
    const playlist = await getCachedPublicPlaylist(playlistId)

    let siblingPlaylists: PlaylistStripItem[] = []
    if (fromPlaylists) {
      const catalog = await getCachedLibraryCatalogSections()
      siblingPlaylists = catalog.publicPlaylists
        .filter((p) => p.songCount > 0)
        .map((p) => ({
          id: p.id,
          name: p.name,
          imageUrl: p.imageUrl,
          songCount: p.songCount,
        }))
    }

    return (
      <PublicPlaylistSearchProvider
        playlist={playlist}
        backHref={backHref}
        siblingPlaylists={siblingPlaylists}
        softSwitchEnabled={fromPlaylists}
      >
        <PublicPlaylistPageFrame>
          <PublicPlaylistDetailShell
            playlist={playlist}
            songCount={playlist.songIds.length}
            canSaveToFolders={Boolean(user)}
          />
          <Suspense fallback={<PublicPlaylistSongListSkeleton />}>
            <PublicPlaylistSongsData playlist={playlist} userId={user?.id} />
          </Suspense>
        </PublicPlaylistPageFrame>
      </PublicPlaylistSearchProvider>
    )
  } catch {
    notFound()
  }
}
