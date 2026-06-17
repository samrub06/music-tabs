import { createSafeServerClient } from '@/lib/supabase/server'
import { songRepo } from '@/lib/services/songRepo'
import { playlistRepo } from '@/lib/services/playlistRepo'
import { assertIsAdmin } from '@/lib/services/adminPermissions'
import { adminSongListQuerySchema } from '@/lib/validation/schemas'
import AdminSongsClient from './AdminSongsClient'
import { notFound } from 'next/navigation'
import { unstable_noStore as noStore } from 'next/cache'

export default async function AdminSongsData({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  noStore()
  const supabase = await createSafeServerClient()

  try {
    await assertIsAdmin(supabase)
  } catch {
    notFound()
  }

  const raw = await searchParams
  const parsed = adminSongListQuerySchema.parse({
    author: typeof raw.author === 'string' ? raw.author : undefined,
    playlist: typeof raw.playlist === 'string' ? raw.playlist : undefined,
    q: typeof raw.q === 'string' ? raw.q : undefined,
    page: raw.page,
    limit: raw.limit,
  })

  const repo = songRepo(supabase)
  const plRepo = playlistRepo(supabase)

  const [{ songs, total }, playlists, artists] = await Promise.all([
    repo.listAdminCatalogSongs({
      author: parsed.author,
      playlistId: parsed.playlist,
      q: parsed.q,
      page: parsed.page,
      limit: parsed.limit,
    }),
    plRepo.getPublicPlaylistsForAdmin(),
    repo.getDistinctCatalogAuthors(),
  ])

  return (
    <AdminSongsClient
      songs={songs}
      total={total}
      page={parsed.page}
      limit={parsed.limit}
      artists={artists}
      playlists={playlists}
      initialAuthor={parsed.author}
      initialPlaylist={parsed.playlist}
      initialQuery={parsed.q}
    />
  )
}
