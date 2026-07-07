import { z } from 'zod'

// Folder Schemas
export const createFolderSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long')
})

export const updateFolderSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long')
})

// Song Schemas
export const createSongSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  author: z.string().min(1, 'Author is required'),
  content: z.string().min(1, 'Content is required'),
  folderId: z.string().uuid().optional().nullable(),
  reviews: z.number().int().optional(),
  capo: z.number().int().optional(),
  key: z.string().optional(),
  soundingKey: z.string().optional(),
  firstChord: z.string().optional(),
  lastChord: z.string().optional(),
  chordProgression: z.array(z.string()).optional(),
  version: z.number().int().optional(),
  versionDescription: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  difficulty: z.string().optional(),
  artistUrl: z.string().url().optional().or(z.literal('')),
  artistImageUrl: z.string().url().optional().or(z.literal('')),
  songImageUrl: z.string().url().optional().or(z.literal('')),
  sourceUrl: z.string().url().optional().or(z.literal('')),
  sourceSite: z.string().optional(),
  tabId: z.union([z.string(), z.number().transform(String)]).optional(),
  genre: z.string().optional(),
  bpm: z.number().int().positive().optional()
})

export const requestChordSchema = z.object({
  chordName: z.string().min(1, 'Chord name is required').max(32),
  instrument: z.enum(['guitar', 'piano']),
})

const chordPositionSchema = z.object({
  chord: z.string().min(1),
  position: z.number().int().min(0),
})

const songLineSchema = z.object({
  type: z.enum(['chords_only', 'lyrics_only', 'chord_over_lyrics']),
  lyrics: z.string().optional(),
  chords: z.array(chordPositionSchema).optional(),
  chord_line: z.string().optional(),
})

const songSectionSchema = z.object({
  type: z.string(),
  name: z.string(),
  lines: z.array(songLineSchema),
})

export const updateSongSchema = createSongSchema.partial().extend({
  title: z.string().min(1, 'Title is required'),
  author: z.string().min(1, 'Author is required'),
  content: z.string().min(1).optional(),
  sections: z.array(songSectionSchema).min(1).optional(),
  folderId: z.string().uuid().optional().nullable(),
}).refine(
  (data) =>
    (data.sections !== undefined && data.sections.length > 0) ||
    (data.content !== undefined && data.content.length > 0),
  { message: 'Either sections or content is required', path: ['content'] }
)

// Playlist Schemas
export const createPlaylistSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  coverSlug: z.string().min(1).optional(),
})

export const toggleSongFavoriteSchema = z.object({
  songId: z.string().uuid(),
})

export const selectableSongIdsSchema = z.object({
  q: z.string().optional(),
  tab: z.enum(['all', 'recent', 'popular']).optional(),
  easyChord: z.boolean().optional(),
  capoFilter: z.enum(['any', 'with', 'without']).optional(),
  likedOnly: z.boolean().optional(),
  folderId: z.union([z.string().uuid(), z.literal('unorganized')]).optional(),
  scopeFolderId: z.string().uuid().optional(),
})

export const userSongsListQuerySchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1).max(10000),
  searchQuery: z.string().optional(),
  tab: z.enum(['all', 'recent', 'popular']).optional(),
  folder: z.string().optional(),
  easyChord: z.boolean().optional(),
  capo: z.enum(['any', 'with', 'without']).optional(),
  likedOnly: z.boolean().optional(),
})

export const adminSongListQuerySchema = z.object({
  author: z.string().optional(),
  playlist: z.string().uuid().optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

export const adminBulkPlaylistMutationSchema = z.object({
  playlistId: z.string().uuid(),
  songIds: z.array(z.string().uuid()).min(1),
})

export const adminBulkMovePlaylistSchema = z.object({
  toPlaylistId: z.string().uuid(),
  songIds: z.array(z.string().uuid()).min(1),
  fromPlaylistId: z.string().uuid().optional(),
  removeFromSource: z.boolean().optional(),
})

export const adminUserListQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
})

export const adminDeleteSongsSchema = z.object({
  songIds: z.array(z.string().uuid()).min(1),
})

export const adminUserSongsQuerySchema = z.object({
  author: z.string().optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

export const jewishChordBookSourceSchema = z.object({
  sourceSite: z.string().min(1),
  sourceLabel: z.string().min(1),
  sourceFile: z.string().min(1),
  page: z.number().int().positive(),
  tabId: z.string().min(1),
})

export const jewishChordBookSongSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  titleHebrew: z.string().min(1),
  author: z.string().min(1),
  key: z.string().min(1),
  capo: z.number().int().nullable().optional(),
  content: z.string().min(1),
  genre: z.string().min(1),
  difficulty: z.string().min(1),
  versionDescription: z.string().optional(),
  source: jewishChordBookSourceSchema,
  review: z.object({
    status: z.enum(['ai_transcribed', 'needs_review', 'approved']),
    notes: z.string().optional(),
  }),
})

export const jewishChordBookExtractSchema = z.object({
  meta: z.object({
    bookId: z.string().min(1),
    bookTitleHebrew: z.string().min(1),
    part: z.string().min(1),
    sourceFile: z.string().min(1),
    extractedAt: z.string().min(1),
    extractionMethod: z.string().min(1),
    reviewStatus: z.string().min(1),
  }),
  songs: z.array(jewishChordBookSongSchema).min(1),
})

export const searchUsersSchema = z.object({
  query: z.string().min(2, 'Search query is too short').max(100),
})

export const friendshipIdSchema = z.object({
  friendshipId: z.string().uuid(),
})

export const sendFriendRequestSchema = z.object({
  addresseeId: z.string().uuid(),
})

export const shareWithFriendSchema = z.object({
  friendUserId: z.string().uuid(),
  entityType: z.enum(['song', 'playlist']),
  entityId: z.string().uuid(),
  entityTitle: z.string().min(1).max(200),
})

export const notificationIdSchema = z.object({
  notificationId: z.string().uuid(),
})

export const createInvitationSchema = z.object({
  inviteeEmail: z.string().email().optional().nullable(),
})

export const redeemInvitationSchema = z.object({
  code: z.string().min(6).max(12),
})

export const completeOnboardingSchema = z.object({
  preferredInstrument: z.enum(['piano', 'guitar']).optional().nullable(),
  inviteCode: z.string().min(6).max(12).optional().nullable(),
})

export const getSongStorySchema = z.object({
  songId: z.string().uuid(),
  title: z.string().min(1),
  author: z.string().min(1),
  tabId: z.string().optional().nullable(),
  genre: z.string().optional(),
  key: z.string().optional(),
  chordProgression: z.array(z.string()).optional(),
  language: z.enum(['en', 'fr', 'he']).default('en'),
})

export type SelectableSongIdsInput = z.infer<typeof selectableSongIdsSchema>
export type UserSongsListQueryInput = z.infer<typeof userSongsListQuerySchema>

export type CreateFolderInput = z.infer<typeof createFolderSchema>
export type UpdateFolderInput = z.infer<typeof updateFolderSchema>
export type CreateSongInput = z.infer<typeof createSongSchema>
export type UpdateSongInput = z.infer<typeof updateSongSchema>
export type CreatePlaylistInput = z.infer<typeof createPlaylistSchema>

