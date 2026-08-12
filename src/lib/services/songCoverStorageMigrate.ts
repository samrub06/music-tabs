/**
 * Migrate external catalog cover URLs into the public `catalog-images` bucket
 * and point `songs.song_image_url` at our Supabase CDN.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/db'

export const CATALOG_IMAGES_BUCKET = 'catalog-images'
export const DEFAULT_COVER_MIGRATE_LIMIT = 40
export const DEFAULT_COVER_MIGRATE_CONCURRENCY = 4

const MAX_BYTES = 5 * 1024 * 1024
const FETCH_TIMEOUT_MS = 20_000

export type CoverMigrateSong = {
  id: string
  slug: string | null
  title: string
  song_image_url: string | null
  artist_image_url: string | null
}

export type CoverMigrateStats = {
  candidatesRemaining: number
  processed: number
  ok: number
  fail: number
  skip: number
  done: boolean
}

export type CoverMigrateOptions = {
  limit?: number
  concurrency?: number
  dryRun?: boolean
  force?: boolean
  /** Song IDs to skip (e.g. permanent download failures). */
  excludeIds?: Set<string>
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function isOurStorageUrl(url: string, supabaseHost: string): boolean {
  try {
    const host = new URL(url).hostname
    return host.includes(supabaseHost) || host.includes('supabase.co')
  } catch {
    return false
  }
}

function candidateUrls(raw: string): string[] {
  const urls: string[] = []
  const push = (u: string) => {
    if (u && !urls.includes(u)) urls.push(u)
  }

  try {
    const parsed = new URL(raw.trim())
    const host = parsed.hostname

    if (host.includes('ultimate-guitar.com')) {
      const base = parsed.href.replace(/@\d+$/, '')
      push(`${base}@1000`)
      push(`${base}@600`)
      push(parsed.href)
      push(base)
    } else if (host.includes('mzstatic.com')) {
      push(parsed.href.replace(/\/\d+x\d+[a-z]*(\.[a-z]+)$/i, '/1200x1200bb$1'))
      push(parsed.href.replace(/\/\d+x\d+[a-z]*(\.[a-z]+)$/i, '/600x600bb$1'))
      push(parsed.href)
    } else {
      push(parsed.href)
    }
  } catch {
    push(raw)
  }

  return urls
}

function extFromContentType(contentType: string | null, url: string): string {
  const ct = (contentType || '').split(';')[0].trim().toLowerCase()
  if (ct === 'image/png') return '.png'
  if (ct === 'image/webp') return '.webp'
  if (ct === 'image/gif') return '.gif'
  if (ct === 'image/jpeg' || ct === 'image/jpg') return '.jpg'
  const pathOnly = url.split('?')[0]
  const m = pathOnly.match(/\.(jpe?g|png|webp|gif)(@\d+)?$/i)
  if (m) {
    const e = m[1].toLowerCase()
    return e === 'jpeg' ? '.jpg' : `.${e}`
  }
  return '.jpg'
}

function contentTypeForExt(ext: string): string {
  switch (ext) {
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

async function downloadBest(
  sourceUrl: string
): Promise<{ bytes: Uint8Array; contentType: string; ext: string; usedUrl: string } | null> {
  for (const url of candidateUrls(sourceUrl)) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; TABascoCoverMigrator/1.0; +https://www.tabascomusic.com)',
          Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
          Referer: 'https://www.tabascomusic.com/',
        },
      })
      if (!res.ok) continue
      const contentType = res.headers.get('content-type')
      if (contentType && !contentType.startsWith('image/')) continue
      const bytes = new Uint8Array(await res.arrayBuffer())
      if (bytes.byteLength < 500) continue
      if (bytes.byteLength > MAX_BYTES) continue
      const ext = extFromContentType(contentType, url)
      return {
        bytes,
        contentType: contentTypeForExt(ext),
        ext,
        usedUrl: url,
      }
    } catch {
      // try next candidate
    } finally {
      clearTimeout(timer)
    }
  }
  return null
}

export async function ensureCatalogImagesBucket(
  supabase: SupabaseClient<Database>
): Promise<void> {
  const { data: buckets } = await supabase.storage.listBuckets()
  if (buckets?.some((b) => b.id === CATALOG_IMAGES_BUCKET)) return

  const { error } = await supabase.storage.createBucket(CATALOG_IMAGES_BUCKET, {
    public: true,
    fileSizeLimit: MAX_BYTES,
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  })
  if (error) throw error
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let next = 0

  async function worker() {
    while (true) {
      const i = next++
      if (i >= items.length) return
      results[i] = await fn(items[i])
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length || 1) }, () => worker())
  )
  return results
}

/**
 * Load catalog songs whose preferred cover URL is still external.
 * Uses keyset-friendly paging; stops early once `limit` candidates collected when set.
 */
export async function loadExternalCoverCandidates(
  supabase: SupabaseClient<Database>,
  supabaseHost: string,
  options: { force?: boolean; limit?: number; excludeIds?: Set<string> } = {}
): Promise<CoverMigrateSong[]> {
  const pageSize = 1000
  const out: CoverMigrateSong[] = []
  let from = 0
  const force = options.force === true
  const excludeIds = options.excludeIds
  const stopAt = options.limit && options.limit > 0 ? options.limit : Infinity

  while (out.length < stopAt) {
    const { data, error } = await supabase
      .from('songs')
      .select('id, slug, title, song_image_url, artist_image_url')
      .is('user_id', null)
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1)

    if (error) throw error
    if (!data?.length) break

    for (const row of data as CoverMigrateSong[]) {
      if (excludeIds?.has(row.id)) continue
      const preferred = row.song_image_url || row.artist_image_url
      if (!preferred) continue
      if (!force && isOurStorageUrl(preferred, supabaseHost)) continue
      if (!force && row.song_image_url && isOurStorageUrl(row.song_image_url, supabaseHost)) {
        continue
      }
      out.push(row)
      if (out.length >= stopAt) break
    }

    if (data.length < pageSize) break
    from += pageSize
  }

  return out
}

async function migrateOne(
  supabase: SupabaseClient<Database>,
  song: CoverMigrateSong,
  supabaseHost: string,
  options: { dryRun?: boolean; force?: boolean }
): Promise<'ok' | 'skip' | 'fail'> {
  const source = song.song_image_url || song.artist_image_url
  if (!source) return 'skip'
  if (!options.force && isOurStorageUrl(source, supabaseHost) && song.song_image_url) {
    return 'skip'
  }

  const downloaded = await downloadBest(source)
  if (!downloaded) {
    console.warn(`FAIL download ${song.title} (${song.id}) ← ${source}`)
    return 'fail'
  }

  const storagePath = `songs/${song.id}${downloaded.ext}`

  if (options.dryRun) {
    console.log(
      `DRY ${song.title} → ${storagePath} (${downloaded.bytes.byteLength}B from ${downloaded.usedUrl})`
    )
    return 'ok'
  }

  const { error: uploadError } = await supabase.storage
    .from(CATALOG_IMAGES_BUCKET)
    .upload(storagePath, downloaded.bytes, {
      upsert: true,
      contentType: downloaded.contentType,
      cacheControl: '31536000',
    })

  if (uploadError) {
    console.warn(`FAIL upload ${song.title}:`, uploadError.message)
    return 'fail'
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(CATALOG_IMAGES_BUCKET).getPublicUrl(storagePath)

  const { error: updateError } = await (supabase.from('songs') as any)
    .update({ song_image_url: publicUrl, updated_at: new Date().toISOString() })
    .eq('id', song.id)

  if (updateError) {
    console.warn(`FAIL update ${song.title}:`, updateError.message)
    return 'fail'
  }

  console.log(`OK ${song.title} → ${publicUrl}`)
  return 'ok'
}

/**
 * Process one batch of external covers. Safe for Vercel cron (bounded limit).
 */
export async function migrateSongCoversBatch(
  supabase: SupabaseClient<Database>,
  supabaseUrl: string,
  options: CoverMigrateOptions = {}
): Promise<CoverMigrateStats> {
  const limit = Math.max(
    1,
    options.limit ?? DEFAULT_COVER_MIGRATE_LIMIT
  )
  const concurrency = Math.max(
    1,
    options.concurrency ?? DEFAULT_COVER_MIGRATE_CONCURRENCY
  )
  const dryRun = options.dryRun === true
  const force = options.force === true
  const supabaseHost = new URL(supabaseUrl).hostname

  await ensureCatalogImagesBucket(supabase)

  // Fetch a bit more than limit so we can report remaining accurately after batch
  const candidates = await loadExternalCoverCandidates(supabase, supabaseHost, {
    force,
    limit: limit + 1,
    excludeIds: options.excludeIds,
  })
  const batch = candidates.slice(0, limit)
  const hasMore = candidates.length > limit

  let ok = 0
  let fail = 0
  let skip = 0
  const failedIds: string[] = []

  const chunkSize = concurrency * 5
  for (let i = 0; i < batch.length; i += chunkSize) {
    const chunk = batch.slice(i, i + chunkSize)
    const results = await mapPool(chunk, concurrency, async (song) => {
      const result = await migrateOne(supabase, song, supabaseHost, { dryRun, force })
      return { songId: song.id, result }
    })
    for (const { songId, result } of results) {
      if (result === 'ok') ok++
      else if (result === 'fail') {
        fail++
        failedIds.push(songId)
      } else skip++
    }
    if (i + chunkSize < batch.length) await sleep(300)
  }

  // Persist failed IDs into the exclude set for callers that reuse it
  if (options.excludeIds) {
    for (const id of failedIds) options.excludeIds.add(id)
  }

  return {
    candidatesRemaining: hasMore ? -1 : 0, // -1 = unknown remaining but more exist
    processed: batch.length,
    ok,
    fail,
    skip,
    done: !hasMore && batch.length === 0,
  }
}
