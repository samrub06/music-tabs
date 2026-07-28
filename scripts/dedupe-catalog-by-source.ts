/**
 * Deduplicate system catalog songs by source identity only (source_url / tab_id).
 * Never merges on title+author alone (UG ≠ Negina).
 *
 * - Rewires songs.cloned_from_id from donors → canonical
 * - Moves song_lyric_syncs from donors → canonical when missing
 * - Deletes donor system rows
 *
 * Usage:
 *   npx tsx scripts/dedupe-catalog-by-source.ts          # dry-run
 *   APPLY=1 npx tsx scripts/dedupe-catalog-by-source.ts  # write
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import {
  groupCatalogSongsBySourceIdentity,
  pickCanonicalCatalogSong,
  type CatalogSongRef,
} from '../src/lib/utils/catalogSongDedup'
import type { Database } from '../src/types/db'

dotenv.config({ path: '.env.local' })

const dryRun = process.env.APPLY !== '1' && process.env.APPLY !== 'true'

type Row = CatalogSongRef & {
  is_public?: boolean | null
  is_trending?: boolean | null
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  const supabase = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const pageSize = 1000
  const songs: Row[] = []
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await (supabase.from('songs') as any)
      .select(
        'id, title, author, source_url, tab_id, user_id, view_count, created_at, is_public, is_trending'
      )
      .is('user_id', null)
      .range(from, from + pageSize - 1)
    if (error) throw error
    const batch = (data || []) as Row[]
    songs.push(...batch)
    if (batch.length < pageSize) break
  }
  const groups = groupCatalogSongsBySourceIdentity(songs).filter((g) => g.length > 1)

  console.log(
    dryRun
      ? `DRY RUN (set APPLY=1 to write). ${songs.length} catalog rows, ${groups.length} duplicate groups`
      : `APPLY. ${songs.length} catalog rows, ${groups.length} duplicate groups`
  )

  let deleted = 0
  let rewiredClones = 0
  let movedSyncs = 0
  let errors = 0

  for (const group of groups) {
    const canonical = pickCanonicalCatalogSong(group)
    const donors = group.filter((s) => s.id !== canonical.id)
    console.log(
      `[group] canonical=${canonical.id.slice(0, 8)} "${canonical.title}" donors=${donors.length} url=${canonical.source_url || '-'} tab=${canonical.tab_id || '-'}`
    )

    for (const donor of donors) {
      if (dryRun) {
        deleted += 1
        continue
      }

      try {
        const { data: clones } = await (supabase.from('songs') as any)
          .select('id')
          .eq('cloned_from_id', donor.id)
        for (const clone of clones || []) {
          const { error: cloneErr } = await (supabase.from('songs') as any)
            .update({ cloned_from_id: canonical.id })
            .eq('id', clone.id)
          if (cloneErr) throw cloneErr
          rewiredClones += 1
        }

        const { data: syncs } = await (supabase as any)
          .from('song_lyric_syncs')
          .select('id, youtube_video_id, status')
          .eq('song_id', donor.id)

        for (const sync of syncs || []) {
          const { data: existing } = await (supabase as any)
            .from('song_lyric_syncs')
            .select('id')
            .eq('song_id', canonical.id)
            .eq('youtube_video_id', sync.youtube_video_id)
            .maybeSingle()

          if (existing?.id) {
            await (supabase as any).from('song_lyric_syncs').delete().eq('id', sync.id)
          } else {
            await (supabase as any)
              .from('song_lyric_syncs')
              .update({ song_id: canonical.id })
              .eq('id', sync.id)
            movedSyncs += 1
          }
        }

        const { error: delErr } = await (supabase.from('songs') as any)
          .delete()
          .eq('id', donor.id)
          .is('user_id', null)
        if (delErr) throw delErr
        deleted += 1
        console.log(`  deleted donor ${donor.id.slice(0, 8)}`)
      } catch (err) {
        errors += 1
        console.error(`  failed donor ${donor.id}:`, err)
      }
    }
  }

  console.log('\nSummary:')
  console.log(`  duplicate groups: ${groups.length}`)
  console.log(`  donors deleted:   ${deleted}`)
  console.log(`  clones rewired:   ${rewiredClones}`)
  console.log(`  syncs moved:      ${movedSyncs}`)
  console.log(`  errors:           ${errors}`)
  console.log(dryRun ? '  mode: DRY_RUN' : '  mode: APPLY')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
