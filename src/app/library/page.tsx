import { createServerClientSupabase } from '@/lib/supabase/server'
import LibraryClient from './LibraryClient'
import { songService } from '@/lib/services/songService'

export default async function LibraryPage({ searchParams }: { searchParams: Promise<{ page?: string; view?: string; limit?: string; q?: string }> }) {
  const supabase = await createServerClientSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  const params = await searchParams
  const page = Math.max(1, parseInt(params?.page || '1', 10))
  const limit = Math.max(1, parseInt(params?.limit || '24', 10))
  const view = (params?.view === 'table' ? 'table' : 'gallery') as 'gallery' | 'table'
  const q = params?.q || ''

  const { songs, total } = await songService.getAllSongs(supabase, page, limit, q)

  return <LibraryClient songs={songs} total={total} page={page} limit={limit} initialView={view} initialQuery={q} />
}
