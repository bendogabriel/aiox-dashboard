import { NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execFileAsync = promisify(execFile);

// ─── Cache ───────────────────────────────────────────────────
interface CacheEntry {
  data: GitHubResponse;
  timestamp: number;
}

let cache: CacheEntry | null = null;
const CACHE_TTL_MS = 60_000; // 60 seconds

// ─── Types ───────────────────────────────────────────────────
interface GitCommit {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
  refs: string[];
}

interface GitHubPR {
  number: number;
  title: string;
  state: string;
  url: string;
  createdAt: string;
  author: { login: string };
  headRefName: string;
  isDraft: boolean;
}

interface GitHubIssue {
  number: number;
  title: string;
  state: string;
  labels: { name: string; color: string }[];
  url: string;
  createdAt: string;
  author: { login: string };
}

interface RepoInfo {
  name: string;
  owner: { login: string };
  url: string;
}

interface GitHubResponse {
  commits: GitCommit[];
  pullRequests: GitHubPR[];
  issues: GitHubIssue[];
  repoInfo: RepoInfo | null;
  source: 'live' | 'partial' | 'git-only';
  ghAvailable: boolean;
  updatedAt: string;
}

// ─── Git repo root (navigate up from dashboard/src/app/api/github/) ──
const GIT_REPO_ROOT = path.resolve(process.cwd(), '..');

// ─── Helpers ─────────────────────────────────────────────────
async function getGitCommits(): Promise<GitCommit[]> {
  try {
    // Get commits with decoration info
    const { stdout } = await execFileAsync(
      'git',
      [
        'log',
        '--oneline',
        '-20',
        '--format=%H|%h|%s|%an|%aI|%D',
      ],
      { cwd: GIT_REPO_ROOT, timeout: 10_000 }
    );

    if (!stdout.trim()) return [];

    // Try to get remote URL for building commit links
    let remoteUrl = '';
    try {
      const { stdout: remote } = await execFileAsync(
        'git',
        ['config', '--get', 'remote.origin.url'],
        { cwd: GIT_REPO_ROOT, timeout: 5_000 }
      );
      remoteUrl = remote.trim()
        .replace(/\.git$/, '')
        .replace(/^git@github\.com:/, 'https://github.com/')
        .replace(/^ssh:\/\/git@github\.com\//, 'https://github.com/');
    } catch {
      // No remote configured
    }

    return stdout
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const [fullHash, shortHash, message, author, date, decorations] = line.split('|');
        const refs = decorations
          ? decorations
              .split(', ')
              .map((r) => r.trim())
              .filter(Boolean)
          : [];
        const url = remoteUrl ? `${remoteUrl}/commit/${fullHash}` : '#';
        return {
          sha: shortHash,
          message,
          author,
          date,
          url,
          refs,
        };
      });
  } catch {
    return [];
  }
}

async function checkGhAvailable(): Promise<boolean> {
  try {
    await execFileAsync('gh', ['auth', 'status'], { timeout: 5_000 });
    return true;
  } catch {
    return false;
  }
}

async function getGhPullRequests(): Promise<GitHubPR[]> {
  try {
    const { stdout } = await execFileAsync(
      'gh',
      [
        'pr',
        'list',
        '--state',
        'all',
        '--json',
        'number,title,state,url,createdAt,author,headRefName,isDraft',
        '--limit',
        '10',
      ],
      { cwd: GIT_REPO_ROOT, timeout: 15_000 }
    );
    return JSON.parse(stdout || '[]');
  } catch {
    return [];
  }
}

async function getGhIssues(): Promise<GitHubIssue[]> {
  try {
    const { stdout } = await execFileAsync(
      'gh',
      [
        'issue',
        'list',
        '--state',
        'all',
        '--json',
        'number,title,state,labels,url,createdAt,author',
        '--limit',
        '10',
      ],
      { cwd: GIT_REPO_ROOT, timeout: 15_000 }
    );
    const raw = JSON.parse(stdout || '[]');
    // Normalize labels to include color field
    return raw.map((issue: GitHubIssue & { labels?: { name: string; color?: string }[] }) => ({
      ...issue,
      labels: (issue.labels || []).map((l) => ({
        name: l.name,
        color: l.color || '6B7280',
      })),
    }));
  } catch {
    return [];
  }
}

async function getRepoInfo(): Promise<RepoInfo | null> {
  try {
    const { stdout } = await execFileAsync(
      'gh',
      ['repo', 'view', '--json', 'name,owner,url'],
      { cwd: GIT_REPO_ROOT, timeout: 10_000 }
    );
    return JSON.parse(stdout);
  } catch {
    return null;
  }
}

// ─── GET handler ─────────────────────────────────────────────
export async function GET() {
  try {
    // Return cached data if fresh
    if (cache && Date.now() - cache.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(cache.data, {
        headers: { 'X-Cache': 'HIT' },
      });
    }

    // Always fetch git commits (works without gh CLI)
    const commits = await getGitCommits();

    // Check if gh CLI is available and authenticated
    const ghAvailable = await checkGhAvailable();

    let pullRequests: GitHubPR[] = [];
    let issues: GitHubIssue[] = [];
    let repoInfo: RepoInfo | null = null;

    if (ghAvailable) {
      // Fetch PRs, issues, and repo info in parallel
      const [prs, iss, repo] = await Promise.all([
        getGhPullRequests(),
        getGhIssues(),
        getRepoInfo(),
      ]);
      pullRequests = prs;
      issues = iss;
      repoInfo = repo;
    }

    const source: GitHubResponse['source'] = ghAvailable
      ? 'live'
      : commits.length > 0
        ? 'git-only'
        : 'partial';

    const data: GitHubResponse = {
      commits,
      pullRequests,
      issues,
      repoInfo,
      source,
      ghAvailable,
      updatedAt: new Date().toISOString(),
    };

    // Update cache
    cache = { data, timestamp: Date.now() };

    return NextResponse.json(data, {
      headers: { 'X-Cache': 'MISS' },
    });
  } catch (error) {
    console.error('GitHub API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch GitHub data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
