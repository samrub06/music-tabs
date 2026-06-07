'use client'

import { FireIcon } from '@heroicons/react/24/solid'
import { useLanguage } from '@/context/LanguageContext'

interface StreakDisplayProps {
  currentStreak: number
  className?: string
}

export default function StreakDisplay({ currentStreak, className = '' }: StreakDisplayProps) {
  const { t } = useLanguage()
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <FireIcon className="w-5 h-5 text-orange-500" />
      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        {t('gamification.STREAK_DAYS').replace('{count}', String(currentStreak))}
      </span>
    </div>
  )
}
