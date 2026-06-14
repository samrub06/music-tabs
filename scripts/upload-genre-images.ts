import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'
import {
  CURATED_PLAYLIST_COVER_FILES,
  LIKED_SONGS_COVER_FILE,
  RECENT_SONGS_COVER_FILE,
  getCuratedPlaylistCoverStoragePath,
} from '../src/data/curatedPlaylistCoverImages'
import { LIBRARY_CATALOG_TAG } from '../src/lib/services/libraryCatalogCache'
import type { Database } from '../src/types/db'

dotenv.config({ path: '.env.local' })

const BUCKET = 'catalog-images'
const GENRE_DIR = path.resolve('genre')

function contentTypeForExt(ext: string): string {
  switch (ext.toLowerCase()) {
    case '.png':
      return 'image/png'
    case '.webp':
      return 'image/webp'
    case '.gif':
      return 'image/gif'
    default:
      return 'image/jpeg'
  }
}

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

async function uploadFile(
  supabase: ReturnType<typeof createClient<Database>>,
  localPath: string,
  storagePath: string
): Promise<string> {
  const ext = path.extname(localPath).toLowerCase()
  const fileBuffer = fs.readFileSync(localPath)

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, fileBuffer, { upsert: true, contentType: contentTypeForExt(ext) })

  if (uploadError) throw uploadError

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)

  return publicUrl
}

async function run() {
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

  const uploaded: string[] = []
  const skipped: string[] = []

  for (const [slug, filename] of Object.entries(CURATED_PLAYLIST_COVER_FILES)) {
    const localPath = path.join(GENRE_DIR, filename)
    const storagePath = getCuratedPlaylistCoverStoragePath(slug)

    if (!storagePath) {
      skipped.push(`${slug}: no storage path`)
      continue
    }

    if (!fs.existsSync(localPath)) {
      skipped.push(`${slug}: missing ${filename}`)
      continue
    }

    const publicUrl = await uploadFile(supabase, localPath, storagePath)

    const { error } = await (supabase.from('playlists') as any)
      .update({ image_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('curated_slug', slug)

    if (error) {
      console.warn(`  ⚠️  ${slug}: uploaded but DB update failed — ${error.message}`)
    } else {
      console.log(`  ✅ ${slug} → ${storagePath}`)
    }

    uploaded.push(slug)
  }

  for (const [slug, coverFile] of [
    ['liked-songs', LIKED_SONGS_COVER_FILE],
    ['recent-songs', RECENT_SONGS_COVER_FILE],
  ] as const) {
    const localPath = path.join(GENRE_DIR, coverFile)
    if (!fs.existsSync(localPath)) continue

    const ext = path.extname(coverFile)
    const storagePath = `genres/${slug}${ext}`
    const publicUrl = await uploadFile(supabase, localPath, storagePath)
    console.log(`  ✅ ${slug} → ${storagePath}`)
    console.log(`     ${publicUrl}`)
  }

  const unmapped = fs
    .readdirSync(GENRE_DIR)
    .filter((file) => {
      const used = new Set([
        ...Object.values(CURATED_PLAYLIST_COVER_FILES),
        LIKED_SONGS_COVER_FILE,
        RECENT_SONGS_COVER_FILE,
      ])
      return !used.has(file)
    })

  console.log(`\nUploaded ${uploaded.length} playlist covers.`)
  if (skipped.length > 0) {
    console.log('\nSkipped:')
    skipped.forEach((line) => console.log(`  - ${line}`))
  }
  if (unmapped.length > 0) {
    console.log('\nUnmapped images in genre/ (no playlist assigned):')
    unmapped.forEach((file) => console.log(`  - ${file}`))
  }

  for (const removedSlug of ['comedy', 'benny-landau', '50s'] as const) {
    const { error: deleteError } = await (supabase.from('playlists') as any)
      .delete()
      .eq('curated_slug', removedSlug)

    if (deleteError) {
      console.warn(`  ⚠️  Could not remove ${removedSlug} playlist: ${deleteError.message}`)
    } else {
      console.log(`  ✅ Removed ${removedSlug} curated playlist from DB`)
    }
  }
  try {
    const { revalidatePath, revalidateTag } = await import('next/cache')
    revalidateTag(LIBRARY_CATALOG_TAG)
    revalidatePath('/')
    console.log('\nCache revalidated for home library sections.')
  } catch {
    console.log('\nRestart dev server or hard-refresh (Cmd+Shift+R) if covers look stale.')
  }
}

run().catch((error) => {
  console.error('Upload failed:', error)
  process.exit(1)
})
