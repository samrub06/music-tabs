import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { FEATURED_CATALOG_SONG } from '../src/data/featuredCatalogSong'
import { songRepo } from '../src/lib/services/songRepo'
import { parseTextToStructuredSong } from '../src/utils/songParser'
import { extractAllChords } from '../src/utils/structuredSong'
import type { Database } from '../src/types/db'

dotenv.config({ path: '.env.local' })

async function run() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local'
    )
    process.exit(1)
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const repo = songRepo(supabase)
  const { slug, genre, difficulty, decade, ...songData } = FEATURED_CATALOG_SONG

  const structuredSong = parseTextToStructuredSong(
    songData.title,
    songData.author,
    songData.content,
    undefined,
    songData.reviews,
    songData.capo,
    songData.key
  )
  const allChords = extractAllChords(structuredSong)
  const now = new Date().toISOString()

  const existing = await repo.findExistingSystemCatalogSong({
    tabId: songData.tabId,
    title: songData.title,
    author: songData.author,
  })

  const row = {
    title: songData.title,
    author: songData.author,
    format: 'structured' as const,
    sections: structuredSong.sections,
    reviews: songData.reviews ?? 0,
    capo: songData.capo ?? null,
    key: songData.key ?? structuredSong.firstChord,
    first_chord: structuredSong.firstChord ?? null,
    last_chord: structuredSong.lastChord ?? null,
    all_chords: allChords.length > 0 ? allChords : null,
    version: songData.version ?? null,
    version_description: songData.versionDescription ?? null,
    rating: songData.rating ?? null,
    difficulty,
    artist_url: songData.artistUrl ?? null,
    artist_image_url: songData.artistImageUrl ?? null,
    song_image_url: songData.songImageUrl ?? null,
    source_url: songData.sourceUrl ?? null,
    source_site: songData.sourceSite ?? 'Curated',
    tab_id: songData.tabId ?? null,
    bpm: songData.bpm ?? null,
    is_trending: true,
    is_public: true,
    genre,
    decade,
    updated_at: now,
  }

  if (existing) {
    const { error } = await (supabase.from('songs') as any)
      .update(row)
      .eq('id', existing.id)

    if (error) throw error
    console.log(`Updated featured catalog song "${songData.title}" (${existing.id})`)
    return
  }

  const { data, error } = await (supabase.from('songs') as any)
    .insert([{ ...row, user_id: null, created_at: now }])
    .select('id')
    .single()

  if (error) throw error
  console.log(`Created featured catalog song "${songData.title}" (${data.id})`)
  console.log(`Slug: ${slug}`)
}

run().catch((error) => {
  console.error('Seed failed:', error)
  process.exit(1)
})
