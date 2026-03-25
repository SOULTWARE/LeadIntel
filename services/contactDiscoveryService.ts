import { hunterService } from './hunterService';

const REQUEST_TIMEOUT_MS = 10_000;
const MAX_PAGES_TO_SCRAPE = 5;
const CONTACT_PATHS = [
  '/contact',
  '/contact-us',
  '/contactus',
  '/about',
  '/about-us',
  '/team',
  '/support',
  '/help',
  '/company',
  '/impressum',
  '/legal',
  '/privacy',
  '/terms',
];
const CONTACT_LINK_HINTS = [
  'contact',
  'about',
  'team',
  'support',
  'help',
  'company',
  'impressum',
  'legal',
  'privacy',
  'terms',
];
const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const MAILTO_REGEX = /mailto:([^"'?>\s]+)/gi;
const PLACEHOLDER_EMAIL_DOMAINS = new Set([
  'example.com',
  'example.org',
  'example.net',
  'example.edu',
  'example.ca',
  'example.co',
  'invalid',
  'localhost',
]);
const GENERIC_PLACEHOLDER_LOCAL_PARTS = new Set(['user', 'test', 'example']);
const DEFAULT_USER_AGENT =
  process.env.FETCH_USER_AGENT ||
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

function normalizeStartUrl(url: string): URL | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    const normalized = trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`;
    const parsed = new URL(normalized);
    parsed.hash = '';
    parsed.search = '';
    return parsed;
  } catch {
    return null;
  }
}

function normalizeEmail(value: string): string {
  return value.toLowerCase().trim().replace(/[)\]}>.,;:!?]+$/g, '');
}

function isPlaceholderEmail(value: string): boolean {
  const normalized = normalizeEmail(value);
  const atIndex = normalized.indexOf('@');
  if (atIndex <= 0 || atIndex === normalized.length - 1) return true;

  const localPart = normalized.slice(0, atIndex);
  const domain = normalized.slice(atIndex + 1);

  if (PLACEHOLDER_EMAIL_DOMAINS.has(domain)) return true;
  if (domain === 'domain.com' && GENERIC_PLACEHOLDER_LOCAL_PARTS.has(localPart)) return true;

  return false;
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values));
}

function extractEmailsFromHtml(html: string): string[] {
  const emails: string[] = [];
  const seen = new Set<string>();

  const addEmail = (value: string): void => {
    const normalized = normalizeEmail(value);
    if (!normalized || !normalized.includes('@') || seen.has(normalized) || isPlaceholderEmail(normalized)) return;
    seen.add(normalized);
    emails.push(normalized);
  };

  for (const match of html.matchAll(MAILTO_REGEX)) {
    const raw = match[1];
    if (!raw) continue;

    try {
      addEmail(decodeURIComponent(raw));
    } catch {
      addEmail(raw);
    }
  }

  for (const match of html.matchAll(EMAIL_REGEX)) {
    addEmail(match[0]);
  }

  return emails;
}

function extractCandidateUrls(html: string, currentUrl: URL): string[] {
  const urls = new Set<string>();
  const hrefRegex = /href\s*=\s*["']([^"']+)["']/gi;

  for (const match of html.matchAll(hrefRegex)) {
    const href = match[1]?.trim();
    if (!href) continue;

    const lowerHref = href.toLowerCase();
    if (
      lowerHref.startsWith('mailto:') ||
      lowerHref.startsWith('tel:') ||
      lowerHref.startsWith('javascript:') ||
      href.startsWith('#')
    ) {
      continue;
    }

    if (!CONTACT_LINK_HINTS.some((hint) => lowerHref.includes(hint))) continue;

    try {
      const candidate = new URL(href, currentUrl);
      candidate.hash = '';
      candidate.search = '';
      if (candidate.origin !== currentUrl.origin) continue;
      urls.add(candidate.toString());
    } catch {
      continue;
    }
  }

  return Array.from(urls);
}

async function fetchPageHtml(url: URL): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': DEFAULT_USER_AGENT,
      },
      redirect: 'follow',
      signal: controller.signal,
    });

    if (!response.ok) return null;

    const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
    if (
      contentType &&
      !contentType.includes('text/html') &&
      !contentType.includes('application/xhtml+xml') &&
      !contentType.includes('text/plain')
    ) {
      return null;
    }

    return await response.text();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return null;
    }

    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function scrapeEmailsFromWebsite(startUrl: URL): Promise<string[]> {
  const queue = [
    startUrl.toString(),
    ...CONTACT_PATHS.map((path) => new URL(path, startUrl).toString()),
  ];
  const queued = new Set(queue);
  const visited = new Set<string>();
  const discovered: string[] = [];

  while (queue.length > 0 && visited.size < MAX_PAGES_TO_SCRAPE) {
    const current = queue.shift();
    if (!current || visited.has(current)) continue;
    visited.add(current);

    const currentUrl = new URL(current);
    const html = await fetchPageHtml(currentUrl);
    if (!html) continue;

    for (const email of extractEmailsFromHtml(html)) {
      if (!discovered.includes(email)) {
        discovered.push(email);
      }
    }

    if (discovered.length > 0) {
      return discovered;
    }

    for (const candidate of extractCandidateUrls(html, currentUrl)) {
      if (visited.has(candidate) || queued.has(candidate)) continue;
      queued.add(candidate);
      queue.push(candidate);
    }
  }

  return discovered;
}

export class ContactDiscoveryService {
  async findEmails(url: string | null, _context?: { name: string; address?: string }): Promise<string[]> {
    if (!url) return [];

    void _context;

    const startUrl = normalizeStartUrl(url);
    if (!startUrl) return [];

    const hostname = startUrl.hostname.toLowerCase().replace(/^www\./, '');

    try {
      const results = await hunterService.domainSearch(hostname);
      const hunterEmails = results
        .map((result) => result.value)
        .filter((value): value is string => typeof value === 'string' && value.includes('@'))
        .map((value) => normalizeEmail(value))
        .filter((value) => value.length > 0)
        .filter((value) => !isPlaceholderEmail(value));

      if (hunterEmails.length > 0) {
        return uniqueStrings(hunterEmails);
      }
    } catch (error) {
      console.warn(`[ContactDiscoveryService] Hunter lookup failed for ${hostname}:`, error);
    }

    const scrapedEmails = await scrapeEmailsFromWebsite(startUrl);
    return uniqueStrings(scrapedEmails);
  }
}

export const contactDiscoveryService = new ContactDiscoveryService();
