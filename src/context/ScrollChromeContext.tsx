'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

interface ScrollChromeContextType {
  headerHidden: boolean
  setHeaderHidden: (hidden: boolean) => void
}

const ScrollChromeContext = createContext<ScrollChromeContextType | undefined>(
  undefined
)

export function ScrollChromeProvider({ children }: { children: ReactNode }) {
  const [headerHidden, setHeaderHidden] = useState(false)

  const value = useMemo(
    () => ({ headerHidden, setHeaderHidden }),
    [headerHidden]
  )

  return (
    <ScrollChromeContext.Provider value={value}>
      {children}
    </ScrollChromeContext.Provider>
  )
}

export function useScrollChrome() {
  const context = useContext(ScrollChromeContext)
  if (!context) {
    throw new Error('useScrollChrome must be used within ScrollChromeProvider')
  }
  return context
}

export function useScrollChromeOptional() {
  return useContext(ScrollChromeContext)
}
