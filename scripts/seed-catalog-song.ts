import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { KARDUNER_SONGS_PART1 } from '../src/data/catalogSongs/kardunerSongsPart1'
import { SHIR_LAMAALOT_CATALOG_SONG } from '../src/data/catalogSongs/shirLamaalot'
import { YAARAT_DVASH_CATALOG_SONG } from '../src/data/catalogSongs/yaaratDvash'
import { FEATURED_CATALOG_SONG } from '../src/data/featuredCatalogSong'
import { songRepo } from '../src/lib/services/songRepo'
import { parseTextToStructuredSong } from '../src/utils/songParser'
import { extractAllChords } from '../src/utils/structuredSong'
import type { Database } from '../src/types/db'
import type { NewSongData } from '../src/types'
import { revalidateSongCache } from './revalidateSongCache'

dotenv.config({ path: '.env.local' })

const TISMACH_CATALOG_SONG = KARDUNER_SONGS_PART1.find((song) => song.slug === 'tismach')

const CATALOG_SONGS: Record<
  string,
  NewSongData & { slug: string; genre: string; difficulty: string; decade: number }
> = {
  'ki-leckha-nae': FEATURED_CATALOG_SONG,
  'yaarat-dvash': YAARAT_DVASH_CATALOG_SONG,
  'shir-lamaalot': SHIR_LAMAALOT_CATALOG_SONG,
  ...(TISMACH_CATALOG_SONG ? { tismach: TISMACH_CATALOG_SONG } : {}),
}

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
    console.log(`Updated "${payload.title}" (${existing.id})`)
    return existing.id
  }

  const { data, error } = await (supabase.from('songs') as any)
    .insert([{ ...row, user_id: null, created_at: now }])
    .select('id')
    .single()

  if (error) throw error
  console.log(`Created "${payload.title}" (${data.id})`)
  console.log(`Slug: ${slug}`)
  return data.id as string
}

async function run() {
  const slug = process.argv[2] ?? 'yaarat-dvash'
  const song = CATALOG_SONGS[slug]

  if (!song) {
    console.error(`Unknown catalog slug "${slug}". Available: ${Object.keys(CATALOG_SONGS).join(', ')}`)
    process.exit(1)
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
    process.exit(1)
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const songId = await upsertCatalogSong(supabase, song)
  await revalidateSongCache(songId)
}

run().catch((error) => {
  console.error('Seed failed:', error)
  process.exit(1)
})
