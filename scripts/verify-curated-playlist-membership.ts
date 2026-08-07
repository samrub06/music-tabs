/**
 * Ops: verify curated playlist song_ids match expected artists / rules.
 * Removes misclassified songs (e.g. Johnny Hallyday in Rap FR).
 *
 * Usage:
 *   npm run verify:playlist-membership -- --dry-run
 *   npm run verify:playlist-membership
 *   npm run verify:playlist-membership -- --slug=rap-fr
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import {
  CURATED_PLAYLIST_MEMBERSHIP_RULES,
  songAllowedInCuratedPlaylist,
} from '../src/data/curatedPlaylistMembership'
import { LIBRARY_CATALOG_TAG } from '../src/lib/services/libraryCatalogCache'
import type { Database } from '../src/types/db'

dotenv.config({ path: '.env.local' })

function parseArgs() {
  let dryRun = false
  let slug: string | undefined
  for (const arg of process.argv.slice(2)) {
    if (arg === '--dry-run') dryRun = true
    else if (arg.startsWith('--slug=')) slug = arg.split('=')[1]
  }
  return { dryRun, slug }
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

  const { dryRun, slug: onlySlug } = parseArgs()
  const client = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const slugs = onlySlug
    ? [onlySlug]
    : Object.keys(CURATED_PLAYLIST_MEMBERSHIP_RULES)

  console.log(
    `Verifying ${slugs.length} curated playlist(s)${dryRun ? ' (dry-run)' : ''}…\n`
  )

  let totalRemoved = 0

  for (const slug of slugs) {
    const rule = CURATED_PLAYLIST_MEMBERSHIP_RULES[slug]
    if (!rule) {
      console.log(`⚠ no rule for ${slug} — skip`)
      continue
    }

    const { data: playlist, error } = await (client.from('playlists') as any)
      .select('id, name, song_ids')
      .eq('curated_slug', slug)
      .maybeSingle()

    if (error) throw error
    if (!playlist) {
      console.log(`· ${slug}: playlist missing`)
      continue
    }

    const songIds = (playlist.song_ids ?? []) as string[]
    if (songIds.length === 0) {
      console.log(`· ${slug}: empty`)
      continue
    }

    const { data: songs, error: songsError } = await client
      .from('songs')
      .select('id, title, author')
      .in('id', songIds)
    if (songsError) throw songsError

    const byId = new Map(
      ((songs ?? []) as Array<{ id: string; title: string; author: string }>).map(
        (s) => [s.id, s]
      )
    )

    const keep: string[] = []
    const removed: Array<{ title: string; author: string; reason: string }> = []

    for (const id of songIds) {
      const song = byId.get(id)
      if (!song) {
        removed.push({ title: id, author: '?', reason: 'song row missing' })
        continue
      }
      const check = songAllowedInCuratedPlaylist(
        slug,
        song.title ?? '',
        song.author ?? '',
        rule
      )
      if (check.ok) keep.push(id)
      else {
        removed.push({
          title: song.title ?? '',
          author: song.author ?? '',
          reason: check.reason ?? 'rejected',
        })
      }
    }

    console.log(`=== ${slug} ===`)
    console.log(`  before=${songIds.length} keep=${keep.length} remove=${removed.length}`)
    for (const r of removed.slice(0, 40)) {
      console.log(`  ✗ ${r.author} — ${r.title} (${r.reason})`)
    }
    if (removed.length > 40) console.log(`  … +${removed.length - 40} more`)

    if (removed.length === 0) continue
    totalRemoved += removed.length

    if (!dryRun) {
      const { error: updateError } = await (client.from('playlists') as any)
        .update({
          song_ids: keep,
          updated_at: new Date().toISOString(),
        })
        .eq('id', playlist.id)
      if (updateError) throw updateError
      console.log(`  → updated playlist (${keep.length} songs)`)
    } else {
      console.log(`  → would update playlist (${keep.length} songs)`)
    }
  }

  console.log(`\nTotal removals: ${totalRemoved}${dryRun ? ' (dry-run)' : ''}`)

  if (!dryRun && totalRemoved > 0) {
    try {
      const { revalidateTag, revalidatePath } = await import('next/cache')
      revalidateTag(LIBRARY_CATALOG_TAG)
      revalidatePath('/')
      console.log('Cache revalidated.')
    } catch {
      console.log('Hard-refresh explorer if shelves look stale.')
    }
  }

  console.log('Done.')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
