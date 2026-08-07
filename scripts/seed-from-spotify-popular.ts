/**
 * Ops: seed catalog + curated playlists from popular tracks.
 *
 * Does NOT call the Spotify API.
 * - Charts: public Spotify daily chart pages (kworb)
 * - Editorial: OpenAI research of popular / streamed songs
 * Then scrapes Tab4U/Negina (IL) or Ultimate Guitar (intl).
 *
 * Usage:
 *   npm run seed:spotify-popular -- --dry-run --limit=5
 *   npm run seed:spotify-popular -- --source=top-israel --limit=20
 *   npm run seed:spotify-popular -- --source=top-global
 *   npm run seed:spotify-popular -- --source=top-france --limit=30
 *   npm run seed:spotify-popular -- --source=editorial-acoustic --limit=30
 *   npm run seed:spotify-popular -- --source=editorial-french-variete --limit=25
 *   npm run seed:spotify-popular -- --source=editorial-french-classics --limit=25
 *   npm run seed:spotify-popular -- --source=editorial-rap-fr --limit=20
 *   npm run seed:spotify-popular -- --source=editorial-kendji --limit=20
 *   npm run seed:spotify-popular -- --source=editorial-goldman --limit=20
 *   npm run seed:spotify-popular -- --source=editorial-bruel --limit=20
 *   npm run seed:spotify-popular -- --source=editorial-celine-dion --limit=20
 *   npm run seed:spotify-popular -- --source=editorial-vianney --limit=20
 *   npm run seed:spotify-popular -- --source=editorial-hassidic --limit=25
 *   npm run seed:spotify-popular -- --source=editorial-religious-il --limit=25
 *   npm run seed:spotify-popular -- --source=editorial-ribo --limit=15
 *   npm run seed:spotify-popular -- --source=editorial-ben-zur --limit=20
 *   npm run seed:spotify-popular -- --source=editorial-eyal-golan --limit=20
 *   npm run seed:spotify-popular -- --source=editorial-omer-adam --limit=20
 *   npm run seed:spotify-popular -- --source=editorial-noa-kirel --limit=20
 *   npm run seed:spotify-popular -- --source=editorial-itay-levi --limit=20
 *   npm run seed:spotify-popular -- --source=editorial-osher-cohen --limit=20
 *   npm run seed:spotify-popular -- --source=editorial-avi-ohayon --limit=20
 *
 * Agent workflow: .cursor/skills/trendy-guitar-catalog/SKILL.md
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { popularCatalogSeedService } from '../src/lib/services/popularCatalogSeedService'
import { SPOTIFY_POPULAR_SOURCES } from '../src/data/spotifyPopularSources'
import { isAIAvailable } from '../src/lib/config/ai'
import { LIBRARY_CATALOG_TAG } from '../src/lib/services/libraryCatalogCache'
import type { Database } from '../src/types/db'

dotenv.config({ path: '.env.local' })

function parseArgs() {
  let dryRun = false
  let source: string | undefined
  let limit: number | undefined

  for (const arg of process.argv.slice(2)) {
    if (arg === '--dry-run') dryRun = true
    else if (arg.startsWith('--source=')) source = arg.split('=')[1]
    else if (arg.startsWith('--limit=')) {
      limit = Number.parseInt(arg.split('=')[1] ?? '', 10)
    }
  }

  return { dryRun, source, limit }
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

  const { dryRun, source, limit } = parseArgs()

  // AI required for editorial sources; charts work without it (fallback uses AI if chart fails)
  if (source) {
    const src = SPOTIFY_POPULAR_SOURCES.find((s) => s.key === source)
    if (src?.researchMode === 'ai' && !isAIAvailable()) {
      console.error('Missing OPENAI_API_KEY in .env.local (required for AI research sources)')
      process.exit(1)
    }
  } else if (!isAIAvailable()) {
    console.warn(
      'OPENAI_API_KEY missing — editorial AI sources will fail; chart sources still work.\n'
    )
  }

  console.log('Popular sources (web charts + AI — no Spotify API):')
  for (const s of SPOTIFY_POPULAR_SOURCES) {
    const via =
      s.researchMode === 'chart' ? `chart ${s.chartUrl}` : 'AI research'
    console.log(
      `  ✓ ${s.key} → ${s.targetSlug} [${s.marketHint ?? 'auto'}] via ${via}`
    )
  }
  console.log('')

  const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log(
    `Seeding popular playlists${dryRun ? ' (dry-run)' : ''}${source ? ` source=${source}` : ''}${limit != null ? ` limit=${limit}` : ''}...\n`
  )

  try {
    const summaries = await popularCatalogSeedService(supabase).seedFromSpotifyPopular({
      sourceKey: source,
      limit,
      dryRun,
      onTrack: (r) => {
        if (r.status === 'added' || r.status === 'updated') {
          console.log(
            `  ${r.status === 'added' ? '+' : '↻'} [${r.locale}/${r.source}] ${r.title} — ${r.artist}`
          )
        } else if (r.status === 'skipped' || r.status === 'error') {
          console.log(`  ⚠ ${r.status} ${r.title} — ${r.artist}: ${r.reason}`)
        }
      },
    })

    console.log('\n--- Per-source summary ---')
    for (const s of summaries) {
      console.log(
        `${s.key} → ${s.targetSlug} (${s.researchMethod}): playlist=${s.playlistAction} songs=${s.songCount} (+${s.added} ↻${s.updated} skip=${s.skipped} err=${s.errors})`
      )
    }

    if (!dryRun) {
      try {
        const { revalidateTag, revalidatePath } = await import('next/cache')
        revalidateTag(LIBRARY_CATALOG_TAG)
        revalidatePath('/')
        console.log('\nCache revalidated.')
      } catch {
        console.log('\nHard-refresh (Cmd+Shift+R) if playlists look stale.')
      }
    }

    console.log('\nDone.')
  } catch (error) {
    console.error('Seed failed:', error)
    process.exit(1)
  }
}

run()
