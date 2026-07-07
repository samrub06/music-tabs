import { unstable_noStore as noStore } from 'next/cache'
import { createSafeServerClient } from '@/lib/supabase/server'
import { friendsRepo } from '@/lib/services/friendsRepo'
import FriendsClient from './FriendsClient'

export default async function FriendsPage() {
  noStore()

  const supabase = await createSafeServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const friends = user ? await friendsRepo(supabase).getAcceptedFriends(user.id) : []
  const discoverableUsers = user ? await friendsRepo(supabase).getDiscoverableUsers(user.id) : []

  return <FriendsClient initialFriends={friends} initialDiscoverableUsers={discoverableUsers} />
}
