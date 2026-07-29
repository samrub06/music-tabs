/**
 * Patch Beau-Papa first lyric line timing (verse ~15–18s, not refrain ~118s).
 * Run: npx tsx scripts/lyrics-sync/patch-beau-papa-first-line.ts
 */
import { config } from 'dotenv'
config({ path: '.env.local' })

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const SONG_ID = '0214c12b-d8fe-4928-a60d-96a47c03e52e'
const FIRST_LINE_RE = /j.?avais\s+pas\s+pr[eé]vu/i
/** Matches public/dev/beau-papa-timed.json */
const PATCH_START = 14.96
const PATCH_END = 18.2

type SyncLine = {
  sectionIndex?: number
  lineIndex?: number
  text?: string
  startSec?: number | null
  endSec?: number | null
  score?: number
  [key: string]: unknown
}

function patchLines(lines: SyncLine[]): { lines: SyncLine[]; patched: boolean; before?: number | null } {
  const next = lines.map((l) => ({ ...l }))
  const idx = next.findIndex((l) => FIRST_LINE_RE.test(String(l.text || '')))
  if (idx < 0) return { lines: next, patched: false }

  const before = next[idx].startSec ?? null
  // Only rewrite if it looks like the refrain (~1:58) or is clearly late.
  if (before != null && before < 40) {
    return { lines: next, patched: false, before }
  }

  next[idx] = {
    ...next[idx],
    startSec: PATCH_START,
    endSec: PATCH_END,
    score: typeof next[idx].score === 'number' ? next[idx].score : 0.9,
  }
  return { lines: next, patched: true, before }
}

async function patchDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    return
  }

  const sb = createClient(url, key)
  const { data, error } = await sb
    .from('song_lyric_syncs')
    .select('id, song_id, youtube_video_id, status, lines')
    .eq('song_id', SONG_ID)
    .eq('status', 'ready')

  if (error) {
    console.error('DB read failed:', error.message)
    return
  }

  for (const row of data || []) {
    const lines = (row.lines || []) as SyncLine[]
    const { lines: patched, patched: did, before } = patchLines(lines)
    if (!did) {
      console.log(
        `DB ${row.youtube_video_id}: skip (startSec=${before ?? 'null'})`
      )
      continue
    }
    const { error: upErr } = await sb
      .from('song_lyric_syncs')
      .update({
        lines: patched,
        updated_at: new Date().toISOString(),
      })
      .eq('id', row.id)
    if (upErr) {
      console.error(`DB update failed ${row.id}:`, upErr.message)
    } else {
      console.log(
        `DB ${row.youtube_video_id}: patched first line ${before} → ${PATCH_START}`
      )
    }
  }
}

function patchFileCaches() {
  const dirs = [
    join(process.cwd(), 'experiments/lyric-sync/cache'),
    join(process.cwd(), 'experiments/beau-papa'),
  ]

  for (const dir of dirs) {
    if (!existsSync(dir)) continue
    for (const name of readdirSync(dir)) {
      if (!name.endsWith('.json')) continue
      if (!name.includes(SONG_ID) && !name.includes('beau') && !name.includes('aligned')) {
        continue
      }
      const path = join(dir, name)
      let raw: unknown
      try {
        raw = JSON.parse(readFileSync(path, 'utf8'))
      } catch {
        continue
      }
      if (!raw || typeof raw !== 'object') continue
      const obj = raw as { lines?: SyncLine[]; songId?: string }
      if (!Array.isArray(obj.lines)) continue
      if (obj.songId && obj.songId !== SONG_ID && !name.includes(SONG_ID)) continue

      const { lines, patched, before } = patchLines(obj.lines)
      if (!patched) {
        console.log(`file ${name}: skip (startSec=${before ?? 'null'})`)
        continue
      }
      writeFileSync(path, JSON.stringify({ ...obj, lines }, null, 2) + '\n', 'utf8')
      console.log(`file ${name}: patched ${before} → ${PATCH_START}`)
    }
  }
}

async function main() {
  await patchDb()
  patchFileCaches()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
