import { redirect, notFound } from 'next/navigation'
import { Suspense } from 'react'
import { createSafeServerClient } from '@/lib/supabase/server'
import { folderRepo } from '@/lib/services/folderRepo'
import FolderSongsData from './FolderSongsData'
import FolderSongsSkeleton from './FolderSongsSkeleton'

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

  const folder = await folderRepo(supabase).getFolderById(id, user.id)

  if (!folder) {
    notFound()
  }

  return (
    <Suspense fallback={<FolderSongsSkeleton />}>
      <FolderSongsData
        folder={folder}
        page={page}
        limit={limit}
        view={view}
        q={q}
        sortOrder={sortOrder}
        userId={user.id}
      />
    </Suspense>
  )
}
