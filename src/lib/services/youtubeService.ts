export interface YoutubeTutorialVideo {
  videoId: string
  title: string
  channelTitle: string
}

interface YoutubeSearchResponse {
  items?: Array<{
    id?: { videoId?: string }
    snippet?: {
      title?: string
      channelTitle?: string
    }
  }>
  error?: {
    message?: string
  }
}

interface YoutubeVideosListResponse {
  items?: Array<{
    id?: string
    status?: {
      embeddable?: boolean
      privacyStatus?: string
    }
  }>
}

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'
const SEARCH_CANDIDATE_COUNT = 8

/** Channels / titles that often refuse iframe embeds (VEVO, Topic, official MV). */
export function isLikelyEmbedRestricted(video: {
  title: string
  channelTitle: string
}): boolean {
  const channel = video.channelTitle.trim()
  const title = video.title.trim()

  if (/vevo/i.test(channel)) return true
  // Auto-generated "Artist - Topic" tracks are often region/embed limited.
  if (/\btopic\b/i.test(channel)) return true
  if (/\bofficial\s+(music\s+)?video\b/i.test(title) && /vevo|records|entertainment|music\b/i.test(channel)) {
    return true
  }
  return false
}

/** Prefer lyric/audio uploads over blocked official MVs when ranking. */
export function scoreYoutubeEmbedCandidate(video: {
  title: string
  channelTitle: string
}): number {
  let score = 0
  const title = video.title.toLowerCase()

  if (isLikelyEmbedRestricted(video)) score -= 100
  if (/\blyrics?\b|\bparoles\b|\bמילים\b/.test(title)) score += 30
  if (/\baudio\b|\bofficial audio\b|\baudio officiel\b/.test(title)) score += 20
  if (/\bcover\b|\bkaraoke\b|\binstrumental\b/.test(title)) score -= 15
  if (/\bofficial\s+(music\s+)?video\b/.test(title)) score -= 25

  return score
}

function pickBestEmbedCandidate(
  videos: YoutubeTutorialVideo[]
): YoutubeTutorialVideo | null {
  if (videos.length === 0) return null

  const ranked = [...videos].sort(
    (a, b) => scoreYoutubeEmbedCandidate(b) - scoreYoutubeEmbedCandidate(a)
  )

  // Prefer a non-restricted hit; fall back to best score overall.
  return ranked.find((v) => !isLikelyEmbedRestricted(v)) ?? ranked[0] ?? null
}

async function filterConfirmedEmbeddable(
  apiKey: string,
  videos: YoutubeTutorialVideo[]
): Promise<YoutubeTutorialVideo[]> {
  if (videos.length === 0) return []

  const ids = videos.map((v) => v.videoId).join(',')
  const params = new URLSearchParams({
    part: 'status',
    id: ids,
    key: apiKey,
  })

  const response = await fetch(`${YOUTUBE_API_BASE}/videos?${params.toString()}`, {
    next: { revalidate: 3600 },
  })

  if (!response.ok) {
    // If status check fails, keep search-order candidates (still filtered heuristically).
    return videos
  }

  const data = (await response.json()) as YoutubeVideosListResponse
  const embeddableIds = new Set(
    (data.items ?? [])
      .filter((item) => item.status?.embeddable === true && item.status?.privacyStatus !== 'private')
      .map((item) => item.id)
      .filter((id): id is string => Boolean(id))
  )

  if (embeddableIds.size === 0) return videos
  return videos.filter((v) => embeddableIds.has(v.videoId))
}

/**
 * Search several candidates, drop likely VEVO/official-blocked uploads,
 * confirm embeddable via videos.list, then pick the best remaining.
 */
export async function searchFirstEmbeddableTutorial(
  query: string,
  relevanceLanguage?: string
): Promise<YoutubeTutorialVideo | null> {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) {
    throw new Error('YOUTUBE_API_KEY is not configured')
  }

  const params = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    maxResults: String(SEARCH_CANDIDATE_COUNT),
    q: query,
    videoEmbeddable: 'true',
    videoSyndicated: 'true',
    safeSearch: 'moderate',
    key: apiKey,
  })

  if (relevanceLanguage) {
    params.set('relevanceLanguage', relevanceLanguage)
  }

  const response = await fetch(`${YOUTUBE_API_BASE}/search?${params.toString()}`, {
    next: { revalidate: 3600 },
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`YouTube API error (${response.status}): ${body}`)
  }

  const data = (await response.json()) as YoutubeSearchResponse
  const candidates: YoutubeTutorialVideo[] = []

  for (const item of data.items ?? []) {
    const videoId = item.id?.videoId
    const title = item.snippet?.title
    if (!videoId || !title) continue
    candidates.push({
      videoId,
      title,
      channelTitle: item.snippet?.channelTitle ?? '',
    })
  }

  if (candidates.length === 0) return null

  const embeddable = await filterConfirmedEmbeddable(apiKey, candidates)
  return pickBestEmbedCandidate(embeddable)
}
