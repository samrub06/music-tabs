import { redirect } from 'next/navigation'
import { unstable_noStore as noStore } from 'next/cache'
import { createSafeServerClient } from '@/lib/supabase/server'
import { chordService } from '@/lib/services/chordService'
import { knownChordService } from '@/lib/services/knownChordService'
import ChordsClient from './ChordsClient'

export default async function ChordsPage() {
  noStore()
  const supabase = await createSafeServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Redirect if not authenticated
  if (!user) {
    redirect('/')
  }

  // Fetch chords and known chord IDs (manual)
  const [chords, knownChordIds] = await Promise.all([
    chordService.getAllChords(supabase),
    knownChordService.getKnownChordIds(user.id, supabase)
  ])

  return (
    <ChordsClient 
      initialChords={chords} 
      initialKnownChordIds={knownChordIds}
    />
  )
}

