'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { BottomSheetDippedTop } from '@/components/ui/BottomSheetDippedTop'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PlaylistCoverPicker } from '@/components/PlaylistCoverPicker'
import {
  getPlaylistCoverOptions,
  resolveAutoCoverSlug,
} from '@/utils/playlistCover'
import { cn } from '@/lib/utils'

interface CreateFolderSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (name: string, coverSlug?: string) => Promise<void>
  existingNames?: string[]
}

function normalizeFolderName(name: string): string {
  return name.trim().toLowerCase()
}

export function CreateFolderSheet({
  open,
  onOpenChange,
  onCreate,
  existingNames = [],
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

  const selectedCover = useMemo(() => {
    if (!coverSlug) return null
    return getPlaylistCoverOptions().find((option) => option.slug === coverSlug) ?? null
  }, [coverSlug])

  useEffect(() => {
    if (!open) {
      setName('')
      setCoverSlug(null)
      setCoverTouched(false)
      setIsCreating(false)
      setError(null)
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
    if (!trimmedName || isCreating || isDuplicate) return
    setIsCreating(true)
    setError(null)
    try {
      await onCreate(trimmedName, coverSlug ?? undefined)
      setIsCreating(false)
      onOpenChange(false)
    } catch (err) {
      console.error('Error creating folder:', err)
      const message = err instanceof Error ? err.message : ''
      setError(
        message === 'FOLDER_NAME_EXISTS'
          ? t('folders.nameExists')
          : t('folders.createError')
      )
      setIsCreating(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(next) => !next && handleClose()}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="!bottom-0 z-[60] flex max-h-[90vh] flex-col gap-0 overflow-visible rounded-t-[1.75rem] border-0 border-t-0 bg-transparent p-0 shadow-none"
      >
        <BottomSheetDippedTop onClose={handleClose} hideBorder />

        <div className="-mt-px flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
          <SheetHeader className="shrink-0 space-y-1 px-6 pb-3 pt-1 text-start">
            <SheetTitle className="text-xl font-semibold tracking-tight">
              {t('folders.newFolder')}
            </SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground">
              {t('folders.newFolderDescription')}
            </SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-6 pb-4">
            <div className="rounded-2xl border border-black/[0.06] bg-white/70 p-3.5 dark:border-white/[0.08] dark:bg-white/[0.06]">
              <Label
                htmlFor="create-folder-name"
                className="mb-2.5 block text-[11px] font-medium text-muted-foreground"
              >
                {t('createMenu.folderName')}
              </Label>
              <Input
                id="create-folder-name"
                type="text"
                placeholder={t('createMenu.folderNamePlaceholder')}
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (error) setError(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleCreate()
                  if (e.key === 'Escape') handleClose()
                }}
                className={cn(
                  'h-11 rounded-xl',
                  (isDuplicate || error) &&
                    'border-destructive focus-visible:ring-destructive/30'
                )}
                autoFocus
                disabled={isCreating}
                aria-invalid={isDuplicate || Boolean(error)}
                aria-describedby={
                  isDuplicate || error ? 'create-folder-name-error' : undefined
                }
              />
              {(isDuplicate || error) && (
                <p
                  id="create-folder-name-error"
                  className="mt-2 text-sm text-destructive"
                  role="alert"
                >
                  {error ?? t('folders.nameExists')}
                </p>
              )}
            </div>

            {selectedCover && (
              <div className="overflow-hidden rounded-2xl border border-black/[0.06] dark:border-white/[0.08]">
                <div className="relative aspect-[2/1] w-full bg-muted">
                  {selectedCover.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedCover.imageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-primary/70 to-primary" />
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3">
                    <p className="text-sm font-medium text-white">
                      {trimmedName || selectedCover.name}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-black/[0.06] bg-white/70 p-3.5 dark:border-white/[0.08] dark:bg-white/[0.06]">
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

          <SheetFooter className="safe-area-inset-bottom shrink-0 flex-row gap-3 border-t border-black/[0.06] bg-background px-6 py-4 pb-8 dark:border-white/[0.08]">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isCreating}
              className="h-11 min-h-[44px] flex-1 rounded-xl font-medium sm:flex-initial"
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => void handleCreate()}
              disabled={isCreating || !trimmedName || isDuplicate}
              className="h-11 min-h-[44px] flex-1 rounded-xl font-medium sm:flex-initial"
            >
              {isCreating ? t('createMenu.creating') : t('createMenu.createFolderButton')}
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}
