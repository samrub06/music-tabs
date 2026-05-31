let gotScrapingModule: typeof import('got-scraping') | null = null;
let lastFetchBlocked = false;

export type UgFetchResult = {
  ok: boolean;
  statusCode: number;
  body: string;
  setCookies: string[];
  blocked: boolean;
  via: 'direct' | 'proxy' | 'scraper-api';
};

export function wasUgLastFetchBlocked(): boolean {
  return lastFetchBlocked;
}

export function isCloudflareBlocked(body: string, statusCode: number): boolean {
  return (
    statusCode === 403 ||
    statusCode === 503 ||
    body.includes('Just a moment') ||
    body.includes('cf-browser-verification') ||
    body.includes('Enable JavaScript and cookies to continue')
  );
}

async function loadGotScraping() {
  if (!gotScrapingModule) {
    gotScrapingModule = await import('got-scraping');
  }
  return gotScrapingModule.gotScraping;
}

function parseSetCookies(raw: string | string[] | undefined): string[] {
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
}

async function fetchViaGotScraping(
  url: string,
  headers: Record<string, string>,
  proxyUrl?: string
): Promise<UgFetchResult> {
  const gotScraping = await loadGotScraping();
  const response = await gotScraping.get(url, {
    headers,
    ...(proxyUrl ? { proxyUrl } : {}),
    timeout: { request: 30_000 },
  });
  const statusCode = response.statusCode ?? 0;
  const body = typeof response.body === 'string' ? response.body : String(response.body);
  const blocked = isCloudflareBlocked(body, statusCode);
  return {
    ok: statusCode >= 200 && statusCode < 300 && !blocked,
    statusCode,
    body,
    setCookies: parseSetCookies(response.headers['set-cookie']),
    blocked,
    via: proxyUrl ? 'proxy' : 'direct',
  };
}

async function fetchViaScraperApi(url: string): Promise<UgFetchResult | null> {
  const apiKey = process.env.SCRAPER_API_KEY;
  if (!apiKey) return null;

  const scraperUrl = `https://api.scraperapi.com?api_key=${encodeURIComponent(apiKey)}&url=${encodeURIComponent(url)}`;
  const response = await fetch(scraperUrl, { signal: AbortSignal.timeout(60_000) });
  const body = await response.text();
  const blocked = isCloudflareBlocked(body, response.status);
  return {
    ok: response.ok && !blocked && body.includes('js-store'),
    statusCode: response.status,
    body,
    setCookies: [],
    blocked,
    via: 'scraper-api',
  };
}

/**
 * Fetch UG HTML bypassing Cloudflare when possible.
 * On Vercel/datacenter IPs, configure UG_PROXY_URL or SCRAPER_API_KEY.
 */
export async function fetchUltimateGuitarHtml(
  url: string,
  options?: { referer?: string; cookie?: string; userAgent?: string; headers?: Record<string, string> }
): Promise<UgFetchResult> {
  const headers: Record<string, string> = {
    ...(options?.headers ?? {}),
    ...(options?.cookie ? { Cookie: options.cookie } : {}),
    ...(options?.userAgent ? { 'User-Agent': options.userAgent } : {}),
  };

  lastFetchBlocked = false;

  try {
    let result = await fetchViaGotScraping(url, headers);

    const proxyUrl = process.env.UG_PROXY_URL;
    if ((!result.ok || result.blocked) && proxyUrl) {
      console.warn('UG direct fetch blocked/failed, retrying via proxy:', result.statusCode);
      result = await fetchViaGotScraping(url, headers, proxyUrl);
    }

    if ((!result.ok || result.blocked) && process.env.SCRAPER_API_KEY) {
      console.warn('UG fetch still blocked, retrying via ScraperAPI:', result.statusCode);
      const scraperResult = await fetchViaScraperApi(url);
      if (scraperResult) {
        result = scraperResult;
      }
    }

    lastFetchBlocked = result.blocked || (!result.ok && !result.body.includes('js-store'));
    if (lastFetchBlocked) {
      console.error('Ultimate Guitar fetch blocked or empty:', {
        url,
        statusCode: result.statusCode,
        via: result.via,
        bodyLength: result.body.length,
        vercel: process.env.VERCEL === '1',
      });
    }

    return result;
  } catch (error) {
    console.error('Ultimate Guitar fetch failed:', url, error);
    lastFetchBlocked = true;
    return {
      ok: false,
      statusCode: 0,
      body: '',
      setCookies: [],
      blocked: true,
      via: 'direct',
    };
  }
}
