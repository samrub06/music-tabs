import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { hebrewPlaylistSeedService } from '../src/lib/services/hebrewPlaylistSeedService'
import { LIBRARY_CATALOG_TAG } from '../src/lib/services/libraryCatalogCache'
import type { Database } from '../src/types/db'

dotenv.config({ path: '.env.local' })

async function run() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local'
    )
    process.exit(1)
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log('Importing Hebrew playlists from Tab4U...\n')

  try {
    const results = await hebrewPlaylistSeedService(supabase).seedAllHebrewPlaylists()

    for (const playlist of results) {
      const icon = playlist.songCount === 0 ? '⚠️ ' : playlist.action === 'created' ? '✅' : '🔄'
      console.log(`${icon} ${playlist.slug} (${playlist.songCount} songs)`)

      for (const song of playlist.songs) {
        if (song.status === 'added') {
          console.log(`    + ${song.title}`)
        } else if (song.status === 'updated') {
          console.log(`    ↻ ${song.title}`)
        } else if (song.status === 'skipped') {
          console.log(`    ⚠ skip ${song.query || '(entry)'} — ${song.reason}`)
        } else {
          console.log(`    ✗ "${song.query}" — ${song.reason}`)
        }
      }
      console.log('')
    }

    console.log('Done.')

    try {
      const { revalidatePath, revalidateTag } = await import('next/cache')
      revalidateTag(LIBRARY_CATALOG_TAG)
      revalidatePath('/')
      console.log('Cache revalidated for home library sections.')
    } catch {
      console.log('Hard-refresh the home page (Cmd+Shift+R) if playlists look stale.')
    }
  } catch (error) {
    console.error('Seed failed:', error)
    process.exit(1)
  }
}

run()
