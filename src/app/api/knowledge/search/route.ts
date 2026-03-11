import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { getProjectRoot } from '@/lib/squad-api-utils';

interface SearchResult {
  name: string;
  path: string;
  size: number;
  modified: string;
  extension: string;
  snippet: string;
  lineNumber?: number;
}

// Extensions eligible for content search
const SEARCHABLE_EXTENSIONS = new Set([
  'md', 'yaml', 'yml', 'json', 'txt',
  'ts', 'tsx', 'js', 'jsx',
  'css', 'scss', 'html',
  'sh', 'bash',
]);

const MAX_RESULTS = 50;
const MAX_SNIPPET_LENGTH = 200;

/**
 * GET /api/knowledge/search?q=term&type=.md
 * Search through project files by content and/or extension.
 * Uses grep for content search when available, falls back to fs-based search.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim() || '';
  const typeFilter = searchParams.get('type')?.replace(/^\./, '').toLowerCase() || '';

  if (!query && !typeFilter) {
    return NextResponse.json({ results: [], total: 0, query: '', type: '' });
  }

  const projectRoot = getProjectRoot();
  const results: SearchResult[] = [];

  // Directories to search in (relative to project root)
  const searchDirs = ['.aios-core', 'docs', 'squads', 'dashboard/src', 'dashboard/aios-platform/src'];

  if (query) {
    // Content search using grep
    try {
      const grepResults = await searchWithGrep(projectRoot, searchDirs, query, typeFilter);
      results.push(...grepResults);
    } catch {
      // Grep failed, fall back to filesystem search
      const fsResults = await searchFilesystem(projectRoot, searchDirs, query, typeFilter);
      results.push(...fsResults);
    }
  } else if (typeFilter) {
    // Extension-only filter: list files of that type
    const fsResults = await searchFilesystem(projectRoot, searchDirs, '', typeFilter);
    results.push(...fsResults);
  }

  return NextResponse.json({
    results: results.slice(0, MAX_RESULTS),
    total: results.length,
    query,
    type: typeFilter,
  });
}

/**
 * Use grep to search file contents. Returns matching files with snippets.
 */
async function searchWithGrep(
  projectRoot: string,
  searchDirs: string[],
  query: string,
  typeFilter: string
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  const seenPaths = new Set<string>();

  // Escape special regex characters for a literal search
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Build include patterns for grep
  let includeArg = '';
  if (typeFilter) {
    includeArg = `--include="*.${typeFilter}"`;
  } else {
    const includePatterns = Array.from(SEARCHABLE_EXTENSIONS)
      .map((ext) => `--include="*.${ext}"`)
      .join(' ');
    includeArg = includePatterns;
  }

  for (const dir of searchDirs) {
    const fullDir = path.join(projectRoot, dir);
    try {
      await fs.access(fullDir);
    } catch {
      continue;
    }

    try {
      // Use grep with:
      //   -r recursive
      //   -l list filenames only (we'll get snippets separately)
      //   -i case insensitive
      //   -n line numbers
      //   --max-count=3 limit matches per file
      const grepCmd = `grep -rn -i --max-count=3 ${includeArg} --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git -e "${escapedQuery}" "${fullDir}" 2>/dev/null || true`;

      const output = execSync(grepCmd, {
        encoding: 'utf-8',
        timeout: 10000,
        maxBuffer: 1024 * 1024, // 1MB
      });

      if (!output.trim()) continue;

      const lines = output.trim().split('\n');
      for (const line of lines) {
        if (results.length >= MAX_RESULTS) break;

        // Parse grep output: /path/to/file:lineNumber:matched line
        const match = line.match(/^(.+?):(\d+):(.*)$/);
        if (!match) continue;

        const [, absPath, lineNumStr, matchedLine] = match;
        const relPath = path.relative(projectRoot, absPath);

        if (seenPaths.has(relPath)) continue;
        seenPaths.add(relPath);

        const ext = path.extname(relPath).slice(1).toLowerCase();
        if (!SEARCHABLE_EXTENSIONS.has(ext)) continue;

        try {
          const stat = await fs.stat(absPath);
          const snippet = matchedLine.trim().substring(0, MAX_SNIPPET_LENGTH);

          results.push({
            name: path.basename(relPath),
            path: relPath,
            size: stat.size,
            modified: stat.mtime.toISOString(),
            extension: ext,
            snippet,
            lineNumber: parseInt(lineNumStr, 10),
          });
        } catch {
          // File inaccessible
        }
      }
    } catch {
      // grep failed for this directory
    }
  }

  return results;
}

/**
 * Filesystem-based search fallback. Searches file names and optionally content.
 */
async function searchFilesystem(
  projectRoot: string,
  searchDirs: string[],
  query: string,
  typeFilter: string
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  const lowerQuery = query.toLowerCase();

  async function walk(dir: string, relBase: string, depth: number) {
    if (depth > 6 || results.length >= MAX_RESULTS) return;

    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (results.length >= MAX_RESULTS) break;
      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') continue;

      const fullPath = path.join(dir, entry.name);
      const relPath = path.join(relBase, entry.name);

      if (entry.isDirectory()) {
        await walk(fullPath, relPath, depth + 1);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).slice(1).toLowerCase();
        if (!SEARCHABLE_EXTENSIONS.has(ext)) continue;
        if (typeFilter && ext !== typeFilter) continue;

        // Match by filename
        const nameMatches = !query || entry.name.toLowerCase().includes(lowerQuery) || relPath.toLowerCase().includes(lowerQuery);

        let snippet = '';
        let lineNumber: number | undefined;

        // If name doesn't match but we have a query, try content search
        if (!nameMatches && query) {
          try {
            const content = await fs.readFile(fullPath, 'utf-8');
            const lines = content.split('\n');
            for (let i = 0; i < lines.length; i++) {
              if (lines[i].toLowerCase().includes(lowerQuery)) {
                snippet = lines[i].trim().substring(0, MAX_SNIPPET_LENGTH);
                lineNumber = i + 1;
                break;
              }
            }
            if (!snippet) continue; // No match
          } catch {
            continue;
          }
        }

        try {
          const stat = await fs.stat(fullPath);
          results.push({
            name: entry.name,
            path: relPath,
            size: stat.size,
            modified: stat.mtime.toISOString(),
            extension: ext,
            snippet: snippet || entry.name,
            lineNumber,
          });
        } catch {
          // Skip
        }
      }
    }
  }

  for (const dir of searchDirs) {
    const fullDir = path.join(projectRoot, dir);
    try {
      await fs.access(fullDir);
      await walk(fullDir, dir, 0);
    } catch {
      // Directory doesn't exist
    }
  }

  return results;
}
