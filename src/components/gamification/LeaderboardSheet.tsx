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
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
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
          <BottomSheetDippedTop hideBorder showClose={false} />

          <div className="flex max-h-[calc(85vh-2rem)] min-h-0 flex-1 flex-col overflow-hidden bg-background">
            <div className="flex min-h-0 flex-1 flex-col px-4 pb-3 sm:px-6">
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

                  <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain">
                    {data.entries.length === 0 ? (
                      <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                        {t('gamification.EMPTY_LEADERBOARD')}
                      </p>
                    ) : (
                      data.entries.map((entry) => {
                        const isCurrentUser = entry.userId === currentUserId

                        return (
                          <button
                            key={entry.userId}
                            type="button"
                            onClick={() => setSelectedEntry(entry)}
                            className={cn(
                              'flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors',
                              isCurrentUser
                                ? 'border-primary bg-primary/10'
                                : 'border-black/[0.06] bg-card hover:bg-muted/40 dark:border-white/[0.08]'
                            )}
                          >
                            <div className="w-8 shrink-0 text-center text-sm font-bold tabular-nums text-muted-foreground">
                              {getRankLabel(entry.rank)}
                            </div>

                            {entry.avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={entry.avatarUrl}
                                alt=""
                                className="h-9 w-9 shrink-0 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                                {((entry.fullName || entry.email || 'U')[0] || 'U').toUpperCase()}
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-foreground">
                                {entry.fullName || entry.email || t('gamification.UNKNOWN_USER')}
                                {isCurrentUser && (
                                  <span className="ms-1.5 text-[11px] font-medium text-primary">
                                    {t('gamification.YOU_BADGE')}
                                  </span>
                                )}
                              </p>
                              <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                                <span>
                                  {t('gamification.LEVEL_WITH_NUMBER').replace(
                                    '{level}',
                                    String(entry.currentLevel)
                                  )}
                                </span>
                                <span className="tabular-nums">
                                  {entry.totalXp.toLocaleString()} {t('gamification.XP')}
                                </span>
                                <span className="tabular-nums">
                                  🎵 {entry.songCount}
                                </span>
                              </div>
                            </div>
                          </button>
                        )
                      })
                    )}
                  </div>
                </>
              ) : (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  {t('gamification.EMPTY_LEADERBOARD')}
                </div>
              )}

              <div className="shrink-0 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <SheetClose asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 w-full rounded-xl"
                    onClick={handleClose}
                  >
                    {t('common.close')}
                  </Button>
                </SheetClose>
              </div>
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
