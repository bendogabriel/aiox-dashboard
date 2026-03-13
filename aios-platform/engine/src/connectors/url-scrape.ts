/**
 * URL Scrape connector — fetches web pages and extracts text content.
 *
 * Config shape:
 *   { urls: string[] }  — one or more URLs to scrape
 *
 * Each URL becomes a single SourceItem / RawContent.
 */
import type { VaultConnector, SourceItem, RawContent } from './types';

/**
 * Strip HTML tags and extract readable text content.
 * Also extracts <title> for use as document title.
 */
function stripHtml(html: string): { title: string; content: string } {
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch
    ? titleMatch[1].replace(/\s+/g, ' ').trim()
    : '';

  // Remove script and style blocks entirely
  let cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '');

  // Convert common block elements to newlines
  cleaned = cleaned
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|tr|blockquote|section|article|header|footer|nav|main|aside)>/gi, '\n')
    .replace(/<(hr)\s*\/?>/gi, '\n---\n');

  // Convert links to markdown-style
  cleaned = cleaned.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)');

  // Convert headings to markdown
  cleaned = cleaned.replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_match, level, text) => {
    return '\n' + '#'.repeat(Number(level)) + ' ' + text.trim() + '\n';
  });

  // Convert list items
  cleaned = cleaned.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1');

  // Strip remaining tags
  cleaned = cleaned.replace(/<[^>]+>/g, '');

  // Decode common HTML entities
  cleaned = cleaned
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_m, code) => String.fromCharCode(Number(code)));

  // Normalize whitespace
  cleaned = cleaned
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return { title, content: cleaned };
}

function normalizeUrl(url: string): string {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
}

export const urlScrapeConnector: VaultConnector = {
  type: 'url-scrape',
  name: 'URL Scraper',

  async testConnection(config: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
    const urls = config.urls as string[] | undefined;
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return { ok: false, error: 'config.urls must be a non-empty array of URLs' };
    }

    // Test first URL with HEAD request
    const testUrl = normalizeUrl(urls[0]);
    try {
      const response = await fetch(testUrl, {
        method: 'HEAD',
        signal: AbortSignal.timeout(10_000),
        headers: {
          'User-Agent': 'AIOS-Vault-Connector/1.0',
        },
      });
      if (!response.ok) {
        return { ok: false, error: `HTTP ${response.status}: ${response.statusText}` };
      }
      return { ok: true };
    } catch (err) {
      return { ok: false, error: `Connection failed: ${(err as Error).message}` };
    }
  },

  async discover(config: Record<string, unknown>): Promise<SourceItem[]> {
    const urls = config.urls as string[] | undefined;
    if (!urls || !Array.isArray(urls)) return [];

    const items: SourceItem[] = [];

    for (const rawUrl of urls) {
      const url = normalizeUrl(rawUrl);
      const id = `url-${Buffer.from(url).toString('base64url').slice(0, 16)}`;

      try {
        const response = await fetch(url, {
          method: 'HEAD',
          signal: AbortSignal.timeout(10_000),
          headers: { 'User-Agent': 'AIOS-Vault-Connector/1.0' },
        });

        const contentLength = response.headers.get('content-length');
        const lastModified = response.headers.get('last-modified');
        const contentType = response.headers.get('content-type') || 'text/html';

        items.push({
          id,
          path: url,
          name: new URL(url).hostname + new URL(url).pathname,
          type: contentType.split(';')[0].trim(),
          size: contentLength ? Number(contentLength) : undefined,
          lastModified: lastModified || undefined,
          preview: url,
        });
      } catch {
        // Still add the item, it will fail during extract
        items.push({
          id,
          path: url,
          name: rawUrl,
          type: 'text/html',
          preview: url,
        });
      }
    }

    return items;
  },

  async *extract(items: SourceItem[]): AsyncGenerator<RawContent> {
    for (const item of items) {
      try {
        const response = await fetch(item.path, {
          signal: AbortSignal.timeout(30_000),
          headers: {
            'User-Agent': 'AIOS-Vault-Connector/1.0',
            'Accept': 'text/html,application/xhtml+xml,text/plain,application/json',
          },
        });

        if (!response.ok) {
          yield {
            sourceItemId: item.id,
            title: item.name,
            content: `[Fetch error: HTTP ${response.status} ${response.statusText}]`,
            originalFormat: 'error',
            originalUrl: item.path,
            metadata: { error: true, status: response.status },
          };
          continue;
        }

        const contentType = response.headers.get('content-type') || '';
        const rawBody = await response.text();

        if (contentType.includes('text/html') || contentType.includes('application/xhtml')) {
          const { title, content } = stripHtml(rawBody);
          yield {
            sourceItemId: item.id,
            title: title || item.name,
            content,
            originalFormat: 'html',
            originalUrl: item.path,
            metadata: {
              contentType,
              contentLength: rawBody.length,
              fetchedAt: new Date().toISOString(),
            },
          };
        } else if (contentType.includes('application/json')) {
          yield {
            sourceItemId: item.id,
            title: item.name,
            content: rawBody,
            originalFormat: 'json',
            originalUrl: item.path,
            metadata: {
              contentType,
              contentLength: rawBody.length,
              fetchedAt: new Date().toISOString(),
            },
          };
        } else {
          // Plain text or other
          yield {
            sourceItemId: item.id,
            title: item.name,
            content: rawBody,
            originalFormat: 'text',
            originalUrl: item.path,
            metadata: {
              contentType,
              contentLength: rawBody.length,
              fetchedAt: new Date().toISOString(),
            },
          };
        }
      } catch (err) {
        yield {
          sourceItemId: item.id,
          title: item.name,
          content: `[Fetch error: ${(err as Error).message}]`,
          originalFormat: 'error',
          originalUrl: item.path,
          metadata: { error: true, message: (err as Error).message },
        };
      }
    }
  },
};
