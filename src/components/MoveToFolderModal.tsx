'use client'

import { Folder } from '@/types'
import { FolderIcon, XMarkIcon, PlusIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { FilterChip } from '@/components/ui/filter-chip'

interface MoveToFolderModalProps {
  isOpen: boolean
  onClose: () => void
  folders: Folder[]
  onMove: (folderId: string | undefined) => Promise<void>
  onCreateFolderAndMove?: (folderName: string) => Promise<void>
  songCount: number
}

export default function MoveToFolderModal({
  isOpen,
  onClose,
  folders,
  onMove,
  onCreateFolderAndMove,
  songCount,
}: MoveToFolderModalProps) {
  const { t } = useLanguage()
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>(undefined)
  const [newFolderName, setNewFolderName] = useState('')
  const [tab, setTab] = useState<'existing' | 'new'>('existing')
  const [isMoving, setIsMoving] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      setSelectedFolderId(undefined)
      setNewFolderName('')
      setTab('existing')
      setNameError(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleMoveExisting = async () => {
    setIsMoving(true)
    try {
      await onMove(selectedFolderId)
      onClose()
    } catch (error) {
      console.error('Error moving songs:', error)
    } finally {
      setIsMoving(false)
    }
  }

  const handleCreateAndMove = async () => {
    const trimmed = newFolderName.trim()
    if (!trimmed || !onCreateFolderAndMove || isMoving) return
    const exists = folders.some(
      (folder) => folder.name.trim().toLowerCase() === trimmed.toLowerCase()
    )
    if (exists) {
      setNameError(t('folders.nameExists'))
      return
    }
    setIsMoving(true)
    setNameError(null)
    try {
      await onCreateFolderAndMove(trimmed)
      onClose()
    } catch (error) {
      console.error('Error creating folder:', error)
      if (error instanceof Error && error.message === 'FOLDER_NAME_EXISTS') {
        setNameError(t('folders.nameExists'))
      }
    } finally {
      setIsMoving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div
        className="flex max-h-[85vh] w-full max-w-md flex-col rounded-t-2xl border border-border bg-background shadow-lg sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between gap-2 border-b border-border p-5">
          <h3 className="text-lg font-semibold text-foreground">
            {t('songs.moveSongsTitle').replace('{count}', String(songCount))}
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isMoving}
            className="rounded-full p-2 text-muted-foreground hover:bg-muted"
            aria-label={t('songs.cancel')}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {onCreateFolderAndMove && (
          <div className="flex gap-2 border-b border-border p-2">
            <FilterChip
              active={tab === 'existing'}
              onClick={() => setTab('existing')}
              className="flex-1"
            >
              {t('songs.existingFolder')}
            </FilterChip>
            <FilterChip
              active={tab === 'new'}
              onClick={() => setTab('new')}
              className="flex-1"
            >
              {t('songs.newFolder')}
            </FilterChip>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'existing' || !onCreateFolderAndMove ? (
            <>
              <p className="mb-3 text-sm text-muted-foreground">{t('songs.selectDestinationFolder')}</p>
              <div className="max-h-[220px] space-y-1 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => setSelectedFolderId(undefined)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition-colors',
                    selectedFolderId === undefined
                      ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
                      : 'hover:bg-muted'
                  )}
                >
                  <FolderIcon className="h-5 w-5 shrink-0" />
                  {t('songs.unorganized')}
                </button>
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    type="button"
                    onClick={() => setSelectedFolderId(folder.id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition-colors',
                      selectedFolderId === folder.id
                        ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
                        : 'hover:bg-muted'
                    )}
                  >
                    <FolderIcon className="h-5 w-5 shrink-0" />
                    <span className="truncate">{folder.name}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{t('songs.newFolderDescription')}</p>
              <div className="space-y-2">
                <Label htmlFor="new-folder-name">{t('songs.folderName')}</Label>
                <Input
                  id="new-folder-name"
                  value={newFolderName}
                  onChange={(e) => {
                    setNewFolderName(e.target.value)
                    if (nameError) setNameError(null)
                  }}
                  placeholder={t('songs.folderNamePlaceholder')}
                  className={cn(
                    'h-11 rounded-xl',
                    nameError && 'border-destructive focus-visible:ring-destructive/30'
                  )}
                  disabled={isMoving}
                  aria-invalid={Boolean(nameError)}
                />
                {nameError && (
                  <p className="text-sm text-destructive" role="alert">
                    {nameError}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-border p-5 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={isMoving} className="min-h-11">
            {t('songs.cancel')}
          </Button>
          {tab === 'existing' || !onCreateFolderAndMove ? (
            <Button type="button" onClick={() => void handleMoveExisting()} disabled={isMoving} className="min-h-11">
              {isMoving ? t('songs.moving') : t('songs.move')}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => void handleCreateAndMove()}
              disabled={isMoving || !newFolderName.trim()}
              className="min-h-11 gap-1.5"
            >
              <PlusIcon className="h-4 w-4" />
              {isMoving ? t('songs.moving') : t('songs.createAndMove')}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
