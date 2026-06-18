import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { tab4uCategorySeedService } from '../src/lib/services/tab4uCategorySeedService'
import { LIBRARY_CATALOG_TAG } from '../src/lib/services/libraryCatalogCache'
import type { Database } from '../src/types/db'

dotenv.config({ path: '.env.local' })

function parseArgs() {
  let dryRun = false
  let maxSongs: number | undefined
  let startOffset = 0
  let skipExisting = false

  for (const arg of process.argv.slice(2)) {
    if (arg === '--dry-run') dryRun = true
    else if (arg === '--skip-existing') skipExisting = true
    else if (arg.startsWith('--max-songs=')) {
      maxSongs = Number.parseInt(arg.split('=')[1] ?? '', 10)
    } else if (arg.startsWith('--offset=')) {
      startOffset = Number.parseInt(arg.split('=')[1] ?? '', 10)
    }
  }

  return { dryRun, maxSongs, startOffset, skipExisting }
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

  const { dryRun, maxSongs, startOffset, skipExisting } = parseArgs()

  const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log('Seeding Tab4U hassidic category (cat=1)...\n')
  if (dryRun) console.log('(dry-run mode)\n')

  try {
    const result = await tab4uCategorySeedService(supabase).seedTab4uCategory({
      cat: 1,
      dryRun,
      maxSongs,
      startOffset,
      skipExisting,
      playlistSlug: 'tab4u-hassidic-full',
    })

    console.log(`${result.action === 'created' ? '✅' : '🔄'} ${result.slug} (${result.songCount} songs)\n`)

    for (const song of result.songs) {
      if (song.status === 'added') {
        console.log(`    + ${song.title}`)
      } else if (song.status === 'updated') {
        console.log(`    ↻ ${song.title}`)
      } else if (song.status === 'skipped') {
        console.log(`    ⚠ skip ${song.url} — ${song.reason}`)
      } else {
        console.log(`    ✗ ${song.url} — ${song.reason}`)
      }
    }

    console.log('\nDone.')

    if (!dryRun) {
      try {
        const { revalidateTag, revalidatePath } = await import('next/cache')
        revalidateTag(LIBRARY_CATALOG_TAG)
        revalidatePath('/')
        console.log('Cache revalidated for home library sections.')
      } catch {
        console.log('Hard-refresh the home page if playlists look stale.')
      }
    }
  } catch (error) {
    console.error('Seed failed:', error)
    process.exit(1)
  }
}

run()
