import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/db'

/**
 * Creates a Supabase client for Server Components (Pages/Layouts).
 * This client is READ-ONLY for cookies and will not attempt to set/write them.
 * Use this in async server components (page.tsx, layout.tsx).
 */
export async function createSafeServerClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          // Intentionally empty. Server Components cannot write cookies.
          // Auth session refreshing is handled by Middleware.
        },
      },
    }
  )
}

/**
 * Creates a Supabase client for Server Actions and Route Handlers.
 * This client CAN write cookies and should be used for mutations (login, update, etc).
 */
export async function createActionServerClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            // Should not happen in Actions/Routes, but safety net just in case
            console.error('Error setting cookies in action client:', error)
          }
        },
      },
    }
  )
}

// Deprecated export to maintain temporary compatibility while refactoring,
// mapped to the safe client to avoid crashes, but should be replaced.
export const createServerClientSupabase = createSafeServerClient
