import { redirect } from 'next/navigation'
import { createSafeServerClient } from '@/lib/supabase/server'
import ChordProgressionsClient from './ChordProgressionsClient'

export default async function ChordProgressionsPage() {
  const supabase = await createSafeServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  return <ChordProgressionsClient />
}
