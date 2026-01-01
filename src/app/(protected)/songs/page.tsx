import { redirect } from 'next/navigation'
import { unstable_noStore as noStore } from 'next/cache'
import { createSafeServerClient } from '@/lib/supabase/server'
import { Suspense } from 'react'
import SongsData from './SongsData'

export default async function SongsPage({ searchParams }: { searchParams: Promise<{ page?: string; view?: string; limit?: string; searchQuery?: string; songId?: string; folder?: string; sortOrder?: string }> }) {
  noStore()
  const supabase = await createSafeServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Redirect if not authenticated
  if (!user) {
    redirect('/')
  }

  return (
    <Suspense fallback={<div className="p-3 sm:p-6"><div className="h-10 bg-gray-100 rounded w-full max-w-2xl mb-6 animate-pulse"></div></div>}>
      <SongsData searchParams={searchParams} />
    </Suspense>
  )
}

