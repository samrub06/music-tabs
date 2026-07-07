import { unstable_noStore as noStore } from 'next/cache'
import { createSafeServerClient } from '@/lib/supabase/server'
import { notificationsRepo } from '@/lib/services/notificationsRepo'
import NotificationsClient from './NotificationsClient'

export default async function NotificationsPage() {
  noStore()

  const supabase = await createSafeServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const notifications = user
    ? await notificationsRepo(supabase).getNotifications(user.id, 100)
    : []

  return <NotificationsClient initialNotifications={notifications} />
}
