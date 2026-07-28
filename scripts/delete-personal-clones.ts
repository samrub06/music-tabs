/**
 * Delete all personal clone rows (cloned_from_id set). Catalog wins.
 * Ensures user_library links to catalog ids exist first. Does NOT copy clone edits.
 *
 * Usage:
 *   npx tsx scripts/delete-personal-clones.ts
 *   APPLY=1 npx tsx scripts/delete-personal-clones.ts
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const dryRun = process.env.APPLY !== '1' && process.env.APPLY !== 'true'

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { count: catalogBefore } = await supabase
    .from('songs')
    .select('id', { count: 'exact', head: true })
    .is('user_id', null)

  const { count: kardunerBefore } = await supabase
    .from('songs')
    .select('id', { count: 'exact', head: true })
    .is('user_id', null)
    .ilike('author', '%kardun%')

  const { data: clones, error } = await supabase
    .from('songs')
    .select('id, user_id, cloned_from_id, title, author')
    .not('user_id', 'is', null)
    .not('cloned_from_id', 'is', null)

  if (error) throw error

  const rows = clones || []
  console.log(`Found ${rows.length} personal clones`)

  const { data: links } = await supabase.from('user_library').select('user_id, song_id')
  const linkSet = new Set((links || []).map((l) => `${l.user_id}:${l.song_id}`))

  const ensure: Array<{ user_id: string; song_id: string; folder_id: null }> = []
  for (const c of rows) {
    const keyLink = `${c.user_id}:${c.cloned_from_id}`
    if (!linkSet.has(keyLink)) {
      ensure.push({
        user_id: c.user_id as string,
        song_id: c.cloned_from_id as string,
        folder_id: null,
      })
      linkSet.add(keyLink)
    }
  }
  console.log(`Library links to ensure: ${ensure.length}`)

  if (dryRun) {
    console.log('DRY RUN — set APPLY=1 to delete clones')
    console.log({ catalogBefore, kardunerBefore, sample: rows.slice(0, 5) })
    return
  }

  if (ensure.length > 0) {
    for (let i = 0; i < ensure.length; i += 100) {
      const chunk = ensure.slice(i, i + 100)
      const { error: upsErr } = await supabase
        .from('user_library')
        .upsert(chunk, { onConflict: 'user_id,song_id', ignoreDuplicates: true })
      if (upsErr) throw upsErr
    }
  }

  const ids = rows.map((r) => r.id)
  let deleted = 0
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50)
    // Safety: only rows that are personal clones
    const { error: delErr, count } = await supabase
      .from('songs')
      .delete({ count: 'exact' })
      .in('id', chunk)
      .not('user_id', 'is', null)
      .not('cloned_from_id', 'is', null)
    if (delErr) throw delErr
    deleted += count ?? chunk.length
  }

  const { count: clonesAfter } = await supabase
    .from('songs')
    .select('id', { count: 'exact', head: true })
    .not('user_id', 'is', null)
    .not('cloned_from_id', 'is', null)

  const { count: catalogAfter } = await supabase
    .from('songs')
    .select('id', { count: 'exact', head: true })
    .is('user_id', null)

  const { count: kardunerAfter } = await supabase
    .from('songs')
    .select('id', { count: 'exact', head: true })
    .is('user_id', null)
    .ilike('author', '%kardun%')

  const { count: libAfter } = await supabase
    .from('user_library')
    .select('id', { count: 'exact', head: true })

  console.log(
    JSON.stringify(
      {
        deleted,
        clonesAfter,
        catalogBefore,
        catalogAfter,
        kardunerBefore,
        kardunerAfter,
        libAfter,
      },
      null,
      2
    )
  )

  if (catalogAfter !== catalogBefore) {
    throw new Error('SAFETY FAIL: catalog count changed')
  }
  if (kardunerAfter !== kardunerBefore) {
    throw new Error('SAFETY FAIL: karduner catalog count changed')
  }
  if ((clonesAfter ?? 0) > 0) {
    console.warn('Warning: some clones remain:', clonesAfter)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
