'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  CloudArrowDownIcon,
  TrophyIcon,
  PencilSquareIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'
import { useLanguage } from '@/context/LanguageContext'
import { useFoldersContext } from '@/context/FoldersContext'
import ManualEntryForm from './ManualEntryForm'
import PlaylistImporter from './PlaylistImporter'
import { cn } from '@/lib/utils'

interface MoreMenuProps {
  isOpen: boolean
  onClose: () => void
}

type MoreView = 'menu' | 'manual' | 'import'

function CreateOptionButton({
  icon,
  iconBg,
  title,
  onClick,
}: {
  icon: React.ReactNode
  iconBg: string
  title: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-black/[0.06] bg-card p-4 text-center transition-colors hover:bg-muted/50 dark:border-white/[0.08] dark:hover:bg-white/[0.04]"
    >
      <div
        className={cn(
          'flex h-11 w-11 items-center justify-center rounded-xl',
          iconBg
        )}
      >
        {icon}
      </div>
      <span className="text-sm font-medium text-foreground">{title}</span>
    </button>
  )
}

export default function MoreMenu({ isOpen, onClose }: MoreMenuProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const { folders } = useFoldersContext()
  const [currentView, setCurrentView] = useState<MoreView>('menu')

  const handleClose = () => {
    setCurrentView('menu')
    onClose()
  }

  const navigate = (path: string) => {
    handleClose()
    router.push(path)
  }

  const handleManualEntrySuccess = () => {
    handleClose()
    router.refresh()
  }

  const handleImportComplete = () => {
    handleClose()
    router.refresh()
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        overlayClassName="backdrop-blur-sm"
        className="z-[60] flex max-h-[85vh] flex-col gap-0 overflow-hidden rounded-t-[1.75rem] border-0 bg-background p-0 shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.12)] dark:shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.4)]"
      >
        <div className="mx-3 mt-2 flex shrink-0 justify-center">
          <div className="h-1 w-14 rounded-full bg-muted-foreground/25" />
        </div>

        <div className="flex min-h-0 flex-1 flex-col px-4 pb-4 pt-3">
          <SheetHeader className="shrink-0 pb-3">
            <SheetTitle className="text-center text-lg">
              {t('navigation.more')}
            </SheetTitle>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {currentView === 'menu' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => navigate('/friends')}
                    className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-black/[0.06] bg-card p-4 text-center transition-colors hover:bg-muted/50 dark:border-white/[0.08] dark:hover:bg-white/[0.04]"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-900/40">
                      <UserGroupIcon className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {t('navigation.friends')}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/leaderboard')}
                    className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-black/[0.06] bg-card p-4 text-center transition-colors hover:bg-muted/50 dark:border-white/[0.08] dark:hover:bg-white/[0.04]"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-100 dark:bg-yellow-900/40">
                      <TrophyIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {t('navigation.leaderboard')}
                    </span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <CreateOptionButton
                    icon={
                      <PencilSquareIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    }
                    iconBg="bg-indigo-100 dark:bg-indigo-900/40"
                    title={t('createMenu.manualEntryShort')}
                    onClick={() => setCurrentView('manual')}
                  />
                  <CreateOptionButton
                    icon={
                      <CloudArrowDownIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    }
                    iconBg="bg-orange-100 dark:bg-orange-900/40"
                    title={t('createMenu.importShort')}
                    onClick={() => setCurrentView('import')}
                  />
                </div>
              </div>
            )}

            {currentView === 'manual' && (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setCurrentView('menu')}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  <span>←</span> {t('createMenu.back')}
                </button>
                <ManualEntryForm
                  folders={folders}
                  onClose={() => setCurrentView('menu')}
                  onSuccess={handleManualEntrySuccess}
                />
              </div>
            )}

            {currentView === 'import' && (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setCurrentView('menu')}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  <span>←</span> {t('createMenu.back')}
                </button>
                <div className="max-h-[55vh] overflow-y-auto">
                  <PlaylistImporter onImportComplete={handleImportComplete} />
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="mt-4 h-11 w-full shrink-0 rounded-xl border border-border bg-muted/50 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            {t('common.close')}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
