/**
 * Admin/ops: assign genre to public catalog songs with null genre via heuristics.
 *
 * Usage:
 *   npm run triage:null-genres -- --dry-run --limit=100
 *   npm run triage:null-genres
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { triageGenreHeuristic } from '../src/data/genreTriageHeuristics'
import type { Database } from '../src/types/db'

dotenv.config({ path: '.env.local' })

const PAGE_SIZE = 500

function parseArgs() {
  let dryRun = false
  let limit: number | undefined
  for (const arg of process.argv.slice(2)) {
    if (arg === '--dry-run') dryRun = true
    else if (arg.startsWith('--limit=')) {
      limit = Number.parseInt(arg.split('=')[1] ?? '', 10)
    }
  }
  return { dryRun, limit }
}

async function run() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase env in .env.local')
    process.exit(1)
  }

  const { dryRun, limit } = parseArgs()
  const client = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log('Loading null-genre public catalog songs...')
  const songs: { id: string; title: string; author: string }[] = []
  let from = 0
  const hardCap = limit ?? Number.POSITIVE_INFINITY

  while (from < hardCap) {
    const to = Math.min(from + PAGE_SIZE - 1, hardCap - 1)
    const { data, error } = await (client.from('songs') as any)
      .select('id, title, author')
      .is('genre', null)
      .is('user_id', null)
      .or('is_public.eq.true,is_trending.eq.true')
      .order('view_count', { ascending: false, nullsFirst: false })
      .range(from, to)
    if (error) throw error
    const rows = (data ?? []) as { id: string; title: string; author: string }[]
    if (rows.length === 0) break
    songs.push(...rows)
    if (rows.length < to - from + 1) break
    from += PAGE_SIZE
  }

  console.log(`Loaded ${songs.length} null-genre songs${dryRun ? ' (dry-run)' : ''}\n`)

  const byGenre = new Map<string, number>()
  let applied = 0
  let skipped = 0

  for (const song of songs) {
    const hit = triageGenreHeuristic({
      title: song.title ?? '',
      author: song.author ?? '',
    })
    if (!hit) {
      skipped += 1
      continue
    }
    byGenre.set(hit.genre, (byGenre.get(hit.genre) ?? 0) + 1)
    console.log(
      `${dryRun ? 'WOULD' : 'APPLY'} ${hit.genre.padEnd(16)} ${song.title} — ${song.author} (${hit.reason})`
    )
    if (!dryRun) {
      const { error } = await (client.from('songs') as any)
        .update({ genre: hit.genre, updated_at: new Date().toISOString() })
        .eq('id', song.id)
        .is('genre', null)
      if (error) throw error
    }
    applied += 1
  }

  console.log('\n--- By genre ---')
  const genreRows = Array.from(byGenre.entries()).sort((a, b) => b[1] - a[1])
  for (let i = 0; i < genreRows.length; i += 1) {
    const [g, n] = genreRows[i]
    console.log(`  ${String(n).padStart(4)} → ${g}`)
  }
  console.log(`\nDone. applied=${applied} skipped=${skipped} total=${songs.length}`)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
