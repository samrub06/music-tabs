import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { KARDUNER_CATALOG_SONGS } from '../src/data/catalogSongs/kardunerCatalog'
import { HEBREW_PLAYLISTS } from '../src/data/hebrewPlaylists'
import { hebrewPlaylistSeedService } from '../src/lib/services/hebrewPlaylistSeedService'
import { songRepo } from '../src/lib/services/songRepo'
import { parseTextToStructuredSong } from '../src/utils/songParser'
import { extractAllChords } from '../src/utils/structuredSong'
import type { Database } from '../src/types/db'
import type { NewSongData } from '../src/types'

dotenv.config({ path: '.env.local' })

async function upsertCatalogSong(
  supabase: ReturnType<typeof createClient<Database>>,
  songData: NewSongData & { slug: string; genre: string; difficulty: string; decade: number }
) {
  const repo = songRepo(supabase)
  const { slug, genre, difficulty, decade, ...payload } = songData

  const structuredSong = parseTextToStructuredSong(
    payload.title,
    payload.author,
    payload.content,
    undefined,
    payload.reviews,
    payload.capo,
    payload.key
  )
  const allChords = extractAllChords(structuredSong)
  const now = new Date().toISOString()

  const existing = await repo.findExistingSystemCatalogSong({
    tabId: payload.tabId,
    title: payload.title,
    author: payload.author,
  })

  const row = {
    title: payload.title,
    author: payload.author,
    format: 'structured' as const,
    sections: structuredSong.sections,
    reviews: payload.reviews ?? 0,
    capo: payload.capo ?? null,
    key: payload.key ?? structuredSong.firstChord,
    first_chord: structuredSong.firstChord ?? null,
    last_chord: structuredSong.lastChord ?? null,
    all_chords: allChords.length > 0 ? allChords : null,
    version: payload.version ?? null,
    version_description: payload.versionDescription ?? null,
    rating: payload.rating ?? null,
    difficulty,
    artist_url: payload.artistUrl ?? null,
    artist_image_url: payload.artistImageUrl ?? null,
    song_image_url: payload.songImageUrl ?? null,
    source_url: payload.sourceUrl ?? null,
    source_site: payload.sourceSite ?? 'Curated',
    tab_id: payload.tabId ?? null,
    bpm: payload.bpm ?? null,
    is_trending: true,
    is_public: true,
    genre,
    decade,
    updated_at: now,
  }

  if (existing) {
    const { error } = await (supabase.from('songs') as any).update(row).eq('id', existing.id)
    if (error) throw error
    return { id: existing.id, action: 'updated' as const, title: payload.title, slug }
  }

  const { data, error } = await (supabase.from('songs') as any)
    .insert([{ ...row, user_id: null, created_at: now }])
    .select('id')
    .single()

  if (error) throw error
  return { id: data.id as string, action: 'created' as const, title: payload.title, slug }
}

async function run() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
    process.exit(1)
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log(`Seeding ${KARDUNER_CATALOG_SONGS.length} Karduner catalog songs...\n`)

  for (const song of KARDUNER_CATALOG_SONGS) {
    const result = await upsertCatalogSong(supabase, song)
    const icon = result.action === 'created' ? '+' : '↻'
    console.log(`${icon} ${result.title} (${result.slug})`)
  }

  const karduner = HEBREW_PLAYLISTS.find((p) => p.slug === 'yosef-karduner')
  if (!karduner) throw new Error('yosef-karduner playlist not found')

  const playlistResult = await hebrewPlaylistSeedService(supabase).seedPlaylist(karduner)
  console.log(`\nPlaylist ${playlistResult.slug}: ${playlistResult.songCount} songs (${playlistResult.action})`)
  console.log('Done.')
}

run().catch((error) => {
  console.error('Seed failed:', error)
  process.exit(1)
})
