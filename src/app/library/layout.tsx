'use client'

import { ReactNode } from 'react'
import Header from '@/components/Header'

export default function LibraryLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  )
}

