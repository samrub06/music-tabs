'use client'

import { Folder } from '@/types'
import { useDroppable } from '@dnd-kit/core'
import { FolderIcon } from '@heroicons/react/24/outline'
import { useLanguage } from '@/context/LanguageContext'

interface DragDropOverlayProps {
  folders: Folder[]
  isDragging: boolean
}

function DroppableFolderButton({ 
  folderId, 
  folderName 
}: { 
  folderId: string | null
  folderName: string
}) {
  const dropId = folderId ? `folder-${folderId}` : 'folder-null'
  const { setNodeRef, isOver } = useDroppable({
    id: dropId,
  })

  return (
    <div
      ref={setNodeRef}
      className={`
        flex items-center justify-center px-2 py-1.5 rounded-md border transition-all flex-shrink-0
        ${isOver
          ? 'scale-105 border-primary border-dashed bg-primary/20 shadow-md'
          : 'border-border bg-muted hover:bg-muted/80'
        }
      `}
    >
      <FolderIcon className="mr-1.5 h-3 w-3 shrink-0 text-primary" />
      <span className="max-w-[80px] truncate text-xs font-medium text-foreground">
        {folderName}
      </span>
    </div>
  )
}

export default function DragDropOverlay({ folders, isDragging }: DragDropOverlayProps) {
  const { t } = useLanguage()
  if (!isDragging) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[45] border-t-2 border-primary bg-background shadow-2xl lg:hidden animate-in slide-in-from-bottom-5">
      <div className="px-2 py-2 max-h-[35vh] overflow-y-auto">
        <div className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {t('dragDrop.DROP_INTO_FOLDER')}
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 px-1">
          <DroppableFolderButton folderId={null} folderName={t('dragDrop.NO_FOLDER')} />
          {folders.map((folder) => (
            <DroppableFolderButton
              key={folder.id}
              folderId={folder.id}
              folderName={folder.name}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

