'use client'

import type { UserBadge } from '@/types'
import { TrophyIcon, StarIcon } from '@heroicons/react/24/solid'
import { getBadgeDefinitions } from '@/utils/gamification'
import { useLanguage } from '@/context/LanguageContext'

interface BadgeDisplayProps {
  badges: UserBadge[]
  showLocked?: boolean
  className?: string
}

export default function BadgeDisplay({ badges, showLocked = false, className = '' }: BadgeDisplayProps) {
  const { t } = useLanguage()
  const earnedBadgeKeys = new Set(badges.map(b => b.badgeKey))
  
  // Get all badge definitions to show locked ones
  const allBadges = showLocked ? getBadgeDefinitions() : badges.map(b => ({
    key: b.badgeKey,
    type: b.badgeType,
    name: b.badgeName,
    description: b.badgeDescription || ''
  }))

  if (allBadges.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 dark:text-gray-400 ${className}`}>
        <p>{t('gamification.NO_BADGES')}</p>
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 ${className}`}>
      {allBadges.map((badge: any) => {
        const isEarned = earnedBadgeKeys.has(badge.key)
        const Icon = badge.type === 'achievement' ? StarIcon : TrophyIcon
        
        return (
          <div
            key={badge.key}
            className={`
              relative p-4 rounded-lg border-2 transition-all
              ${isEarned 
                ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' 
                : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 opacity-50'
              }
            `}
            title={badge.description || badge.name}
          >
            <div className="flex flex-col items-center text-center">
              <Icon 
                className={`
                  w-8 h-8 mb-2
                  ${isEarned 
                    ? 'text-yellow-500 dark:text-yellow-400' 
                    : 'text-gray-400 dark:text-gray-600'
                  }
                `}
              />
              <span className={`
                text-xs font-medium
                ${isEarned 
                  ? 'text-gray-900 dark:text-gray-100' 
                  : 'text-gray-500 dark:text-gray-500'
                }
              `}>
                {badge.name}
              </span>
            </div>
            {isEarned && (
              <div className="absolute top-1 right-1">
                <span className="text-xs text-yellow-600 dark:text-yellow-400">✓</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
