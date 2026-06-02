'use client'

import AddSongForm from '@/components/AddSongForm'
import type { Folder } from '@/types'
import { useRouter, useSearchParams } from 'next/navigation'

interface AddSongClientProps {
  folders: Folder[]
  defaultFolderId?: string
}

export default function AddSongClient({ folders, defaultFolderId }: AddSongClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const initialSearchQuery = searchParams.get('q')?.trim() || undefined
  const autoSearchFlag = searchParams.get('autoSearch')
  const autoSearchOnOpen =
    !!initialSearchQuery &&
    (autoSearchFlag === '1' || autoSearchFlag === 'true')

  const folderFromUrl = searchParams.get('folderId')?.trim() || undefined

  return (
    <AddSongForm
      key={`${initialSearchQuery ?? ''}:${autoSearchOnOpen}`}
      variant="page"
      onClose={() => router.back()}
      folders={folders}
      defaultFolderId={folderFromUrl ?? defaultFolderId}
      redirectAfterAdd
      initialSearchQuery={initialSearchQuery}
      autoSearchOnOpen={autoSearchOnOpen}
      onSuccess={() => router.refresh()}
    />
  )
}
