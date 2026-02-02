'use client'

import type { LeaderboardEntry } from '@/types'
import { TrophyIcon } from '@heroicons/react/24/solid'

interface LeaderboardProps {
  entries: LeaderboardEntry[]
  currentUserId?: string
  className?: string
}

export default function Leaderboard({ entries, currentUserId, className = '' }: LeaderboardProps) {
  if (entries.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 dark:text-gray-400 ${className}`}>
        <p>No users on the leaderboard yet. Be the first!</p>
      </div>
    )
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return null
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {entries.map((entry) => {
        const isCurrentUser = entry.userId === currentUserId
        const rankIcon = getRankIcon(entry.rank)

        return (
          <div
            key={entry.userId}
            className={`
              flex items-center gap-4 p-4 rounded-lg border-2 transition-all
              ${isCurrentUser
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }
            `}
          >
            <div className="flex-shrink-0 w-12 text-center">
              {rankIcon ? (
                <span className="text-2xl">{rankIcon}</span>
              ) : (
                <span className="text-lg font-bold text-gray-600 dark:text-gray-400">
                  #{entry.rank}
                </span>
              )}
            </div>

            <div className="flex-shrink-0">
              {entry.avatarUrl ? (
                <img
                  src={entry.avatarUrl}
                  alt={entry.fullName || entry.email}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                    {(entry.fullName || entry.email)[0].toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                {entry.fullName || entry.email}
                {isCurrentUser && (
                  <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(You)</span>
                )}
              </p>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Level {entry.currentLevel}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {entry.totalXp.toLocaleString()} XP
                </span>
                {entry.currentStreak > 0 && (
                  <span className="text-sm text-orange-600 dark:text-orange-400">
                    🔥 {entry.currentStreak}
                  </span>
                )}
              </div>
            </div>

            {entry.badges.length > 0 && (
              <div className="flex-shrink-0 flex items-center gap-1">
                <TrophyIcon className="w-5 h-5 text-yellow-500" />
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                  {entry.badges.length}
                </span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
