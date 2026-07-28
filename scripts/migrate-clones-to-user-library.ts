/**
 * Migrate personal clones (cloned_from_id set) into user_library links.
 * Inserts links to catalog ids; keeps clone rows (non-destructive).
 *
 * Requires db/add-user-library.sql applied first.
 *
 * Usage:
 *   npx tsx scripts/migrate-clones-to-user-library.ts
 *   APPLY=1 npx tsx scripts/migrate-clones-to-user-library.ts
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import type { Database } from '../src/types/db'

dotenv.config({ path: '.env.local' })

const dryRun = process.env.APPLY !== '1' && process.env.APPLY !== 'true'

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  const supabase = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // Verify table exists
  const { error: probeError } = await (supabase as any)
    .from('user_library')
    .select('id')
    .limit(1)
  if (probeError) {
    console.error(
      'user_library table missing. Apply db/add-user-library.sql in Supabase first.'
    )
    console.error(probeError.message)
    process.exit(1)
  }

  const pageSize = 1000
  type Row = {
    id: string
    user_id: string
    folder_id: string | null
    cloned_from_id: string
    title: string
  }
  const clones: Row[] = []
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await (supabase.from('songs') as any)
      .select('id, user_id, folder_id, cloned_from_id, title')
      .not('user_id', 'is', null)
      .not('cloned_from_id', 'is', null)
      .range(from, from + pageSize - 1)
    if (error) throw error
    const batch = (data || []) as Row[]
    clones.push(...batch)
    if (batch.length < pageSize) break
  }

  console.log(
    dryRun
      ? `DRY RUN. ${clones.length} personal clones with cloned_from_id`
      : `APPLY. ${clones.length} personal clones with cloned_from_id`
  )

  let inserted = 0
  let skipped = 0
  let errors = 0

  for (const row of clones) {
    const catalogId = row.cloned_from_id
    const { data: existing } = await (supabase as any)
      .from('user_library')
      .select('id')
      .eq('user_id', row.user_id)
      .eq('song_id', catalogId)
      .maybeSingle()

    if (existing?.id) {
      skipped += 1
      continue
    }

    console.log(
      `[link] user=${row.user_id.slice(0, 8)} catalog=${catalogId.slice(0, 8)} "${row.title}"`
    )
    if (dryRun) {
      inserted += 1
      continue
    }

    const { error } = await (supabase as any).from('user_library').insert({
      user_id: row.user_id,
      song_id: catalogId,
      folder_id: row.folder_id,
    })
    if (error) {
      // Unique race or FK
      if (error.code === '23505') {
        skipped += 1
        continue
      }
      console.error(`  failed:`, error.message)
      errors += 1
      continue
    }
    inserted += 1
  }

  console.log('\nSummary:')
  console.log(`  candidates: ${clones.length}`)
  console.log(`  inserted:   ${inserted}`)
  console.log(`  skipped:    ${skipped}`)
  console.log(`  errors:     ${errors}`)
  console.log(dryRun ? '  mode: DRY_RUN' : '  mode: APPLY')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
