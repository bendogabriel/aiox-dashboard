/**
 * PDF parser — extracts text content from PDF files.
 * Uses pdf-parse (pure JS, Bun-compatible).
 */
export async function parsePdf(
  buffer: Buffer,
  filename: string
): Promise<{ content: string; metadata: Record<string, unknown> }> {
  try {
    // Dynamic import to avoid issues when pdf-parse is not installed
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(buffer);

    return {
      content: data.text,
      metadata: {
        format: 'pdf',
        pages: data.numpages,
        info: data.info,
        bytes: buffer.byteLength,
      },
    };
  } catch (error) {
    return {
      content: `[PDF parse error: ${(error as Error).message}]`,
      metadata: { format: 'pdf', error: (error as Error).message, bytes: buffer.byteLength },
    };
  }
}
