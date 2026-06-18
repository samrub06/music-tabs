'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export interface PageHeaderOverride {
  title: string
  backHref: string
}

interface PageHeaderContextValue {
  override: PageHeaderOverride | null
  setOverride: (override: PageHeaderOverride | null) => void
}

const PageHeaderContext = createContext<PageHeaderContextValue | undefined>(undefined)

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [override, setOverrideState] = useState<PageHeaderOverride | null>(null)

  const setOverride = useCallback((next: PageHeaderOverride | null) => {
    setOverrideState((prev) => {
      if (prev === next) return prev
      if (prev && next && prev.title === next.title && prev.backHref === next.backHref) {
        return prev
      }
      return next
    })
  }, [])

  const value = useMemo(
    () => ({ override, setOverride }),
    [override, setOverride]
  )

  return (
    <PageHeaderContext.Provider value={value}>{children}</PageHeaderContext.Provider>
  )
}

export function usePageHeaderContext() {
  const context = useContext(PageHeaderContext)
  if (context === undefined) {
    throw new Error('usePageHeaderContext must be used within PageHeaderProvider')
  }
  return context
}

export function usePageHeaderOptional() {
  return useContext(PageHeaderContext)
}

/** Sets the app header back button + title for detail pages (e.g. folder). */
export function usePageHeader(title: string, backHref: string) {
  const setOverride = usePageHeaderOptional()?.setOverride

  useEffect(() => {
    if (!setOverride) return
    setOverride({ title, backHref })
    return () => setOverride(null)
  }, [setOverride, title, backHref])
}
