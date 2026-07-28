/**
 * Backfill songs.cloned_from_id for user library copies that match a catalog
 * song by tab_id / source_url only (never title+author).
 *
 * For promote-on-miss as well, use:
 *   npx tsx scripts/migrate-user-songs-to-catalog.ts
 *
 * Usage:
 *   DRY_RUN=1 npx tsx scripts/backfill-cloned-from.ts
 *   APPLY=1 npx tsx scripts/backfill-cloned-from.ts
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import {
  buildCatalogSourceIndex,
  matchCatalogBySourceIdentity,
} from '../src/lib/utils/catalogSourceIndex'

dotenv.config({ path: '.env.local' })

const dryRun = process.env.APPLY !== '1' && process.env.APPLY !== 'true'

type SongRow = {
  id: string
  title: string
  author: string | null
  tab_id: string | null
  source_url: string | null
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: catalogRows, error: catalogError } = await supabase
    .from('songs')
    .select('id, title, author, tab_id, source_url')
    .is('user_id', null)

  if (catalogError) throw catalogError

  const index = buildCatalogSourceIndex(
    ((catalogRows || []) as SongRow[]).map((row) => ({
      id: row.id,
      tabId: row.tab_id,
      sourceUrl: row.source_url,
    }))
  )

  const { data: userRows, error: userError } = await supabase
    .from('songs')
    .select('id, title, author, tab_id, source_url, cloned_from_id, user_id')
    .not('user_id', 'is', null)
    .is('cloned_from_id', null)
    .or('tab_id.not.is.null,source_url.not.is.null')

  if (userError) throw userError

  let matched = 0
  let updated = 0
  const candidates = (userRows || []) as SongRow[]

  for (const row of candidates) {
    const catalogId = matchCatalogBySourceIdentity(
      { id: row.id, tabId: row.tab_id, sourceUrl: row.source_url },
      index
    )
    if (!catalogId) continue
    matched += 1

    if (dryRun) {
      console.log(`[dry-run] ${row.id} → ${catalogId} (${row.title})`)
      continue
    }

    const { error } = await supabase
      .from('songs')
      .update({ cloned_from_id: catalogId })
      .eq('id', row.id)

    if (error) {
      console.error(`Failed ${row.id}:`, error.message)
      continue
    }
    updated += 1
  }

  console.log(
    dryRun
      ? `Dry run: ${matched} matches among ${candidates.length} user songs without cloned_from_id (source identity only)`
      : `Updated ${updated}/${matched} matches (${candidates.length} candidates)`
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
