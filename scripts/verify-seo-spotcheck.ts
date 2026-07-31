/**
 * Local SEO spot-check for EN + HE catalog songs (no network required for copy;
 * optional DB check when service role is present).
 *
 *   npx tsx scripts/verify-seo-spotcheck.ts
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import type { Database } from '../src/types/db'
import { songSeoCopy } from '../src/lib/seo/songSeoCopy'
import { PRODUCTION_SITE_URL } from '../src/lib/seo/site'
import { songPath } from '../src/lib/seo/songPath'

dotenv.config({ path: '.env.local' })

async function main() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || PRODUCTION_SITE_URL
  console.log('Site URL for canonicals:', siteUrl)
  if (/localhost|127\.0\.0\.1/i.test(siteUrl) && process.env.VERCEL) {
    console.warn('WARN: localhost site URL on Vercel — set NEXT_PUBLIC_SITE_URL=https://www.tabascomusic.com')
  }

  const he = songSeoCopy({ title: 'תשמח', author: 'יוסף קרדונר' })
  const en = songSeoCopy({ title: 'Wonderwall', author: 'Oasis' })
  console.log('HE title OK:', he.title.includes('אקורדים וטאבים'))
  console.log('EN title OK:', en.title.includes('Chords & Tabs'))

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.log('Skip DB spot-check (no service role)')
    return
  }

  const supabase = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: heSongs } = await (supabase.from('songs') as any)
    .select('id, title, author, slug')
    .is('user_id', null)
    .not('slug', 'is', null)
    .ilike('author', '%קרדונר%')
    .limit(1)

  const { data: enSongs } = await (supabase.from('songs') as any)
    .select('id, title, author, slug')
    .is('user_id', null)
    .not('slug', 'is', null)
    .ilike('title', '%wonder%')
    .limit(1)

  for (const song of [...(heSongs || []), ...(enSongs || [])]) {
    const copy = songSeoCopy(song)
    const path = songPath(song)
    console.log('—')
    console.log(path)
    console.log(copy.title)
    console.log(copy.locale, copy.ogLocale)
  }

  console.log('\nGSC checklist:')
  console.log('- Submit', `${PRODUCTION_SITE_URL}/sitemap.xml`)
  console.log('- Inspect a Hebrew slug URL and confirm title contains אקורדים וטאבים')
  console.log('- Inspect an English slug URL and confirm title contains Chords & Tabs')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
