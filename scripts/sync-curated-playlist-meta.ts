/**
 * Ops: sync public curated playlist name / description / display_order / cover
 * from CURATED_PLAYLISTS so explorer ordering matches code.
 *
 *   npx tsx scripts/sync-curated-playlist-meta.ts
 *   npx tsx scripts/sync-curated-playlist-meta.ts --dry-run
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { CURATED_PLAYLISTS } from '../src/data/curatedPlaylists'
import { getCuratedPlaylistCoverUrl } from '../src/data/curatedPlaylistCoverImages'
import { LIBRARY_CATALOG_TAG } from '../src/lib/services/libraryCatalogCache'
import type { Database } from '../src/types/db'

dotenv.config({ path: '.env.local' })

async function run() {
  const dryRun = process.argv.includes('--dry-run')
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const client = createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  let updated = 0
  for (const def of CURATED_PLAYLISTS) {
    const { data: existing, error } = await (client.from('playlists') as any)
      .select('id, display_order, name, description, image_url')
      .eq('curated_slug', def.slug)
      .maybeSingle()
    if (error) throw error
    if (!existing?.id) {
      console.log(`· skip missing ${def.slug}`)
      continue
    }

    const cover = getCuratedPlaylistCoverUrl(def.slug) ?? null
    const row = {
      name: def.name,
      description: def.description,
      display_order: def.displayOrder,
      image_url: cover ?? existing.image_url ?? null,
      updated_at: new Date().toISOString(),
    }

    const changed =
      existing.display_order !== row.display_order ||
      existing.name !== row.name ||
      (existing.description ?? '') !== row.description ||
      (cover && existing.image_url !== cover)

    if (!changed) continue

    console.log(
      `↻ ${def.slug}: order ${existing.display_order}→${row.display_order} name="${row.name}"`
    )
    if (!dryRun) {
      const { error: upErr } = await (client.from('playlists') as any)
        .update(row)
        .eq('id', existing.id)
      if (upErr) throw upErr
    }
    updated++
  }

  console.log(`\n${dryRun ? 'Would update' : 'Updated'} ${updated} playlist(s).`)
  if (!dryRun && updated > 0) {
    try {
      const { revalidateTag, revalidatePath } = await import('next/cache')
      revalidateTag(LIBRARY_CATALOG_TAG)
      revalidatePath('/')
    } catch {
      console.log('Hard-refresh explorer if shelves look stale.')
    }
  }
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
