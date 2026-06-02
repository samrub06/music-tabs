import { createSafeServerClient } from '@/lib/supabase/server'
import { folderRepo } from '@/lib/services/folderRepo'
import AddSongClient from './AddSongClient'
import { unstable_noStore as noStore } from 'next/cache'
import { Suspense } from 'react'

export default async function AddSongPage({
  searchParams,
}: {
  searchParams: Promise<{ folderId?: string }>
}) {
  noStore()

  const params = await searchParams
  const defaultFolderId = params.folderId?.trim() || undefined

  const supabase = await createSafeServerClient()
  const folders = await folderRepo(supabase).getAllFolders()

  return (
    <div className="flex min-h-0 flex-1 flex-col p-3 sm:p-6">
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        }
      >
        <AddSongClient folders={folders} defaultFolderId={defaultFolderId} />
      </Suspense>
    </div>
  )
}
