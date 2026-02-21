// src/app/api/auth/callback/route.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createActionServerClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  
  // Default to search if no next param provided
  let next = searchParams.get('next') ?? '/search'

  // Basic sanitization to prevent open redirects
  // Ensure it starts with / and is not a protocol-relative URL (//)
  if (!next.startsWith('/') || next.startsWith('//')) {
    next = '/search'
  }

  if (code) {
    console.log('Exchanging code for session...', code)
    const supabase = await createActionServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth-code-error`)
}
