'use client'

import { calculateXpProgress } from '@/utils/gamification'

interface LevelProgressBarProps {
  currentXp: number
  currentLevel: number
  className?: string
}

export default function LevelProgressBar({ currentXp, currentLevel, className = '' }: LevelProgressBarProps) {
  const progress = calculateXpProgress(currentXp, currentLevel)
  const percentage = progress.next > 0 ? (progress.current / progress.next) * 100 : 0

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-gray-600 dark:text-gray-400">
          Level {currentLevel}
        </span>
        <span className="text-gray-600 dark:text-gray-400">
          {progress.current} / {progress.next} XP
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
        <div
          className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  )
}
