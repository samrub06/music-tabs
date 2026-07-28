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
  'id, title, author, folder_id, created_at, updated_at, rating, difficulty, capo, artist_image_url, song_image_url, view_count, version, version_description, key, first_chord, last_chord, tab_id, genre, bpm, cloned_from_id, source_url'

const BATCH_SIZE = 1000

/** Song-attribute filters only (no user_id / folder_id). Used for linked catalog rows. */
export function applySongAttributeFilters(
  query: any,
  params: SongListFilterParams
): { query: any; orderColumn: string } {
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

  // likedOnly is applied via user_library / RPC — not songs.is_liked

  const orderBy = tabToOrderBy(params.tab)
  if (orderBy === 'view_count') {
    query = query.not('view_count', 'is', null).gt('view_count', 0)
  }

  const orderColumn =
    orderBy === 'updated_at' ? 'updated_at' : orderBy === 'view_count' ? 'view_count' : 'created_at'

  return { query, orderColumn }
}

/** In-memory match for linked catalog rows (same semantics as applySongAttributeFilters). */
export function songListRowMatchesFilters(
  row: Record<string, unknown>,
  params: SongListFilterParams
): boolean {
  const q = params.q?.trim()?.toLowerCase()
  if (q) {
    const title = String(row.title ?? '').toLowerCase()
    const author = String(row.author ?? '').toLowerCase()
    if (!title.includes(q) && !author.includes(q)) return false
  }

  if (params.easyChord === true) {
    const difficulty = String(row.difficulty ?? '').toLowerCase()
    const easy =
      difficulty.includes('easy') ||
      difficulty.includes('facile') ||
      difficulty.includes('beginner') ||
      difficulty.includes('débutant') ||
      difficulty.includes('debutant')
    if (!easy) return false
  }

  if (params.capoFilter === 'with') {
    const capo = Number(row.capo ?? 0)
    if (!Number.isFinite(capo) || capo <= 0) return false
  } else if (params.capoFilter === 'without') {
    const capo = row.capo
    if (capo != null && Number(capo) > 0) return false
  }

  if (params.likedOnly === true) {
    if (row.is_liked !== true) return false
  }

  if (params.tab === 'popular') {
    const views = Number(row.view_count ?? 0)
    if (!Number.isFinite(views) || views <= 0) return false
  }

  return true
}

export function compareSongListRowsByOrder(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
  orderColumn: string
): number {
  const av = a[orderColumn]
  const bv = b[orderColumn]
  if (orderColumn === 'view_count') {
    return (Number(bv) || 0) - (Number(av) || 0)
  }
  const at = av ? new Date(String(av)).getTime() : 0
  const bt = bv ? new Date(String(bv)).getTime() : 0
  return bt - at
}

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

  const { query: withAttrs, orderColumn } = applySongAttributeFilters(query, params)
  query = withAttrs

  if (params.folderId === 'unorganized') {
    query = query.is('folder_id', null)
  } else if (params.folderId) {
    query = query.eq('folder_id', params.folderId)
  }

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
