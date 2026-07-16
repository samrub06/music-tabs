import { z } from 'zod'

/** Max songs assignable when creating a playlist (folder) in one wizard flow. */
export const MAX_FOLDER_SONGS_ON_CREATE = 500

/** Chunk size for progressive assign UI + PostgREST-friendly bulk updates. */
export const FOLDER_SONG_ASSIGN_CHUNK_SIZE = 50

// Folder Schemas
export const createFolderSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name is too long'),
  coverSlug: z.string().min(1).optional(),
  imageUrl: z.string().optional(),
})

export const createFolderWithSongsSchema = createFolderSchema.extend({
  songIds: z
    .array(z.string().uuid())
    .max(MAX_FOLDER_SONGS_ON_CREATE)
    .optional()
    .default([]),
})

export const assignSongsToFolderSchema = z.object({
  folderId: z.string().uuid(),
  songIds: z
    .array(z.string().uuid())
    .min(1)
    .max(FOLDER_SONG_ASSIGN_CHUNK_SIZE),
})

export const updateFolderSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name is too long'),
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
  bpm: z.number().int().positive().optional(),
  clonedFromId: z.string().uuid().optional().nullable(),
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
  lang: z.enum(['all', 'he']).optional().default('all'),
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

export const friendRelationUserIdSchema = z.object({
  userId: z.string().uuid(),
})

export const chordProgressionSearchSchema = z.object({
  chords: z.array(z.string().min(1).max(16)).min(2).max(8),
  limit: z.number().int().min(1).max(50).optional(),
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

export const invitationIdSchema = z.object({
  invitationId: z.string().uuid(),
})

export const createInvitationSchema = z.object({
  inviteeEmail: z
    .union([z.string(), z.null()])
    .optional()
    .transform((value) => {
      if (value == null || !String(value).trim()) return null
      const emails = String(value)
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)
      return emails.length > 0 ? emails.join(', ') : null
    })
    .superRefine((value, ctx) => {
      if (!value) return
      for (const email of value.split(',').map((part) => part.trim()).filter(Boolean)) {
        if (!z.string().email().safeParse(email).success) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Invalid email: ${email}`,
          })
        }
      }
    }),
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
export const spotifyImportSchema = z.object({
  playlistId: z.string().min(1),
  targetFolderId: z.string().uuid().optional().nullable(),
  useAiOrganization: z.boolean().optional(),
})

export const youtubeTutorialSearchSchema = z.object({
  q: z.string().min(1, 'Search query is required').max(200, 'Search query is too long'),
  lang: z.enum(['en', 'fr', 'he']).optional(),
})

const songLineMarkerSchema = z.object({
  lineIndex: z.number().int().min(0),
  startMs: z.number().int().min(0),
})

/** Max recording duration: 10 minutes */
export const MAX_SONG_RECORDING_DURATION_MS = 10 * 60 * 1000

/** Max upload size: 10MB */
export const MAX_SONG_RECORDING_BYTES = 10 * 1024 * 1024

export const saveSongRecordingSchema = z.object({
  songId: z.string().uuid(),
  durationMs: z
    .number()
    .int()
    .positive()
    .max(MAX_SONG_RECORDING_DURATION_MS)
    .optional()
    .nullable(),
  lineMarkers: z.array(songLineMarkerSchema).optional(),
  isPublic: z.boolean().optional(),
})

export const updateSongRecordingMarkersSchema = z.object({
  recordingId: z.string().uuid(),
  lineMarkers: z.array(songLineMarkerSchema),
})

export type SaveSongRecordingInput = z.infer<typeof saveSongRecordingSchema>
export type UpdateSongRecordingMarkersInput = z.infer<typeof updateSongRecordingMarkersSchema>

export type UserSongsListQueryInput = z.infer<typeof userSongsListQuerySchema>
export type YoutubeTutorialSearchInput = z.infer<typeof youtubeTutorialSearchSchema>

export const submitSongEditSuggestionSchema = z.object({
  catalogSongId: z.string().uuid(),
  fromSongId: z.string().uuid(),
  message: z.string().trim().max(1000).default(''),
})

export const reviewSongEditSuggestionSchema = z.object({
  suggestionId: z.string().uuid(),
  status: z.enum(['accepted', 'rejected']),
})

export type SubmitSongEditSuggestionInput = z.infer<typeof submitSongEditSuggestionSchema>
export type ReviewSongEditSuggestionInput = z.infer<typeof reviewSongEditSuggestionSchema>

export type CreateFolderInput = z.infer<typeof createFolderSchema>
export type UpdateFolderInput = z.infer<typeof updateFolderSchema>
export type CreateSongInput = z.infer<typeof createSongSchema>
export type UpdateSongInput = z.infer<typeof updateSongSchema>
export type CreatePlaylistInput = z.infer<typeof createPlaylistSchema>

