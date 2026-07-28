import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: '.env.local' })

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('missing env')
    process.exit(1)
  }
  const sb = createClient(url, key)
  const { count, error } = await sb
    .from('song_lyric_syncs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'ready')
  console.log('ready count:', count, error?.message || error?.code || '')

  const { data, error: e2 } = await sb.from('song_lyric_syncs').select('status')
  if (e2) {
    console.log('list err:', e2.message, e2.code)
  } else {
    const map: Record<string, number> = {}
    for (const r of data || []) {
      map[r.status] = (map[r.status] || 0) + 1
    }
    console.log('by status:', map, 'fetched', data?.length)
  }

  const { data: sample } = await sb
    .from('song_lyric_syncs')
    .select('song_id, youtube_video_id, status, model')
    .eq('status', 'ready')
    .limit(10)
  console.log('sample:', JSON.stringify(sample, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
