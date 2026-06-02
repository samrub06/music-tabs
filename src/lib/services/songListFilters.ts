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

const BATCH_SIZE = 1000

export function tabToOrderBy(tab: SongListTab = 'all'): 'created_at' | 'updated_at' | 'view_count' {
  if (tab === 'recent') return 'updated_at'
  if (tab === 'popular') return 'view_count'
  return 'created_at'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applySongListFilters(client: SupabaseClient<Database>, user: { id: string } | null, params: SongListFilterParams): any {
  let baseQuery = client.from('songs').select('id', { count: 'exact' })

  if (!user) {
    baseQuery = baseQuery.is('user_id', null)
  } else {
    baseQuery = baseQuery.eq('user_id', user.id)
  }

  const q = params.q?.trim()
  if (q) {
    baseQuery = baseQuery.or(`title.ilike.%${q}%,author.ilike.%${q}%`)
  }

  if (params.easyChord === true) {
    baseQuery = baseQuery.or(
      'difficulty.ilike.%easy%,difficulty.ilike.%facile%,difficulty.ilike.%beginner%,difficulty.ilike.%débutant%'
    )
  }

  if (params.capoFilter === 'with') {
    baseQuery = baseQuery.not('capo', 'is', null).gt('capo', 0)
  } else if (params.capoFilter === 'without') {
    baseQuery = baseQuery.or('capo.is.null,capo.eq.0')
  }

  if (params.likedOnly === true) {
    baseQuery = baseQuery.eq('is_liked', true)
  }

  const orderBy = tabToOrderBy(params.tab)
  if (orderBy === 'view_count') {
    baseQuery = baseQuery.not('view_count', 'is', null).gt('view_count', 0)
  }

  if (params.folderId === 'unorganized') {
    baseQuery = baseQuery.is('folder_id', null)
  } else if (params.folderId) {
    baseQuery = baseQuery.eq('folder_id', params.folderId)
  }

  const orderColumn =
    orderBy === 'updated_at' ? 'updated_at' : orderBy === 'view_count' ? 'view_count' : 'created_at'

  return { baseQuery, orderColumn }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
