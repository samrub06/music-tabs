'use client'

import { useEffect, useMemo, useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useLanguage } from '@/context/LanguageContext'
import { addFolderAction } from '@/app/(protected)/dashboard/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PlaylistCoverPicker } from '@/components/PlaylistCoverPicker'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { Folder } from '@/types'
import { resolveAutoCoverSlug } from '@/utils/playlistCover'
import { cn } from '@/lib/utils'

function normalizeFolderName(name: string): string {
  return name.trim().toLowerCase()
}

interface CreateFolderSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingNames: string[]
  onCreated?: (folder: Folder) => void
}

/** Bottom sheet to quickly create a personal playlist (name + cover). */
export function CreateFolderSheet({
  open,
  onOpenChange,
  existingNames,
  onCreated,
}: CreateFolderSheetProps) {
  const { t } = useLanguage()
  const [name, setName] = useState('')
  const [coverSlug, setCoverSlug] = useState<string | null>(null)
  const [coverTouched, setCoverTouched] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const existingNameSet = useMemo(
    () => new Set(existingNames.map(normalizeFolderName).filter(Boolean)),
    [existingNames]
  )

  const trimmedName = name.trim()
  const isDuplicate =
    trimmedName.length > 0 && existingNameSet.has(normalizeFolderName(trimmedName))

  useEffect(() => {
    if (!open) {
      setName('')
      setCoverSlug(null)
      setCoverTouched(false)
      setError(null)
      setIsCreating(false)
    }
  }, [open])

  useEffect(() => {
    if (!open || coverTouched) return
    const auto = resolveAutoCoverSlug({ name: trimmedName })
    if (auto) setCoverSlug(auto)
  }, [open, trimmedName, coverTouched])

  const handleCreate = async () => {
    if (!trimmedName || isCreating || isDuplicate) return
    setIsCreating(true)
    setError(null)
    try {
      const created = await addFolderAction(trimmedName, coverSlug ?? undefined)
      onOpenChange(false)
      onCreated?.(created)
    } catch (err) {
      console.error('Error creating playlist:', err)
      const message = err instanceof Error ? err.message : String(err)
      setError(
        message.includes('FOLDER_NAME_EXISTS') || message.toLowerCase().includes('exist')
          ? t('folders.nameExists')
          : t('folders.createError')
      )
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        overlayClassName="bg-black/35 dark:bg-black/50"
        className="flex h-auto max-h-[min(85vh,640px)] flex-col gap-0 overflow-hidden rounded-t-[1.75rem] border border-b-0 border-black/[0.06] bg-background/95 p-0 shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.12)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-background/98 dark:shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.4)]"
      >
        <div className="flex shrink-0 items-center px-4 py-1.5">
          <div className="flex-1" aria-hidden />
          <div className="h-1 w-14 shrink-0 touch-none rounded-full bg-muted-foreground/25" />
          <div className="flex flex-1 justify-end">
            <SheetClose
              className="flex min-h-[24px] min-w-[24px] items-center justify-center rounded-sm opacity-70"
              disabled={isCreating}
            >
              <XMarkIcon className="h-5 w-5" />
              <span className="sr-only">{t('common.close')}</span>
            </SheetClose>
          </div>
        </div>

        <SheetHeader className="shrink-0 space-y-1 px-5 pb-2 text-start">
          <SheetTitle className="text-xl font-semibold">{t('folders.newFolder')}</SheetTitle>
          <p className="text-sm text-muted-foreground">{t('folders.newFolderDescription')}</p>
        </SheetHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 pb-3">
          <div className="space-y-2">
            <Label
              htmlFor="create-folder-name"
              className="block text-[11px] font-medium text-muted-foreground"
            >
              {t('createMenu.folderName')}
            </Label>
            <Input
              id="create-folder-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('folders.folderNamePlaceholder')}
              className={cn(
                'h-11 rounded-xl',
                isDuplicate && 'border-destructive focus-visible:ring-destructive/30'
              )}
              disabled={isCreating}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleCreate()
              }}
            />
            {isDuplicate ? (
              <p className="text-xs text-destructive">{t('folders.nameExists')}</p>
            ) : null}
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
          </div>

          <PlaylistCoverPicker
            value={coverSlug}
            onChange={(slug) => {
              setCoverTouched(true)
              setCoverSlug(slug)
            }}
            disabled={isCreating}
          />
        </div>

        <SheetFooter className="safe-area-inset-bottom flex shrink-0 flex-row gap-3 border-t border-black/[0.06] px-5 py-3 pb-6 dark:border-white/[0.08]">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
            className="h-10 min-h-[44px] flex-1 rounded-xl font-medium"
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            onClick={() => void handleCreate()}
            disabled={isCreating || !trimmedName || isDuplicate}
            className="h-10 min-h-[44px] flex-1 rounded-xl font-medium"
          >
            {isCreating ? t('common.saving') : t('common.create')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
