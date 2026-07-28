import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: '.env.local' })

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const sb = createClient(url, key)

  const { data: syncs } = await sb
    .from('song_lyric_syncs')
    .select('song_id, youtube_video_id, status')
    .eq('status', 'ready')
    .limit(200)

  const ids = (syncs || []).map((s) => s.song_id)
  const { data: songs } = await sb.from('songs').select('id, title, author').in('id', ids)

  const byId = new Map((songs || []).map((s) => [s.id, s]))
  console.log(`ready songs (${ids.length}):`)
  for (const s of syncs || []) {
    const song = byId.get(s.song_id)
    console.log(
      `- ${song?.title || s.song_id} — ${song?.author || '?'} | yt=${s.youtube_video_id}`
    )
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
