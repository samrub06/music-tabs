import { redirect, notFound } from 'next/navigation'
import { createSafeServerClient } from '@/lib/supabase/server'
import { folderRepo } from '@/lib/services/folderRepo'
import { songRepo } from '@/lib/services/songRepo'
import FolderSongsClient from './FolderSongsClient'

export default async function FolderSongsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ page?: string; view?: string; limit?: string; q?: string; sortOrder?: string }>
}) {
  const supabase = await createSafeServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { id } = await params
  const searchParamsResolved = await searchParams
  const page = Math.max(1, parseInt(searchParamsResolved?.page || '1', 10))
  const limit = Math.max(1, parseInt(searchParamsResolved?.limit || '50', 10))
  const view = (searchParamsResolved?.view === 'table' ? 'table' : 'gallery') as 'gallery' | 'table'
  const q = searchParamsResolved?.q || ''
  const sortOrder = (searchParamsResolved?.sortOrder === 'desc' ? 'desc' : 'asc') as 'asc' | 'desc'

  const folderRepoInstance = folderRepo(supabase)
  const songRepoInstance = songRepo(supabase)

  const [folder, { songs, total }] = await Promise.all([
    folderRepoInstance.getFolderById(id, user.id),
    songRepoInstance.getSongsByFolder(id, page, limit, q, user.id),
  ])

  if (!folder) {
    notFound()
  }

  return (
    <FolderSongsClient
      folder={folder}
      songs={songs}
      total={total}
      page={page}
      limit={limit}
      initialView={view}
      initialQuery={q}
      initialSortOrder={sortOrder}
    />
  )
}
