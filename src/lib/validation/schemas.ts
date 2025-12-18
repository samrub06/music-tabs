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

export const updateSongSchema = createSongSchema.partial().extend({
  title: z.string().min(1, 'Title is required'),
  author: z.string().min(1, 'Author is required'),
  content: z.string().min(1, 'Content is required'),
  folderId: z.string().uuid().optional().nullable()
})

// Playlist Schemas
export const createPlaylistSchema = z.object({
  name: z.string().min(1, 'Name is required')
})

export type CreateFolderInput = z.infer<typeof createFolderSchema>
export type UpdateFolderInput = z.infer<typeof updateFolderSchema>
export type CreateSongInput = z.infer<typeof createSongSchema>
export type UpdateSongInput = z.infer<typeof updateSongSchema>
export type CreatePlaylistInput = z.infer<typeof createPlaylistSchema>

