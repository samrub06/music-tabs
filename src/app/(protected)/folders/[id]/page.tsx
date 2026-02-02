import { redirect, notFound } from 'next/navigation'
import { createSafeServerClient } from '@/lib/supabase/server'
import { folderRepo } from '@/lib/services/folderRepo'
import FolderSongsClient from './FolderSongsClient'
import type { Song } from '@/types'

export default async function FolderSongsPage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ id: string }>
  searchParams: Promise<{ page?: string; view?: string; limit?: string; q?: string }>
}) {
  // Removed noStore() - data is revalidated via revalidatePath() after mutations
  const supabase = await createSafeServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Redirect if not authenticated
  if (!user) {
    redirect('/')
  }

  const { id } = await params
  const searchParamsResolved = await searchParams
  const page = Math.max(1, parseInt(searchParamsResolved?.page || '1', 10))
  const limit = Math.max(1, parseInt(searchParamsResolved?.limit || '50', 10))
  const view = (searchParamsResolved?.view === 'table' ? 'table' : 'gallery') as 'gallery' | 'table'
  const q = searchParamsResolved?.q || ''

  // Fetch folder directly by ID (optimized)
  const folder = await folderRepo(supabase).getFolderById(id)

  if (!folder) {
    notFound()
  }

  // Fetch songs filtered by folder_id

  let baseQuery = supabase
    .from('songs')
    .select('id, title, author, folder_id, created_at, updated_at, rating, difficulty, artist_image_url, song_image_url, view_count, version, version_description, key, first_chord, last_chord, tab_id, genre, bpm', { count: 'exact' })
    .eq('user_id', user.id)
    .eq('folder_id', id)

  if (q && q.trim()) {
    const query = q.trim()
    baseQuery = baseQuery.or(`title.ilike.%${query}%,author.ilike.%${query}%`)
  }

  const { data, error, count } = await baseQuery
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (error) {
    throw error
  }

  const folderSongs: Song[] = (data || []).map((song: any) => ({
    ...song,
    folderId: song.folder_id,
    createdAt: new Date(song.created_at),
    updatedAt: new Date(song.updated_at),
    version: song.version,
    versionDescription: song.version_description,
    rating: song.rating,
    difficulty: song.difficulty,
    artistImageUrl: song.artist_image_url,
    songImageUrl: song.song_image_url,
    viewCount: song.view_count || 0,
    key: song.key,
    firstChord: song.first_chord,
    lastChord: song.last_chord,
    tabId: song.tab_id,
    genre: song.genre,
    bpm: song.bpm,
    format: 'structured' as const,
    sections: [],
    content: '',
    author: song.author || ''
  }))

  return (
    <FolderSongsClient 
      folder={folder}
      songs={folderSongs}
      total={count || 0}
      page={page}
      limit={limit}
      initialView={view}
      initialQuery={q}
    />
  )
}

