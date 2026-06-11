import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'
import type { Database } from '../src/types/db'

dotenv.config({ path: '.env.local' })

const BUCKET = 'catalog-images'

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
  const slug = process.argv[2]
  const localPath = process.argv[3]

  if (!slug || !localPath) {
    console.error('Usage: npx tsx scripts/upload-catalog-song-image.ts <slug> <local-image-path>')
    process.exit(1)
  }

  const resolvedPath = path.resolve(localPath)
  if (!fs.existsSync(resolvedPath)) {
    console.error(`File not found: ${resolvedPath}`)
    process.exit(1)
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
    process.exit(1)
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  await ensureBucket(supabase)

  const ext = path.extname(resolvedPath).toLowerCase()
  const storagePath = `songs/${slug}${ext}`
  const fileBuffer = fs.readFileSync(resolvedPath)
  const contentType =
    ext === '.png'
      ? 'image/png'
      : ext === '.webp'
        ? 'image/webp'
        : ext === '.gif'
          ? 'image/gif'
          : 'image/jpeg'

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, fileBuffer, { upsert: true, contentType })

  if (uploadError) throw uploadError

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)

  console.log(publicUrl)
}

run().catch((error) => {
  console.error('Upload failed:', error)
  process.exit(1)
})
