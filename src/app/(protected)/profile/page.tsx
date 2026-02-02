import { createSafeServerClient } from '@/lib/supabase/server'
import { profileRepo } from '@/lib/services/profileRepo'
import { gamificationRepo } from '@/lib/services/gamificationRepo'
import ProfileClient from './ProfileClient'
import type { UserStats } from '@/types'
import { unstable_noStore as noStore } from 'next/cache'

export default async function ProfilePage() {
  noStore() // Disable static caching for user-specific data
  
  const supabase = await createSafeServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return <div>Please sign in to view your profile</div>
  }
  
  // Fetch profile and stats in parallel
  const [profile, stats] = await Promise.all([
    profileRepo(supabase).getProfile(user.id),
    gamificationRepo(supabase).getUserStats(user.id)
  ])
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <ProfileClient 
          initialProfile={profile}
          initialStats={stats}
        />
      </div>
    </div>
  )
}
