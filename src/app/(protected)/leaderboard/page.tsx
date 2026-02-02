import { unstable_noStore as noStore } from 'next/cache'
import { createSafeServerClient } from '@/lib/supabase/server'
import { gamificationRepo } from '@/lib/services/gamificationRepo'
import LeaderboardClient from './LeaderboardClient'

export default async function LeaderboardPage() {
  noStore() // Disable static caching for user-specific data
  
  const supabase = await createSafeServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const gamification = gamificationRepo(supabase)
  const leaderboard = await gamification.getLeaderboard(100)
  
  return (
    <LeaderboardClient 
      initialLeaderboard={leaderboard}
      currentUserId={user?.id || undefined}
    />
  )
}
