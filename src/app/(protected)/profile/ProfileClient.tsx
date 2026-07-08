'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { updateProfileAction, unlinkSpotifyAccountAction } from './actions'
import type { Profile, PreferredInstrument } from '@/lib/services/profileRepo'
import type { UserStats } from '@/types'
import UserStatsCard from '@/components/gamification/UserStatsCard'
import BadgeDisplay from '@/components/gamification/BadgeDisplay'
import { PencilIcon, CheckIcon, XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline'
import { Guitar, Piano } from 'lucide-react'
import { getUserStatsAction, getUserBadgesAction } from '@/app/(protected)/gamification/actions'
import { useEffect, useRef } from 'react'
import type { UserBadge } from '@/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { usePageHeader } from '@/context/PageHeaderContext'

interface ProfileClientProps {
  initialProfile: Profile | null
  initialStats: UserStats | null
}

const sectionCardClass =
  'rounded-2xl border border-black/[0.06] bg-card p-4 dark:border-white/[0.08] sm:p-5'

const fieldInputClass =
  'h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30'

export default function ProfileClient({ initialProfile, initialStats }: ProfileClientProps) {
  const { user, profile: contextProfile, refetchProfile } = useAuthContext()
  const { t } = useLanguage()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fullName, setFullName] = useState(initialProfile?.fullName || contextProfile?.full_name || '')
  const [avatarUrl, setAvatarUrl] = useState(initialProfile?.avatarUrl || contextProfile?.avatar_url || '')
  const [preferredInstrument, setPreferredInstrument] = useState<PreferredInstrument | null>(
    initialProfile?.preferredInstrument ?? null
  )
  const [tsnioutFilterEnabled, setTsnioutFilterEnabled] = useState(
    initialProfile?.tsnioutFilterEnabled ?? false
  )
  const [spotifyConnected, setSpotifyConnected] = useState(
    !!(initialProfile?.spotifyId || contextProfile?.spotify_id)
  )
  const [spotifyError, setSpotifyError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [stats, setStats] = useState<UserStats | null>(initialStats)
  const [badges, setBadges] = useState<UserBadge[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setSpotifyConnected(!!(initialProfile?.spotifyId || contextProfile?.spotify_id))
  }, [initialProfile?.spotifyId, contextProfile?.spotify_id])

  usePageHeader(t('navigation.profile'), '/')

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
          avatarUrl: avatarUrl.trim() || null,
          preferredInstrument: preferredInstrument,
          tsnioutFilterEnabled,
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
    setPreferredInstrument(initialProfile?.preferredInstrument ?? null)
    setTsnioutFilterEnabled(initialProfile?.tsnioutFilterEnabled ?? false)
    setPreviewUrl(null)
    setIsEditing(false)
    setError(null)
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setError(t('profile.invalidFileType'))
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      setError(t('profile.fileTooLarge'))
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload file
    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/profile/upload-avatar', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || t('profile.uploadError'))
      }

      const data = await response.json()
      setAvatarUrl(data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('profile.uploadError'))
      setPreviewUrl(null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleAvatarClick = () => {
    if (isEditing && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleTsnioutToggle = () => {
    const next = !tsnioutFilterEnabled
    setTsnioutFilterEnabled(next)
    setError(null)
    startTransition(async () => {
      try {
        await updateProfileAction({ tsnioutFilterEnabled: next })
        await refetchProfile()
        router.refresh()
      } catch (err) {
        setTsnioutFilterEnabled(!next)
        setError(err instanceof Error ? err.message : t('profile.updateError'))
      }
    })
  }

  const handleDisconnectSpotify = () => {
    if (!window.confirm(t('profile.spotifyDisconnectConfirm'))) return

    setSpotifyError(null)
    startTransition(async () => {
      try {
        await unlinkSpotifyAccountAction()
        setSpotifyConnected(false)
        await refetchProfile()
        router.refresh()
      } catch (err) {
        setSpotifyError(
          err instanceof Error ? err.message : t('profile.spotifyDisconnectError')
        )
      }
    })
  }

  const handleConnectSpotify = () => {
    window.location.assign('/api/spotify/auth')
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
    <div className="space-y-4 sm:space-y-5">
      {/* Profile Header */}
      <div className={sectionCardClass}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:gap-4">
            <div className="relative shrink-0">
              {previewUrl || displayAvatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={previewUrl || displayAvatarUrl || ''} 
                  alt={displayName}
                  className={cn(
                    'h-16 w-16 rounded-full object-cover border-2 border-border sm:h-20 sm:w-20',
                    isEditing && 'cursor-pointer transition-opacity hover:opacity-80'
                  )}
                  onClick={handleAvatarClick}
                />
              ) : (
                <div 
                  className={cn(
                    'flex h-16 w-16 items-center justify-center rounded-full border-2 border-border bg-gradient-to-br from-primary to-primary/80 text-xl font-semibold text-primary-foreground sm:h-20 sm:w-20 sm:text-2xl',
                    isEditing && 'cursor-pointer transition-opacity hover:opacity-80'
                  )}
                  onClick={handleAvatarClick}
                >
                  {getInitials(fullName || contextProfile?.full_name, user?.email || null)}
                </div>
              )}
              {isEditing && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="absolute bottom-0 right-0 cursor-pointer rounded-full bg-primary p-1.5 text-primary-foreground transition-colors hover:bg-primary/90">
                    <PhotoIcon className="h-4 w-4" />
                  </div>
                </>
              )}
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                  <div className="h-7 w-7 animate-spin rounded-full border-2 border-white border-t-transparent sm:h-8 sm:w-8" />
                </div>
              )}
            </div>
            
            <div className="min-w-0 w-full text-center sm:text-start">
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="profile-full-name" className="mb-2 block text-[11px] font-medium text-muted-foreground">
                      {t('profile.fullName')}
                    </Label>
                    <input
                      id="profile-full-name"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={t('profile.fullNamePlaceholder')}
                      className={fieldInputClass}
                      autoFocus
                    />
                  </div>
                  <div>
                    <Label htmlFor="profile-avatar-url" className="mb-2 block text-[11px] font-medium text-muted-foreground">
                      {t('profile.avatarUrl')} ({t('profile.orUpload')})
                    </Label>
                    <input
                      id="profile-avatar-url"
                      type="url"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder={t('profile.avatarUrlPlaceholder')}
                      className={fieldInputClass}
                    />
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {t('profile.uploadHint')}
                    </p>
                  </div>
                  <div>
                    <Label className="mb-2 block text-[11px] font-medium text-muted-foreground">
                      {t('profile.preferredInstrument')}
                    </Label>
                    <div className="grid grid-cols-2 gap-2 sm:max-w-xs">
                      <button
                        type="button"
                        onClick={() => setPreferredInstrument('guitar')}
                        className={cn(
                          'rounded-2xl border p-3 text-center transition-all',
                          preferredInstrument === 'guitar'
                            ? 'border-amber-500/60 bg-amber-500/10'
                            : 'border-border hover:bg-muted/50'
                        )}
                      >
                        <Guitar className="mx-auto mb-1.5 h-6 w-6 text-amber-600 dark:text-amber-400" />
                        <span className="text-sm font-medium text-foreground">{t('profile.guitar')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreferredInstrument('piano')}
                        className={cn(
                          'rounded-2xl border p-3 text-center transition-all',
                          preferredInstrument === 'piano'
                            ? 'border-blue-500/60 bg-blue-500/10'
                            : 'border-border hover:bg-muted/50'
                        )}
                      >
                        <Piano className="mx-auto mb-1.5 h-6 w-6 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-medium text-foreground">{t('profile.piano')}</span>
                      </button>
                    </div>
                  </div>
                  {error && (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                      {error}
                    </div>
                  )}
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      onClick={handleSave}
                      disabled={isPending}
                      className="h-10 min-h-[44px] flex-1 rounded-xl sm:flex-initial"
                    >
                      <CheckIcon className="h-4 w-4" />
                      {t('common.save')}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      disabled={isPending}
                      className="h-10 min-h-[44px] flex-1 rounded-xl sm:flex-initial"
                    >
                      <XMarkIcon className="h-4 w-4" />
                      {t('common.cancel')}
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <h1 className="truncate text-lg font-semibold text-foreground sm:text-xl">
                    {displayName}
                  </h1>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {user?.email}
                  </p>
                  {preferredInstrument && (
                    <div className="mt-2 flex justify-center sm:justify-start">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                          preferredInstrument === 'piano'
                            ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400'
                            : 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                        )}
                      >
                        {preferredInstrument === 'piano' ? (
                          <Piano className="h-3.5 w-3.5 shrink-0" />
                        ) : (
                          <Guitar className="h-3.5 w-3.5 shrink-0" />
                        )}
                        {preferredInstrument === 'piano' ? t('profile.piano') : t('profile.guitar')}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {!isEditing && (
            <Button
              variant="outline"
              onClick={() => setIsEditing(true)}
              className="h-10 min-h-[44px] w-full shrink-0 rounded-xl sm:ms-auto sm:w-auto"
            >
              <PencilIcon className="h-4 w-4" />
              {t('common.edit')}
            </Button>
          )}
          </div>
        </div>
      </div>

      <div className={sectionCardClass}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-foreground">
              {t('profile.tsnioutFilter')}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('profile.tsnioutFilterDescription')}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={tsnioutFilterEnabled}
            onClick={handleTsnioutToggle}
            disabled={isPending}
            className={cn(
              'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors',
              tsnioutFilterEnabled ? 'bg-primary' : 'bg-muted',
              'disabled:opacity-50'
            )}
          >
            <span
              className={cn(
                'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
                tsnioutFilterEnabled ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>
        {error && !isEditing && (
          <p className="mt-3 text-sm text-destructive">{error}</p>
        )}
      </div>

      <div className={sectionCardClass}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-foreground">
                {t('profile.spotify')}
              </h2>
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                  spotifyConnected
                    ? 'bg-[#1DB954]/15 text-[#0d7a34] dark:text-[#1ed760]'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {spotifyConnected
                  ? t('profile.spotifyConnected')
                  : t('profile.spotifyNotConnected')}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {spotifyConnected
                ? t('profile.spotifyConnectedDescription')
                : t('profile.spotifyDisconnectedDescription')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:shrink-0">
            {spotifyConnected ? (
              <>
                <Button asChild variant="outline" className="h-10 min-h-[44px] rounded-xl">
                  <Link href="/spotify">{t('profile.spotifyImportPlaylists')}</Link>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDisconnectSpotify}
                  disabled={isPending}
                  className="h-10 min-h-[44px] rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  {t('profile.spotifyDisconnect')}
                </Button>
              </>
            ) : (
              <Button
                type="button"
                onClick={handleConnectSpotify}
                disabled={isPending}
                className="h-10 min-h-[44px] rounded-xl bg-[#1DB954] text-black hover:bg-[#1ed760]"
              >
                {t('profile.spotifyConnect')}
              </Button>
            )}
          </div>
        </div>
        {spotifyError && (
          <p className="mt-3 text-sm text-destructive">{spotifyError}</p>
        )}
      </div>

      {/* Stats Card */}
      {stats && (
        <UserStatsCard initialStats={stats} />
      )}

      {/* Badges */}
      {badges.length > 0 && (
        <div className={sectionCardClass}>
          <h2 className="mb-3 text-base font-semibold text-foreground sm:mb-4">
            {t('profile.badges')}
          </h2>
          <BadgeDisplay badges={badges} />
        </div>
      )}

      {/* Additional Stats */}
      {stats && (
        <div className={sectionCardClass}>
          <h2 className="mb-3 text-base font-semibold text-foreground sm:mb-4">
            {t('profile.activity')}
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4 md:gap-4">
            <div className="rounded-xl bg-muted/50 p-3 text-center sm:p-4">
              <p className="text-xl font-bold tabular-nums text-foreground sm:text-2xl">
                {stats.totalSongsCreated}
              </p>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                {t('profile.songsCreated')}
              </p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3 text-center sm:p-4">
              <p className="text-xl font-bold tabular-nums text-foreground sm:text-2xl">
                {stats.totalSongsViewed}
              </p>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                {t('profile.songsViewed')}
              </p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3 text-center sm:p-4">
              <p className="text-xl font-bold tabular-nums text-foreground sm:text-2xl">
                {stats.totalFoldersCreated}
              </p>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                {t('profile.foldersCreated')}
              </p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3 text-center sm:p-4">
              <p className="text-xl font-bold tabular-nums text-foreground sm:text-2xl">
                {stats.totalPlaylistsCreated}
              </p>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                {t('profile.playlistsCreated')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
