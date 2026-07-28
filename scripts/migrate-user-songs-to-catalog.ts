/**
 * Migrate user library songs onto shared catalog identity:
 * - Match by tab_id / source_url only (never title+author)
 * - On hit: set cloned_from_id
 * - On miss + allowlisted source_url: promote content to a new catalog row, then link
 *
 * Usage:
 *   DRY_RUN=1 npx tsx scripts/migrate-user-songs-to-catalog.ts
 *   npx tsx scripts/migrate-user-songs-to-catalog.ts
 *   LIMIT=100 npx tsx scripts/migrate-user-songs-to-catalog.ts
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { songRepo } from '../src/lib/services/songRepo'
import {
  buildCatalogSourceIdentity,
  deriveTabIdFromSourceUrl,
  normalizeTabId,
} from '../src/lib/utils/catalogSourceIdentity'
import {
  buildCatalogSourceIndex,
  canPromoteUserSongToCatalog,
  matchCatalogBySourceIdentity,
} from '../src/lib/utils/catalogSourceIndex'
import { renderStructuredSong } from '../src/utils/structuredSong'
import type { Database } from '../src/types/db'
import type { SongSection } from '../src/types'

dotenv.config({ path: '.env.local' })

/** Default to dry-run unless APPLY=1 */
const dryRun = process.env.APPLY !== '1' && process.env.APPLY !== 'true'

const limit = process.env.LIMIT ? Number(process.env.LIMIT) : undefined

type CatalogRow = {
  id: string
  tab_id: string | null
  source_url: string | null
}

type UserRow = {
  id: string
  title: string
  author: string | null
  tab_id: string | null
  source_url: string | null
  source_site: string | null
  sections: SongSection[] | null
  capo: number | null
  key: string | null
  version: number | null
  version_description: string | null
  rating: number | null
  difficulty: string | null
  artist_url: string | null
  artist_image_url: string | null
  song_image_url: string | null
  bpm: number | null
  reviews: number | null
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  const supabase = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const repo = songRepo(supabase)

  const { data: catalogRows, error: catalogError } = await (supabase.from('songs') as any)
    .select('id, tab_id, source_url')
    .is('user_id', null)

  if (catalogError) throw catalogError

  const index = buildCatalogSourceIndex(
    ((catalogRows || []) as CatalogRow[]).map((row) => ({
      id: row.id,
      tabId: row.tab_id,
      sourceUrl: row.source_url,
    }))
  )

  let userQuery = (supabase.from('songs') as any)
    .select(
      'id, title, author, tab_id, source_url, source_site, sections, capo, key, version, version_description, rating, difficulty, artist_url, artist_image_url, song_image_url, bpm, reviews'
    )
    .not('user_id', 'is', null)
    .is('cloned_from_id', null)
    .or('tab_id.not.is.null,source_url.not.is.null')

  if (limit && Number.isFinite(limit) && limit > 0) {
    userQuery = userQuery.limit(limit)
  }

  const { data: userRows, error: userError } = await userQuery
  if (userError) throw userError

  const candidates = (userRows || []) as UserRow[]

  let linked = 0
  let promoted = 0
  let skippedNoMatch = 0
  let skippedNoContent = 0
  let skippedDisallowed = 0
  let errors = 0

  console.log(
    dryRun
      ? `DRY RUN (set APPLY=1 to write). Candidates: ${candidates.length}`
      : `APPLY mode. Candidates: ${candidates.length}`
  )

  for (const row of candidates) {
    const userRef = {
      id: row.id,
      tabId: row.tab_id,
      sourceUrl: row.source_url,
    }

    const existingCatalogId = matchCatalogBySourceIdentity(userRef, index)
    if (existingCatalogId) {
      linked += 1
      console.log(
        `[link] ${row.id} → ${existingCatalogId} | ${row.title} | tab=${row.tab_id || '-'} url=${row.source_url || '-'}`
      )
      if (!dryRun) {
        const { error } = await (supabase.from('songs') as any)
          .update({ cloned_from_id: existingCatalogId })
          .eq('id', row.id)
        if (error) {
          console.error(`  failed link ${row.id}:`, error.message)
          errors += 1
        }
      }
      continue
    }

    if (!canPromoteUserSongToCatalog(userRef)) {
      if (!row.source_url && row.tab_id) {
        skippedNoMatch += 1
      } else {
        skippedDisallowed += 1
      }
      continue
    }

    const sections = row.sections || []
    const content =
      sections.length > 0
        ? renderStructuredSong({
            title: row.title,
            author: row.author || '',
            format: 'structured',
            sections,
          } as any)
        : ''

    if (!content.trim()) {
      skippedNoContent += 1
      console.log(`[skip-empty] ${row.id} | ${row.title}`)
      continue
    }

    let identity
    try {
      identity = buildCatalogSourceIdentity({
        url: row.source_url!,
        tabId: row.tab_id,
      })
    } catch {
      skippedDisallowed += 1
      continue
    }

    const tabId =
      normalizeTabId(row.tab_id) ??
      identity.tabId ??
      deriveTabIdFromSourceUrl(identity.sourceUrl)

    promoted += 1
    console.log(
      `[promote] ${row.id} → new catalog | ${row.title} | ${identity.sourceUrl} | tab=${tabId || '-'}`
    )

    if (dryRun) continue

    try {
      const created = await repo.createSystemSong(
        {
          title: row.title.trim(),
          author: (row.author || 'Unknown').trim(),
          content: content.trim(),
          reviews: row.reviews ?? 0,
          capo: row.capo ?? undefined,
          key: row.key ?? undefined,
          version: row.version ?? undefined,
          versionDescription: row.version_description ?? undefined,
          rating: row.rating ?? undefined,
          difficulty: row.difficulty ?? undefined,
          artistUrl: row.artist_url ?? undefined,
          artistImageUrl: row.artist_image_url ?? undefined,
          songImageUrl: row.song_image_url ?? undefined,
          sourceUrl: identity.sourceUrl,
          sourceSite: row.source_site ?? undefined,
          tabId,
          bpm: row.bpm ?? undefined,
        },
        { isPublic: true, isTrending: false }
      )

      const { error } = await (supabase.from('songs') as any)
        .update({ cloned_from_id: created.id })
        .eq('id', row.id)

      if (error) {
        console.error(`  failed link after promote ${row.id}:`, error.message)
        errors += 1
        continue
      }

      // Keep index fresh for later candidates in this run
      if (tabId) {
        index.byTabId.set(tabId, created.id)
        if (/^\d{5,}$/.test(tabId)) index.byTabId.set(`ug:${tabId}`, created.id)
      }
      index.bySourceUrl.set(identity.sourceUrl, created.id)
    } catch (err) {
      console.error(`  promote failed ${row.id}:`, err)
      errors += 1
    }
  }

  console.log('\nSummary:')
  console.log(`  candidates:        ${candidates.length}`)
  console.log(`  linked (hit):      ${linked}`)
  console.log(`  promoted (miss):   ${promoted}`)
  console.log(`  skipped no match:  ${skippedNoMatch}`)
  console.log(`  skipped empty:     ${skippedNoContent}`)
  console.log(`  skipped host/url:  ${skippedDisallowed}`)
  console.log(`  errors:            ${errors}`)
  console.log(dryRun ? '  mode: DRY_RUN (no writes)' : '  mode: APPLY')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
