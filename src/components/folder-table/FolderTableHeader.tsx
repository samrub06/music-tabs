'use client'

interface FolderTableHeaderProps {
  sortedFoldersCount: number
  selectedCount: number
  searchQuery: string
  showDeleteAll: boolean
  onCancelSelection: () => void
  onDeleteSelected: () => void
  onDeleteAll: () => void
}

export default function FolderTableHeader({
  sortedFoldersCount,
  selectedCount,
  searchQuery,
  showDeleteAll,
  onCancelSelection,
  onDeleteSelected,
  onDeleteAll
}: FolderTableHeaderProps) {
  return (
    <>
      {selectedCount > 0 ? (
        <BulkActions 
          selectedCount={selectedCount}
          showDeleteAll={showDeleteAll}
          onCancelSelection={onCancelSelection}
          onDeleteSelected={onDeleteSelected}
          onDeleteAll={onDeleteAll}
        />
      ) : (
        <FolderCountDisplay
          count={sortedFoldersCount}
          searchQuery={searchQuery}
        />
      )}
    </>
  )
}

function BulkActions({ selectedCount, showDeleteAll, onCancelSelection, onDeleteSelected, onDeleteAll }: any) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
      <span className="text-sm font-medium text-blue-700">
        {selectedCount} {selectedCount === 1 ? 'dossier sélectionné' : 'dossiers sélectionnés'}
      </span>
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <button
          onClick={onDeleteSelected}
          className="inline-flex items-center justify-center px-4 py-3 sm:px-3 sm:py-1.5 border border-red-300 shadow-sm text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 min-h-[48px] sm:min-h-0"
        >
          <span className="sm:hidden">Supprimer sélection</span>
          <span className="hidden sm:inline">Supprimer sélection</span>
        </button>
        {showDeleteAll && (
          <button
            onClick={onDeleteAll}
            className="inline-flex items-center justify-center px-4 py-3 sm:px-3 sm:py-1.5 border border-red-300 shadow-sm text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 min-h-[48px] sm:min-h-0"
          >
            <span className="sm:hidden">Tout supprimer</span>
            <span className="hidden sm:inline">Tout supprimer</span>
          </button>
        )}
        <button
          onClick={onCancelSelection}
          className="inline-flex items-center justify-center px-4 py-3 sm:px-3 sm:py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-h-[48px] sm:min-h-0"
        >
          <span className="sm:hidden">Annuler</span>
          <span className="hidden sm:inline">Annuler</span>
        </button>
      </div>
    </div>
  )
}

function FolderCountDisplay({ count, searchQuery }: { count: number; searchQuery: string }) {
  return (
    <div className="flex items-center space-x-2 flex-wrap">
      <span className="text-sm font-medium text-gray-700">
        {count} {count === 1 ? 'dossier' : 'dossiers'}
      </span>
      {searchQuery && (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
          &ldquo;{searchQuery}&rdquo;
        </span>
      )}
    </div>
  )
}





