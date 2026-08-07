/**
 * Admin: demote songs tagged with artist genres whose author does not match.
 * Then rebuild Hebrew playlist memberships.
 *
 * Usage: npx tsx scripts/cleanup-artist-playlist-genres.ts [--dry-run]
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { HEBREW_CATALOG_GENRES } from '../src/data/hebrewCatalogGenres'
import { rebuildHebrewPlaylistsFromGenres } from '../src/lib/services/hebrewPlaylistRebuildService'
import {
  classifyHebrewSongHeuristic,
  categoryToCatalogGenre,
} from '../src/lib/services/hebrewSongClassifierService'
import type { Database } from '../src/types/db'

dotenv.config({ path: '.env.local' })

const ARTIST_GENRES = [
  HEBREW_CATALOG_GENRES.hananBenAri,
  HEBREW_CATALOG_GENRES.aharonRazel,
  HEBREW_CATALOG_GENRES.eviatarBanai,
  HEBREW_CATALOG_GENRES.shuliRand,
  HEBREW_CATALOG_GENRES.akiva,
  HEBREW_CATALOG_GENRES.ribo,
  HEBREW_CATALOG_GENRES.karduner,
  HEBREW_CATALOG_GENRES.benZur,
  HEBREW_CATALOG_GENRES.eyalGolan,
  HEBREW_CATALOG_GENRES.omerAdam,
  HEBREW_CATALOG_GENRES.edenHason,
  HEBREW_CATALOG_GENRES.saritHadad,
  HEBREW_CATALOG_GENRES.moshePeretz,
  HEBREW_CATALOG_GENRES.nathanGoshen,
  HEBREW_CATALOG_GENRES.idanRaichel,
  HEBREW_CATALOG_GENRES.shlomoArtzi,
  HEBREW_CATALOG_GENRES.staticBenEl,
  HEBREW_CATALOG_GENRES.noaKirel,
  HEBREW_CATALOG_GENRES.itayLevi,
  HEBREW_CATALOG_GENRES.osherCohen,
  // avi-ohayon is a songwriter shelf (performer authors) — do not demote via author heuristic
] as const

async function run() {
  const dryRun = process.argv.includes('--dry-run')
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase env')
    process.exit(1)
  }

  const client = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data, error } = await (client.from('songs') as any)
    .select('id, title, author, genre')
    .in('genre', [...ARTIST_GENRES])
    .is('user_id', null)

  if (error) throw error
  const rows = (data ?? []) as {
    id: string
    title: string
    author: string
    genre: string
  }[]

  let demoted = 0
  for (const row of rows) {
    const heuristic = classifyHebrewSongHeuristic({
      id: row.id,
      title: row.title ?? '',
      author: row.author ?? '',
    })
    const expected = heuristic
      ? categoryToCatalogGenre(heuristic.category)
      : HEBREW_CATALOG_GENRES.modern
    if (expected === row.genre) continue

    console.log(
      `DEMOTÉ ${row.genre} → ${expected}: ${row.title} — ${row.author}`
    )
    if (!dryRun) {
      const { error: upErr } = await (client.from('songs') as any)
        .update({
          genre: expected,
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id)
      if (upErr) throw upErr
    }
    demoted += 1
  }

  console.log(`\nDemoted ${demoted} songs${dryRun ? ' (dry-run)' : ''}`)

  if (!dryRun) {
    const rebuilds = await rebuildHebrewPlaylistsFromGenres(client)
    for (const r of rebuilds) {
      console.log(`  ${r.slug}: ${r.songCount} songs`)
    }
  }
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
