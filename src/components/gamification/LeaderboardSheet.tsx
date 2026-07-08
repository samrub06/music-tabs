'use client'

import { useEffect, useState } from 'react'
import type { LeaderboardEntry, LeaderboardSheetData } from '@/types'
import { getLeaderboardSheetAction } from '@/app/(protected)/gamification/actions'
import { useLanguage } from '@/context/LanguageContext'
import LevelProgressBar from './LevelProgressBar'
import LeaderboardUserDialog from './LeaderboardUserDialog'
import { BottomSheetDippedTop } from '@/components/ui/BottomSheetDippedTop'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

interface LeaderboardSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function getRankLabel(rank: number) {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return `#${rank}`
}

export default function LeaderboardSheet({ open, onOpenChange }: LeaderboardSheetProps) {
  const { t } = useLanguage()
  const [data, setData] = useState<LeaderboardSheetData | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<LeaderboardEntry | null>(null)

  useEffect(() => {
    if (!open) return

    let cancelled = false
    setLoading(true)

    getLeaderboardSheetAction()
      .then((result) => {
        if (!cancelled) {
          setData(result)
        }
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [open])

  useEffect(() => {
    if (!open) setSelectedEntry(null)
  }, [open])

  const handleClose = () => onOpenChange(false)
  const currentUserId = data?.currentUser?.userId

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          overlayClassName="backdrop-blur-sm"
          className="!bottom-0 z-[60] flex max-h-[85vh] flex-col gap-0 overflow-visible rounded-t-[1.75rem] border-0 border-t-0 bg-transparent p-0 shadow-none"
        >
          <BottomSheetDippedTop onClose={handleClose} hideBorder />

          <div className="flex max-h-[calc(85vh-2rem)] min-h-0 flex-1 flex-col overflow-hidden bg-background">
            <div className="flex min-h-0 flex-1 flex-col px-4 pb-6 sm:px-6">
              <SheetHeader className="pb-3 pt-1">
                <SheetTitle className="text-center text-lg">
                  {t('leaderboard.title')}
                </SheetTitle>
              </SheetHeader>

              {loading ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  {t('gamification.LOADING_STATS')}
                </div>
              ) : data?.currentUser ? (
                <>
                  <div className="mb-4 rounded-2xl border border-black/[0.06] bg-muted/40 p-4 dark:border-white/[0.08]">
                    <div className="mb-3 grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p className="text-[11px] font-medium text-muted-foreground">
                          {t('gamification.LEVEL')}
                        </p>
                        <p className="text-xl font-bold tabular-nums text-foreground">
                          {data.currentUser.currentLevel}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-medium text-muted-foreground">
                          {t('leaderboard.songsColumn')}
                        </p>
                        <p className="text-xl font-bold tabular-nums text-foreground">
                          {data.currentUser.songCount}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-medium text-muted-foreground">
                          {t('leaderboard.yourRank')}
                        </p>
                        <p className="text-xl font-bold tabular-nums text-foreground">
                          {data.currentUser.rank ? `#${data.currentUser.rank}` : '—'}
                        </p>
                      </div>
                    </div>
                    <LevelProgressBar
                      currentXp={data.currentUser.totalXp}
                      currentLevel={data.currentUser.currentLevel}
                    />
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-2xl border border-black/[0.06] dark:border-white/[0.08]">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
                        <tr className="border-b border-border text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          <th className="px-3 py-2.5">{t('leaderboard.rankColumn')}</th>
                          <th className="px-3 py-2.5">{t('leaderboard.playerColumn')}</th>
                          <th className="hidden px-3 py-2.5 sm:table-cell">{t('leaderboard.levelColumn')}</th>
                          <th className="px-3 py-2.5 text-right">{t('leaderboard.xpColumn')}</th>
                          <th className="px-3 py-2.5 text-right">{t('leaderboard.songsColumn')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.entries.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                              {t('gamification.EMPTY_LEADERBOARD')}
                            </td>
                          </tr>
                        ) : (
                          data.entries.map((entry) => {
                            const isCurrentUser = entry.userId === currentUserId

                            return (
                              <tr
                                key={entry.userId}
                                role="button"
                                tabIndex={0}
                                onClick={() => setSelectedEntry(entry)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault()
                                    setSelectedEntry(entry)
                                  }
                                }}
                                className={cn(
                                  'cursor-pointer border-b border-border/60 last:border-0 transition-colors hover:bg-muted/50',
                                  isCurrentUser && 'bg-primary/10'
                                )}
                              >
                                <td className="px-3 py-2.5 font-semibold tabular-nums text-foreground">
                                  {getRankLabel(entry.rank)}
                                </td>
                                <td className="px-3 py-2.5">
                                  <div className="flex min-w-0 items-center gap-2">
                                    {entry.avatarUrl ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={entry.avatarUrl}
                                        alt=""
                                        className="h-7 w-7 shrink-0 rounded-full object-cover"
                                      />
                                    ) : (
                                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                                        {((entry.fullName || entry.email || 'U')[0] || 'U').toUpperCase()}
                                      </div>
                                    )}
                                    <div className="min-w-0">
                                      <p className="truncate font-medium text-foreground">
                                        {entry.fullName || entry.email || t('gamification.UNKNOWN_USER')}
                                      </p>
                                      {isCurrentUser && (
                                        <p className="text-[11px] text-primary">{t('gamification.YOU_BADGE')}</p>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="hidden px-3 py-2.5 tabular-nums text-muted-foreground sm:table-cell">
                                  {entry.currentLevel}
                                </td>
                                <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                                  {entry.totalXp.toLocaleString()}
                                </td>
                                <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                                  {entry.songCount}
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  {t('gamification.EMPTY_LEADERBOARD')}
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <LeaderboardUserDialog
        entry={selectedEntry}
        open={!!selectedEntry}
        onOpenChange={(dialogOpen) => {
          if (!dialogOpen) setSelectedEntry(null)
        }}
        isCurrentUser={!!selectedEntry && selectedEntry.userId === currentUserId}
      />
    </>
  )
}
