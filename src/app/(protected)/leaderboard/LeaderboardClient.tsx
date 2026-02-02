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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {t('leaderboard.title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t('leaderboard.description')}
        </p>
      </div>

      {/* Search bar */}
      <div className="mb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('leaderboard.searchPlaceholder')}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        {searchQuery && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {t('leaderboard.resultsCount', { count: filteredLeaderboard.length })}
          </p>
        )}
      </div>

      <Leaderboard 
        entries={filteredLeaderboard}
        currentUserId={currentUserId}
      />
    </div>
  )
}
