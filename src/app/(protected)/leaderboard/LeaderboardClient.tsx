'use client'

import { useState, useMemo } from 'react'
import type { LeaderboardEntry } from '@/types'
import Leaderboard from '@/components/gamification/Leaderboard'
import { useLanguage } from '@/context/LanguageContext'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

interface LeaderboardClientProps {
  initialLeaderboard: LeaderboardEntry[]
  currentUserId?: string
}

export default function LeaderboardClient({ initialLeaderboard, currentUserId }: LeaderboardClientProps) {
  const { t } = useLanguage()
  const [searchQuery, setSearchQuery] = useState('')

  // Filter leaderboard entries based on search query
  const filteredLeaderboard = useMemo(() => {
    if (!searchQuery.trim()) {
      return initialLeaderboard
    }

    const query = searchQuery.toLowerCase().trim()
    return initialLeaderboard.filter((entry) => {
      const fullName = entry.fullName?.toLowerCase() || ''
      const email = entry.email.toLowerCase()
      return fullName.includes(query) || email.includes(query)
    })
  }, [initialLeaderboard, searchQuery])

  return (
    <div className="flex flex-1 flex-col min-h-0 overflow-hidden bg-background">
      <div
        data-main-scroll
        className="relative z-0 min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
    <div className="container mx-auto max-w-4xl px-4 py-4 sm:py-6 lg:py-8">
      <div className="mb-4 sm:mb-6">
        <h1 className="mb-2 hidden text-2xl font-bold text-foreground lg:block">
          {t('leaderboard.title')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('leaderboard.description')}
        </p>
      </div>

      {/* Search bar */}
      <div className="mb-4">
        <div className="relative">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('leaderboard.searchPlaceholder')}
            className="block w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 sm:text-base"
          />
        </div>
        {searchQuery && (
          <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
            {t('leaderboard.resultsCount').replace('{count}', String(filteredLeaderboard.length))}
          </p>
        )}
      </div>

      <Leaderboard 
        entries={filteredLeaderboard}
        currentUserId={currentUserId}
      />
    </div>
      </div>
    </div>
  )
}
