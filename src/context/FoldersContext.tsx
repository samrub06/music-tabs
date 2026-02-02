'use client'

import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react'
import { useSupabase } from '@/lib/hooks/useSupabase'
import { useAuthContext } from '@/context/AuthContext'
import { folderRepo } from '@/lib/services/folderRepo'
import type { Folder } from '@/types'

interface FoldersContextType {
  folders: Folder[]
  loading: boolean
  error: Error | null
  refreshFolders: () => Promise<void>
}

const FoldersContext = createContext<FoldersContextType | undefined>(undefined)

// Cache global pour les folders (persiste entre navigations)
let foldersCache: {
  folders: Folder[]
  timestamp: number
  userId: string | null
} | null = null

const CACHE_DURATION = 30000 // 30 secondes

interface FoldersProviderProps {
  children: ReactNode
}

export function FoldersProvider({ children }: FoldersProviderProps) {
  const { supabase } = useSupabase()
  const { user } = useAuthContext()
  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Vérifier si le cache est valide
  const isCacheValid = useMemo(() => {
    if (!foldersCache) return false
    if (foldersCache.userId !== user?.id) return false
    const now = Date.now()
    return (now - foldersCache.timestamp) < CACHE_DURATION
  }, [user?.id])

  const fetchFolders = useCallback(async () => {
    if (!user || !supabase) {
      setLoading(false)
      return
    }

    // Utiliser le cache si valide
    if (isCacheValid && foldersCache) {
      setFolders(foldersCache.folders)
      setLoading(false)
      return
    }

    // Sinon, charger les données
    try {
      setLoading(true)
      setError(null)
      const foldersData = await folderRepo(supabase).getAllFolders()
      
      // Mettre à jour le cache
      foldersCache = {
        folders: foldersData,
        timestamp: Date.now(),
        userId: user.id
      }
      
      setFolders(foldersData)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch folders')
      setError(error)
      console.error('Error fetching folders:', error)
    } finally {
      setLoading(false)
    }
  }, [user, supabase, isCacheValid])

  useEffect(() => {
    fetchFolders()
  }, [fetchFolders])

  const refreshFolders = async () => {
    // Invalider le cache
    foldersCache = null
    await fetchFolders()
  }

  return (
    <FoldersContext.Provider value={{ folders, loading, error, refreshFolders }}>
      {children}
    </FoldersContext.Provider>
  )
}

export function useFoldersContext() {
  const context = useContext(FoldersContext)
  if (context === undefined) {
    throw new Error('useFoldersContext must be used within a FoldersProvider')
  }
  return context
}
