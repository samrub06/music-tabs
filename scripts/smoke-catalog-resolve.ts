/**
 * One-off smoke: catalog resolve hit path against live Supabase.
 * Run: npx tsx scripts/smoke-catalog-resolve.ts
 */
import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import { songRepo } from '../src/lib/services/songRepo'
import {
  createDefaultResolveCatalogDeps,
  resolveCatalogSongFromSearch,
} from '../src/lib/services/resolveCatalogSongFromSearch'
import { planAddSongFromSearch } from '../src/lib/services/addSongFromSearchFlow'
import { buildCatalogSourceIdentity } from '../src/lib/utils/catalogSourceIdentity'
import { lyricSyncLookupSongIds } from '../src/utils/lyricSyncLookup'
import type { Database } from '../src/types/db'

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('FAIL: missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const client = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const repo = songRepo(client)

  const { data: rows, error } = await (client.from('songs') as any)
    .select('id, title, author, source_url, tab_id')
    .is('user_id', null)
    .not('source_url', 'is', null)
    .limit(5)

  if (error) {
    console.error('FAIL query', error)
    process.exit(1)
  }

  console.log('Catalog samples with source_url:', (rows || []).length)
  if (!rows?.length) {
    console.error('FAIL: no catalog songs with source_url')
    process.exit(1)
  }

  const sample = rows[0] as {
    id: string
    title: string
    author: string
    source_url: string
    tab_id: string | null
  }
  console.log('Using:', {
    id: sample.id,
    title: sample.title,
    source_url: sample.source_url,
    tab_id: sample.tab_id,
  })

  let scrapeCalls = 0
  const deps = {
    ...createDefaultResolveCatalogDeps(client),
    scrape: async () => {
      scrapeCalls++
      throw new Error('scrape should not be called on catalog hit')
    },
  }

  const r1 = await resolveCatalogSongFromSearch(
    {
      url: sample.source_url,
      tabId: sample.tab_id,
      title: sample.title,
      author: sample.author,
    },
    deps
  )
  console.log('Test1 resolve hit:', {
    catalogSongId: r1.catalogSongId,
    scraped: r1.scraped,
    scrapeCalls,
  })
  if (r1.scraped || r1.catalogSongId !== sample.id || scrapeCalls !== 0) {
    console.error('FAIL Test1')
    process.exit(1)
  }

  const r2 = await resolveCatalogSongFromSearch(
    { url: sample.source_url, tabId: sample.tab_id },
    deps
  )
  console.log('Test2 second resolve:', {
    catalogSongId: r2.catalogSongId,
    scraped: r2.scraped,
    scrapeCalls,
  })
  if (r2.scraped || scrapeCalls !== 0) {
    console.error('FAIL Test2')
    process.exit(1)
  }

  const planOwned = await planAddSongFromSearch({
    search: { url: sample.source_url, tabId: sample.tab_id },
    userSongs: [
      {
        id: 'user-copy-1',
        tabId: sample.tab_id ?? undefined,
        sourceUrl: sample.source_url,
      },
    ],
    deps,
  })
  console.log('Test3 already_owned:', planOwned)
  if (planOwned.status !== 'already_owned' || planOwned.songId !== 'user-copy-1') {
    console.error('FAIL Test3')
    process.exit(1)
  }

  const planClone = await planAddSongFromSearch({
    search: { url: sample.source_url, tabId: sample.tab_id },
    userSongs: [],
    deps,
  })
  console.log('Test4 needs_clone:', {
    status: planClone.status,
    scraped: planClone.status === 'needs_clone' ? planClone.scraped : undefined,
    catalogSongId:
      planClone.status === 'needs_clone' ? planClone.catalogSongId : undefined,
  })
  if (
    planClone.status !== 'needs_clone' ||
    planClone.scraped ||
    planClone.catalogSongId !== sample.id
  ) {
    console.error('FAIL Test4')
    process.exit(1)
  }

  let rejected = false
  try {
    await resolveCatalogSongFromSearch({ url: 'https://evil.example.com/x' }, deps)
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    rejected = /not allowed/i.test(message)
    console.log('Test5 reject host:', message)
  }
  if (!rejected) {
    console.error('FAIL Test5')
    process.exit(1)
  }

  const byUrl = await repo.findCatalogSongBySourceIdentity({
    sourceUrl: sample.source_url,
  })
  console.log('Test6 find by source_url:', byUrl)
  if (!byUrl || byUrl.id !== sample.id) {
    console.error('FAIL Test6')
    process.exit(1)
  }

  if (sample.tab_id) {
    const byTab = await repo.findCatalogSongBySourceIdentity({ tabId: sample.tab_id })
    console.log('Test6b find by tab_id:', byTab)
    if (!byTab || byTab.id !== sample.id) {
      console.error('FAIL Test6b')
      process.exit(1)
    }
  }

  const ids = lyricSyncLookupSongIds('user-clone-uuid', sample.id)
  console.log('Test7 lyric lookup ids:', ids)
  if (ids[0] !== 'user-clone-uuid' || ids[1] !== sample.id) {
    console.error('FAIL Test7')
    process.exit(1)
  }

  const ug = buildCatalogSourceIdentity({
    url: 'https://tabs.ultimate-guitar.com/tab/vianney/beau-papa-chords-2123456',
  })
  const neg = buildCatalogSourceIdentity({
    url: 'https://negina.co.il/chords/vianney/beau-papa',
  })
  console.log('Test8 identities:', { ug: ug.tabId, neg: neg.tabId })
  if (ug.tabId === neg.tabId) {
    console.error('FAIL Test8')
    process.exit(1)
  }

  // Optional: lyric sync exists for this catalog song?
  const { data: syncs } = await (client as any)
    .from('song_lyric_syncs')
    .select('song_id, youtube_video_id, status')
    .eq('song_id', sample.id)
    .eq('status', 'ready')
    .limit(1)
  console.log('Test9 catalog lyric sync ready rows:', syncs?.length ?? 0)

  console.log('\nALL SMOKE TESTS PASSED')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
