let gotScrapingModule: typeof import('got-scraping') | null = null;
let lastFetchBlocked = false;

export type UgFetchMeta = {
  blocked: boolean;
  proxyConfigured: boolean;
  via: UgFetchResult['via'];
  statusCode: number;
  bodyLength: number;
  hasJsStore: boolean;
  cloudflare: boolean;
};

let lastFetchMeta: UgFetchMeta = {
  blocked: false,
  proxyConfigured: false,
  via: 'direct',
  statusCode: 0,
  bodyLength: 0,
  hasJsStore: false,
  cloudflare: false,
};

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

export function getLastUgFetchMeta(): UgFetchMeta {
  return lastFetchMeta;
}

export function buildUgSearchErrorMessage(meta: UgFetchMeta): string {
  if (!meta.proxyConfigured) {
    return 'Ultimate Guitar bloque les requêtes depuis le serveur (Cloudflare). Ajoutez UG_PROXY_URL sur Vercel (proxy résidentiel recommandé).';
  }
  if (meta.cloudflare || meta.blocked) {
    return 'Proxy actif mais Ultimate Guitar bloque encore la requête (Cloudflare). Le plan datacenter Webshare gratuit ne suffit généralement pas — passez à Rotating Residential.';
  }
  return 'Aucun résultat trouvé sur Ultimate Guitar pour cette recherche.';
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

/** UG embeds search/tab data in .js-store — 200 without it is a failed scrape. */
export function isMissingUgPageData(body: string, url: string): boolean {
  if (!url.includes('ultimate-guitar.com')) return false;
  if (body.length < 500) return true;
  return !body.includes('js-store') && !body.includes('data-content');
}

function getUgProxyUrl(): string | undefined {
  const raw = process.env.UG_PROXY_URL?.trim();
  if (raw) {
    return raw.replace(/^['"]|['"]$/g, '');
  }

  const host = process.env.UG_PROXY_HOST?.trim();
  const port = process.env.UG_PROXY_PORT?.trim();
  const username = process.env.UG_PROXY_USERNAME?.trim();
  const password = process.env.UG_PROXY_PASSWORD?.trim();
  if (host && port && username && password) {
    return `http://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}`;
  }

  return undefined;
}

function updateLastFetchMeta(result: UgFetchResult, url: string, proxyConfigured: boolean): void {
  const cloudflare = isCloudflareBlocked(result.body, result.statusCode);
  const blocked = result.blocked || isMissingUgPageData(result.body, url);
  lastFetchMeta = {
    blocked,
    proxyConfigured,
    via: result.via,
    statusCode: result.statusCode,
    bodyLength: result.body.length,
    hasJsStore: result.body.includes('js-store'),
    cloudflare,
  };
  lastFetchBlocked = blocked;
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
  const blocked = isCloudflareBlocked(body, statusCode) || isMissingUgPageData(body, url);
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
    const proxyUrl = getUgProxyUrl();
    const proxyConfigured = Boolean(proxyUrl);
    let result: UgFetchResult;

    if (proxyUrl) {
      console.log('UG fetch via proxy (UG_PROXY_URL configured):', url);
      result = await fetchViaGotScraping(url, headers, proxyUrl);
    } else {
      result = await fetchViaGotScraping(url, headers);
    }

    if ((!result.ok || result.blocked) && process.env.SCRAPER_API_KEY) {
      console.warn('UG fetch still blocked, retrying via ScraperAPI:', result.statusCode);
      const scraperResult = await fetchViaScraperApi(url);
      if (scraperResult) {
        result = scraperResult;
      }
    }

    updateLastFetchMeta(result, url, proxyConfigured);
    if (lastFetchBlocked) {
      console.error('Ultimate Guitar fetch blocked or empty:', {
        url,
        ...lastFetchMeta,
        vercel: process.env.VERCEL === '1',
      });
    }

    return result;
  } catch (error) {
    console.error('Ultimate Guitar fetch failed:', url, error);
    const proxyConfigured = Boolean(getUgProxyUrl());
    lastFetchMeta = {
      blocked: true,
      proxyConfigured,
      via: proxyConfigured ? 'proxy' : 'direct',
      statusCode: 0,
      bodyLength: 0,
      hasJsStore: false,
      cloudflare: true,
    };
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
