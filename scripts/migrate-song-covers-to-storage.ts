/**
 * Download external catalog cover URLs into `catalog-images` and update
 * `songs.song_image_url`. Single long-lived process (no bash restart gaps).
 *
 *   npx tsx scripts/migrate-song-covers-to-storage.ts --write --until-done
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'
import type { Database } from '../src/types/db'
import {
  loadExternalCoverCandidates,
  migrateSongCoversBatch,
} from '../src/lib/services/songCoverStorageMigrate'

dotenv.config({ path: '.env.local' })

const WRITE = process.argv.includes('--write')
const FORCE = process.argv.includes('--force')
const UNTIL_DONE = process.argv.includes('--until-done')
const LIMIT = Number(process.argv.find((a) => a.startsWith('--limit='))?.split('=')[1] ?? 0)
const CONCURRENCY = Math.max(
  1,
  Number(process.argv.find((a) => a.startsWith('--concurrency='))?.split('=')[1] ?? 6)
)
const BATCH = Math.max(
  1,
  Number(process.argv.find((a) => a.startsWith('--batch='))?.split('=')[1] ?? 80)
)

const FAIL_FILE = path.resolve('experiments/cover-migrate/failed-ids.json')

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function loadFailedIds(): Set<string> {
  try {
    if (!fs.existsSync(FAIL_FILE)) return new Set()
    const raw = JSON.parse(fs.readFileSync(FAIL_FILE, 'utf8')) as string[]
    return new Set(Array.isArray(raw) ? raw : [])
  } catch {
    return new Set()
  }
}

function saveFailedIds(ids: Set<string>) {
  fs.mkdirSync(path.dirname(FAIL_FILE), { recursive: true })
  fs.writeFileSync(FAIL_FILE, JSON.stringify(Array.from(ids), null, 2))
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const supabase = createClient<Database>(supabaseUrl, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const supabaseHost = new URL(supabaseUrl).hostname
  const excludeIds = FORCE ? new Set<string>() : loadFailedIds()

  if (!UNTIL_DONE) {
    const all = await loadExternalCoverCandidates(supabase, supabaseHost, {
      force: FORCE,
      excludeIds,
    })
    const batchLimit = LIMIT > 0 ? LIMIT : Math.min(20, all.length)
    console.log(
      `Candidates=${all.length} processing=${batchLimit} write=${WRITE} concurrency=${CONCURRENCY} excluded=${excludeIds.size}`
    )
    if (all.length === 0) {
      console.log('Done ok=0 fail=0 skip=0 (nothing left)')
      return
    }
    const stats = await migrateSongCoversBatch(supabase, supabaseUrl, {
      limit: batchLimit,
      concurrency: CONCURRENCY,
      dryRun: !WRITE,
      force: FORCE,
      excludeIds,
    })
    saveFailedIds(excludeIds)
    console.log(`Done ok=${stats.ok} fail=${stats.fail} skip=${stats.skip}`)
    return
  }

  console.log(
    `[until-done] write=${WRITE} batch=${BATCH} concurrency=${CONCURRENCY} excluded=${excludeIds.size}`
  )
  let totalOk = 0
  let totalFail = 0
  let round = 0

  while (true) {
    round += 1
    const peek = await loadExternalCoverCandidates(supabase, supabaseHost, {
      force: FORCE,
      limit: BATCH + 1,
      excludeIds,
    })
    if (peek.length === 0) {
      console.log(
        `[until-done] exhausted after ${round - 1} rounds ok=${totalOk} fail=${totalFail} excluded=${excludeIds.size}`
      )
      break
    }

    console.log(
      `[until-done] round=${round} batch_candidates=${peek.length} excluded=${excludeIds.size}`
    )

    const stats = await migrateSongCoversBatch(supabase, supabaseUrl, {
      limit: BATCH,
      concurrency: CONCURRENCY,
      dryRun: !WRITE,
      force: FORCE,
      excludeIds,
    })
    saveFailedIds(excludeIds)
    totalOk += stats.ok
    totalFail += stats.fail
    console.log(
      `[until-done] round=${round} ok=+${stats.ok} fail=+${stats.fail} totals ok=${totalOk} fail=${totalFail} excluded=${excludeIds.size}`
    )

    if (stats.processed === 0) {
      console.log('[until-done] zero processed — stopping')
      break
    }

    await sleep(400)
  }

  console.log(`Done ok=${totalOk} fail=${totalFail} excluded=${excludeIds.size}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
