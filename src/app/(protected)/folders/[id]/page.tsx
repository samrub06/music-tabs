import { redirect, notFound } from 'next/navigation'
import { createSafeServerClient } from '@/lib/supabase/server'
import { folderRepo } from '@/lib/services/folderRepo'
import { songRepo } from '@/lib/services/songRepo'
import FolderSongsClient from './FolderSongsClient'

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

  // Fetch folder directly by ID
  const folder = await folderRepo(supabase).getFolderById(id)

  if (!folder) {
    notFound()
  }

  // Fetch songs filtered by folder_id using repo method
  const repo = songRepo(supabase)
  const { songs, total } = await repo.getSongsByFolder(id, page, limit, q)

  return (
    <FolderSongsClient 
      folder={folder}
      songs={songs}
      total={total}
      page={page}
      limit={limit}
      initialView={view}
      initialQuery={q}
    />
  )
}

