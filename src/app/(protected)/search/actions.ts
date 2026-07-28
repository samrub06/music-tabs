'use server'

import { revalidatePath } from 'next/cache'
import { searchSongsByStyle, type AiExcludeSong } from '@/lib/services/aiSearchService'
import { planAddSongFromSearch } from '@/lib/services/addSongFromSearchFlow'
import {
  createDefaultResolveCatalogDeps,
  resolveCatalogSongFromSearch,
} from '@/lib/services/resolveCatalogSongFromSearch'
import { songRepo } from '@/lib/services/songRepo'
import {
  createActionServerClient,
  createServiceRoleClient,
} from '@/lib/supabase/server'
import { searchResultAddSchema } from '@/lib/validation/schemas'
import { cloneSongAction } from '@/app/(protected)/dashboard/actions'
import type { Song } from '@/types'

export async function searchSongsByStyleAction(
  description: string,
  exclude?: AiExcludeSong[]
) {
  return await searchSongsByStyle(description, { exclude })
}

function toSearchInput(validated: ReturnType<typeof searchResultAddSchema.parse>) {
  return {
    url: validated.url,
    title: validated.title,
    author: validated.author,
    source: validated.source,
    tabId: validated.tabId,
    reviews: validated.reviews,
    version: validated.version,
    rating: validated.rating,
    difficulty: validated.difficulty,
    versionDescription: validated.versionDescription,
    artistUrl: validated.artistUrl,
    artistImageUrl: validated.artistImageUrl,
    songImageUrl: validated.songImageUrl,
  }
}

/**
 * Add a search result to the user library:
 * resolve catalog by source identity (no rescrape on hit) → clone for user.
 */
export async function addSongFromSearchAction(payload: unknown): Promise<{
  song: Song
  scraped: boolean
  alreadyOwned: boolean
}> {
  const validated = searchResultAddSchema.parse(payload)
  const supabase = await createActionServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Authentication required')
  }

  const userRepo = songRepo(supabase)
  const userSongs = await userRepo.getAllSongsLightweight()

  // Also treat user_library links as owned
  try {
    const { userLibraryRepo } = await import('@/lib/services/userLibraryRepo')
    const links = await userLibraryRepo(supabase).listByUser(user.id)
    for (const link of links) {
      if (!userSongs.some((s) => s.id === link.songId)) {
        const linked = await userRepo.getSong(link.songId)
        if (linked) {
          userSongs.push({
            id: linked.id,
            tabId: linked.tabId,
            sourceUrl: linked.sourceUrl,
            title: linked.title,
            author: linked.author,
          })
        }
      }
    }
  } catch {
    /* user_library may be missing */
  }

  const catalogClient = createServiceRoleClient()
  const deps = createDefaultResolveCatalogDeps(catalogClient)

  const plan = await planAddSongFromSearch({
    search: toSearchInput(validated),
    userSongs,
    deps,
  })

  if (plan.status === 'already_owned') {
    const song = await userRepo.getSong(plan.songId)
    if (!song) throw new Error('Song not found')
    return { song, scraped: false, alreadyOwned: true }
  }

  // Prefer library link / clone via cloneSongAction (links catalog when table exists)
  const created = await cloneSongAction(plan.catalogSongId)
  revalidatePath('/songs')
  revalidatePath('/')
  return {
    song: created,
    scraped: plan.scraped,
    alreadyOwned: false,
  }
}

/**
 * Load song for preview: catalog hit returns DB content; miss scrapes once into catalog.
 */
export async function getSongForPreviewFromSearchAction(
  payload: unknown
): Promise<{
  song: Song
  scraped: boolean
}> {
  const validated = searchResultAddSchema.parse(payload)
  const catalogClient = createServiceRoleClient()
  const deps = createDefaultResolveCatalogDeps(catalogClient)
  const resolved = await resolveCatalogSongFromSearch(
    toSearchInput(validated),
    deps
  )
  return {
    song: resolved.catalogSong,
    scraped: resolved.scraped,
  }
}
