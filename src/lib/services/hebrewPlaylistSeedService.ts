import type { SupabaseClient } from '@supabase/supabase-js'
import {
  HEBREW_PLAYLISTS,
  type HebrewCatalogGenre,
  type HebrewPlaylistDefinition,
  type HebrewPlaylistSongEntry,
} from '@/data/hebrewPlaylists'
import { upsertCatalogSongFromNegina, upsertCatalogSongFromTab4u } from '@/lib/services/catalogSongUpsert'
import {
  scrapeSongFromUrl,
  searchNeginaOnly,
  searchTab4UOnly,
  type SearchResult,
} from '@/lib/services/scraperService'
import { cleanTab4uAuthor } from '@/lib/services/tab4uUtils'
import type { Database } from '@/types/db'
import { getCuratedPlaylistCoverUrl } from '@/data/curatedPlaylistCoverImages'

const REQUEST_DELAY_MS = 600

export type HebrewSongSeedResult =
  | { status: 'added'; songId: string; title: string; url: string }
  | { status: 'updated'; songId: string; title: string; url: string }
  | { status: 'skipped'; reason: string; query: string }
  | { status: 'error'; reason: string; query: string }

export type HebrewPlaylistSeedResult = {
  slug: string
  songCount: number
  action: 'created' | 'updated'
  songs: HebrewSongSeedResult[]
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export { cleanTab4uAuthor } from '@/lib/services/tab4uUtils'

function normalizeMatchText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim()
}

function matchesEntry(result: SearchResult, entry: HebrewPlaylistSongEntry): boolean {
  const title = normalizeMatchText(result.title)
  const author = normalizeMatchText(cleanTab4uAuthor(result.author))

  if (entry.titleIncludes) {
    if (!title.includes(normalizeMatchText(entry.titleIncludes))) return false
  }
  if (entry.authorIncludes) {
    if (!author.includes(normalizeMatchText(entry.authorIncludes))) return false
  }
  return true
}

function pickBestTab4uResult(
  results: SearchResult[],
  entry: HebrewPlaylistSongEntry
): SearchResult | null {
  const withChords = results.filter((r) => !r.title.includes('ללא אקורדים'))
  const strict = withChords.filter((r) => matchesEntry(r, entry))
  if (strict.length > 0) return strict[0]

  if (entry.titleIncludes) {
    const byTitle = withChords.filter((r) =>
      normalizeMatchText(r.title).includes(normalizeMatchText(entry.titleIncludes!))
    )
    if (byTitle.length > 0) return byTitle[0]
  }

  return withChords[0] ?? null
}

async function linkExistingCatalogSong(
  client: SupabaseClient<Database>,
  tabId: string,
  catalogGenre: HebrewCatalogGenre
): Promise<HebrewSongSeedResult> {
  const { data, error } = await (client.from('songs') as any)
    .select('id, title, source_url')
    .eq('tab_id', tabId)
    .is('user_id', null)
    .maybeSingle()

  if (error) throw error
  if (!data?.id) {
    return { status: 'skipped', reason: 'catalog song not found', query: tabId }
  }

  await (client.from('songs') as any)
    .update({
      is_public: true,
      is_trending: true,
      genre: catalogGenre,
      updated_at: new Date().toISOString(),
    })
    .eq('id', data.id)

  return {
    status: 'updated',
    songId: data.id,
    title: data.title,
    url: data.source_url ?? tabId,
  }
}

async function seedPlaylistSong(
  client: SupabaseClient<Database>,
  entry: HebrewPlaylistSongEntry,
  catalogGenre: HebrewCatalogGenre
): Promise<HebrewSongSeedResult> {
  try {
    if (entry.catalogTabId) {
      return linkExistingCatalogSong(client, entry.catalogTabId, catalogGenre)
    }

    if (!entry.searchQuery) {
      return { status: 'skipped', reason: 'missing searchQuery', query: '' }
    }

    const results = await searchTab4UOnly(entry.searchQuery)
    let match = pickBestTab4uResult(results, entry)
    let source: 'Tab4U' | 'Negina' = 'Tab4U'

    if (!match) {
      const neginaResults = await searchNeginaOnly(entry.searchQuery)
      match = pickBestTab4uResult(neginaResults, entry)
      source = 'Negina'
    }

    if (!match) {
      return {
        status: 'skipped',
        reason: 'no Tab4U or Negina result',
        query: entry.searchQuery,
      }
    }

    const { songId, action } =
      source === 'Negina'
        ? await upsertCatalogSongFromNegina(client, match, catalogGenre)
        : await upsertCatalogSongFromTab4u(client, match, catalogGenre)
    return {
      status: action,
      songId,
      title: match.title,
      url: match.url,
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    return { status: 'error', reason, query: entry.searchQuery ?? '' }
  }
}

async function upsertHebrewPlaylist(
  client: SupabaseClient<Database>,
  definition: HebrewPlaylistDefinition,
  songIds: string[]
): Promise<'created' | 'updated'> {
  const now = new Date().toISOString()
  const row = {
    user_id: null,
    name: definition.name,
    description: definition.description,
    song_ids: songIds,
    is_public: true,
    curated_slug: definition.slug,
    display_order: definition.displayOrder,
    image_url: getCuratedPlaylistCoverUrl(definition.slug) ?? null,
    updated_at: now,
  }

  const { data: existing, error: existingError } = await (client.from('playlists') as any)
    .select('id')
    .eq('curated_slug', definition.slug)
    .maybeSingle()

  if (existingError) throw existingError

  if (existing?.id) {
    const { error } = await (client.from('playlists') as any)
      .update(row)
      .eq('id', existing.id)
    if (error) throw error
    return 'updated'
  }

  const { error } = await (client.from('playlists') as any).insert([
    { ...row, created_at: now },
  ])
  if (error) throw error
  return 'created'
}

export const hebrewPlaylistSeedService = (client: SupabaseClient<Database>) => ({
  async seedPlaylist(definition: HebrewPlaylistDefinition): Promise<HebrewPlaylistSeedResult> {
    const songResults: HebrewSongSeedResult[] = []
    const songIds: string[] = []
    const seenIds = new Set<string>()

    for (const entry of definition.songs) {
      const result = await seedPlaylistSong(client, entry, definition.catalogGenre)
      songResults.push(result)

      if (result.status === 'added' || result.status === 'updated') {
        if (!seenIds.has(result.songId)) {
          seenIds.add(result.songId)
          songIds.push(result.songId)
        }
      }

      await sleep(REQUEST_DELAY_MS)
    }

    const action = await upsertHebrewPlaylist(client, definition, songIds)

    return {
      slug: definition.slug,
      songCount: songIds.length,
      action,
      songs: songResults,
    }
  },

  async seedAllHebrewPlaylists(): Promise<HebrewPlaylistSeedResult[]> {
    const results: HebrewPlaylistSeedResult[] = []
    for (const definition of HEBREW_PLAYLISTS) {
      if (definition.songs.length === 0) continue
      results.push(await this.seedPlaylist(definition))
    }
    return results
  },
})
