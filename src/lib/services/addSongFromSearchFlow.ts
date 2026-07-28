import type { Song } from '@/types'
import {
  buildCatalogSourceIdentity,
  findUserSongBySourceIdentity,
  type CatalogSourceIdentity,
} from '@/lib/utils/catalogSourceIdentity'
import {
  resolveCatalogSongFromSearch,
  type ResolveCatalogDeps,
  type ResolveCatalogFromSearchInput,
} from '@/lib/services/resolveCatalogSongFromSearch'

export type AddFromSearchFlowResult =
  | {
      status: 'already_owned'
      songId: string
      catalogSongId?: string
      scraped: false
    }
  | {
      status: 'needs_clone'
      catalogSongId: string
      scraped: boolean
      identity: CatalogSourceIdentity
      catalogSong: Song
    }

/**
 * Pure-ish orchestration (no DB writes for user clone):
 * 1) if user already has source identity → already_owned
 * 2) else resolve-or-create catalog → needs_clone
 */
export async function planAddSongFromSearch(input: {
  search: ResolveCatalogFromSearchInput
  userSongs: Array<{ id: string; tabId?: string; sourceUrl?: string }>
  deps: ResolveCatalogDeps
}): Promise<AddFromSearchFlowResult> {
  const identity = buildCatalogSourceIdentity({
    url: input.search.url,
    tabId: input.search.tabId,
  })
  const owned = findUserSongBySourceIdentity(identity, input.userSongs)
  if (owned) {
    return { status: 'already_owned', songId: owned.id, scraped: false }
  }

  const resolved = await resolveCatalogSongFromSearch(input.search, input.deps)
  return {
    status: 'needs_clone',
    catalogSongId: resolved.catalogSongId,
    scraped: resolved.scraped,
    identity: resolved.identity,
    catalogSong: resolved.catalogSong,
  }
}
