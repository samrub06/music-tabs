'use server'

import { searchSongsByStyle } from '@/lib/services/aiSearchService'

export async function searchSongsByStyleAction(description: string) {
  return await searchSongsByStyle(description)
}
