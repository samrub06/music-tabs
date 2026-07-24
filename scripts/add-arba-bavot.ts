/**
 * Add the "Arba Bavot" (ניגון ארבע בבות) Chabad niggun to the public catalog
 * and link it into the "Nigounim Habad" curated playlist (chabad-nigunim).
 *
 * Usage: npx tsx scripts/add-arba-bavot.ts
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { ARBA_BAVOT_CATALOG_SONG } from '../src/data/catalogSongs/arbaBavot'
import { songRepo } from '../src/lib/services/songRepo'
import { parseTextToStructuredSong } from '../src/utils/songParser'
import { extractAllChords } from '../src/utils/structuredSong'
import type { Database } from '../src/types/db'
import { revalidateSongCache } from './revalidateSongCache'

dotenv.config({ path: '.env.local' })

const CHABAD_PLAYLIST_SLUG = 'chabad-nigunim'

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

  const repo = songRepo(supabase)
  const { slug, genre, difficulty, decade, ...payload } = ARBA_BAVOT_CATALOG_SONG

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
    version_description: payload.versionDescription ?? null,
    difficulty,
    song_image_url: payload.songImageUrl ?? null,
    source_site: payload.sourceSite ?? 'Curated',
    tab_id: payload.tabId ?? null,
    is_trending: true,
    is_public: true,
    genre,
    decade,
    updated_at: now,
  }

  let songId: string
  if (existing) {
    const { error } = await (supabase.from('songs') as any).update(row).eq('id', existing.id)
    if (error) throw error
    songId = existing.id
    console.log(`↻ Updated "${payload.title}" (${songId})`)
  } else {
    const { data, error } = await (supabase.from('songs') as any)
      .insert([{ ...row, user_id: null, created_at: now }])
      .select('id')
      .single()
    if (error) throw error
    songId = data.id as string
    console.log(`+ Created "${payload.title}" (${songId})`)
  }

  // Link into the Chabad curated playlist (append, idempotent).
  const { data: playlist, error: plError } = await (supabase.from('playlists') as any)
    .select('id, name, song_ids')
    .eq('curated_slug', CHABAD_PLAYLIST_SLUG)
    .maybeSingle()
  if (plError) throw plError
  if (!playlist?.id) {
    console.error(`Chabad playlist "${CHABAD_PLAYLIST_SLUG}" not found. Seed it first.`)
    process.exit(1)
  }

  const currentIds: string[] = playlist.song_ids ?? []
  if (currentIds.includes(songId)) {
    console.log(`= Already in playlist "${playlist.name}".`)
  } else {
    const nextIds = [...currentIds, songId]
    const { error: updateError } = await (supabase.from('playlists') as any)
      .update({ song_ids: nextIds, updated_at: now })
      .eq('id', playlist.id)
    if (updateError) throw updateError
    console.log(`+ Added to playlist "${playlist.name}" (${nextIds.length} songs).`)
  }

  await revalidateSongCache(songId)
  console.log('Done.')
}

run().catch((error) => {
  console.error('Add failed:', error)
  process.exit(1)
})
