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

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

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
    maxResults: '1',
    q: query,
    videoEmbeddable: 'true',
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
  const item = data.items?.[0]
  const videoId = item?.id?.videoId

  if (!videoId || !item.snippet?.title) {
    return null
  }

  return {
    videoId,
    title: item.snippet.title,
    channelTitle: item.snippet.channelTitle ?? '',
  }
}
