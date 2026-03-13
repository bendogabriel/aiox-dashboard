/**
 * XLSX/CSV parser — converts spreadsheets to markdown tables.
 * Uses xlsx (SheetJS, pure JS, Bun-compatible).
 */
export async function parseXlsx(
  buffer: Buffer,
  filename: string
): Promise<{ content: string; metadata: Record<string, unknown> }> {
  try {
    const XLSX = await import('xlsx');
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheets: string[] = [];

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { header: 1 }) as unknown[][];

      if (rows.length === 0) continue;

      // Build markdown table
      const header = rows[0] as string[];
      let md = `## ${sheetName}\n\n`;
      md += '| ' + header.map(h => String(h ?? '')).join(' | ') + ' |\n';
      md += '| ' + header.map(() => '---').join(' | ') + ' |\n';

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i] as unknown[];
        md += '| ' + header.map((_, j) => String(row[j] ?? '')).join(' | ') + ' |\n';
      }

      sheets.push(md);
    }

    return {
      content: sheets.join('\n\n'),
      metadata: {
        format: filename.endsWith('.csv') ? 'csv' : 'xlsx',
        sheets: workbook.SheetNames.length,
        bytes: buffer.byteLength,
      },
    };
  } catch (error) {
    return {
      content: `[XLSX parse error: ${(error as Error).message}]`,
      metadata: { format: 'xlsx', error: (error as Error).message, bytes: buffer.byteLength },
    };
  }
}
