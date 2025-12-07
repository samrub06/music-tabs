// src/app/api/auth/callback/route.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createActionServerClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  // Echange le code OAuth contre une session et met à jour les cookies, puis redirige
  const res = NextResponse.redirect(new URL('/', req.url))
  
  // Use action client because we need to write cookies (exchange code for session)
  const supabase = await createActionServerClient()
  
  // Handing the exchange (Supabase SSR auth helper usually does this via exchangeCodeForSession)
  // But here we rely on the manual flow matching middleware if needed.
  // Actually, @supabase/ssr helpers typically handle code exchange via exchangeCodeForSession.
  // Let's stick to the pattern:
  const code = req.nextUrl.searchParams.get('code')
  if (code) {
    await supabase.auth.exchangeCodeForSession(code)
  }

  return res
}