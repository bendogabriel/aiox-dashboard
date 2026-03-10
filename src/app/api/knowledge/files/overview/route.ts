import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { getProjectRoot } from '@/lib/squad-api-utils';

interface FileInfo {
  name: string;
  path: string;
  size: number;
  modified: string;
  extension: string;
}

// ── In-memory cache ──
let cachedResult: {
  data: Record<string, unknown>;
  timestamp: number;
} | null = null;

const CACHE_TTL_MS = 60_000; // 60 seconds

// Allowed file extensions for scanning
const SCAN_EXTENSIONS = new Set([
  'md', 'yaml', 'yml', 'json', 'txt',
  'ts', 'tsx', 'js', 'jsx',
  'css', 'scss', 'html',
  'sh', 'bash',
]);

// Max depth to prevent runaway recursion
const MAX_DEPTH = 8;

// Max files to collect before stopping (safety cap)
const MAX_FILES = 5000;

/**
 * GET /api/knowledge/files/overview
 * Returns overview stats of project knowledge files.
 * Scans .aios-core/, docs/, squads/, src/, dashboard/ recursively.
 * Uses git log for recent files when available.
 * Results cached for 60 seconds.
 */
export async function GET() {
  // Return cached result if fresh
  if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cachedResult.data);
  }

  const projectRoot = getProjectRoot();
  let totalFiles = 0;
  let totalDirectories = 0;
  let totalSize = 0;
  const byExtension: Record<string, number> = {};
  const allFiles: FileInfo[] = [];

  // Directories to scan (relative to project root)
  const dirsToScan = ['.aios-core', 'docs', 'squads', 'dashboard/src', 'dashboard/aios-platform/src'];

  async function walk(dir: string, relBase: string, depth: number) {
    if (depth > MAX_DEPTH || totalFiles >= MAX_FILES) return;

    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (totalFiles >= MAX_FILES) break;
      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'build') continue;

      const fullPath = path.join(dir, entry.name);
      const relPath = path.join(relBase, entry.name);

      if (entry.isDirectory()) {
        totalDirectories++;
        await walk(fullPath, relPath, depth + 1);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).slice(1).toLowerCase();
        if (ext && SCAN_EXTENSIONS.has(ext)) {
          try {
            const stat = await fs.stat(fullPath);
            totalFiles++;
            totalSize += stat.size;
            byExtension[ext] = (byExtension[ext] || 0) + 1;
            allFiles.push({
              name: entry.name,
              path: relPath,
              size: stat.size,
              modified: stat.mtime.toISOString(),
              extension: ext,
            });
          } catch {
            // Skip inaccessible files
          }
        }
      }
    }
  }

  for (const dir of dirsToScan) {
    const fullDir = path.join(projectRoot, dir);
    try {
      await fs.access(fullDir);
      await walk(fullDir, dir, 0);
    } catch {
      // Directory doesn't exist, skip
    }
  }

  // Try to get recent files from git log for better "modified" timestamps
  let recentFiles: FileInfo[] = [];
  try {
    const gitOutput = execSync(
      'git log --diff-filter=AM --name-only --format=%aI -20 --no-merges 2>/dev/null',
      { cwd: projectRoot, encoding: 'utf-8', timeout: 5000 }
    );

    const lines = gitOutput.trim().split('\n');
    let currentTimestamp = '';
    const seenPaths = new Set<string>();

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // ISO date line (from --format=%aI)
      if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) {
        currentTimestamp = trimmed;
        continue;
      }

      // File path line
      if (currentTimestamp && !seenPaths.has(trimmed) && recentFiles.length < 20) {
        seenPaths.add(trimmed);
        const ext = path.extname(trimmed).slice(1).toLowerCase();
        if (!ext || !SCAN_EXTENSIONS.has(ext)) continue;

        const fullPath = path.join(projectRoot, trimmed);
        try {
          const stat = await fs.stat(fullPath);
          recentFiles.push({
            name: path.basename(trimmed),
            path: trimmed,
            size: stat.size,
            modified: currentTimestamp,
            extension: ext,
          });
        } catch {
          // File may have been deleted since the commit
        }
      }
    }
  } catch {
    // git not available or failed — fall back to filesystem-sorted files
    allFiles.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());
    recentFiles = allFiles.slice(0, 20);
  }

  const result = {
    totalFiles,
    totalDirectories,
    totalSize,
    byExtension,
    recentFiles,
  };

  // Cache the result
  cachedResult = { data: result, timestamp: Date.now() };

  return NextResponse.json(result);
}
