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
  searchUltimateGuitarOnly,
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

export type SongbookSeedSource = 'tab4u' | 'ultimate-guitar' | 'both'

export interface SongbookSeedOptions {
  /** Max songbook entries to process (each entry may yield multiple versions). */
  limit?: number
  /** Section ids to include (default: main + supplementary). */
  sectionIds?: string[]
  dryRun?: boolean
  /** Which external sources to query (default: tab4u). */
  source?: SongbookSeedSource
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

function ugTabId(url: string): string | null {
  const match = url.match(/(?:tab\/view\/|[-_/])(\d{5,})(?:[/?#]|$)/i)
  return match ? `ug:${match[1]}` : null
}

function cleanAuthorName(author: string): string {
  return cleanTab4uAuthor(author)
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

function ugTitleMatches(resultTitle: string, entry: SongbookEntry): boolean {
  const rt = normalizeMatchText(resultTitle.replace(/\(version \d+\)/gi, ''))
  const translit = normalizeMatchText(entry.transliteration)

  if (!translit) return titleMatches(resultTitle, entry.hebrew)

  if (rt === translit || rt.includes(translit) || translit.includes(rt)) return true

  const words = translit.split(' ').filter((w) => w.length > 2)
  if (words.length > 1 && words.every((word) => rt.includes(word))) return true

  return titleMatches(resultTitle, entry.hebrew)
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

function pickUgMatches(
  results: SearchResult[],
  entry: SongbookEntry,
  target: ArtistTarget
): SearchResult[] {
  const titled = results.filter((r) => ugTitleMatches(r.title, entry))
  if (titled.length === 0) return []

  if (target.searchTerms.length === 0) {
    return titled.slice(0, 1)
  }

  const strict = titled.filter((r) => authorMatches(r, target))
  return strict.length > 0 ? strict : []
}

function authorMatches(result: SearchResult, target: ArtistTarget): boolean {
  if (target.searchTerms.length === 0) return true
  const author = normalizeMatchText(cleanAuthorName(result.author))
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

async function searchUgForEntry(
  entry: SongbookEntry,
  target: ArtistTarget
): Promise<SearchResult[]> {
  const queries = [entry.transliteration.trim()]
  const latinLabel = target.label !== 'any' ? target.label : undefined
  if (latinLabel) {
    queries.push(`${entry.transliteration} ${latinLabel}`)
  }

  const merged = new Map<string, SearchResult>()
  for (const query of [...new Set(queries.filter(Boolean))]) {
    const results = await searchUltimateGuitarOnly(query)
    for (const result of results) {
      merged.set(result.url, result)
    }
    await sleep(800)
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

async function upsertSongbookSongFromSource(
  client: SupabaseClient<Database>,
  result: SearchResult,
  sourceSite: 'Tab4U' | 'Ultimate Guitar',
  dryRun: boolean
): Promise<{ songId: string; action: 'added' | 'updated'; author: string }> {
  const tabId =
    sourceSite === 'Tab4U' ? tab4uTabId(result.url) : ugTabId(result.url)
  const existing = await findExistingBySourceOnly(client, {
    sourceUrl: result.url,
    tabId,
  })

  if (dryRun) {
    return {
      songId: existing?.id ?? 'dry-run',
      action: existing ? 'updated' : 'added',
      author: cleanAuthorName(result.author),
    }
  }

  const scraped = await scrapeSongFromUrl(result.url, result)
  if (!scraped?.content?.trim()) {
    throw new Error('empty scrape content')
  }

  const author = cleanAuthorName(scraped.author || result.author)
  const title = scraped.title || result.title
  const now = new Date().toISOString()
  const resolvedTabId =
    sourceSite === 'Ultimate Guitar' && scraped.tabId
      ? `ug:${scraped.tabId}`
      : tabId

  const row = {
    title,
    author,
    source_url: result.url,
    source_site: sourceSite,
    tab_id: resolvedTabId,
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
        rating: scraped.rating ?? null,
        difficulty: scraped.difficulty ?? null,
        version: scraped.version ?? null,
        version_description: scraped.versionDescription ?? null,
        artist_url: scraped.artistUrl ?? null,
        artist_image_url: scraped.artistImageUrl ?? null,
        song_image_url: scraped.songImageUrl ?? null,
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
      sourceSite,
      tabId: resolvedTabId ?? undefined,
      rating: scraped.rating,
      difficulty: scraped.difficulty,
      version: scraped.version,
      versionDescription: scraped.versionDescription,
      artistUrl: scraped.artistUrl,
      artistImageUrl: scraped.artistImageUrl,
      songImageUrl: scraped.songImageUrl,
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
    .select('id, song_ids')
    .eq('curated_slug', SONGBOOK_PLAYLIST.slug)
    .maybeSingle()

  if (existingError) throw existingError

  const mergedSongIds = [...new Set([...(existing?.song_ids ?? []), ...songIds])]

  if (existing?.id) {
    const { error } = await (client.from('playlists') as any)
      .update({ ...row, song_ids: mergedSongIds })
      .eq('id', existing.id)
    if (error) throw error
    return 'updated'
  }

  const { error } = await (client.from('playlists') as any).insert([
    { ...row, song_ids: mergedSongIds, created_at: now },
  ])
  if (error) throw error
  return 'created'
}

async function seedSongbookEntryFromSource(
  client: SupabaseClient<Database>,
  entry: SongbookEntry,
  source: 'tab4u' | 'ultimate-guitar',
  dryRun: boolean
): Promise<SongbookSeedResult[]> {
  const results: SongbookSeedResult[] = []
  const importedUrls = new Set<string>()
  const targets = parseArtistTargets(entry)
  const sourceLabel = source === 'tab4u' ? 'Tab4U' : 'Ultimate Guitar'

  try {
    for (const target of targets) {
      const searchResults =
        source === 'tab4u'
          ? await searchTab4uForEntry(entry, target)
          : await searchUgForEntry(entry, target)
      const matches =
        source === 'tab4u'
          ? pickTab4uMatches(searchResults, entry, target)
          : pickUgMatches(searchResults, entry, target)

      for (const match of matches) {
        if (importedUrls.has(match.url)) continue
        importedUrls.add(match.url)

        const { songId, action, author } = await upsertSongbookSongFromSource(
          client,
          match,
          sourceLabel,
          dryRun
        )

        results.push({
          status: action,
          songId,
          title: match.title,
          author,
          url: match.url,
        })

        await sleep(source === 'ultimate-guitar' ? 1200 : REQUEST_DELAY_MS)
      }
    }

    if (results.length === 0) {
      results.push({
        status: 'skipped',
        reason: `no ${sourceLabel} match`,
        query: source === 'tab4u' ? entry.hebrew : entry.transliteration,
        transliteration: entry.transliteration,
      })
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    results.push({
      status: 'error',
      reason,
      query: source === 'tab4u' ? entry.hebrew : entry.transliteration,
      transliteration: entry.transliteration,
    })
  }

  return results
}

async function seedSongbookEntry(
  client: SupabaseClient<Database>,
  entry: SongbookEntry,
  sources: Array<'tab4u' | 'ultimate-guitar'>,
  dryRun: boolean
): Promise<SongbookSeedResult[]> {
  const all: SongbookSeedResult[] = []
  for (const source of sources) {
    all.push(...(await seedSongbookEntryFromSource(client, entry, source, dryRun)))
  }
  return all
}

export const songbookSeedService = (client: SupabaseClient<Database>) => ({
  async seedFromSonglist(options: SongbookSeedOptions = {}): Promise<SongbookSeedSummary> {
    const dryRun = options.dryRun ?? false
    const sourceOption = options.source ?? 'tab4u'
    const sources: Array<'tab4u' | 'ultimate-guitar'> =
      sourceOption === 'both'
        ? ['tab4u', 'ultimate-guitar']
        : [sourceOption]

    const entries = loadSongbookEntries(options)
    const allResults: SongbookSeedResult[] = []
    const songIds: string[] = []
    const seenSongIds = new Set<string>()

    for (const entry of entries) {
      const entryResults = await seedSongbookEntry(client, entry, sources, dryRun)
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
