import type { FriendProfile, LeaderboardEntry } from '@/types'

export const MOCK_USER_ID_PREFIX = 'mock-'

export function isMockUserId(userId: string): boolean {
  return userId.startsWith(MOCK_USER_ID_PREFIX)
}

/** Demo leaderboard rows when the real board is empty (UI only). */
export const MOCK_LEADERBOARD_ENTRIES: LeaderboardEntry[] = [
  {
    rank: 1,
    userId: `${MOCK_USER_ID_PREFIX}maya-chen`,
    email: 'maya.chen@example.com',
    fullName: 'Maya Chen',
    avatarUrl: null,
    totalXp: 12480,
    currentLevel: 14,
    currentStreak: 21,
    badges: [],
    songCount: 86,
    playlistCount: 7,
  },
  {
    rank: 2,
    userId: `${MOCK_USER_ID_PREFIX}leo-martin`,
    email: 'leo.martin@example.com',
    fullName: 'Léo Martin',
    avatarUrl: null,
    totalXp: 10920,
    currentLevel: 12,
    currentStreak: 12,
    badges: [],
    songCount: 64,
    playlistCount: 5,
  },
  {
    rank: 3,
    userId: `${MOCK_USER_ID_PREFIX}sofia-rossi`,
    email: 'sofia.rossi@example.com',
    fullName: 'Sofia Rossi',
    avatarUrl: null,
    totalXp: 9840,
    currentLevel: 11,
    currentStreak: 8,
    badges: [],
    songCount: 51,
    playlistCount: 4,
  },
  {
    rank: 4,
    userId: `${MOCK_USER_ID_PREFIX}noah-bennett`,
    email: 'noah.bennett@example.com',
    fullName: 'Noah Bennett',
    avatarUrl: null,
    totalXp: 8120,
    currentLevel: 10,
    currentStreak: 5,
    badges: [],
    songCount: 43,
    playlistCount: 3,
  },
  {
    rank: 5,
    userId: `${MOCK_USER_ID_PREFIX}aya-nakamura`,
    email: 'aya.nakamura@example.com',
    fullName: 'Aya Nakamura',
    avatarUrl: null,
    totalXp: 7340,
    currentLevel: 9,
    currentStreak: 3,
    badges: [],
    songCount: 38,
    playlistCount: 2,
  },
  {
    rank: 6,
    userId: `${MOCK_USER_ID_PREFIX}jordan-lee`,
    email: 'jordan.lee@example.com',
    fullName: 'Jordan Lee',
    avatarUrl: null,
    totalXp: 5980,
    currentLevel: 8,
    currentStreak: 2,
    badges: [],
    songCount: 29,
    playlistCount: 2,
  },
  {
    rank: 7,
    userId: `${MOCK_USER_ID_PREFIX}emma-cohen`,
    email: 'emma.cohen@example.com',
    fullName: 'Emma Cohen',
    avatarUrl: null,
    totalXp: 4520,
    currentLevel: 7,
    currentStreak: 1,
    badges: [],
    songCount: 22,
    playlistCount: 1,
  },
  {
    rank: 8,
    userId: `${MOCK_USER_ID_PREFIX}sam-okonkwo`,
    email: 'sam.okonkwo@example.com',
    fullName: 'Sam Okonkwo',
    avatarUrl: null,
    totalXp: 3180,
    currentLevel: 5,
    currentStreak: 0,
    badges: [],
    songCount: 15,
    playlistCount: 1,
  },
]

/** Demo discoverable / search profiles when friend search is empty (UI only). */
export const MOCK_FRIEND_PROFILES: FriendProfile[] = [
  {
    id: `${MOCK_USER_ID_PREFIX}maya-chen`,
    email: 'maya.chen@example.com',
    fullName: 'Maya Chen',
    avatarUrl: null,
    relationStatus: 'none',
    friendshipId: null,
  },
  {
    id: `${MOCK_USER_ID_PREFIX}leo-martin`,
    email: 'leo.martin@example.com',
    fullName: 'Léo Martin',
    avatarUrl: null,
    relationStatus: 'none',
    friendshipId: null,
  },
  {
    id: `${MOCK_USER_ID_PREFIX}sofia-rossi`,
    email: 'sofia.rossi@example.com',
    fullName: 'Sofia Rossi',
    avatarUrl: null,
    relationStatus: 'none',
    friendshipId: null,
  },
  {
    id: `${MOCK_USER_ID_PREFIX}noah-bennett`,
    email: 'noah.bennett@example.com',
    fullName: 'Noah Bennett',
    avatarUrl: null,
    relationStatus: 'none',
    friendshipId: null,
  },
  {
    id: `${MOCK_USER_ID_PREFIX}aya-nakamura`,
    email: 'aya.nakamura@example.com',
    fullName: 'Aya Nakamura',
    avatarUrl: null,
    relationStatus: 'none',
    friendshipId: null,
  },
  {
    id: `${MOCK_USER_ID_PREFIX}jordan-lee`,
    email: 'jordan.lee@example.com',
    fullName: 'Jordan Lee',
    avatarUrl: null,
    relationStatus: 'none',
    friendshipId: null,
  },
]

export function filterMockFriendsByQuery(query: string): FriendProfile[] {
  const q = query.trim().toLowerCase()
  if (!q) return MOCK_FRIEND_PROFILES
  return MOCK_FRIEND_PROFILES.filter((p) => {
    const name = p.fullName?.toLowerCase() ?? ''
    const email = p.email.toLowerCase()
    return name.includes(q) || email.includes(q)
  })
}
