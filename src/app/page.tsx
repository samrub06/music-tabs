import { redirect } from 'next/navigation'
import { createSafeServerClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createSafeServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/search')
  } else {
    redirect('/search')
  }
}
