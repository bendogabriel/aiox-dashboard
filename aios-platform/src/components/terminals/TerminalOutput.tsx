import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { ArrowDown } from 'lucide-react';

interface TerminalOutputProps {
  lines: string[];
  isActive: boolean;
}

// ── Parsed line types ──

interface ParsedLine {
  timestamp: string | null;
  type: 'system' | 'assistant' | 'tool_use' | 'tool_result' | 'text' | 'error' | 'done' | 'raw';
  label: string;
  content: string;
  detail: string | null;
  colorClass: string;
  labelClass: string;
}

// ── ANSI handling (kept for raw lines) ──

interface StyledSegment {
  text: string;
  classes: string;
}

const ANSI_COLOR_MAP: Record<number, string> = {
  30: 'text-black',
  31: 'terminal-error',
  32: 'terminal-prompt',
  33: 'terminal-ansi-yellow',
  34: 'terminal-ansi-blue',
  35: 'terminal-ansi-purple',
  36: 'terminal-ansi-cyan',
  37: 'text-white',
  90: 'terminal-ansi-dim',
  91: 'terminal-error',
  92: 'terminal-prompt',
  93: 'terminal-ansi-yellow',
  94: 'terminal-ansi-blue',
};

function parseAnsiLine(line: string): StyledSegment[] {
  const segments: StyledSegment[] = [];
  // eslint-disable-next-line no-control-regex
  const ansiRegex = /\x1b\[(\d+(?:;\d+)*)m/g;
  let lastIndex = 0;
  let currentClasses = 'terminal-text';
  let match: RegExpExecArray | null;

  while ((match = ansiRegex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: line.slice(lastIndex, match.index), classes: currentClasses });
    }
    const codes = match[1].split(';').map(Number);
    for (const code of codes) {
      if (code === 0) currentClasses = 'text-secondary';
      else if (code === 1) {
        if (!currentClasses.includes('font-bold')) currentClasses += ' font-bold';
      } else if (ANSI_COLOR_MAP[code]) {
        currentClasses = currentClasses.replace(/(?:text-\S+|terminal-\S+)/, ANSI_COLOR_MAP[code]);
      }
    }
    lastIndex = ansiRegex.lastIndex;
  }

  if (lastIndex < line.length) {
    segments.push({ text: line.slice(lastIndex), classes: currentClasses });
  }
  return segments;
}

// eslint-disable-next-line no-control-regex
function hasAnsiCodes(line: string): boolean { return /\x1b\[/.test(line); }

// ── JSON line parser ──

function tryParseJson(line: string): Record<string, unknown> | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null;
  try { return JSON.parse(trimmed); } catch { return null; }
}

/**
 * Split a string that may contain multiple concatenated JSON objects.
 * e.g. '{"a":1}{"b":2}' → ['{"a":1}', '{"b":2}']
 */
function splitJsonBlobs(text: string): string[] {
  const results: string[] = [];
  let depth = 0;
  let start = -1;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0 && start >= 0) {
        results.push(text.slice(start, i + 1));
        start = -1;
      }
    }
  }

  return results;
}

function formatTimestamp(ts: string): string {
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch { return ''; }
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + '...' : s;
}

/**
 * Parse a single raw line into one or more ParsedLines.
 * Handles concatenated JSONs and [timestamp] [status] prefixes.
 */
function parseLineMulti(raw: string): ParsedLine[] {
  if (!raw.trim()) return [];

  // Try timestamp prefix: [2026-03-10T17:04:03.211Z] [type] {json...}{json...}
  const tsMatch = raw.match(/^\[(\d{4}-\d{2}-\d{2}T[\d:.]+Z?)\]\s*\[(\w+)\]\s*(.*)/s);
  if (tsMatch) {
    const ts = tsMatch[1];
    const status = tsMatch[2];
    const rest = tsMatch[3].trim();

    // Try splitting concatenated JSONs
    const blobs = splitJsonBlobs(rest);
    if (blobs.length > 0) {
      return blobs.map((blob) => {
        const json = tryParseJson(blob);
        if (json) return parseJsonEvent(json, ts, status);
        return makeFallbackLine(blob, ts, status);
      });
    }

    // Single non-JSON rest
    return [makeFallbackLine(rest, ts, status)];
  }

  // Try splitting bare concatenated JSONs
  const blobs = splitJsonBlobs(raw);
  if (blobs.length > 0) {
    return blobs.map((blob) => {
      const json = tryParseJson(blob);
      if (json) return parseJsonEvent(json, null, null);
      return { timestamp: null, type: 'raw' as const, label: '', content: blob, detail: null, colorClass: 'text-secondary', labelClass: '' };
    });
  }

  // Raw line
  return [{
    timestamp: null,
    type: 'raw',
    label: '',
    content: raw,
    detail: null,
    colorClass: getHeuristicColor(raw),
    labelClass: '',
  }];
}

function makeFallbackLine(text: string, ts: string, status: string): ParsedLine {
  return {
    timestamp: formatTimestamp(ts),
    type: status === 'error' ? 'error' : 'text',
    label: status.toUpperCase(),
    content: truncate(text, 200),
    detail: null,
    colorClass: status === 'error' ? 'text-[var(--bb-error)]' : 'text-secondary',
    labelClass: status === 'done' ? 'text-[var(--color-status-success)]' : status === 'error' ? 'text-[var(--bb-error)]' : 'text-[var(--aiox-gray-muted)]',
  };
}

function parseJsonEvent(json: Record<string, unknown>, ts: string | null, status: string | null): ParsedLine {
  const type = (json.type as string) || status || 'unknown';
  const subtype = json.subtype as string | undefined;
  const timestamp = ts ? formatTimestamp(ts) : null;

  // system init
  if (type === 'system' && subtype === 'init') {
    const sessionId = (json.session_id as string || '').slice(0, 8);
    const tools = json.tools as string[] | undefined;
    return {
      timestamp,
      type: 'system',
      label: 'INIT',
      content: sessionId ? `Session ${sessionId}` : 'Session started',
      detail: tools ? `${tools.length} tools` : null,
      colorClass: 'text-[var(--aiox-blue)]',
      labelClass: 'text-[var(--aiox-blue)]',
    };
  }

  // assistant message
  if (type === 'assistant') {
    let text = '';
    const message = json.message as string | Record<string, unknown> | undefined;
    if (typeof message === 'string') {
      try {
        const parsed = JSON.parse(message);
        if (parsed?.content) {
          text = Array.isArray(parsed.content)
            ? parsed.content.map((c: Record<string, unknown>) => c.text || '').join('')
            : String(parsed.content);
        }
      } catch {
        text = message;
      }
    } else if (message && typeof message === 'object') {
      const content = message.content;
      if (Array.isArray(content)) {
        text = content.map((c: Record<string, unknown>) => (c.text as string) || '').join('');
      } else if (typeof content === 'string') {
        text = content;
      }
    }
    return {
      timestamp,
      type: 'assistant',
      label: 'AI',
      content: truncate(text || '(thinking...)', 300),
      detail: null,
      colorClass: 'text-[var(--aiox-cream)]',
      labelClass: 'text-[var(--aiox-lime)]',
    };
  }

  // tool_use
  if (type === 'tool_use' || subtype === 'tool_use') {
    const toolName = (json.name as string) || (json.tool as string) || 'tool';
    return {
      timestamp,
      type: 'tool_use',
      label: 'TOOL',
      content: toolName,
      detail: null,
      colorClass: 'text-[var(--aiox-gray-muted)]',
      labelClass: 'text-[var(--bb-warning)]',
    };
  }

  // tool_result
  if (type === 'tool_result' || subtype === 'tool_result') {
    const content = json.content as string | undefined;
    return {
      timestamp,
      type: 'tool_result',
      label: 'RESULT',
      content: truncate(content || '(ok)', 200),
      detail: null,
      colorClass: 'text-[var(--aiox-gray-dim)]',
      labelClass: 'text-[var(--aiox-gray-muted)]',
    };
  }

  // result / done
  if (type === 'result' || status === 'done') {
    const msg = (json.message as string) || '';
    return {
      timestamp,
      type: 'done',
      label: 'DONE',
      content: truncate(msg, 100) || 'Completed',
      detail: null,
      colorClass: 'text-[var(--color-status-success)]',
      labelClass: 'text-[var(--color-status-success)]',
    };
  }

  // error
  if (type === 'error') {
    const msg = (json.message as string) || (json.error as string) || JSON.stringify(json);
    return {
      timestamp,
      type: 'error',
      label: 'ERROR',
      content: truncate(msg, 200),
      detail: null,
      colorClass: 'text-[var(--bb-error)]',
      labelClass: 'text-[var(--bb-error)]',
    };
  }

  // rate_limit_event or other
  if (type === 'rate_limit_event') {
    return {
      timestamp,
      type: 'system',
      label: 'RATE',
      content: 'Rate limit checkpoint',
      detail: null,
      colorClass: 'text-[var(--aiox-gray-dim)]',
      labelClass: 'text-[var(--aiox-gray-dim)]',
    };
  }

  // routed message
  if (json.routed_by || json.original_payload) {
    const msg = (json.message as string) || '';
    const routedBy = (json.routed_by as string) || '';
    return {
      timestamp,
      type: 'system',
      label: 'ROUTE',
      content: msg,
      detail: routedBy ? `via ${routedBy}` : null,
      colorClass: 'text-[var(--aiox-gray-muted)]',
      labelClass: 'text-[var(--aiox-blue)]',
    };
  }

  // generic JSON — show message or compact summary
  const msg = (json.message as string) || '';
  return {
    timestamp,
    type: 'text',
    label: type.toUpperCase().slice(0, 6),
    content: msg || truncate(JSON.stringify(json), 120),
    detail: null,
    colorClass: 'text-secondary',
    labelClass: 'text-[var(--aiox-gray-muted)]',
  };
}

function getHeuristicColor(line: string): string {
  if (line.startsWith('$')) return 'terminal-prompt';
  if (/^PASS|passed/.test(line)) return 'terminal-success';
  if (/FAIL|error|Error/.test(line)) return 'terminal-error';
  return 'terminal-text';
}

// ── Line rendering ──

function RawLine({ line }: { line: string }) {
  if (hasAnsiCodes(line)) {
    const segments = parseAnsiLine(line);
    return (
      <div className="whitespace-pre-wrap py-px">
        {segments.map((seg, i) => (
          <span key={i} className={seg.classes}>{seg.text}</span>
        ))}
      </div>
    );
  }
  return (
    <div className="whitespace-pre-wrap py-px">
      <span className={getHeuristicColor(line)}>{line}</span>
    </div>
  );
}

function ParsedLineRow({ parsed }: { parsed: ParsedLine }) {
  if (parsed.type === 'raw') {
    return <RawLine line={parsed.content} />;
  }

  return (
    <div className="flex items-start gap-2 py-0.5 group hover:bg-white/[0.02] rounded px-1 -mx-1">
      {/* Timestamp */}
      {parsed.timestamp && (
        <span className="text-[var(--aiox-gray-dim)] text-[10px] leading-[18px] flex-shrink-0 w-[52px] tabular-nums opacity-50 group-hover:opacity-80">
          {parsed.timestamp}
        </span>
      )}

      {/* Label badge */}
      {parsed.label && (
        <span
          className={`text-[9px] font-bold uppercase tracking-wider leading-[18px] flex-shrink-0 w-[42px] text-right ${parsed.labelClass}`}
        >
          {parsed.label}
        </span>
      )}

      {/* Separator */}
      <span className="text-[var(--aiox-gray-dim)]/30 leading-[18px] flex-shrink-0 select-none">|</span>

      {/* Content */}
      <span className={`${parsed.colorClass} leading-[18px] break-words min-w-0`}>
        {parsed.content}
        {parsed.detail && (
          <span className="text-[var(--aiox-gray-dim)] ml-2 text-[10px]">{parsed.detail}</span>
        )}
      </span>
    </div>
  );
}

// ── Main component ──

export function TerminalOutput({ lines, isActive }: TerminalOutputProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const parsedLines = useMemo(() => lines.flatMap(parseLineMulti), [lines]);

  const scrollToBottom = useCallback(() => {
    const el = containerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
      setIsAtBottom(true);
    }
  }, []);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const threshold = 40;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    setIsAtBottom(atBottom);
  }, []);

  useEffect(() => {
    if (isAtBottom) {
      const el = containerRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, [lines.length, isAtBottom]);

  return (
    <div className="relative flex-1 overflow-hidden">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full bg-black/80 p-3 font-mono text-xs leading-relaxed overflow-y-auto"
        tabIndex={0}
        role="region"
        aria-label="Saida do terminal"
      >
        {parsedLines.map((parsed, i) => (
          <ParsedLineRow key={i} parsed={parsed} />
        ))}
        {isActive && (
          <span className="terminal-cursor animate-pulse">_</span>
        )}
      </div>

      {!isAtBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-3 right-3 p-1.5 rounded-lg glass text-xs text-secondary hover:text-primary flex items-center gap-1 transition-colors"
          aria-label="Scroll to bottom"
        >
          <ArrowDown className="h-3 w-3" />
          <span>Bottom</span>
        </button>
      )}
    </div>
  );
}
