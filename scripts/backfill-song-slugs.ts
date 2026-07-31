/**
 * Backfill SEO slugs for catalog songs (user_id IS NULL).
 *
 *   npx tsx scripts/backfill-song-slugs.ts
 *   npx tsx scripts/backfill-song-slugs.ts --dry-run
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import type { Database } from '../src/types/db'
import { songSlugFromTitleAuthor } from '../src/utils/slugify'

dotenv.config({ path: '.env.local' })

const PAGE_SIZE = 500
const dryRun = process.argv.includes('--dry-run')

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  const supabase = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const used = new Set<string>()
  let from = 0
  let updated = 0
  let skipped = 0
  let collisions = 0

  // Reserve already-assigned slugs
  while (true) {
    const { data, error } = await (supabase.from('songs') as any)
      .select('slug')
      .is('user_id', null)
      .not('slug', 'is', null)
      .range(from, from + PAGE_SIZE - 1)

    if (error) throw error
    if (!data?.length) break
    for (const row of data as Array<{ slug: string }>) {
      if (row.slug) used.add(row.slug)
    }
    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  from = 0
  while (true) {
    const { data, error } = await (supabase.from('songs') as any)
      .select('id, title, author, slug')
      .is('user_id', null)
      .or('is_trending.eq.true,is_public.eq.true')
      .order('created_at', { ascending: true })
      .range(from, from + PAGE_SIZE - 1)

    if (error) throw error
    if (!data?.length) break

    for (const row of data as Array<{
      id: string
      title: string
      author: string | null
      slug: string | null
    }>) {
      if (row.slug?.trim()) {
        skipped += 1
        continue
      }

      const base = songSlugFromTitleAuthor(row.title, row.author || '')
      let candidate = base
      let suffix = 2
      while (used.has(candidate)) {
        candidate = `${base}-${suffix}`
        suffix += 1
        collisions += 1
      }
      used.add(candidate)

      if (dryRun) {
        console.log(`[dry-run] ${row.id} → ${candidate}`)
        updated += 1
        continue
      }

      const { error: updateError } = await (supabase.from('songs') as any)
        .update({ slug: candidate })
        .eq('id', row.id)

      if (updateError) {
        console.error(`Failed ${row.id}:`, updateError.message)
        used.delete(candidate)
        continue
      }
      updated += 1
      if (updated % 100 === 0) {
        console.log(`Updated ${updated} slugs…`)
      }
    }

    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  console.log(
    `${dryRun ? 'Dry-run' : 'Done'}: assigned=${updated}, alreadyHadSlug=${skipped}, collisionRetries=${collisions}`
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
