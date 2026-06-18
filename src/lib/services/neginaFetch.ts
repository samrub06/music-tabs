import { isCloudflareBlocked } from '@/lib/services/ugFetch'

export type NeginaFetchResult = {
  ok: boolean
  statusCode: number
  body: string
  blocked: boolean
  via: 'direct' | 'proxy' | 'scraper-api'
}

export type NeginaPageKind = 'chord' | 'listing' | 'any'

const NEGINA_HOME = 'https://negina.co.il/'

export function getNeginaFetchHeaders(referer?: string): Record<string, string> {
  return {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7',
    Referer: referer ?? NEGINA_HOME,
  }
}

export function isNeginaPageValid(body: string, kind: NeginaPageKind): boolean {
  if (isCloudflareBlocked(body, 200)) return false
  if (body.includes('Just a moment')) return false
  if (body.length < 500) return false

  if (kind === 'chord') {
    return body.includes('song-container') || body.includes('song-text')
  }
  if (kind === 'listing') {
    return body.includes('songsContent') || body.includes('song-list__card')
  }
  return true
}

function getNeginaProxyUrl(): string | undefined {
  const raw = process.env.NEGINA_PROXY_URL?.trim() || process.env.UG_PROXY_URL?.trim()
  return raw ? raw.replace(/^['"]|['"]$/g, '') : undefined
}

async function fetchViaScraperApi(url: string): Promise<NeginaFetchResult | null> {
  const apiKey = process.env.SCRAPER_API_KEY
  if (!apiKey) return null

  const scraperUrl = `https://api.scraperapi.com?api_key=${encodeURIComponent(apiKey)}&url=${encodeURIComponent(url)}`
  const response = await fetch(scraperUrl, { signal: AbortSignal.timeout(90_000) })
  const body = await response.text()
  const blocked = isCloudflareBlocked(body, response.status)
  return {
    ok: response.ok && !blocked,
    statusCode: response.status,
    body,
    blocked,
    via: 'scraper-api',
  }
}

let gotScrapingModule: typeof import('got-scraping') | null = null

async function loadGotScraping() {
  if (!gotScrapingModule) {
    gotScrapingModule = await import('got-scraping')
  }
  return gotScrapingModule.gotScraping
}

function getProxySafeHeaders(headers: Record<string, string>): Record<string, string> {
  return {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': headers['Accept-Language'] || 'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7',
    Referer: headers['Referer'] || NEGINA_HOME,
  }
}

async function fetchViaProxy(
  url: string,
  headers: Record<string, string>,
  proxyUrl: string
): Promise<NeginaFetchResult> {
  const gotScraping = await loadGotScraping()
  const response = await gotScraping.get(url, {
    headers: getProxySafeHeaders(headers),
    proxyUrl,
    useHeaderGenerator: false,
    http2: false,
    timeout: { request: 45_000 },
  })
  const statusCode = response.statusCode ?? 0
  const body = typeof response.body === 'string' ? response.body : String(response.body)
  const blocked = isCloudflareBlocked(body, statusCode)
  return {
    ok: statusCode >= 200 && statusCode < 300 && !blocked,
    statusCode,
    body,
    blocked,
    via: 'proxy',
  }
}

async function fetchDirect(url: string, headers: Record<string, string>): Promise<NeginaFetchResult> {
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(30_000) })
  const body = await response.text()
  const blocked = isCloudflareBlocked(body, response.status)
  return {
    ok: response.ok && !blocked,
    statusCode: response.status,
    body,
    blocked,
    via: 'direct',
  }
}

/**
 * Fetch Negina HTML bypassing Cloudflare when possible.
 * Configure SCRAPER_API_KEY and optionally NEGINA_PROXY_URL (or UG_PROXY_URL).
 */
export async function fetchNeginaHtml(
  url: string,
  options?: { referer?: string; pageKind?: NeginaPageKind }
): Promise<NeginaFetchResult> {
  const headers = getNeginaFetchHeaders(options?.referer)
  const pageKind = options?.pageKind ?? 'any'
  const proxyUrl = getNeginaProxyUrl()

  let result: NeginaFetchResult

  if (proxyUrl) {
    result = await fetchViaProxy(url, headers, proxyUrl)
  } else {
    result = await fetchDirect(url, headers)
  }

  if ((!result.ok || result.blocked) && process.env.SCRAPER_API_KEY) {
    const scraperResult = await fetchViaScraperApi(url)
    if (scraperResult && !scraperResult.blocked) {
      result = scraperResult
    }
  }

  if (!result.blocked && !isNeginaPageValid(result.body, pageKind)) {
    result = { ...result, ok: false, blocked: true }
  }

  return result
}
