import type { SupabaseClient } from '@supabase/supabase-js'
import songlist from '@/data/songlist/songlist.json'
import {
  SONGBOOK_CATALOG_GENRE,
  SONGBOOK_PLAYLIST,
  type SongbookEntry,
} from '@/data/songbookCatalog'
import {
  cleanTab4uAuthor,
} from '@/lib/services/hebrewPlaylistSeedService'
import { songRepo } from '@/lib/services/songRepo'
import {
  scrapeSongFromUrl,
  searchTab4UOnly,
  type SearchResult,
} from '@/lib/services/scraperService'
import { parseTextToStructuredSong } from '@/utils/songParser'
import { extractAllChords } from '@/utils/structuredSong'
import type { Database } from '@/types/db'

const REQUEST_DELAY_MS = 700

export type SongbookSeedResult =
  | { status: 'added'; songId: string; title: string; author: string; url: string }
  | { status: 'updated'; songId: string; title: string; author: string; url: string }
  | { status: 'skipped'; reason: string; query: string; transliteration?: string }
  | { status: 'error'; reason: string; query: string; transliteration?: string }

export type SongbookSeedSummary = {
  playlistAction: 'created' | 'updated'
  songCount: number
  added: number
  updated: number
  skipped: number
  errors: number
  results: SongbookSeedResult[]
}

export interface SongbookSeedOptions {
  /** Max songbook entries to process (each entry may yield multiple Tab4U versions). */
  limit?: number
  /** Section ids to include (default: main + supplementary). */
  sectionIds?: string[]
  dryRun?: boolean
}

interface ArtistTarget {
  label: string
  searchTerms: string[]
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function normalizeMatchText(value: string): string {
  return value.toLowerCase().replace(/["']/g, '').replace(/\s+/g, ' ').trim()
}

function tab4uTabId(url: string): string | null {
  const match = url.match(/tabs\/songs\/(\d+)/i)
  return match ? `tab4u:${match[1]}` : null
}

function cleanArtistPart(value: string): string | null {
  const trimmed = value.replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim()
  if (!trimmed || trimmed === '...') return null
  if (/traditionnel|tehilim\s*\d|feat\.|ft\./i.test(trimmed)) return null
  return trimmed
}

function splitArtistParts(value?: string): string[] {
  if (!value?.trim()) return []
  return value
    .split(/\s*\/\s*|\s*,\s*|\s+&\s+|\s+—\s+/)
    .map(cleanArtistPart)
    .filter((part): part is string => Boolean(part))
}

function buildSearchTerms(hebrew?: string, latin?: string): string[] {
  const terms: string[] = []
  const he = hebrew?.replace(/"/g, '').trim()
  if (he && he.length >= 2) {
    terms.push(he)
    const first = he.split(/\s+/)[0]
    if (first && first.length >= 2) terms.push(first)
  }
  if (latin?.trim()) {
    const lat = latin.trim()
    terms.push(lat.toLowerCase())
    terms.push(lat.split(/\s+/)[0].toLowerCase())
  }
  const blob = `${he ?? ''} ${latin ?? ''}`
  if (/חב"ד|chabad/i.test(blob)) {
    terms.push('חב', 'chabad')
  }
  if (/מב"ד|\bmbd\b/i.test(blob)) {
    terms.push('מב', 'mbd', 'בן דוד', 'mordechai')
  }
  if (/zusha|זושא/i.test(blob)) terms.push('zusha', 'זושא')
  if (/קרליבך|carlebach/i.test(blob)) terms.push('קרליב', 'carlebach')
  if (/שוואקי|shwekey/i.test(blob)) terms.push('שווא', 'shwekey')
  if (/פריד|fried/i.test(blob)) terms.push('פריד', 'fried')
  if (/וובר|weber/i.test(blob)) terms.push('וובר', 'weber')
  if (/כ"ץ|katz/i.test(blob)) terms.push('כ"ץ', 'katz')
  if (/ריבו|ribo/i.test(blob)) terms.push('ריבו', 'ribo')

  return [...new Set(terms.map((t) => normalizeMatchText(t)).filter((t) => t.length >= 2))]
}

function parseArtistTargets(entry: SongbookEntry): ArtistTarget[] {
  const heParts = splitArtistParts(entry.artistHebrew)
  const enParts = splitArtistParts(entry.artist)

  if (heParts.length === 0 && enParts.length === 0) {
    return [{ label: 'any', searchTerms: [] }]
  }

  const count = Math.max(heParts.length, enParts.length, 1)
  const targets: ArtistTarget[] = []

  for (let i = 0; i < count; i++) {
    const he = heParts[i] ?? heParts[0]
    const en = enParts[i] ?? enParts[0]
    const label = en ?? he ?? `artist-${i + 1}`
    targets.push({
      label,
      searchTerms: buildSearchTerms(he, en),
    })
  }

  return targets
}

function titleMatches(resultTitle: string, hebrew: string): boolean {
  const rt = normalizeMatchText(resultTitle)
  const ht = normalizeMatchText(hebrew)
  if (!ht) return true
  if (rt === ht || rt.includes(ht)) return true

  const htWords = ht.split(' ').filter(Boolean)
  if (htWords.length > 1) {
    return htWords.every((word) => rt.includes(word))
  }

  return ht.length >= 4 && rt.includes(ht)
}

function pickTab4uMatches(
  results: SearchResult[],
  entry: SongbookEntry,
  target: ArtistTarget
): SearchResult[] {
  const withChords = results.filter((r) => !r.title.includes('ללא אקורדים'))
  const titled = withChords.filter((r) => titleMatches(r.title, entry.hebrew))

  if (titled.length === 0) return []

  if (target.searchTerms.length === 0) {
    return titled.slice(0, 1)
  }

  const strict = titled.filter((r) => authorMatches(r, target))
  return strict.length > 0 ? strict : []
}

function authorMatches(result: SearchResult, target: ArtistTarget): boolean {
  if (target.searchTerms.length === 0) return true
  const author = normalizeMatchText(cleanTab4uAuthor(result.author))
  return target.searchTerms.some((term) => author.includes(term))
}

async function searchTab4uForEntry(
  entry: SongbookEntry,
  target: ArtistTarget
): Promise<SearchResult[]> {
  const queries = [entry.hebrew]
  const primaryTerm = target.searchTerms[0]
  if (primaryTerm) {
    queries.push(`${entry.hebrew} ${primaryTerm}`)
  }

  const merged = new Map<string, SearchResult>()
  for (const query of [...new Set(queries)]) {
    const results = await searchTab4UOnly(query)
    for (const result of results) {
      merged.set(result.url, result)
    }
    await sleep(300)
  }

  return [...merged.values()]
}

async function findExistingBySourceOnly(
  client: SupabaseClient<Database>,
  match: { sourceUrl?: string | null; tabId?: string | null }
): Promise<{ id: string } | null> {
  if (match.tabId) {
    const { data } = await (client.from('songs') as any)
      .select('id')
      .eq('tab_id', match.tabId)
      .is('user_id', null)
      .maybeSingle()
    if (data?.id) return { id: data.id }
  }

  const sourceUrl = match.sourceUrl?.trim()
  if (sourceUrl) {
    const { data } = await (client.from('songs') as any)
      .select('id')
      .eq('source_url', sourceUrl)
      .is('user_id', null)
      .maybeSingle()
    if (data?.id) return { id: data.id }
  }

  return null
}

async function upsertSongbookSongFromTab4u(
  client: SupabaseClient<Database>,
  result: SearchResult,
  dryRun: boolean
): Promise<{ songId: string; action: 'added' | 'updated'; author: string }> {
  const tabId = tab4uTabId(result.url)
  const existing = await findExistingBySourceOnly(client, {
    sourceUrl: result.url,
    tabId,
  })

  if (dryRun) {
    return {
      songId: existing?.id ?? 'dry-run',
      action: existing ? 'updated' : 'added',
      author: cleanTab4uAuthor(result.author),
    }
  }

  const scraped = await scrapeSongFromUrl(result.url, result)
  if (!scraped?.content?.trim()) {
    throw new Error('empty scrape content')
  }

  const author = cleanTab4uAuthor(scraped.author || result.author)
  const title = scraped.title || result.title
  const now = new Date().toISOString()

  const row = {
    title,
    author,
    source_url: result.url,
    source_site: 'Tab4U',
    tab_id: tabId,
    is_public: true,
    is_trending: true,
    genre: SONGBOOK_CATALOG_GENRE,
    updated_at: now,
  }

  if (existing) {
    const structuredSong = parseTextToStructuredSong(
      title,
      author,
      scraped.content,
      undefined,
      undefined,
      scraped.capo,
      scraped.key
    )
    const allChords = extractAllChords(structuredSong)

    await (client.from('songs') as any)
      .update({
        ...row,
        sections: structuredSong.sections,
        key: scraped.key ?? structuredSong.firstChord,
        capo: scraped.capo ?? null,
        first_chord: structuredSong.firstChord ?? null,
        last_chord: structuredSong.lastChord ?? null,
        all_chords: allChords.length > 0 ? allChords : null,
      })
      .eq('id', existing.id)

    return { songId: existing.id, action: 'updated', author }
  }

  const repo = songRepo(client)
  const created = await repo.createSystemSong(
    {
      title,
      author,
      content: scraped.content,
      key: scraped.key,
      capo: scraped.capo,
      sourceUrl: result.url,
      sourceSite: 'Tab4U',
      tabId: tabId ?? undefined,
    },
    { isPublic: true, isTrending: true, genre: SONGBOOK_CATALOG_GENRE }
  )

  return { songId: created.id, action: 'added', author }
}

function loadSongbookEntries(options: SongbookSeedOptions): SongbookEntry[] {
  const sectionIds = options.sectionIds ?? ['main', 'supplementary']
  const entries: SongbookEntry[] = []

  for (const section of songlist.sections) {
    if (!sectionIds.includes(section.id)) continue
    for (const song of section.songs) {
      if (!song.hebrew?.trim()) continue
      entries.push({
        transliteration: song.transliteration,
        hebrew: song.hebrew,
        artist: song.artist,
        artistHebrew: song.artistHebrew,
      })
    }
  }

  if (options.limit != null && options.limit > 0) {
    return entries.slice(0, options.limit)
  }
  return entries
}

async function upsertSongbookPlaylist(
  client: SupabaseClient<Database>,
  songIds: string[],
  dryRun: boolean
): Promise<'created' | 'updated'> {
  if (dryRun) return 'updated'

  const now = new Date().toISOString()
  const row = {
    user_id: null,
    name: SONGBOOK_PLAYLIST.name,
    description: SONGBOOK_PLAYLIST.description,
    song_ids: songIds,
    is_public: true,
    curated_slug: SONGBOOK_PLAYLIST.slug,
    display_order: SONGBOOK_PLAYLIST.displayOrder,
    image_url: null,
    updated_at: now,
  }

  const { data: existing, error: existingError } = await (client.from('playlists') as any)
    .select('id')
    .eq('curated_slug', SONGBOOK_PLAYLIST.slug)
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

async function seedSongbookEntry(
  client: SupabaseClient<Database>,
  entry: SongbookEntry,
  dryRun: boolean
): Promise<SongbookSeedResult[]> {
  const results: SongbookSeedResult[] = []
  const importedUrls = new Set<string>()
  const targets = parseArtistTargets(entry)

  try {
    for (const target of targets) {
      const searchResults = await searchTab4uForEntry(entry, target)
      const matches = pickTab4uMatches(searchResults, entry, target)

      for (const match of matches) {
        if (importedUrls.has(match.url)) continue
        importedUrls.add(match.url)

        const { songId, action, author } = await upsertSongbookSongFromTab4u(
          client,
          match,
          dryRun
        )

        results.push({
          status: action,
          songId,
          title: match.title,
          author,
          url: match.url,
        })

        await sleep(REQUEST_DELAY_MS)
      }
    }

    if (results.length === 0) {
      results.push({
        status: 'skipped',
        reason: 'no Tab4U match',
        query: entry.hebrew,
        transliteration: entry.transliteration,
      })
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    results.push({
      status: 'error',
      reason,
      query: entry.hebrew,
      transliteration: entry.transliteration,
    })
  }

  return results
}

export const songbookSeedService = (client: SupabaseClient<Database>) => ({
  async seedFromSonglist(options: SongbookSeedOptions = {}): Promise<SongbookSeedSummary> {
    const dryRun = options.dryRun ?? false
    const entries = loadSongbookEntries(options)
    const allResults: SongbookSeedResult[] = []
    const songIds: string[] = []
    const seenSongIds = new Set<string>()

    for (const entry of entries) {
      const entryResults = await seedSongbookEntry(client, entry, dryRun)
      allResults.push(...entryResults)

      for (const result of entryResults) {
        if (result.status === 'added' || result.status === 'updated') {
          if (!seenSongIds.has(result.songId)) {
            seenSongIds.add(result.songId)
            songIds.push(result.songId)
          }
        }
      }

      await sleep(REQUEST_DELAY_MS)
    }

    const playlistAction = await upsertSongbookPlaylist(client, songIds, dryRun)

    return {
      playlistAction,
      songCount: songIds.length,
      added: allResults.filter((r) => r.status === 'added').length,
      updated: allResults.filter((r) => r.status === 'updated').length,
      skipped: allResults.filter((r) => r.status === 'skipped').length,
      errors: allResults.filter((r) => r.status === 'error').length,
      results: allResults,
    }
  },
})
