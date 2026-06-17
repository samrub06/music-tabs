'use client'

import { useCallback, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { BackArrowIcon } from '@/components/icons/DirectionalIcons'
import SongTable from '@/components/SongTable'
import Pagination from '@/components/Pagination'
import { SelectModeToggleButton } from '@/components/song-table/SongTableHeader'
import { useLanguage } from '@/context/LanguageContext'
import type { Profile } from '@/lib/services/profileRepo'
import type { Song } from '@/types'
import { adminDeleteSongsAction } from '@/app/(protected)/admin/songs/actions'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface AdminUserSongsClientProps {
  profile: Profile
  songs: Song[]
  total: number
  page: number
  limit: number
  artists: string[]
  initialAuthor?: string
  initialQuery?: string
}

export default function AdminUserSongsClient({
  profile,
  songs,
  total,
  page,
  limit,
  artists,
  initialAuthor = '',
  initialQuery = '',
}: AdminUserSongsClientProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [localSearch, setLocalSearch] = useState(initialQuery)

  const applyParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams?.toString() || '')
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value)
        else params.delete(key)
      }
      if (!updates.page) params.set('page', '1')
      router.push(`${pathname}?${params.toString()}`)
    },
    [pathname, router, searchParams]
  )

  const noopFolderChange = async () => {}

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 sm:p-6">
      <Link
        href="/admin/users"
        className="mb-4 inline-flex shrink-0 items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <BackArrowIcon className="h-4 w-4" />
        {t('admin.usersTitle')}
      </Link>

      <div className="mb-4 shrink-0">
        <h1 className="text-xl font-semibold">{profile.fullName || profile.email}</h1>
        <p className="text-sm text-muted-foreground">{profile.email}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('admin.songCount').replace('{count}', String(total))}
        </p>
      </div>

      <div className="mb-4 flex shrink-0 flex-wrap items-center gap-2">
        <input
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          onKeyDown={(e) =>
            e.key === 'Enter' && applyParams({ q: localSearch.trim() || undefined, page: '1' })
          }
          placeholder={t('songs.search')}
          className="min-w-[160px] flex-1 rounded-xl border border-border px-3 py-2 text-sm"
        />
        <Select
          value={initialAuthor || 'all'}
          onValueChange={(v) =>
            applyParams({ author: v === 'all' ? undefined : v, page: '1' })
          }
        >
          <SelectTrigger className="w-[160px] rounded-xl">
            <SelectValue placeholder={t('admin.filterArtist')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin.allArtists')}</SelectItem>
            {artists.map((artist) => (
              <SelectItem key={artist} value={artist}>
                {artist}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <SelectModeToggleButton
          isSelectMode={isSelectMode}
          onToggle={() => setIsSelectMode((v) => !v)}
          t={t}
        />
      </div>

      <div
        data-main-scroll
        className="relative z-0 min-h-0 flex-1 overflow-y-auto overscroll-contain pb-4"
      >
        <SongTable
          songs={songs}
          folders={[]}
          hasUser
          isSelectMode={isSelectMode}
          onToggleSelectMode={() => setIsSelectMode((v) => !v)}
          onFolderChange={noopFolderChange}
          onDeleteSongs={adminDeleteSongsAction}
          onDeleteAllSongs={async () => {}}
        />
        <Pagination page={page} limit={limit} total={total} />
      </div>
    </div>
  )
}
