import { revalidatePath, revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'
import { LIBRARY_CATALOG_TAG } from '@/lib/services/libraryCatalogCache'

/**
 * Bust home explorer playlist cache after admin seed/triage scripts.
 * POST with header: x-revalidate-secret: CRON_SECRET or REVALIDATE_SECRET
 */
export async function POST(req: Request) {
  const secret = req.headers.get('x-revalidate-secret')
  const expected =
    process.env.REVALIDATE_SECRET?.trim() || process.env.CRON_SECRET?.trim()

  if (!expected || secret !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  revalidateTag(LIBRARY_CATALOG_TAG)
  revalidatePath('/')
  revalidatePath('/explore')

  return NextResponse.json({ ok: true, tag: LIBRARY_CATALOG_TAG })
}
