import { redirect, notFound } from 'next/navigation'
import { Suspense } from 'react'
import { unstable_noStore as noStore } from 'next/cache'
import { createSafeServerClient } from '@/lib/supabase/server'
import { folderRepo } from '@/lib/services/folderRepo'
import FolderSongsData from './FolderSongsData'
import FolderSongsSkeleton from './FolderSongsSkeleton'

export default async function FolderSongsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{
    page?: string
    limit?: string
    q?: string
    sortOrder?: string
    searchQuery?: string
  }>
}) {
  noStore()

  const supabase = await createSafeServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { id } = await params
  const searchParamsResolved = await searchParams

  const folder = await folderRepo(supabase).getFolderById(id, user.id)

  if (!folder) {
    notFound()
  }

  const limit = Math.max(1, Number(searchParamsResolved?.limit) || 50)
  const q = searchParamsResolved?.q || searchParamsResolved?.searchQuery || ''
  const sortOrder =
    searchParamsResolved?.sortOrder === 'desc' || searchParamsResolved?.sortOrder === 'asc'
      ? searchParamsResolved.sortOrder
      : 'asc'

  return (
    <Suspense fallback={<FolderSongsSkeleton />}>
      <FolderSongsData
        folder={folder}
        page={1}
        limit={limit}
        q={q}
        sortOrder={sortOrder}
        userId={user.id}
      />
    </Suspense>
  )
}
