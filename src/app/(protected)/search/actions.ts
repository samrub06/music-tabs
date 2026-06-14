'use server'

import { searchSongsByStyle, type AiExcludeSong } from '@/lib/services/aiSearchService'

export async function searchSongsByStyleAction(
  description: string,
  exclude?: AiExcludeSong[]
) {
  return await searchSongsByStyle(description, { exclude })
}
