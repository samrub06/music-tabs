import { unstable_noStore as noStore } from 'next/cache'
import { createSafeServerClient } from '@/lib/supabase/server'
import { songSuggestionRepo } from '@/lib/services/songSuggestionRepo'
import AdminSuggestionsClient from './AdminSuggestionsClient'

export default async function AdminSuggestionsData() {
  noStore()
  const supabase = await createSafeServerClient()
  const suggestions = await songSuggestionRepo(supabase).listPending()
  return <AdminSuggestionsClient suggestions={suggestions} />
}
