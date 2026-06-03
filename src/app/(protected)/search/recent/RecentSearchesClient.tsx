'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useLanguage } from '@/context/LanguageContext'
import { RecentSearchList } from '@/components/search/RecentSearchList'
import { Button } from '@/components/ui/button'
import {
  clearRecentSearches,
  loadRecentSearches,
  type RecentSearchItem,
} from '@/lib/recentSearches'

export default function RecentSearchesClient() {
  const router = useRouter()
  const { t } = useLanguage()
  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>([])

  useEffect(() => {
    setRecentSearches(loadRecentSearches())
  }, [])

  const handleItemClick = (item: RecentSearchItem) => {
    router.push(`/search?q=${encodeURIComponent(item.query)}`)
  }

  const handleClearAll = () => {
    clearRecentSearches()
    setRecentSearches([])
  }

  return (
    <div className="flex flex-1 flex-col min-h-0 overflow-hidden bg-background">
      <div
        data-main-scroll
        className="relative z-0 min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pt-6 pb-24 sm:p-6 lg:px-0 lg:py-8 lg:pb-10"
      >
      <div className="mx-auto max-w-7xl lg:mx-0 lg:max-w-none">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3 min-w-0">
            <Button asChild variant="ghost" size="icon" className="shrink-0 rounded-lg">
              <Link href="/search" aria-label={t('common.back')}>
                <ArrowLeftIcon className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-lg sm:text-xl font-semibold text-foreground truncate">
              {t('search.recentSearches')}
            </h1>
          </div>
          {recentSearches.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="shrink-0 text-muted-foreground hover:text-destructive"
            >
              {t('search.clearRecent')}
            </Button>
          )}
        </div>

        {recentSearches.length > 0 ? (
          <RecentSearchList items={recentSearches} onItemClick={handleItemClick} />
        ) : (
          <div className="text-center py-16 rounded-2xl bg-card border border-border">
            <p className="text-muted-foreground mb-4">{t('search.noRecentSearches')}</p>
            <Button asChild>
              <Link href="/search">{t('search.startSearching')}</Link>
            </Button>
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
