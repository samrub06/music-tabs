'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { updateProfileAction } from './actions'
import type { Profile } from '@/lib/services/profileRepo'
import type { UserStats } from '@/types'
import UserStatsCard from '@/components/gamification/UserStatsCard'
import BadgeDisplay from '@/components/gamification/BadgeDisplay'
import { PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { getUserStatsAction, getUserBadgesAction } from '@/app/(protected)/gamification/actions'
import { useEffect } from 'react'
import type { UserBadge } from '@/types'

interface ProfileClientProps {
  initialProfile: Profile | null
  initialStats: UserStats | null
}

export default function ProfileClient({ initialProfile, initialStats }: ProfileClientProps) {
  const { user, profile: contextProfile } = useAuthContext()
  const { t } = useLanguage()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [fullName, setFullName] = useState(initialProfile?.fullName || contextProfile?.full_name || '')
  const [avatarUrl, setAvatarUrl] = useState(initialProfile?.avatarUrl || contextProfile?.avatar_url || '')
  const [stats, setStats] = useState<UserStats | null>(initialStats)
  const [badges, setBadges] = useState<UserBadge[]>([])

  // Load badges
  useEffect(() => {
    getUserBadgesAction()
      .then(setBadges)
      .catch(console.error)
  }, [])

  // Refresh stats
  useEffect(() => {
    getUserStatsAction().then(setStats).catch(console.error)
  }, [])

  const handleSave = () => {
    setError(null)
    startTransition(async () => {
      try {
        await updateProfileAction({
          fullName: fullName.trim() || null,
          avatarUrl: avatarUrl.trim() || null
        })
        setIsEditing(false)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : t('profile.updateError'))
      }
    })
  }

  const handleCancel = () => {
    setFullName(initialProfile?.fullName || contextProfile?.full_name || '')
    setAvatarUrl(initialProfile?.avatarUrl || contextProfile?.avatar_url || '')
    setIsEditing(false)
    setError(null)
  }

  const getInitials = (name: string | null | undefined, email: string | null | undefined) => {
    if (name) {
      const parts = name.trim().split(' ')
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      }
      return parts[0].substring(0, 2).toUpperCase()
    }
    if (email) {
      return email.substring(0, 2).toUpperCase()
    }
    return 'U'
  }

  const displayName = fullName || contextProfile?.full_name || user?.email || t('common.user')
  const displayAvatarUrl = avatarUrl || contextProfile?.avatar_url

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            {displayAvatarUrl ? (
              <img 
                src={displayAvatarUrl} 
                alt={displayName}
                className="h-20 w-20 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-2xl border-2 border-gray-200 dark:border-gray-700">
                {getInitials(fullName || contextProfile?.full_name, user?.email || null)}
              </div>
            )}
            
            <div>
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('profile.fullName')}
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={t('profile.fullNamePlaceholder')}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('profile.avatarUrl')}
                    </label>
                    <input
                      type="url"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder={t('profile.avatarUrlPlaceholder')}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  {error && (
                    <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-sm">
                      {error}
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleSave}
                      disabled={isPending}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <CheckIcon className="h-4 w-4" />
                      <span>{t('common.save')}</span>
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={isPending}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <XMarkIcon className="h-4 w-4" />
                      <span>{t('common.cancel')}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {displayName}
                  </h1>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">
                    {user?.email}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <PencilIcon className="h-4 w-4" />
              <span>{t('common.edit')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Card */}
      {stats && (
        <UserStatsCard initialStats={stats} />
      )}

      {/* Badges */}
      {badges.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {t('profile.badges')}
          </h2>
          <BadgeDisplay badges={badges} />
        </div>
      )}

      {/* Additional Stats */}
      {stats && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {t('profile.activity')}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.totalSongsCreated}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {t('profile.songsCreated')}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.totalSongsViewed}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {t('profile.songsViewed')}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.totalFoldersCreated}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {t('profile.foldersCreated')}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.totalPlaylistsCreated}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {t('profile.playlistsCreated')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
