'use server'

import { assertIsAdmin } from '@/lib/services/adminPermissions'
import { createActionServerClient } from '@/lib/supabase/server'
import { playlistRepo } from '@/lib/services/playlistRepo'
import { songRepo } from '@/lib/services/songRepo'
import {
  adminBulkMovePlaylistSchema,
  adminBulkPlaylistMutationSchema,
  adminDeleteSongsSchema,
  createSongSchema,
} from '@/lib/validation/schemas'
import type { NewSongData } from '@/types'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const adminImportSchema = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
  content: z.string().min(1),
  sourceUrl: z.string().optional(),
  sourceSite: z.string().optional(),
  tabId: z.union([z.string(), z.number().transform(String)]).optional(),
  capo: z.number().int().optional(),
  key: z.string().optional(),
  rating: z.number().optional(),
  difficulty: z.string().optional(),
  version: z.number().int().optional(),
  versionDescription: z.string().optional(),
  artistUrl: z.string().optional(),
  artistImageUrl: z.string().optional(),
  songImageUrl: z.string().optional(),
  genre: z.string().optional(),
  bpm: z.number().int().optional(),
  playlistId: z.string().uuid().optional(),
})

async function appendSongsToPlaylist(
  supabase: Awaited<ReturnType<typeof createActionServerClient>>,
  playlistId: string,
  songIds: string[]
) {
  const repo = playlistRepo(supabase)
  const playlist = await repo.getPublicPlaylist(playlistId)
  const existing = new Set(playlist.songIds)
  const nextIds = [...playlist.songIds]
  for (const id of songIds) {
    if (!existing.has(id)) {
      nextIds.push(id)
      existing.add(id)
    }
  }
  await repo.updatePublicPlaylist(playlistId, { songIds: nextIds })
}

function revalidateAdminSongPaths(playlistId?: string) {
  revalidatePath('/admin/songs')
  revalidatePath('/admin/users')
  revalidatePath('/')
  if (playlistId) {
    revalidatePath(`/library/${playlistId}`)
  }
}

export async function adminBulkAddSongsToPlaylistAction(playlistId: string, songIds: string[]) {
  const { playlistId: pid, songIds: ids } = adminBulkPlaylistMutationSchema.parse({
    playlistId,
    songIds,
  })
  const supabase = await createActionServerClient()
  await assertIsAdmin(supabase)
  await appendSongsToPlaylist(supabase, pid, ids)
  revalidateAdminSongPaths(pid)
}

export async function adminBulkRemoveSongsFromPlaylistAction(playlistId: string, songIds: string[]) {
  const { playlistId: pid, songIds: ids } = adminBulkPlaylistMutationSchema.parse({
    playlistId,
    songIds,
  })
  const supabase = await createActionServerClient()
  await assertIsAdmin(supabase)
  const repo = playlistRepo(supabase)
  const playlist = await repo.getPublicPlaylist(pid)
  const removeSet = new Set(ids)
  const nextIds = playlist.songIds.filter((id) => !removeSet.has(id))
  await repo.updatePublicPlaylist(pid, { songIds: nextIds })
  revalidateAdminSongPaths(pid)
}

export async function adminBulkMoveSongsToPlaylistAction(
  toPlaylistId: string,
  songIds: string[],
  fromPlaylistId?: string,
  removeFromSource?: boolean
) {
  const parsed = adminBulkMovePlaylistSchema.parse({
    toPlaylistId,
    songIds,
    fromPlaylistId,
    removeFromSource,
  })
  const supabase = await createActionServerClient()
  await assertIsAdmin(supabase)

  await appendSongsToPlaylist(supabase, parsed.toPlaylistId, parsed.songIds)

  if (parsed.removeFromSource && parsed.fromPlaylistId) {
    const repo = playlistRepo(supabase)
    const source = await repo.getPublicPlaylist(parsed.fromPlaylistId)
    const removeSet = new Set(parsed.songIds)
    const nextIds = source.songIds.filter((id) => !removeSet.has(id))
    await repo.updatePublicPlaylist(parsed.fromPlaylistId, { songIds: nextIds })
    revalidateAdminSongPaths(parsed.fromPlaylistId)
  }

  revalidateAdminSongPaths(parsed.toPlaylistId)
}

export async function adminCreateCatalogSongAction(payload: NewSongData, playlistId?: string) {
  const validated = createSongSchema.parse(payload)
  const supabase = await createActionServerClient()
  await assertIsAdmin(supabase)
  const repo = songRepo(supabase)
  const song = await repo.createSystemSong(
    {
      ...validated,
      folderId: validated.folderId ?? undefined,
    },
    { isPublic: true, isTrending: true }
  )
  if (playlistId) {
    await appendSongsToPlaylist(supabase, playlistId, [song.id])
  }
  revalidateAdminSongPaths(playlistId)
  return song
}

export async function adminImportCatalogSongAction(
  payload: z.infer<typeof adminImportSchema>
) {
  const validated = adminImportSchema.parse(payload)
  const supabase = await createActionServerClient()
  await assertIsAdmin(supabase)
  const repo = songRepo(supabase)

  const song = await repo.createSystemSong(
    {
      title: validated.title,
      author: validated.author,
      content: validated.content,
      capo: validated.capo,
      key: validated.key,
      sourceUrl: validated.sourceUrl,
      sourceSite: validated.sourceSite,
      tabId: validated.tabId,
      rating: validated.rating,
      difficulty: validated.difficulty,
      version: validated.version,
      versionDescription: validated.versionDescription,
      artistUrl: validated.artistUrl,
      artistImageUrl: validated.artistImageUrl,
      songImageUrl: validated.songImageUrl,
      genre: validated.genre,
      bpm: validated.bpm,
    },
    { isPublic: true, isTrending: true, genre: validated.genre }
  )

  if (validated.playlistId) {
    await appendSongsToPlaylist(supabase, validated.playlistId, [song.id])
  }

  revalidateAdminSongPaths(validated.playlistId)
  return song
}

export async function adminDeleteSongsAction(songIds: string[]) {
  const { songIds: ids } = adminDeleteSongsSchema.parse({ songIds })
  const supabase = await createActionServerClient()
  await assertIsAdmin(supabase)
  const repo = songRepo(supabase)
  await repo.deleteSongs(ids)
  revalidateAdminSongPaths()
}
