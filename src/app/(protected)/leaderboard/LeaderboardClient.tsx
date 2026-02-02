'use client'

import { useState, useEffect } from 'react'
import type { LeaderboardEntry } from '@/types'
import Leaderboard from '@/components/gamification/Leaderboard'
import { getLeaderboardAction } from '@/app/(protected)/gamification/actions'
import { useLanguage } from '@/context/LanguageContext'

interface LeaderboardClientProps {
  initialLeaderboard: LeaderboardEntry[]
  currentUserId?: string
}

export default function LeaderboardClient({ initialLeaderboard, currentUserId }: LeaderboardClientProps) {
  const { t } = useLanguage()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(initialLeaderboard)
  const [loading, setLoading] = useState(false)

  const refreshLeaderboard = async () => {
    setLoading(true)
    try {
      const updated = await getLeaderboardAction(100)
      setLeaderboard(updated)
    } catch (error) {
      console.error('Error refreshing leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Refresh leaderboard periodically (every 5 minutes)
    const interval = setInterval(refreshLeaderboard, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Leaderboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Top players ranked by total XP
        </p>
      </div>

      <div className="mb-4 flex justify-end">
        <button
          onClick={refreshLeaderboard}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <Leaderboard 
        entries={leaderboard}
        currentUserId={currentUserId}
      />
    </div>
  )
}
