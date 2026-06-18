import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { neginaPlaylistSeedService } from '../src/lib/services/neginaPlaylistSeedService'
import { LIBRARY_CATALOG_TAG } from '../src/lib/services/libraryCatalogCache'
import type { Database } from '../src/types/db'

dotenv.config({ path: '.env.local' })

function parseArgs() {
  let dryRun = false
  let maxSongs: number | undefined
  let startPage = 1
  let skipExisting = false

  for (const arg of process.argv.slice(2)) {
    if (arg === '--dry-run') dryRun = true
    else if (arg === '--skip-existing') skipExisting = true
    else if (arg.startsWith('--max-songs=')) {
      maxSongs = Number.parseInt(arg.split('=')[1] ?? '', 10)
    } else if (arg.startsWith('--page=')) {
      startPage = Number.parseInt(arg.split('=')[1] ?? '', 10)
    }
  }

  return { dryRun, maxSongs, startPage, skipExisting }
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

  const { dryRun, maxSongs, startPage, skipExisting } = parseArgs()

  const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log('Seeding Negina Jewish music genre...\n')
  if (dryRun) console.log('(dry-run mode)\n')
  if (!process.env.SCRAPER_API_KEY && !process.env.UG_PROXY_URL && !process.env.NEGINA_PROXY_URL) {
    console.warn(
      'Warning: set UG_PROXY_URL or SCRAPER_API_KEY — Negina fetch may fail (Cloudflare).\n'
    )
  }

  try {
    const result = await neginaPlaylistSeedService(supabase).seedNeginaJewishPlaylist({
      dryRun,
      maxSongs,
      startPage,
      skipExisting,
      playlistSlug: 'negina-jewish-music',
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
