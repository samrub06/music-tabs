'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import Pagination from '@/components/Pagination'
import { useLanguage } from '@/context/LanguageContext'
import type { Profile } from '@/lib/services/profileRepo'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

type AdminUserRow = Profile & { songCount: number }

interface AdminUsersClientProps {
  profiles: AdminUserRow[]
  total: number
  page: number
  limit: number
  initialSearch?: string
}

export default function AdminUsersClient({
  profiles,
  total,
  page,
  limit,
  initialSearch = '',
}: AdminUsersClientProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(initialSearch)

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    if (search.trim()) params.set('search', search.trim())
    else params.delete('search')
    params.set('page', '1')
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 sm:p-6">
      <h1 className="mb-4 shrink-0 text-xl font-semibold">{t('admin.usersTitle')}</h1>

      <div className="mb-4 flex shrink-0 gap-2">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={t('leaderboard.searchPlaceholder')}
            className="w-full rounded-xl border border-border py-2.5 pl-10 pr-3 text-sm"
          />
        </div>
        <Button type="button" variant="outline" onClick={handleSearch}>
          {t('common.search')}
        </Button>
      </div>

      <div
        data-main-scroll
        className="relative z-0 min-h-0 flex-1 overflow-y-auto overscroll-contain pb-4"
      >
      {profiles.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">{t('admin.noUsers')}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left">
                <th className="px-4 py-3 font-medium">{t('admin.columnName')}</th>
                <th className="px-4 py-3 font-medium">{t('admin.columnEmail')}</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">
                  {t('admin.columnSongs')}
                </th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">
                  {t('admin.columnJoined')}
                </th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {profiles.map((profile) => (
                <tr key={profile.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {profile.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={profile.avatarUrl}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs">
                          {(profile.fullName || profile.email)[0]?.toUpperCase()}
                        </div>
                      )}
                      <span>{profile.fullName || t('common.user')}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{profile.email}</td>
                  <td className="hidden px-4 py-3 sm:table-cell">{profile.songCount}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {profile.createdAt.toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/users/${profile.id}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {t('admin.viewSongs')}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} limit={limit} total={total} />
      </div>
    </div>
  )
}
