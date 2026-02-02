'use client'

import { FireIcon } from '@heroicons/react/24/solid'

interface StreakDisplayProps {
  currentStreak: number
  className?: string
}

export default function StreakDisplay({ currentStreak, className = '' }: StreakDisplayProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <FireIcon className="w-5 h-5 text-orange-500" />
      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        {currentStreak} day{currentStreak !== 1 ? 's' : ''}
      </span>
    </div>
  )
}
