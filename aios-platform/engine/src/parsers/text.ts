/**
 * Text parser — pass-through for MD, TXT, JSON, YAML files.
 */
export async function parseText(
  buffer: Buffer,
  filename: string
): Promise<{ content: string; metadata: Record<string, unknown> }> {
  const content = buffer.toString('utf-8');
  const ext = filename.split('.').pop()?.toLowerCase() || 'txt';

  return {
    content,
    metadata: {
      format: ext,
      lines: content.split('\n').length,
      bytes: buffer.byteLength,
    },
  };
}
