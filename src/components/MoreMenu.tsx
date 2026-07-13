'use client'

import { useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { BottomSheetDippedTop } from '@/components/ui/BottomSheetDippedTop'
import {
  CloudArrowDownIcon,
  TrophyIcon,
  ChevronRightIcon,
  PencilSquareIcon,
  UserGroupIcon,
  FolderPlusIcon,
} from '@heroicons/react/24/outline'
import { useLanguage } from '@/context/LanguageContext'
import { useFoldersContext } from '@/context/FoldersContext'
import ManualEntryForm from './ManualEntryForm'
import PlaylistImporter from './PlaylistImporter'

interface MoreMenuProps {
  isOpen: boolean
  onClose: () => void
}

type MoreView = 'menu' | 'manual' | 'import'

function MenuNavItem({
  icon,
  iconBg,
  title,
  description,
  onClick,
}: {
  icon: ReactNode
  iconBg: string
  title: string
  description?: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl border border-black/[0.06] dark:border-white/[0.08] hover:bg-muted/50 dark:hover:bg-white/[0.04] transition-colors text-start"
    >
      <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-foreground text-sm">{title}</div>
        {description && (
          <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
        )}
      </div>
      <ChevronRightIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
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
    <>
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        overlayClassName="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:duration-500 data-[state=open]:duration-500 backdrop-blur-sm"
        className="!bottom-0 z-[60] flex max-h-[85vh] flex-col gap-0 overflow-visible rounded-t-[1.75rem] border-0 border-t-0 bg-transparent p-0 shadow-none"
      >
        <BottomSheetDippedTop onClose={handleClose} hideBorder />

        <div className="-mt-px overflow-hidden bg-background">
          <div className="px-6 pb-6">
          <SheetHeader className=" pb-2 pt-1">
            <SheetTitle className="text-center text-lg">{t('navigation.more')}</SheetTitle>
          </SheetHeader>

          <div className="mt-4">
          {currentView === 'menu' && (
            <div className="space-y-2 pb-2">
              <MenuNavItem
                icon={<UserGroupIcon className="h-5 w-5 text-sky-600 dark:text-sky-400" />}
                iconBg="bg-sky-100 dark:bg-sky-900/40"
                title={t('navigation.friends')}
                description={t('friends.moreMenuDescription')}
                onClick={() => navigate('/friends')}
              />

              <MenuNavItem
                icon={<TrophyIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />}
                iconBg="bg-yellow-100 dark:bg-yellow-900/40"
                title={t('navigation.leaderboard')}
                onClick={() => navigate('/leaderboard')}
              />

              <div className="pt-2 pb-1">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide px-1">
                  {t('moreMenu.addContent')}
                </p>
              </div>

              <MenuNavItem
                icon={<FolderPlusIcon className="h-5 w-5 text-violet-600 dark:text-violet-400" />}
                iconBg="bg-violet-100 dark:bg-violet-900/40"
                title={t('createMenu.createFolder')}
                description={t('createMenu.createFolderDescription')}
                onClick={() => navigate('/folders/new')}
              />
              <MenuNavItem
                icon={<PencilSquareIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />}
                iconBg="bg-indigo-100 dark:bg-indigo-900/40"
                title={t('createMenu.manualEntry')}
                description={t('createMenu.manualEntryDescription')}
                onClick={() => setCurrentView('manual')}
              />
              <MenuNavItem
                icon={<CloudArrowDownIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />}
                iconBg="bg-orange-100 dark:bg-orange-900/40"
                title={t('createMenu.importUltimateGuitar')}
                description={t('createMenu.importUltimateGuitarDescription')}
                onClick={() => setCurrentView('import')}
              />
            </div>
          )}

          {currentView === 'manual' && (
            <div className="space-y-4">
              <button
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
                onClick={() => setCurrentView('menu')}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <span>←</span> {t('createMenu.back')}
              </button>
              <div className="max-h-[70vh] overflow-y-auto">
                <PlaylistImporter onImportComplete={handleImportComplete} />
              </div>
            </div>
          )}
          </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
    </>
  )
}
