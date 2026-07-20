'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import type { FriendProfile } from '@/types'
import {
  acceptFriendRequestAction,
  cancelFriendRequestAction,
  declineFriendRequestAction,
  getDiscoverableUsersAction,
  getFriendsAction,
  getPendingReceivedRequestsAction,
  removeFriendAction,
  searchUsersAction,
  sendFriendRequestAction,
} from './actions'
import { useLanguage } from '@/context/LanguageContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MagnifyingGlassIcon, UserPlusIcon } from '@heroicons/react/24/outline'
import InviteFriendsSection from '@/components/social/InviteFriendsSection'
import { cn } from '@/lib/utils'
import {
  filterMockFriendsByQuery,
  isMockUserId,
  MOCK_FRIEND_PROFILES,
} from '@/data/mockSocialUsers'

interface FriendsClientProps {
  initialFriends: FriendProfile[]
  initialPendingRequests: FriendProfile[]
  initialDiscoverableUsers: FriendProfile[]
}

function getInitials(name: string | null | undefined, email: string) {
  if (name) {
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return parts[0].substring(0, 2).toUpperCase()
  }
  return email.substring(0, 2).toUpperCase()
}

function UserAvatar({
  avatarUrl,
  name,
  email,
}: {
  avatarUrl: string | null
  name: string | null
  email: string
}) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
    )
  }

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
      {getInitials(name, email)}
    </div>
  )
}

function FriendRow({
  profile,
  onAction,
  onDecline,
  pending,
}: {
  profile: FriendProfile
  onAction: () => void
  onDecline?: () => void
  pending: boolean
}) {
  const { t } = useLanguage()
  const isMock = isMockUserId(profile.id)

  const renderAction = () => {
    if (isMock) {
      return (
        <Button type="button" size="sm" disabled className="rounded-xl">
          <UserPlusIcon className="mr-1.5 h-4 w-4" />
          {t('friends.addFriend')}
        </Button>
      )
    }

    switch (profile.relationStatus) {
      case 'friends':
        return (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending || !profile.friendshipId}
            onClick={onAction}
            className="rounded-xl"
          >
            {t('friends.remove')}
          </Button>
        )
      case 'pending_sent':
        return (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending || !profile.friendshipId}
            onClick={onAction}
            className="rounded-xl"
          >
            {t('friends.cancelRequest')}
          </Button>
        )
      case 'pending_received':
        return (
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              disabled={pending || !profile.friendshipId}
              onClick={onAction}
              className="rounded-xl"
            >
              {t('friends.accept')}
            </Button>
            {onDecline && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={pending || !profile.friendshipId}
                onClick={onDecline}
                className="rounded-xl"
              >
                {t('friends.decline')}
              </Button>
            )}
          </div>
        )
      default:
        return (
          <Button
            type="button"
            size="sm"
            disabled={pending}
            onClick={onAction}
            className="rounded-xl"
          >
            <UserPlusIcon className="mr-1.5 h-4 w-4" />
            {t('friends.addFriend')}
          </Button>
        )
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-black/[0.06] bg-card p-3 dark:border-white/[0.08]">
      <UserAvatar
        avatarUrl={profile.avatarUrl}
        name={profile.fullName}
        email={profile.email}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground">
          {profile.fullName || profile.email}
        </p>
        {profile.fullName && (
          <p className="truncate text-xs text-muted-foreground">{profile.email}</p>
        )}
      </div>
      {renderAction()}
    </div>
  )
}

export default function FriendsClient({
  initialFriends,
  initialPendingRequests,
  initialDiscoverableUsers,
}: FriendsClientProps) {
  const { t } = useLanguage()
  const [friends, setFriends] = useState(initialFriends)
  const [pendingRequests, setPendingRequests] = useState(initialPendingRequests)
  const [discoverableUsers, setDiscoverableUsers] = useState(
    initialDiscoverableUsers.length > 0 ? initialDiscoverableUsers : MOCK_FRIEND_PROFILES
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<FriendProfile[]>([])
  const [activeTab, setActiveTab] = useState<'friends' | 'search'>('friends')
  const [pending, startTransition] = useTransition()

  const refreshFriends = useCallback(() => {
    getFriendsAction().then(setFriends).catch(console.error)
  }, [])

  const refreshPendingRequests = useCallback(() => {
    getPendingReceivedRequestsAction().then(setPendingRequests).catch(console.error)
  }, [])

  const refreshDiscoverableUsers = useCallback(() => {
    getDiscoverableUsersAction()
      .then((users) => {
        setDiscoverableUsers(users.length > 0 ? users : MOCK_FRIEND_PROFILES)
      })
      .catch(console.error)
  }, [])

  const isSearching = searchQuery.trim().length >= 2

  const refreshSearchTab = useCallback(async () => {
    if (isSearching) {
      const results = await searchUsersAction(searchQuery.trim())
      setSearchResults(results.length > 0 ? results : filterMockFriendsByQuery(searchQuery))
      return
    }
    refreshDiscoverableUsers()
  }, [isSearching, searchQuery, refreshDiscoverableUsers])

  useEffect(() => {
    if (activeTab !== 'search') return

    const trimmed = searchQuery.trim()
    if (trimmed.length < 2) {
      setSearchResults([])
      return
    }

    const timeout = window.setTimeout(() => {
      searchUsersAction(trimmed)
        .then((results) => {
          setSearchResults(results.length > 0 ? results : filterMockFriendsByQuery(trimmed))
        })
        .catch(console.error)
    }, 300)

    return () => window.clearTimeout(timeout)
  }, [searchQuery, activeTab])

  const refreshAfterMutation = useCallback(async () => {
    refreshFriends()
    refreshPendingRequests()
    if (activeTab === 'search') {
      await refreshSearchTab()
    }
  }, [activeTab, refreshFriends, refreshPendingRequests, refreshSearchTab])

  const handleProfileAction = (profile: FriendProfile) => {
    if (isMockUserId(profile.id)) return
    startTransition(async () => {
      try {
        if (profile.relationStatus === 'friends' && profile.friendshipId) {
          await removeFriendAction(profile.friendshipId)
        } else if (profile.relationStatus === 'pending_sent' && profile.friendshipId) {
          await cancelFriendRequestAction(profile.friendshipId)
        } else if (profile.relationStatus === 'pending_received' && profile.friendshipId) {
          await acceptFriendRequestAction(profile.friendshipId)
        } else {
          await sendFriendRequestAction(profile.id)
        }
        await refreshAfterMutation()
      } catch (error) {
        console.error(error)
      }
    })
  }

  const handleDecline = (profile: FriendProfile) => {
    if (!profile.friendshipId) return
    startTransition(async () => {
      try {
        await declineFriendRequestAction(profile.friendshipId!)
        await refreshAfterMutation()
      } catch (error) {
        console.error(error)
      }
    })
  }

  return (
    <div className="flex flex-1 flex-col min-h-0 overflow-hidden bg-background">
      <div
        data-main-scroll
        className="relative z-0 min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        <div className="container mx-auto max-w-2xl px-4 py-6">
          <div className="mb-6 text-center">
            <h1 className="hidden text-2xl font-bold text-foreground lg:block">
              {t('friends.title')}
            </h1>
            <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {t('friends.description')}
            </p>
          </div>

          <InviteFriendsSection />

          <div className="mb-4 flex rounded-full bg-muted/80 p-0.5">
            <button
              type="button"
              onClick={() => setActiveTab('friends')}
              className={cn(
                'flex-1 rounded-full py-2 text-sm font-medium transition-all',
                activeTab === 'friends'
                  ? 'bg-background text-foreground shadow-sm dark:bg-white/10'
                  : 'text-muted-foreground'
              )}
            >
              {t('friends.myFriends')} ({friends.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('search')}
              className={cn(
                'flex-1 rounded-full py-2 text-sm font-medium transition-all',
                activeTab === 'search'
                  ? 'bg-background text-foreground shadow-sm dark:bg-white/10'
                  : 'text-muted-foreground'
              )}
            >
              {t('friends.findFriends')}
            </button>
          </div>

          {activeTab === 'friends' ? (
            <div className="space-y-6">
              {pendingRequests.length > 0 && (
                <section className="space-y-2">
                  <h2 className="text-sm font-semibold text-foreground">
                    {t('friends.pendingRequests')} ({pendingRequests.length})
                  </h2>
                  {pendingRequests.map((profile) => (
                    <FriendRow
                      key={profile.id}
                      profile={profile}
                      pending={pending}
                      onAction={() => handleProfileAction(profile)}
                      onDecline={() => handleDecline(profile)}
                    />
                  ))}
                </section>
              )}

              <section className="space-y-2">
                {friends.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    {t('friends.noFriends')}
                  </div>
                ) : (
                  friends.map((friend) => (
                    <FriendRow
                      key={friend.id}
                      profile={friend}
                      pending={pending}
                      onAction={() => handleProfileAction(friend)}
                    />
                  ))
                )}
              </section>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('friends.searchPlaceholder')}
                  className="rounded-xl pl-9"
                />
              </div>

              <div className="space-y-2">
                {(isSearching ? searchResults : discoverableUsers).length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    {isSearching ? t('friends.noSearchResults') : t('friends.noDiscoverableUsers')}
                  </div>
                ) : (
                  (isSearching ? searchResults : discoverableUsers).map((profile) => (
                    <FriendRow
                      key={profile.id}
                      profile={profile}
                      pending={pending}
                      onAction={() => handleProfileAction(profile)}
                      onDecline={
                        profile.relationStatus === 'pending_received'
                          ? () => handleDecline(profile)
                          : undefined
                      }
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
