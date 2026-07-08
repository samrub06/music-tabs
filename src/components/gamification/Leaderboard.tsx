'use client'

import { useState } from 'react'
import type { LeaderboardEntry } from '@/types'
import { TrophyIcon } from '@heroicons/react/24/solid'
import { useLanguage } from '@/context/LanguageContext'
import LeaderboardUserDialog from './LeaderboardUserDialog'
import { cn } from '@/lib/utils'

interface LeaderboardProps {
  entries: LeaderboardEntry[]
  currentUserId?: string
  className?: string
}

export default function Leaderboard({ entries, currentUserId, className = '' }: LeaderboardProps) {
  const { t } = useLanguage()
  const [selectedEntry, setSelectedEntry] = useState<LeaderboardEntry | null>(null)

  if (entries.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 dark:text-gray-400 ${className}`}>
        <p>{t('gamification.EMPTY_LEADERBOARD')}</p>
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
    <>
      <div className={`space-y-2 ${className}`}>
        {entries.map((entry) => {
          const isCurrentUser = entry.userId === currentUserId
          const rankIcon = getRankIcon(entry.rank)

          return (
            <button
              key={entry.userId}
              type="button"
              onClick={() => setSelectedEntry(entry)}
              className={cn(
                'flex w-full items-start gap-2 rounded-2xl border p-3 text-left transition-all sm:items-center sm:gap-3 sm:p-4',
                isCurrentUser
                  ? 'border-primary bg-primary/10'
                  : 'border-black/[0.06] bg-card hover:bg-muted/40 dark:border-white/[0.08]'
              )}
            >
              <div className="w-8 shrink-0 pt-0.5 text-center sm:w-10 sm:pt-0">
                {rankIcon ? (
                  <span className="text-xl sm:text-2xl">{rankIcon}</span>
                ) : (
                  <span className="text-sm font-bold tabular-nums text-muted-foreground sm:text-base">
                    #{entry.rank}
                  </span>
                )}
              </div>

              <div className="shrink-0">
                {entry.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={entry.avatarUrl}
                    alt={entry.fullName || entry.email || 'User'}
                    className="h-8 w-8 rounded-full object-cover sm:h-10 sm:w-10"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted sm:h-10 sm:w-10">
                    <span className="text-xs font-semibold text-muted-foreground sm:text-sm">
                      {((entry.fullName || entry.email || 'U')[0] || 'U').toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <p className="min-w-0 truncate text-sm font-semibold text-foreground sm:text-base">
                    {entry.fullName || entry.email || t('gamification.UNKNOWN_USER')}
                    {isCurrentUser && (
                      <span className="ml-1.5 text-[11px] font-medium text-primary sm:ml-2 sm:text-xs">
                        {t('gamification.YOU_BADGE')}
                      </span>
                    )}
                  </p>
                  {entry.badges.length > 0 && (
                    <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
                      <TrophyIcon className="h-4 w-4 text-yellow-500 sm:h-5 sm:w-5" />
                      <span className="text-xs font-semibold tabular-nums text-muted-foreground sm:text-sm">
                        {entry.badges.length}
                      </span>
                    </div>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground sm:gap-x-4 sm:text-sm">
                  <span>
                    {t('gamification.LEVEL_WITH_NUMBER').replace('{level}', String(entry.currentLevel))}
                  </span>
                  <span className="tabular-nums">
                    {entry.totalXp.toLocaleString()} {t('gamification.XP')}
                  </span>
                  {entry.currentStreak > 0 && (
                    <span className="text-orange-600 dark:text-orange-400">
                      🔥 {entry.currentStreak}
                    </span>
                  )}
                  <span>
                    🎵 {entry.songCount}{' '}
                    {entry.songCount === 1 ? t('songs.songCount') : t('songs.songCountPlural')}
                  </span>
                  <span>
                    📋 {entry.playlistCount}{' '}
                    {entry.playlistCount === 1 ? t('leaderboard.playlist') : t('leaderboard.playlists')}
                  </span>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <LeaderboardUserDialog
        entry={selectedEntry}
        open={!!selectedEntry}
        onOpenChange={(open) => {
          if (!open) setSelectedEntry(null)
        }}
        isCurrentUser={!!selectedEntry && selectedEntry.userId === currentUserId}
      />
    </>
  )
}
