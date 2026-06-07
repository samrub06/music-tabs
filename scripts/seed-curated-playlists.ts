import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { curatedPlaylistService } from '../src/lib/services/curatedPlaylistService'
import { CURATED_PLAYLISTS } from '../src/data/curatedPlaylists'
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

  console.log(`Seeding ${CURATED_PLAYLISTS.length} curated playlists...`)

  try {
    const results = await curatedPlaylistService(supabase).seedAllCuratedPlaylists()

    for (const result of results) {
      const icon =
        result.songCount === 0 ? '⚠️ ' : result.action === 'created' ? '✅' : '🔄'
      console.log(`  ${icon} ${result.slug} (${result.songCount} songs)`)
    }

    const empty = results.filter((r) => r.songCount === 0)
    if (empty.length > 0) {
      console.log(
        '\nSome playlists are empty. Ensure db/add-curated-playlists.sql was run and trending songs have genre/decade set.'
      )
    }

    console.log('\nDone.')
  } catch (error) {
    console.error('Seed failed:', error)
    process.exit(1)
  }
}

run()
