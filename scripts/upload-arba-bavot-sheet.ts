/**
 * Upload the Arba Bavot chord-sheet image to Supabase storage and set
 * songs.sheet_image_url for the curated catalog song.
 *
 * Prerequisites:
 *   - Run db/add-song-sheet-image-url.sql in the Supabase SQL editor
 *   - Local sheet at partition/arba-bavot.jpg
 *
 * Usage: npx tsx scripts/upload-arba-bavot-sheet.ts
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'
import type { Database } from '../src/types/db'
import { revalidateSongCache } from './revalidateSongCache'

dotenv.config({ path: '.env.local' })

const BUCKET = 'catalog-images'
const TAB_ID = 'curated:arba-bavot'
const LOCAL_SHEET = path.resolve(__dirname, '../partition/arba-bavot.jpg')
const STORAGE_PATH = 'sheets/arba-bavot.jpg'

async function ensureBucket(supabase: ReturnType<typeof createClient<Database>>) {
  const { data: buckets } = await supabase.storage.listBuckets()
  if (buckets?.some((b) => b.id === BUCKET)) return

  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  })
  if (error) throw error
  console.log(`Created bucket "${BUCKET}"`)
}

async function run() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
    process.exit(1)
  }

  if (!fs.existsSync(LOCAL_SHEET)) {
    console.error(`Sheet image not found: ${LOCAL_SHEET}`)
    process.exit(1)
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  await ensureBucket(supabase)

  const fileBuffer = fs.readFileSync(LOCAL_SHEET)
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(STORAGE_PATH, fileBuffer, { upsert: true, contentType: 'image/jpeg' })
  if (uploadError) throw uploadError

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(STORAGE_PATH)

  console.log('Uploaded:', publicUrl)

  const { data: song, error: findError } = await (supabase.from('songs') as any)
    .select('id, title, sheet_image_url')
    .eq('tab_id', TAB_ID)
    .maybeSingle()

  if (findError) {
    if (String(findError.message || '').includes('sheet_image_url')) {
      console.error(
        'Column sheet_image_url missing. Run db/add-song-sheet-image-url.sql in the Supabase SQL editor first.'
      )
    }
    throw findError
  }

  if (!song?.id) {
    console.error(`Song with tab_id "${TAB_ID}" not found. Run scripts/add-arba-bavot.ts first.`)
    process.exit(1)
  }

  const { error: updateError } = await (supabase.from('songs') as any)
    .update({ sheet_image_url: publicUrl, updated_at: new Date().toISOString() })
    .eq('id', song.id)

  if (updateError) {
    if (String(updateError.message || '').includes('sheet_image_url')) {
      console.error(
        'Column sheet_image_url missing. Run db/add-song-sheet-image-url.sql in the Supabase SQL editor first.'
      )
    }
    throw updateError
  }

  console.log(`Updated "${song.title}" (${song.id}) sheet_image_url`)
  await revalidateSongCache(song.id)
  console.log('Done.')
}

run().catch((error) => {
  console.error('Upload failed:', error)
  process.exit(1)
})
