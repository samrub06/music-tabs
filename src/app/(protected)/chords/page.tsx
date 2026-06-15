import { redirect } from 'next/navigation'
import { unstable_cache } from 'next/cache'
import { createSafeServerClient } from '@/lib/supabase/server'
import { chordService } from '@/lib/services/chordService'
import { knownChordService } from '@/lib/services/knownChordService'
import ChordsClient from './ChordsClient'

const getCachedChords = unstable_cache(
  async () => {
    const supabase = await createSafeServerClient()
    return chordService.getAllChords(supabase)
  },
  ['chord-catalog'],
  { revalidate: 86_400, tags: ['chord-catalog'] }
)

export default async function ChordsPage() {
  const supabase = await createSafeServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const [chords, knownChordIds] = await Promise.all([
    getCachedChords(),
    knownChordService.getKnownChordIds(user.id, supabase),
  ])

  return (
    <ChordsClient
      initialChords={chords}
      initialKnownChordIds={knownChordIds}
    />
  )
}
