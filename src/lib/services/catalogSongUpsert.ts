import type { SupabaseClient } from '@supabase/supabase-js'
import { cleanTab4uAuthor } from '@/lib/services/tab4uUtils'
import { scrapeSongFromUrl, type SearchResult } from '@/lib/services/scraperService'
import { songRepo } from '@/lib/services/songRepo'
import { parseTextToStructuredSong } from '@/utils/songParser'
import { extractAllChords } from '@/utils/structuredSong'
import type { HebrewCatalogGenre } from '@/data/hebrewCatalogGenres'
import type { Database } from '@/types/db'

export async function upsertCatalogSongFromTab4u(
  client: SupabaseClient<Database>,
  result: SearchResult,
  catalogGenre: HebrewCatalogGenre
): Promise<{ songId: string; action: 'added' | 'updated' }> {
  const repo = songRepo(client)
  const author = cleanTab4uAuthor(result.author)
  const existing = await repo.findExistingSystemCatalogSong({
    sourceUrl: result.url,
    title: result.title,
    author,
  })

  const scraped = await scrapeSongFromUrl(result.url, result)
  if (!scraped?.content?.trim()) {
    throw new Error('empty scrape content')
  }

  const resolvedAuthor = cleanTab4uAuthor(scraped.author || result.author)
  const now = new Date().toISOString()

  const imageFields = {
    ...(scraped.artistImageUrl ? { artist_image_url: scraped.artistImageUrl } : {}),
    ...(scraped.songImageUrl ? { song_image_url: scraped.songImageUrl } : {}),
  }

  const row = {
    title: scraped.title || result.title,
    author: resolvedAuthor,
    source_url: result.url,
    source_site: 'Tab4U',
    is_public: true,
    is_trending: true,
    genre: catalogGenre,
    updated_at: now,
  }

  if (existing) {
    const structuredSong = parseTextToStructuredSong(
      row.title,
      resolvedAuthor,
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
        ...imageFields,
        sections: structuredSong.sections,
        key: scraped.key ?? structuredSong.firstChord,
        capo: scraped.capo ?? null,
        first_chord: structuredSong.firstChord ?? null,
        last_chord: structuredSong.lastChord ?? null,
        all_chords: allChords.length > 0 ? allChords : null,
      })
      .eq('id', existing.id)

    return { songId: existing.id, action: 'updated' }
  }

  const created = await repo.createSystemSong(
    {
      title: row.title,
      author: resolvedAuthor,
      content: scraped.content,
      key: scraped.key,
      capo: scraped.capo,
      sourceUrl: result.url,
      sourceSite: 'Tab4U',
      artistImageUrl: scraped.artistImageUrl,
      songImageUrl: scraped.songImageUrl,
    },
    { isPublic: true, isTrending: true, genre: catalogGenre }
  )

  return { songId: created.id, action: 'added' }
}

export async function upsertCatalogSongFromNegina(
  client: SupabaseClient<Database>,
  result: SearchResult,
  catalogGenre: HebrewCatalogGenre
): Promise<{ songId: string; action: 'added' | 'updated' }> {
  const repo = songRepo(client)
  const existing = await repo.findExistingSystemCatalogSong({
    sourceUrl: result.url,
    title: result.title,
    author: result.author,
  })

  const scraped = await scrapeSongFromUrl(result.url, result)
  if (!scraped?.content?.trim()) {
    throw new Error('empty scrape content')
  }

  const author = scraped.author || result.author
  const now = new Date().toISOString()

  const row = {
    title: scraped.title || result.title,
    author,
    source_url: result.url,
    source_site: 'Negina',
    is_public: true,
    is_trending: true,
    genre: catalogGenre,
    updated_at: now,
  }

  if (existing) {
    const structuredSong = parseTextToStructuredSong(
      row.title,
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

    return { songId: existing.id, action: 'updated' }
  }

  const created = await repo.createSystemSong(
    {
      title: row.title,
      author,
      content: scraped.content,
      key: scraped.key,
      capo: scraped.capo,
      sourceUrl: result.url,
      sourceSite: 'Negina',
    },
    { isPublic: true, isTrending: true, genre: catalogGenre }
  )

  return { songId: created.id, action: 'added' }
}
