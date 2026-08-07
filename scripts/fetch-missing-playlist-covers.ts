/**
 * Fetch missing curated playlist covers via iTunes → /genre → storage → playlists.image_url
 *
 *   npx tsx scripts/fetch-missing-playlist-covers.ts
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'
import type { Database } from '../src/types/db'

dotenv.config({ path: '.env.local' })

const GENRE_DIR = path.resolve('genre')
const BUCKET = 'catalog-images'

const MISSING: Array<{ slug: string; query: string; country?: string }> = [
  { slug: 'ben-zur', query: 'בן צור', country: 'IL' },
  { slug: 'eyal-golan', query: 'אייל גולן', country: 'IL' },
  { slug: 'omer-adam', query: 'עומר אדם', country: 'IL' },
  { slug: 'eden-hason', query: 'עדן חסון', country: 'IL' },
  { slug: 'sarit-hadad', query: 'שרית חדד', country: 'IL' },
  { slug: 'moshe-peretz', query: 'משה פרץ', country: 'IL' },
  { slug: 'nathan-goshen', query: 'נתן גושן', country: 'IL' },
  { slug: 'idan-raichel', query: 'עידן רייכל', country: 'IL' },
  { slug: 'shlomo-artzi', query: 'שלמה ארצי', country: 'IL' },
  { slug: 'static-ben-el', query: 'סטטיק ובן אל', country: 'IL' },
  { slug: 'noa-kirel', query: 'נועה קירל', country: 'IL' },
  { slug: 'itay-levi', query: 'איתי לוי', country: 'IL' },
  { slug: 'osher-cohen', query: 'אושר כהן', country: 'IL' },
  { slug: 'avi-ohayon', query: 'אבי אוחיון', country: 'IL' },
  { slug: 'kendji-girac', query: 'Kendji Girac', country: 'FR' },
  { slug: 'jean-jacques-goldman', query: 'Jean-Jacques Goldman', country: 'FR' },
  { slug: 'patrick-bruel', query: 'Patrick Bruel', country: 'FR' },
  { slug: 'celine-dion', query: 'Celine Dion', country: 'FR' },
  { slug: 'vianney', query: 'Vianney', country: 'FR' },
]

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function upscale(url: string) {
  return url.replace('100x100bb', '600x600bb').replace('100x100', '600x600')
}

async function itunesArtwork(
  term: string,
  country: string
): Promise<string | null> {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=10&country=${country}`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'music-tabs-cover-fetch/1.0' },
  })
  if (!res.ok) throw new Error(`iTunes ${res.status}`)
  const data = (await res.json()) as {
    results?: Array<{ artworkUrl100?: string }>
  }
  const hit = (data.results ?? []).find((r) => r.artworkUrl100)
  return hit?.artworkUrl100 ? upscale(hit.artworkUrl100) : null
}

async function run() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  if (!fs.existsSync(GENRE_DIR)) fs.mkdirSync(GENRE_DIR, { recursive: true })

  const supabase = createClient<Database>(supabaseUrl, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const ok: string[] = []
  const fail: string[] = []

  for (const item of MISSING) {
    try {
      let art = await itunesArtwork(item.query, item.country ?? 'US')
      if (!art && item.country !== 'US') {
        art = await itunesArtwork(item.query, 'US')
      }
      if (!art) {
        console.log(`✗ ${item.slug}: no itunes art`)
        fail.push(item.slug)
        continue
      }

      const file = `${item.slug}.jpg`
      const local = path.join(GENRE_DIR, file)
      const imgRes = await fetch(art)
      if (!imgRes.ok) throw new Error(`download ${imgRes.status}`)
      fs.writeFileSync(local, Buffer.from(await imgRes.arrayBuffer()))

      const storagePath = `genres/${item.slug}.jpg`
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, fs.readFileSync(local), {
          upsert: true,
          contentType: 'image/jpeg',
        })
      if (error) throw error

      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)

      const { error: upErr } = await (supabase.from('playlists') as any)
        .update({ image_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('curated_slug', item.slug)
      if (upErr) throw upErr

      console.log(`✓ ${item.slug}`)
      ok.push(item.slug)
    } catch (e) {
      console.log(
        `✗ ${item.slug}: ${e instanceof Error ? e.message : String(e)}`
      )
      fail.push(item.slug)
    }
    await sleep(1100)
  }

  console.log(`\nDone. ok=${ok.length} fail=${fail.length}`)
  if (fail.length) console.log('Failed:', fail.join(', '))
  console.log('\nAdd to CURATED_PLAYLIST_COVER_FILES:')
  for (const slug of ok) console.log(`  '${slug}': '${slug}.jpg',`)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
