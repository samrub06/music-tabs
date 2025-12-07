import { redirect } from 'next/navigation'
import { ReactNode } from 'react'
import { createSafeServerClient } from '@/lib/supabase/server'
import ProtectedLayoutClient from './ProtectedLayoutClient'

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const supabase = await createSafeServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Redirect to login or home if not authenticated
  if (!user) {
    redirect('/')
  }
  
  // Render the client layout with the UI
  return <ProtectedLayoutClient>{children}</ProtectedLayoutClient>
}

