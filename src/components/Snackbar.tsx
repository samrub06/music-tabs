'use client'

import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { useEffect } from 'react'

interface SnackbarProps {
  message: string
  isOpen: boolean
  onClose: () => void
  type?: 'success' | 'error'
  duration?: number
}

export default function Snackbar({ 
  message, 
  isOpen, 
  onClose, 
  type = 'success',
  duration = 3000 
}: SnackbarProps) {
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [isOpen, duration, onClose])

  if (!isOpen) return null

  const bgColor = type === 'success' ? 'bg-green-600' : 'bg-red-600'
  const iconColor = type === 'success' ? 'text-green-100' : 'text-red-100'

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-[60] animate-in slide-in-from-bottom-5 fade-in">
      <div className={`${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[280px] max-w-[90vw]`}>
        {type === 'success' && (
          <CheckCircleIcon className="h-5 w-5 flex-shrink-0" />
        )}
        <span className="text-sm font-medium flex-1">{message}</span>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-200 flex-shrink-0"
          aria-label="Fermer"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

