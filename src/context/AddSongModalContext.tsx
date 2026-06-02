'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import AddSongForm from '@/components/AddSongForm'
import { useFoldersContext } from '@/context/FoldersContext'
import { buildAddSongPageUrl } from '@/lib/addSongNavigation'

export interface OpenAddSongModalOptions {
  initialSearchQuery?: string
  autoSearchOnOpen?: boolean
  defaultFolderId?: string
}

export interface NavigateToAddSongPageOptions {
  query?: string
  autoSearch?: boolean
  folderId?: string
}

interface AddSongModalContextValue {
  openAddSongModal: (opts?: OpenAddSongModalOptions) => void
  closeAddSongModal: () => void
  navigateToAddSongPage: (opts?: NavigateToAddSongPageOptions) => void
}

const AddSongModalContext = createContext<AddSongModalContextValue | undefined>(
  undefined
)

type ModalState = {
  isOpen: boolean
  initialSearchQuery?: string
  autoSearchOnOpen: boolean
  defaultFolderId?: string
}

export function AddSongModalProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { folders } = useFoldersContext()
  const [state, setState] = useState<ModalState>({
    isOpen: false,
    autoSearchOnOpen: false,
  })

  const openAddSongModal = useCallback((opts?: OpenAddSongModalOptions) => {
    setState({
      isOpen: true,
      initialSearchQuery: opts?.initialSearchQuery,
      autoSearchOnOpen: opts?.autoSearchOnOpen ?? false,
      defaultFolderId: opts?.defaultFolderId,
    })
  }, [])

  const closeAddSongModal = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }))
  }, [])

  const navigateToAddSongPage = useCallback(
    (opts?: NavigateToAddSongPageOptions) => {
      router.push(buildAddSongPageUrl(opts))
    },
    [router]
  )

  const value = useMemo(
    () => ({ openAddSongModal, closeAddSongModal, navigateToAddSongPage }),
    [openAddSongModal, closeAddSongModal, navigateToAddSongPage]
  )

  return (
    <AddSongModalContext.Provider value={value}>
      {children}
      <AddSongForm
        variant="dialog"
        isOpen={state.isOpen}
        onClose={closeAddSongModal}
        folders={folders}
        defaultFolderId={state.defaultFolderId}
        initialSearchQuery={state.initialSearchQuery}
        autoSearchOnOpen={state.autoSearchOnOpen}
        redirectAfterAdd
        onSuccess={() => router.refresh()}
      />
    </AddSongModalContext.Provider>
  )
}

export function useAddSongModal() {
  const context = useContext(AddSongModalContext)
  if (context === undefined) {
    throw new Error('useAddSongModal must be used within AddSongModalProvider')
  }
  return context
}
