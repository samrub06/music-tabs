/**
 * One-shot backfill: set songs.cloned_from_id for user library copies
 * that match a catalog song (tabId / sourceUrl / title+author).
 *
 * Usage:
 *   DRY_RUN=1 npx tsx scripts/backfill-cloned-from.ts
 *   npx tsx scripts/backfill-cloned-from.ts
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { findUserSongMatch } from '../src/lib/utils/songLibraryMatch'

dotenv.config({ path: '.env.local' })

const dryRun = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true'

type SongRow = {
  id: string
  title: string
  author: string | null
  tab_id: string | null
  source_url: string | null
  cloned_from_id?: string | null
  user_id?: string | null
  is_public?: boolean | null
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
    .select('id, title, author, tab_id, source_url, user_id, is_public')
    .or('user_id.is.null,is_public.eq.true')

  if (catalogError) throw catalogError

  const catalog = ((catalogRows || []) as SongRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    author: row.author || '',
    tabId: row.tab_id || undefined,
    sourceUrl: row.source_url || undefined,
  }))

  const { data: userRows, error: userError } = await supabase
    .from('songs')
    .select('id, title, author, tab_id, source_url, cloned_from_id, user_id')
    .not('user_id', 'is', null)
    .is('cloned_from_id', null)

  if (userError) throw userError

  let matched = 0
  let updated = 0
  const candidates = (userRows || []) as SongRow[]

  for (const row of candidates) {
    const userSong = {
      id: row.id,
      title: row.title,
      author: row.author || '',
      tabId: row.tab_id || undefined,
      sourceUrl: row.source_url || undefined,
    }

    let catalogMatch: (typeof catalog)[number] | undefined
    for (const c of catalog) {
      if (findUserSongMatch(c, [userSong])) {
        catalogMatch = c
        break
      }
    }

    if (!catalogMatch || catalogMatch.id === row.id) continue
    matched += 1

    if (dryRun) {
      console.log(`[dry-run] ${row.id} → ${catalogMatch.id} (${row.title})`)
      continue
    }

    const { error } = await supabase
      .from('songs')
      .update({ cloned_from_id: catalogMatch.id })
      .eq('id', row.id)

    if (error) {
      console.error(`Failed ${row.id}:`, error.message)
      continue
    }
    updated += 1
  }

  console.log(
    dryRun
      ? `Dry run: ${matched} matches among ${candidates.length} user songs without cloned_from_id`
      : `Updated ${updated}/${matched} matches (${candidates.length} candidates)`
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
