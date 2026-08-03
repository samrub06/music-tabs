'use server'

import { z } from 'zod'
import { getCachedExploreCatalog } from '@/lib/services/exploreCatalogCache'
import type { Song } from '@/types'

const exploreListQuerySchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1).max(100),
  q: z.string().optional(),
  genre: z.string().optional(),
  difficulty: z.string().optional(),
  decade: z.number().int().optional(),
})

export async function fetchExploreCatalogPageAction(
  payload: unknown
): Promise<{ songs: Song[]; total: number }> {
  const params = exploreListQuerySchema.parse(payload)
  return getCachedExploreCatalog(params)
}
