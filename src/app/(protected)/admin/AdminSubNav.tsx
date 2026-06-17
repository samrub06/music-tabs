'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '/admin/songs', label: 'Songs' },
  { href: '/admin/users', label: 'Users' },
] as const

export function AdminSubNav() {
  const pathname = usePathname()

  return (
    <nav className="flex shrink-0 gap-1 border-b border-border px-4 py-2 sm:px-6">
      {LINKS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
            pathname === href || pathname.startsWith(`${href}/`)
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}
