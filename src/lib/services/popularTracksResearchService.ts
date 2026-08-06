/**
 * Research popular tracks WITHOUT the Spotify API:
 * - chart sources: fetch public Spotify daily chart mirrors (kworb)
 * - ai sources: OpenAI researches popular / streamed tracks for a style
 */
import { AI_CONFIG, isAIAvailable } from '@/lib/config/ai'
import type { SpotifyPopularSource } from '@/data/spotifyPopularSources'

export type ResearchedTrack = {
  title: string
  artist: string
}

const CHART_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

function stripFeaturing(text: string): string {
  return text
    .replace(/\s*\(w\/[^)]*\)/gi, '')
    .replace(/\s*\(feat\.?[^)]*\)/gi, '')
    .replace(/\s*\(with[^)]*\)/gi, '')
    .trim()
}

function decodeBasicHtml(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()
}

/**
 * Parse kworb Spotify daily chart HTML rows:
 *   <td class="text mp"><div><a>Artist</a> - <a>Title</a> …</div></td>
 */
export function parseKworbChartHtml(html: string, limit = 50): ResearchedTrack[] {
  const tracks: ResearchedTrack[] = []
  const rowRe =
    /<td class="text mp"><div>([\s\S]*?)<\/div><\/td>/gi

  let match: RegExpExecArray | null
  while ((match = rowRe.exec(html)) !== null && tracks.length < limit) {
    const cell = match[1] ?? ''
    const linkTexts = Array.from(cell.matchAll(/<a[^>]*>([^<]*)<\/a>/gi)).map(
      (m) => decodeBasicHtml(m[1] ?? '')
    )
    if (linkTexts.length < 2) continue

    const artist = stripFeaturing(linkTexts[0] ?? '')
    const title = stripFeaturing(linkTexts[1] ?? '')
    if (!artist || !title) continue

    tracks.push({ title, artist })
  }

  return tracks
}

export async function fetchPublicChartTracks(
  chartUrl: string,
  limit = 50
): Promise<ResearchedTrack[]> {
  const response = await fetch(chartUrl, {
    headers: {
      'User-Agent': CHART_UA,
      Accept: 'text/html,application/xhtml+xml',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Chart fetch failed ${response.status} for ${chartUrl}`)
  }

  const html = await response.text()
  const tracks = parseKworbChartHtml(html, limit)
  if (tracks.length === 0) {
    throw new Error(`No tracks parsed from chart page: ${chartUrl}`)
  }
  return tracks
}

export async function researchPopularTracksWithAi(
  prompt: string,
  limit = 40
): Promise<ResearchedTrack[]> {
  if (!isAIAvailable()) {
    throw new Error('OPENAI_API_KEY missing — required for AI popular-track research')
  }

  const capped = Math.min(Math.max(limit, 5), 50)

  const userPrompt = `You research what people actually listen to (Spotify / streaming popularity), using your knowledge of current and enduring hits.

Task: ${prompt}

Return exactly ${capped} songs (or fewer only if you truly cannot fill the list).
Rules:
- Prefer real, well-known streamed tracks (charts, radio, viral, evergreen hits)
- Exact title + artist names (Hebrew when that is the common form for Israeli/Jewish songs)
- No duplicates
- No commentary

Return ONLY valid JSON:
{ "songs": [ { "title": "...", "artist": "..." } ] }`

  const response = await fetch(AI_CONFIG.OPENAI_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${AI_CONFIG.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: AI_CONFIG.MODEL,
      messages: [
        {
          role: 'system',
          content:
            'You are a music popularity researcher. Return only valid JSON with a songs array. No markdown.',
        },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: AI_CONFIG.MAX_TOKENS,
      response_format: { type: 'json_object' },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenAI research error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  let content = data.choices[0]?.message?.content as string | undefined
  if (!content) throw new Error('No content from OpenAI popular research')

  content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const firstBrace = content.indexOf('{')
  const lastBrace = content.lastIndexOf('}')
  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error('No JSON in OpenAI popular research response')
  }

  const parsed = JSON.parse(content.slice(firstBrace, lastBrace + 1)) as {
    songs?: Array<{ title?: string; artist?: string }>
  }

  if (!parsed.songs || !Array.isArray(parsed.songs)) {
    throw new Error('Invalid JSON from OpenAI popular research')
  }

  const tracks: ResearchedTrack[] = []
  const seen = new Set<string>()
  for (const song of parsed.songs) {
    const title = String(song.title ?? '').trim()
    const artist = String(song.artist ?? '').trim()
    if (!title || !artist) continue
    const key = `${title.toLowerCase()}::${artist.toLowerCase()}`
    if (seen.has(key)) continue
    seen.add(key)
    tracks.push({ title, artist })
    if (tracks.length >= capped) break
  }

  return tracks
}

/**
 * Resolve a popularity source to a track list (web chart or AI research).
 * No Spotify API.
 */
export async function researchPopularTracksForSource(
  source: SpotifyPopularSource,
  limit = 50
): Promise<{ tracks: ResearchedTrack[]; method: 'chart' | 'ai' }> {
  if (source.researchMode === 'chart') {
    if (!source.chartUrl?.trim()) {
      throw new Error(`Source "${source.key}" missing chartUrl`)
    }
    try {
      const tracks = await fetchPublicChartTracks(source.chartUrl, limit)
      return { tracks, method: 'chart' }
    } catch (error) {
      // Fallback: AI research of the same chart concept
      if (!isAIAvailable()) throw error
      const reason = error instanceof Error ? error.message : String(error)
      console.warn(
        `[popularTracksResearch] chart fetch failed for ${source.key} (${reason}) — falling back to AI`
      )
      const tracks = await researchPopularTracksWithAi(
        `Current Spotify Top tracks for: ${source.name}. ${source.description ?? ''}`,
        limit
      )
      return { tracks, method: 'ai' }
    }
  }

  if (!source.aiPrompt?.trim()) {
    throw new Error(`Source "${source.key}" missing aiPrompt`)
  }
  const tracks = await researchPopularTracksWithAi(source.aiPrompt, limit)
  return { tracks, method: 'ai' }
}
