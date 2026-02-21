import { ReactNode } from 'react'
import ProtectedLayoutClient from './ProtectedLayoutClient'

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  // No server-side redirect - let ProtectedLayoutClient handle authentication
  // This allows /search and /library/[playlistId] to be accessible without auth while other routes are protected
  // The client component will handle redirects for non-authenticated users on protected routes
  return <ProtectedLayoutClient>{children}</ProtectedLayoutClient>
}

