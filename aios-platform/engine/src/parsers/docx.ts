/**
 * DOCX parser — extracts markdown from Word documents.
 * Uses mammoth (pure JS, Bun-compatible).
 */
export async function parseDocx(
  buffer: Buffer,
  filename: string
): Promise<{ content: string; metadata: Record<string, unknown> }> {
  try {
    const mammoth = await import('mammoth');
    const result = await mammoth.convertToMarkdown({ buffer });

    return {
      content: result.value,
      metadata: {
        format: 'docx',
        warnings: result.messages.length,
        bytes: buffer.byteLength,
      },
    };
  } catch (error) {
    return {
      content: `[DOCX parse error: ${(error as Error).message}]`,
      metadata: { format: 'docx', error: (error as Error).message, bytes: buffer.byteLength },
    };
  }
}
