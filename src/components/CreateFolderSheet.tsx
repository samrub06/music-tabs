'use client'

import { useEffect, useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useLanguage } from '@/context/LanguageContext'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetClose } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PlaylistCoverPicker } from '@/components/PlaylistCoverPicker'
import { resolveAutoCoverSlug } from '@/utils/playlistCover'

interface CreateFolderSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (name: string, coverSlug?: string) => Promise<void>
}

export function CreateFolderSheet({
  open,
  onOpenChange,
  onCreate,
}: CreateFolderSheetProps) {
  const { t } = useLanguage()
  const [name, setName] = useState('')
  const [coverSlug, setCoverSlug] = useState<string | null>(null)
  const [coverTouched, setCoverTouched] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    if (!open) {
      setName('')
      setCoverSlug(null)
      setCoverTouched(false)
      setIsCreating(false)
    }
  }, [open])

  useEffect(() => {
    if (coverTouched) return
    const auto = resolveAutoCoverSlug({ name })
    if (auto) setCoverSlug(auto)
  }, [name, coverTouched])

  const handleClose = () => {
    if (isCreating) return
    onOpenChange(false)
  }

  const handleCreate = async () => {
    const trimmed = name.trim()
    if (!trimmed || isCreating) return
    setIsCreating(true)
    try {
      await onCreate(trimmed, coverSlug ?? undefined)
      setIsCreating(false)
      onOpenChange(false)
    } catch (error) {
      console.error('Error creating folder:', error)
      setIsCreating(false)
      throw error
    }
  }

  return (
    <Sheet open={open} onOpenChange={(next) => !next && handleClose()}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="max-h-[90vh] !bottom-0 flex flex-col gap-0 overflow-hidden rounded-t-[1.75rem] border border-b-0 border-black/[0.06] dark:border-white/[0.08] bg-background/95 dark:bg-background/98 backdrop-blur-xl p-6 pt-0 shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.12)] dark:shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.4)]"
      >
        <div className="shrink-0 flex items-center py-1.5 -mt-1">
          <div className="flex-1" aria-hidden />
          <div className="w-14 h-1 rounded-full bg-muted-foreground/25 cursor-ns-resize touch-none shrink-0" />
          <div className="flex flex-1 justify-end">
            <SheetClose
              className="flex min-w-[24px] min-h-[24px] items-center justify-center rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
              disabled={isCreating}
            >
              <XMarkIcon className="h-5 w-5" />
              <span className="sr-only">{t('common.close')}</span>
            </SheetClose>
          </div>
        </div>

        <SheetHeader className="shrink-0 px-1 pb-2">
          <SheetTitle className="text-xl font-semibold">{t('folders.newFolder')}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-1 pb-4 space-y-4">
          <div className="rounded-2xl bg-muted/50 dark:bg-muted/30 border border-black/[0.06] dark:border-white/[0.08] p-3.5">
            <Label
              htmlFor="create-folder-name"
              className="text-[11px] font-medium text-muted-foreground mb-2.5 block"
            >
              {t('sidebar.folderName')}
            </Label>
            <Input
              id="create-folder-name"
              type="text"
              placeholder={t('folders.folderNamePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleCreate()
                if (e.key === 'Escape') handleClose()
              }}
              className="h-10 rounded-xl"
              autoFocus
              disabled={isCreating}
            />
          </div>

          <div className="rounded-2xl bg-muted/50 dark:bg-muted/30 border border-black/[0.06] dark:border-white/[0.08] p-3.5">
            <PlaylistCoverPicker
              value={coverSlug}
              onChange={(slug) => {
                setCoverTouched(true)
                setCoverSlug(slug)
              }}
              disabled={isCreating}
            />
          </div>
        </div>

        <SheetFooter className="shrink-0 flex flex-row gap-3 px-6 py-4 pt-4 pb-8 border-t border-black/[0.06] dark:border-white/[0.08] bg-background safe-area-inset-bottom">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isCreating}
            className="flex-1 h-10 rounded-xl font-medium min-h-[44px] sm:flex-initial"
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={() => void handleCreate()}
            disabled={isCreating || !name.trim()}
            className="flex-1 h-10 rounded-xl font-medium min-h-[44px] sm:flex-initial"
          >
            {isCreating ? t('createMenu.creating') : t('common.create')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
