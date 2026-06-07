import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { curatedPlaylistService } from '../src/lib/services/curatedPlaylistService'
import { trendingService } from '../src/lib/services/trendingService'
import type { Database } from '../src/types/db'

dotenv.config({ path: '.env.local' })

async function run() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
    process.exit(1)
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const limit = Number(process.env.SYNC_LIMIT_PER_CATEGORY || '15')

  console.log(`Step 1/2: Scraping UG explore (genres, decades, difficulty) — ${limit} per category...`)
  const stats = await trendingService.updateTrendingDatabaseByCategories(supabase, limit)
  console.log('Scrape stats:', stats)

  console.log('\nStep 2/2: Seeding curated playlists...')
  const results = await curatedPlaylistService(supabase).seedAllCuratedPlaylists()

  for (const result of results) {
    const icon = result.songCount === 0 ? '⚠️ ' : result.action === 'created' ? '✅' : '🔄'
    console.log(`  ${icon} ${result.slug} (${result.songCount} songs)`)
  }

  console.log('\nDone.')
}

run().catch((error) => {
  console.error('Sync failed:', error)
  process.exit(1)
})
