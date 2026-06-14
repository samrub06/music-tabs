import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { songbookSeedService } from '../src/lib/services/songbookSeedService'
import type { Database } from '../src/types/db'

dotenv.config({ path: '.env.local' })

function parseArgs() {
  const args = process.argv.slice(2)
  let limit: number | undefined
  let dryRun = false
  let source: 'tab4u' | 'ultimate-guitar' | 'both' = 'tab4u'

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) {
      limit = Number(args[i + 1])
      i++
    } else if (args[i] === '--dry-run') {
      dryRun = true
    } else if (args[i] === '--source' && args[i + 1]) {
      const value = args[i + 1]
      if (value === 'tab4u' || value === 'ultimate-guitar' || value === 'both') {
        source = value
      }
      i++
    }
  }

  return { limit, dryRun, source }
}

async function run() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local'
    )
    process.exit(1)
  }

  const { limit, dryRun, source } = parseArgs()

  if (source === 'ultimate-guitar' || source === 'both') {
    process.env.UG_SKIP_PROXY = '1'
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const sourceLabel =
    source === 'both' ? 'Tab4U + Ultimate Guitar' : source === 'ultimate-guitar' ? 'Ultimate Guitar' : 'Tab4U'

  console.log(
    `Importing songbook from ${sourceLabel}${dryRun ? ' (dry run)' : ''}${limit ? ` — limit ${limit} entries` : ''}...\n`
  )
  if (source === 'ultimate-guitar' || source === 'both') {
    console.log('UG: direct fetch (no proxy)\n')
  }

  try {
    const summary = await songbookSeedService(supabase).seedFromSonglist({
      limit,
      dryRun,
      source,
      sectionIds: ['main', 'supplementary'],
    })

    console.log(
      `Playlist ${summary.playlistAction}: ${summary.songCount} songs in DB`
    )
    console.log(
      `Added: ${summary.added} | Updated: ${summary.updated} | Skipped: ${summary.skipped} | Errors: ${summary.errors}\n`
    )

    for (const result of summary.results) {
      if (result.status === 'added') {
        console.log(`  + ${result.title} — ${result.author}`)
        console.log(`    ${result.url}`)
      } else if (result.status === 'updated') {
        console.log(`  ↻ ${result.title} — ${result.author}`)
      } else if (result.status === 'skipped') {
        console.log(
          `  ⚠ skip ${result.transliteration ?? result.query} — ${result.reason}`
        )
      } else {
        console.log(
          `  ✗ ${result.transliteration ?? result.query} — ${result.reason}`
        )
      }
    }

    console.log('\nDone.')
  } catch (error) {
    console.error('Seed failed:', error)
    process.exit(1)
  }
}

run()
