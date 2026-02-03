import { redirect } from 'next/navigation'
import { createSafeServerClient } from '@/lib/supabase/server'
import SongPreviewClient from './SongPreviewClient'

export default async function SongPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string; searchResult?: string }>
}) {
  const params = await searchParams
  const { url, searchResult } = params

  if (!url) {
    redirect('/search')
  }

  const supabase = await createSafeServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <SongPreviewClient 
      url={url}
      searchResult={searchResult}
      userId={user?.id}
    />
  )
}
