import { createSafeServerClient } from '@/lib/supabase/server'
import { profileRepo } from '@/lib/services/profileRepo'
import { songRepo } from '@/lib/services/songRepo'
import { assertIsAdmin } from '@/lib/services/adminPermissions'
import { adminUserSongsQuerySchema } from '@/lib/validation/schemas'
import AdminUserSongsClient from './AdminUserSongsClient'
import { notFound } from 'next/navigation'
import { unstable_noStore as noStore } from 'next/cache'

export default async function AdminUserSongsPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  noStore()
  const { userId } = await params
  const supabase = await createSafeServerClient()

  try {
    await assertIsAdmin(supabase)
  } catch {
    notFound()
  }

  const profile = await profileRepo(supabase).getProfile(userId)
  if (!profile) notFound()

  const raw = await searchParams
  const parsed = adminUserSongsQuerySchema.parse({
    author: typeof raw.author === 'string' ? raw.author : undefined,
    q: typeof raw.q === 'string' ? raw.q : undefined,
    page: raw.page,
    limit: raw.limit,
  })

  const repo = songRepo(supabase)
  const [{ songs, total }, allSongsForArtists] = await Promise.all([
    repo.getSongsByUserIdForAdmin(userId, {
      author: parsed.author,
      q: parsed.q,
      page: parsed.page,
      limit: parsed.limit,
    }),
    repo.getSongsByUserIdForAdmin(userId, { limit: 500 }),
  ])

  const artistSet = new Set<string>()
  for (const song of allSongsForArtists.songs) {
    if (song.author?.trim()) artistSet.add(song.author.trim())
  }
  const artists = Array.from(artistSet).sort((a, b) => a.localeCompare(b))

  return (
    <AdminUserSongsClient
      profile={profile}
      songs={songs}
      total={total}
      page={parsed.page}
      limit={parsed.limit}
      artists={artists}
      initialAuthor={parsed.author}
      initialQuery={parsed.q}
    />
  )
}
