import { redirect, notFound } from 'next/navigation'
import { createSafeServerClient } from '@/lib/supabase/server'
import { folderRepo } from '@/lib/services/folderRepo'

export default async function FolderSongsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ page?: string; view?: string; limit?: string; q?: string; sortOrder?: string; searchQuery?: string }>
}) {
  const supabase = await createSafeServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { id } = await params
  const searchParamsResolved = await searchParams

  const folder = await folderRepo(supabase).getFolderById(id, user.id)

  if (!folder) {
    notFound()
  }

  const redirectParams = new URLSearchParams()
  redirectParams.set('folder', id)

  const page = searchParamsResolved?.page
  const limit = searchParamsResolved?.limit
  const view = searchParamsResolved?.view
  const q = searchParamsResolved?.q || searchParamsResolved?.searchQuery
  const sortOrder = searchParamsResolved?.sortOrder

  if (page) redirectParams.set('page', page)
  if (limit) redirectParams.set('limit', limit)
  if (view) redirectParams.set('view', view)
  if (q) redirectParams.set('searchQuery', q)
  if (sortOrder) redirectParams.set('sortOrder', sortOrder)

  redirect(`/songs?${redirectParams.toString()}`)
}
