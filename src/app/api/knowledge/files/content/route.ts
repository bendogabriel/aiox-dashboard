import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getProjectRoot, resolvePathWithin } from '@/lib/squad-api-utils';

// Max file size to read (512 KB)
const MAX_FILE_SIZE = 512 * 1024;

// Extensions allowed to be read as text
const READABLE_EXTENSIONS = new Set([
  'md', 'yaml', 'yml', 'json', 'txt',
  'ts', 'tsx', 'js', 'jsx',
  'css', 'scss', 'html',
  'sh', 'bash', 'env', 'toml', 'ini',
  'xml', 'svg',
]);

/**
 * GET /api/knowledge/files/content?path=relative/path/to/file
 * Returns the text content of a file within the project root.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestedPath = searchParams.get('path');

  if (!requestedPath) {
    return NextResponse.json(
      { error: 'Missing required query parameter: path' },
      { status: 400 }
    );
  }

  const projectRoot = getProjectRoot();
  const resolvedPath = resolvePathWithin(projectRoot, requestedPath);

  if (!resolvedPath) {
    return NextResponse.json(
      { error: 'Invalid path' },
      { status: 400 }
    );
  }

  try {
    const stat = await fs.stat(resolvedPath);

    if (!stat.isFile()) {
      return NextResponse.json(
        { error: 'Path is not a file' },
        { status: 400 }
      );
    }

    const ext = path.extname(resolvedPath).slice(1).toLowerCase();
    if (!READABLE_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { error: `File type .${ext} is not supported for reading` },
        { status: 415 }
      );
    }

    if (stat.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large (${stat.size} bytes). Maximum is ${MAX_FILE_SIZE} bytes.` },
        { status: 413 }
      );
    }

    const content = await fs.readFile(resolvedPath, 'utf-8');

    return NextResponse.json({
      path: requestedPath,
      name: path.basename(resolvedPath),
      content,
      size: stat.size,
      modified: stat.mtime.toISOString(),
      extension: ext,
    });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to read file' },
      { status: 500 }
    );
  }
}
