'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'
import { addFolderAction } from '@/app/(protected)/dashboard/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PlaylistCoverPicker } from '@/components/PlaylistCoverPicker'
import {
  getPlaylistCoverOptions,
  resolveAutoCoverSlug,
} from '@/utils/playlistCover'
import { cn } from '@/lib/utils'

type WizardStep = 1 | 2 | 3

interface CreateFolderWizardClientProps {
  existingNames: string[]
}

function normalizeFolderName(name: string): string {
  return name.trim().toLowerCase()
}

export default function CreateFolderWizardClient({
  existingNames,
}: CreateFolderWizardClientProps) {
  const { t } = useLanguage()
  const router = useRouter()

  const [step, setStep] = useState<WizardStep>(1)
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
    if (coverTouched) return
    const auto = resolveAutoCoverSlug({ name })
    if (auto) setCoverSlug(auto)
  }, [name, coverTouched])

  const goNextFromName = () => {
    if (!trimmedName || isDuplicate) return
    setError(null)
    setStep(2)
  }

  const handleCreate = async () => {
    if (!trimmedName || isCreating || isDuplicate) return
    setIsCreating(true)
    setError(null)
    try {
      await addFolderAction(trimmedName, coverSlug ?? undefined)
      router.push('/folders')
      router.refresh()
    } catch (err) {
      console.error('Error creating folder:', err)
      const message = err instanceof Error ? err.message : ''
      setError(
        message === 'FOLDER_NAME_EXISTS'
          ? t('folders.nameExists')
          : t('folders.createError')
      )
      setStep(1)
      setIsCreating(false)
    }
  }

  const steps: { id: WizardStep; label: string }[] = [
    { id: 1, label: t('folders.stepName') },
    { id: 2, label: t('folders.stepCover') },
    { id: 3, label: t('folders.stepConfirm') },
  ]

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-background p-4 sm:p-6">
      <div className="mx-auto w-full max-w-lg space-y-6">
        <div className="space-y-1.5">
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {t('folders.newFolder')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('folders.newFolderWizardDescription')}
          </p>
        </div>

        <div className="flex items-center gap-2" aria-label={t('folders.wizardProgress')}>
          {steps.map((item, index) => {
            const isActive = step === item.id
            const isDone = step > item.id
            return (
              <div key={item.id} className="flex min-w-0 flex-1 items-center gap-2">
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                    isActive || isDone
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {item.id}
                </div>
                <span
                  className={cn(
                    'truncate text-xs font-medium sm:text-sm',
                    isActive ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {item.label}
                </span>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'ms-1 hidden h-px flex-1 sm:block',
                      isDone ? 'bg-primary/50' : 'bg-border'
                    )}
                    aria-hidden
                  />
                )}
              </div>
            )
          })}
        </div>

        {step === 1 && (
          <div className="space-y-4 rounded-2xl border border-black/[0.06] bg-white/70 p-4 dark:border-white/[0.08] dark:bg-white/[0.06] sm:p-5">
            <div>
              <Label
                htmlFor="wizard-folder-name"
                className="mb-2.5 block text-[11px] font-medium text-muted-foreground"
              >
                {t('createMenu.folderName')}
              </Label>
              <Input
                id="wizard-folder-name"
                type="text"
                placeholder={t('createMenu.folderNamePlaceholder')}
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (error) setError(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') goNextFromName()
                }}
                className={cn(
                  'h-11 rounded-xl',
                  (isDuplicate || error) &&
                    'border-destructive focus-visible:ring-destructive/30'
                )}
                autoFocus
                aria-invalid={isDuplicate || Boolean(error)}
              />
              {(isDuplicate || error) && (
                <p className="mt-2 text-sm text-destructive" role="alert">
                  {error ?? t('folders.nameExists')}
                </p>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{t('folders.stepNameHint')}</p>
            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/folders')}
                className="h-11 flex-1 rounded-xl"
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="button"
                onClick={goNextFromName}
                disabled={!trimmedName || isDuplicate}
                className="h-11 flex-1 rounded-xl"
              >
                {t('common.next')}
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 rounded-2xl border border-black/[0.06] bg-white/70 p-4 dark:border-white/[0.08] dark:bg-white/[0.06] sm:p-5">
            <p className="text-sm text-muted-foreground">{t('folders.stepCoverHint')}</p>
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
                    <p className="text-sm font-medium text-white">{trimmedName}</p>
                  </div>
                </div>
              </div>
            )}
            <PlaylistCoverPicker
              value={coverSlug}
              onChange={(slug) => {
                setCoverTouched(true)
                setCoverSlug(slug)
              }}
            />
            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="h-11 flex-1 rounded-xl"
              >
                {t('common.back')}
              </Button>
              <Button
                type="button"
                onClick={() => setStep(3)}
                disabled={!coverSlug}
                className="h-11 flex-1 rounded-xl"
              >
                {t('common.next')}
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 rounded-2xl border border-black/[0.06] bg-white/70 p-4 dark:border-white/[0.08] dark:bg-white/[0.06] sm:p-5">
            <p className="text-sm text-muted-foreground">{t('folders.stepConfirmHint')}</p>
            <div className="overflow-hidden rounded-2xl border border-black/[0.06] dark:border-white/[0.08]">
              <div className="relative aspect-[2/1] w-full bg-muted">
                {selectedCover?.imageUrl ? (
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
                  <p className="text-base font-semibold text-white">{trimmedName}</p>
                </div>
              </div>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">{t('createMenu.folderName')}</dt>
                <dd className="font-medium text-foreground">{trimmedName}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">{t('playlistsPage.chooseCover')}</dt>
                <dd className="font-medium text-foreground">
                  {selectedCover?.name ?? t('common.unknown')}
                </dd>
              </div>
            </dl>
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(2)}
                disabled={isCreating}
                className="h-11 flex-1 rounded-xl"
              >
                {t('common.back')}
              </Button>
              <Button
                type="button"
                onClick={() => void handleCreate()}
                disabled={isCreating || !trimmedName || isDuplicate}
                className="h-11 flex-1 rounded-xl"
              >
                {isCreating
                  ? t('createMenu.creating')
                  : t('createMenu.createFolderButton')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
