/**
 * Claude CLI spawn wrapper.
 *
 * Handles the stream-json output format from `claude -p`.
 *
 * CRITICAL gotcha in -p (print) mode:
 * - Does NOT emit content_block_delta events
 * - Emits: system → assistant (partial text) → rate_limit_event → result (full text)
 * - assistant and result contain the SAME text — accumulating both causes duplication
 * - Use assistant for streaming chunks, result for the final complete response
 */

export interface ClaudeStreamEvent {
  type: string;
  subtype?: string;
  message?: string | Record<string, unknown>;
  result?: string;
  session_id?: string;
  input_tokens?: number;
  output_tokens?: number;
  model?: string;
  cost_usd?: number;
  duration_ms?: number;
  duration_api_ms?: number;
  num_turns?: number;
}

export interface ClaudeSpawnResult {
  process: ReturnType<typeof Bun.spawn>;
  events: () => AsyncGenerator<ClaudeStreamEvent>;
  kill: () => void;
}

/**
 * Extract text content from an assistant event's message field.
 * The message can be either a plain string or a JSON string containing
 * {content:[{type:"text",text:"..."}]}.
 */
export function extractTextFromAssistant(message: string | Record<string, unknown> | undefined): string {
  if (!message) return '';

  // Handle object directly (Claude CLI can return message as object)
  if (typeof message === 'object') {
    if (Array.isArray(message.content)) {
      return (message.content as Array<{ type: string; text?: string }>)
        .filter(c => c.type === 'text' && c.text)
        .map(c => c.text)
        .join('');
    }
    if (typeof message.content === 'string') return message.content;
    return '';
  }

  // Handle JSON string
  try {
    const parsed = JSON.parse(message);
    if (parsed?.content && Array.isArray(parsed.content)) {
      return parsed.content
        .filter((c: { type: string }) => c.type === 'text')
        .map((c: { text: string }) => c.text)
        .join('');
    }
    return message;
  } catch {
    return message;
  }
}

let _isClaudeAvailable: boolean | null = null;

export function isClaudeAvailable(): boolean {
  if (_isClaudeAvailable !== null) return _isClaudeAvailable;
  try {
    const result = Bun.spawnSync(['claude', '--version']);
    _isClaudeAvailable = result.exitCode === 0;
  } catch {
    _isClaudeAvailable = false;
  }
  return _isClaudeAvailable;
}

export function spawnClaude(
  prompt: string,
  options?: { model?: string }
): ClaudeSpawnResult {
  // Use stdin for prompt to avoid shell escaping issues and
  // Claude CLI interpreting --- (YAML frontmatter) as CLI options
  const args = ['claude', '-p', '-', '--output-format', 'stream-json', '--verbose'];
  if (options?.model) {
    args.push('--model', options.model);
  }

  // Remove CLAUDECODE from env to prevent recursive Claude Code detection
  const env = { ...process.env } as Record<string, string | undefined>;
  delete env.CLAUDECODE;

  const proc = Bun.spawn(args, {
    stdout: 'pipe',
    stderr: 'pipe',
    stdin: new Response(prompt),
    env: env as Record<string, string>,
  });

  async function* eventGenerator(): AsyncGenerator<ClaudeStreamEvent> {
    const reader = proc.stdout.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop()!;

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const event = JSON.parse(trimmed) as ClaudeStreamEvent;
            yield event;
          } catch {
            // Non-JSON line, skip
          }
        }
      }

      // Process remaining buffer
      if (buffer.trim()) {
        try {
          yield JSON.parse(buffer.trim()) as ClaudeStreamEvent;
        } catch {
          // Skip
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  return {
    process: proc,
    events: eventGenerator,
    kill: () => proc.kill(),
  };
}
