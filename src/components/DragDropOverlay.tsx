'use client'

import { Folder } from '@/types'
import { useDroppable } from '@dnd-kit/core'
import { FolderIcon } from '@heroicons/react/24/outline'

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
          ? 'bg-blue-200 border-blue-500 border-dashed scale-105 shadow-md'
          : 'bg-white border-blue-300 hover:bg-blue-50'
        }
      `}
    >
      <FolderIcon className="h-3 w-3 mr-1.5 text-blue-600 flex-shrink-0" />
      <span className="text-xs font-medium text-gray-900 truncate max-w-[80px]">
        {folderName}
      </span>
    </div>
  )
}

export default function DragDropOverlay({ folders, isDragging }: DragDropOverlayProps) {
  if (!isDragging) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[45] bg-white border-t-2 border-blue-500 shadow-2xl lg:hidden animate-in slide-in-from-bottom-5">
      <div className="px-2 py-2 max-h-[35vh] overflow-y-auto">
        <div className="text-[10px] font-semibold text-gray-600 mb-1.5 uppercase tracking-wide px-1">
          Déposer dans un dossier :
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 px-1">
          <DroppableFolderButton folderId={null} folderName="Sans dossier" />
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

