'use server'

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { songService } from '@/lib/services/songService'
import { revalidatePath } from 'next/cache'
import type { SongEditData } from '@/types'

async function supabaseServer() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    }
  )
}

export async function updateSongAction(id: string, updates: SongEditData) {
  const supabase = await supabaseServer()
  const updated = await songService.updateSong(id, updates, supabase)
  revalidatePath('/dashboard')
  revalidatePath(`/song/${id}`)
  return updated
}

export async function deleteSongAction(id: string) {
  const supabase = await supabaseServer()
  await songService.deleteSong(id, supabase)
  revalidatePath('/dashboard')
}

