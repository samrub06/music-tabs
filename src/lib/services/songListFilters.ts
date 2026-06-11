import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/db'

export type SongListTab = 'all' | 'recent' | 'popular'
export type SongListCapoFilter = 'any' | 'with' | 'without'

export type SongListFilterParams = {
  q?: string
  tab?: SongListTab
  easyChord?: boolean
  capoFilter?: SongListCapoFilter
  likedOnly?: boolean
  folderId?: string
}

export const USER_SONGS_LIST_COLUMNS =
  'id, title, author, folder_id, created_at, updated_at, rating, difficulty, capo, artist_image_url, song_image_url, view_count, version, version_description, key, first_chord, last_chord, tab_id, genre, bpm, is_liked'

const BATCH_SIZE = 1000

export function tabToOrderBy(tab: SongListTab = 'all'): 'created_at' | 'updated_at' | 'view_count' {
  if (tab === 'recent') return 'updated_at'
  if (tab === 'popular') return 'view_count'
  return 'created_at'
}

export function orderByToTab(
  orderBy?: 'created_at' | 'updated_at' | 'view_count'
): SongListTab {
  if (orderBy === 'updated_at') return 'recent'
  if (orderBy === 'view_count') return 'popular'
  return 'all'
}

/** Applies list filters to an already-selected songs query (call twice for parallel data + count). */
export function applyUserSongsListFilters(
  query: any,
  user: { id: string } | null,
  params: SongListFilterParams
): { query: any; orderColumn: string } {

  if (!user) {
    query = query.is('user_id', null)
  } else {
    query = query.eq('user_id', user.id)
  }

  const q = params.q?.trim()
  if (q) {
    query = query.or(`title.ilike.%${q}%,author.ilike.%${q}%`)
  }

  if (params.easyChord === true) {
    query = query.or(
      'difficulty.ilike.%easy%,difficulty.ilike.%facile%,difficulty.ilike.%beginner%,difficulty.ilike.%débutant%'
    )
  }

  if (params.capoFilter === 'with') {
    query = query.not('capo', 'is', null).gt('capo', 0)
  } else if (params.capoFilter === 'without') {
    query = query.or('capo.is.null,capo.eq.0')
  }

  if (params.likedOnly === true) {
    query = query.eq('is_liked', true)
  }

  const orderBy = tabToOrderBy(params.tab)
  if (orderBy === 'view_count') {
    query = query.not('view_count', 'is', null).gt('view_count', 0)
  }

  if (params.folderId === 'unorganized') {
    query = query.is('folder_id', null)
  } else if (params.folderId) {
    query = query.eq('folder_id', params.folderId)
  }

  const orderColumn =
    orderBy === 'updated_at' ? 'updated_at' : orderBy === 'view_count' ? 'view_count' : 'created_at'

  return { query, orderColumn }
}

export function applySongListFilters(
  client: SupabaseClient<Database>,
  user: { id: string } | null,
  params: SongListFilterParams
) {
  const { query, orderColumn } = applyUserSongsListFilters(
    (client.from('songs') as any).select('id', { count: 'exact' }),
    user,
    params
  )
  return { baseQuery: query, orderColumn }
}

export async function fetchAllSongIdsFromQuery(baseQuery: any, orderColumn: string): Promise<string[]> {
  const ids: string[] = []
  let offset = 0

  while (true) {
    const { data, error } = await baseQuery
      .order(orderColumn, { ascending: false })
      .range(offset, offset + BATCH_SIZE - 1)

    if (error) {
      throw error
    }

    const batch = (data ?? []) as { id: string }[]
    if (batch.length === 0) break

    ids.push(...batch.map((row) => row.id))

    if (batch.length < BATCH_SIZE) break
    offset += BATCH_SIZE
  }

  return ids
}
