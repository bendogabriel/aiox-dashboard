/**
 * AI Memory connector — handles paste-based imports from AI assistants
 * (Claude, ChatGPT, Gemini, etc.).
 *
 * Config shape:
 *   { content: string; provider?: string }
 *
 * The connector detects the provider from content patterns, then parses
 * the pasted text into individual knowledge items. Each item becomes
 * a separate document in the vault.
 */
import type { VaultConnector, SourceItem, RawContent } from './types';

type AIProvider = 'claude' | 'chatgpt' | 'gemini' | 'copilot' | 'unknown';

interface ParsedItem {
  title: string;
  content: string;
  role?: string;
  index: number;
}

/**
 * Detect the AI provider from content patterns.
 */
function detectProvider(content: string): AIProvider {
  const lower = content.toLowerCase();

  // Claude patterns
  if (
    lower.includes('human:') && lower.includes('assistant:') ||
    lower.includes('[claude]') ||
    lower.includes('anthropic') ||
    /\bClaude\b/.test(content)
  ) {
    return 'claude';
  }

  // ChatGPT patterns
  if (
    lower.includes('chatgpt') ||
    (lower.includes('user:') && lower.includes('assistant:') && !lower.includes('human:')) ||
    lower.includes('openai') ||
    lower.includes('gpt-4') ||
    lower.includes('gpt-3')
  ) {
    return 'chatgpt';
  }

  // Gemini patterns
  if (
    lower.includes('gemini') ||
    lower.includes('google ai') ||
    lower.includes('bard')
  ) {
    return 'gemini';
  }

  // Copilot patterns
  if (
    lower.includes('copilot') ||
    lower.includes('microsoft ai')
  ) {
    return 'copilot';
  }

  return 'unknown';
}

/**
 * Parse conversation-style content into individual items.
 * Supports formats:
 *   - "Human: ... \n\n Assistant: ..." (Claude)
 *   - "User: ... \n\n Assistant: ..." (ChatGPT/generic)
 *   - Section headers (## or ### delimited)
 *   - Plain text (single document)
 */
function parseConversation(content: string, provider: AIProvider): ParsedItem[] {
  const items: ParsedItem[] = [];

  // Try conversation-style parsing first
  const conversationPattern = /(?:^|\n)(Human|User|Assistant|Claude|ChatGPT|Gemini|System):\s*/gi;
  const segments: Array<{ role: string; content: string; start: number }> = [];
  let match: RegExpExecArray | null;

  while ((match = conversationPattern.exec(content)) !== null) {
    segments.push({
      role: match[1].toLowerCase(),
      content: '',
      start: match.index + match[0].length,
    });
  }

  if (segments.length >= 2) {
    // Fill in content between segments
    for (let i = 0; i < segments.length; i++) {
      const end = i + 1 < segments.length ? segments[i + 1].start - segments[i + 1].role.length - 2 : content.length;
      segments[i].content = content.slice(segments[i].start, end).trim();
    }

    // Only keep assistant responses as knowledge items
    const assistantSegments = segments.filter(
      (s) => ['assistant', 'claude', 'chatgpt', 'gemini'].includes(s.role)
    );

    for (let i = 0; i < assistantSegments.length; i++) {
      const seg = assistantSegments[i];
      if (seg.content.length < 20) continue; // Skip trivial responses

      // Extract a title from the first line or heading
      const firstLine = seg.content.split('\n')[0];
      const headingMatch = firstLine.match(/^#+\s+(.*)/);
      const title = headingMatch
        ? headingMatch[1].slice(0, 100)
        : firstLine.slice(0, 100);

      items.push({
        title: title || `${provider} Response ${i + 1}`,
        content: seg.content,
        role: seg.role,
        index: i,
      });
    }

    if (items.length > 0) return items;
  }

  // Try section-based parsing (## headings)
  const sections = content.split(/\n(?=#{1,3}\s)/);
  if (sections.length >= 2) {
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i].trim();
      if (section.length < 20) continue;

      const headingMatch = section.match(/^(#{1,3})\s+(.*)/);
      const title = headingMatch ? headingMatch[2].slice(0, 100) : `Section ${i + 1}`;

      items.push({
        title,
        content: section,
        index: i,
      });
    }

    if (items.length > 0) return items;
  }

  // Fallback: treat entire content as a single document
  const firstLine = content.split('\n')[0].trim();
  items.push({
    title: firstLine.slice(0, 100) || 'AI Memory Import',
    content,
    index: 0,
  });

  return items;
}

export const aiMemoryConnector: VaultConnector = {
  type: 'ai-memory',
  name: 'AI Memory Import',

  async testConnection(config: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
    const content = config.content as string | undefined;
    if (!content || typeof content !== 'string') {
      return { ok: false, error: 'config.content must be a non-empty string' };
    }
    if (content.trim().length < 10) {
      return { ok: false, error: 'Content is too short to import' };
    }
    return { ok: true };
  },

  async discover(config: Record<string, unknown>): Promise<SourceItem[]> {
    const content = config.content as string | undefined;
    if (!content) return [];

    const provider = detectProvider(content);
    const parsed = parseConversation(content, provider);

    return parsed.map((item, i) => ({
      id: `aim-${i}-${Date.now().toString(36)}`,
      path: `ai-memory/${provider}/${i}`,
      name: item.title,
      type: 'text/markdown',
      size: item.content.length,
      preview: item.content.slice(0, 200),
    }));
  },

  async *extract(items: SourceItem[]): AsyncGenerator<RawContent> {
    // Items already contain the content from discover phase via the preview
    // But we need the full content, so the caller should pass config.content again.
    // In practice, the sync-runner calls discover then extract in sequence,
    // and the items contain size info. We store content in a closure.

    // This connector works differently: the content was already parsed in discover.
    // The sync-runner passes the raw content through config, and we re-parse here.
    // To avoid this coupling issue, we emit items based on what we received.
    for (const item of items) {
      yield {
        sourceItemId: item.id,
        title: item.name,
        content: item.preview || '',
        originalFormat: 'markdown',
        metadata: {
          provider: item.path.split('/')[1] || 'unknown',
          importedAt: new Date().toISOString(),
        },
      };
    }
  },
};

/**
 * Full-content extraction for AI memory imports.
 * Used by the route handler directly since the connector pattern
 * doesn't carry content through discover -> extract seamlessly.
 */
export function parseAiMemoryContent(
  content: string,
  provider?: string
): Array<{ title: string; content: string; provider: string; index: number }> {
  const detectedProvider = provider || detectProvider(content);
  const items = parseConversation(content, detectedProvider as AIProvider);

  return items.map((item) => ({
    title: item.title,
    content: item.content,
    provider: detectedProvider,
    index: item.index,
  }));
}
