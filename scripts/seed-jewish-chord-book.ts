import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import partA from '../src/data/extracted/jewishChordBook/part-a.pilot.json'
import partB from '../src/data/extracted/jewishChordBook/part-b.pilot.json'
import { toNewSongData, type JewishChordBookSong } from '../src/data/extracted/jewishChordBook/types'
import { SONGBOOK_PLAYLIST } from '../src/data/songbookCatalog'
import { jewishChordBookExtractSchema } from '../src/lib/validation/schemas'
import { parseTextToStructuredSong } from '../src/utils/songParser'
import { extractAllChords } from '../src/utils/structuredSong'
import type { Database } from '../src/types/db'
import { revalidateSongCache } from './revalidateSongCache'

dotenv.config({ path: '.env.local' })

const PART_FILES = {
  a: partA,
  b: partB,
} as const

function parseArgs() {
  const dryRun = process.argv.includes('--dry-run')
  const partFlag = process.argv.find((arg) => arg.startsWith('--part='))
  const part = (partFlag?.split('=')[1]?.toLowerCase() ?? 'a') as keyof typeof PART_FILES
  if (part !== 'a' && part !== 'b') {
    console.error(`Unknown part "${part}". Use --part=a or --part=b`)
    process.exit(1)
  }
  return { dryRun, part }
}

async function findByTabId(
  supabase: ReturnType<typeof createClient<Database>>,
  tabId: string
): Promise<{ id: string } | null> {
  const { data, error } = await (supabase.from('songs') as any)
    .select('id')
    .eq('tab_id', tabId)
    .is('user_id', null)
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data?.id ? { id: data.id } : null
}

async function upsertJewishChordBookSong(
  supabase: ReturnType<typeof createClient<Database>>,
  song: JewishChordBookSong,
  dryRun: boolean
) {
  const payload = toNewSongData(song)
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
  const tabId = song.source.tabId

  const existing = await findByTabId(supabase, tabId)

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
    difficulty: song.difficulty,
    artist_url: payload.artistUrl ?? null,
    artist_image_url: payload.artistImageUrl ?? null,
    song_image_url: payload.songImageUrl ?? null,
    source_url: null,
    source_site: song.source.sourceSite,
    tab_id: tabId,
    bpm: payload.bpm ?? null,
    is_trending: true,
    is_public: true,
    genre: song.genre,
    decade: 2010,
    updated_at: now,
  }

  if (dryRun) {
    return {
      id: existing?.id ?? 'dry-run',
      action: (existing ? 'updated' : 'created') as 'created' | 'updated',
      title: payload.title,
      slug: song.slug,
    }
  }

  if (existing) {
    const { error } = await (supabase.from('songs') as any).update(row).eq('id', existing.id)
    if (error) throw error
    return { id: existing.id, action: 'updated' as const, title: payload.title, slug: song.slug }
  }

  const { data, error } = await (supabase.from('songs') as any)
    .insert([{ ...row, user_id: null, created_at: now }])
    .select('id')
    .single()

  if (error) throw error
  return { id: data.id as string, action: 'created' as const, title: payload.title, slug: song.slug }
}

async function appendToSongbookPlaylist(
  supabase: ReturnType<typeof createClient<Database>>,
  songIds: string[],
  dryRun: boolean
) {
  if (dryRun) return 'updated' as const

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

  const { data: existing, error: existingError } = await (supabase.from('playlists') as any)
    .select('id, song_ids')
    .eq('curated_slug', SONGBOOK_PLAYLIST.slug)
    .maybeSingle()

  if (existingError) throw existingError

  const mergedSongIds = Array.from(new Set([...(existing?.song_ids ?? []), ...songIds]))

  if (existing?.id) {
    const { error } = await (supabase.from('playlists') as any)
      .update({ ...row, song_ids: mergedSongIds })
      .eq('id', existing.id)
    if (error) throw error
    return 'updated' as const
  }

  const { error } = await (supabase.from('playlists') as any).insert([
    { ...row, song_ids: mergedSongIds, created_at: now },
  ])
  if (error) throw error
  return 'created' as const
}

async function run() {
  const { dryRun, part } = parseArgs()
  const extract = PART_FILES[part]
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
    process.exit(1)
  }

  const validated = jewishChordBookExtractSchema.parse(extract)
  const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log(
    `Seeding ${validated.songs.length} Jewish Chord Book songs (${validated.meta.part})${dryRun ? ' [dry run]' : ''}...\n`
  )

  const songIds: string[] = []

  for (const song of validated.songs) {
    const result = await upsertJewishChordBookSong(supabase, song, dryRun)
    if (!dryRun) await revalidateSongCache(result.id)
    if (result.id !== 'dry-run') songIds.push(result.id)
    const icon = result.action === 'created' ? '+' : '↻'
    console.log(`${icon} p.${song.source.page} ${result.title} (${result.slug})`)
  }

  const playlistAction = await appendToSongbookPlaylist(supabase, songIds, dryRun)
  console.log(`\nPlaylist ${SONGBOOK_PLAYLIST.slug}: ${playlistAction} (${songIds.length} songs linked)`)
  console.log('Done.')
}

run().catch((error) => {
  console.error('Seed failed:', error)
  process.exit(1)
})
