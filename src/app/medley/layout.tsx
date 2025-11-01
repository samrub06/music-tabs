'use client'

import { AppProvider } from '@/context/AppContext'
import Header from '@/components/Header'
import { ReactNode } from 'react'

export default function MedleyLayout({ children }: { children: ReactNode }) {
  return (
    <AppProvider>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <div className="flex-1 flex flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </AppProvider>
  )
}

