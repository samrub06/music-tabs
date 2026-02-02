import { redirect } from 'next/navigation'
import { createSafeServerClient } from '@/lib/supabase/server'
import { Suspense } from 'react'
import FoldersData from './FoldersData'

export default async function FoldersPage() {
  // Removed noStore() - folders are revalidated via revalidatePath() after mutations
  const supabase = await createSafeServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Redirect if not authenticated
  if (!user) {
    redirect('/')
  }

  return (
    <Suspense fallback={<div className="p-3 sm:p-6"><div className="h-8 bg-gray-200 rounded w-48 mb-6 animate-pulse"></div></div>}>
      <FoldersData />
    </Suspense>
  )
}
