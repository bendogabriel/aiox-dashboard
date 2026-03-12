/**
 * Git Checkpoint Manager — Story 8.2
 *
 * Manages experiment branches with speculative commits and automatic reverts.
 * Guarantees monotonic branch tip (never regresses vs baseline).
 *
 * Inspired by karpathy/autoresearch: "agent only touches train.py"
 * → Here: agent only touches files matching `editable_scope` globs.
 */

import { log } from '../lib/logger';

export interface GitCheckpointConfig {
  branchPrefix: string;       // e.g. "overnight"
  programName: string;
  editableScope: string[];    // glob patterns for editable files
  readonlyScope: string[];    // glob patterns that must NOT be modified
  squashOnComplete: boolean;
  autoPR: boolean;
  workingDir: string;         // absolute path to repo
}

export interface ScopeViolation {
  file: string;
  reason: 'readonly' | 'out_of_scope';
}

/**
 * Execute a git command in the working directory.
 * Returns stdout as string. Throws on non-zero exit.
 */
async function git(args: string[], cwd: string): Promise<string> {
  const proc = Bun.spawn(['git', ...args], {
    cwd,
    stdout: 'pipe',
    stderr: 'pipe',
  });

  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    throw new Error(`git ${args[0]} failed (exit ${exitCode}): ${stderr.trim()}`);
  }

  return stdout.trim();
}

export class GitCheckpoint {
  private config: GitCheckpointConfig;
  private branchName: string;
  private baseBranch: string = '';
  private firstCommitSha: string = '';

  constructor(config: GitCheckpointConfig) {
    this.config = config;
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 13);
    this.branchName = `${config.branchPrefix}/${config.programName}/${timestamp}`;
  }

  get branch(): string {
    return this.branchName;
  }

  /** Create experiment branch from current HEAD */
  async createBranch(): Promise<string> {
    const cwd = this.config.workingDir;

    // Save current branch
    this.baseBranch = await git(['rev-parse', '--abbrev-ref', 'HEAD'], cwd);

    // Create and checkout experiment branch
    await git(['checkout', '-b', this.branchName], cwd);

    log.info('Git checkpoint: branch created', {
      branch: this.branchName,
      base: this.baseBranch,
    });

    return this.branchName;
  }

  /** Validate that modified files are within editable scope and not in readonly scope */
  async validateScope(): Promise<ScopeViolation[]> {
    const cwd = this.config.workingDir;
    const violations: ScopeViolation[] = [];

    // Get list of modified files (staged + unstaged)
    const diffOutput = await git(['diff', '--name-only', 'HEAD'], cwd).catch(() => '');
    const stagedOutput = await git(['diff', '--cached', '--name-only'], cwd).catch(() => '');

    const modifiedFiles = new Set(
      [...diffOutput.split('\n'), ...stagedOutput.split('\n')].filter(Boolean)
    );

    if (modifiedFiles.size === 0) return violations;

    for (const file of modifiedFiles) {
      // Check readonly scope
      if (matchesGlobs(file, this.config.readonlyScope)) {
        violations.push({ file, reason: 'readonly' });
        continue;
      }

      // Check editable scope (if defined, file must match)
      if (this.config.editableScope.length > 0 && !matchesGlobs(file, this.config.editableScope)) {
        violations.push({ file, reason: 'out_of_scope' });
      }
    }

    if (violations.length > 0) {
      log.warn('Git checkpoint: scope violations detected', { violations });
    }

    return violations;
  }

  /** Create speculative commit (savepoint) for current changes */
  async speculativeCommit(iteration: number, hypothesis: string): Promise<string | null> {
    const cwd = this.config.workingDir;

    // Stage editable files only
    if (this.config.editableScope.length > 0) {
      for (const glob of this.config.editableScope) {
        await git(['add', glob], cwd).catch(() => {});
      }
    } else {
      await git(['add', '-A'], cwd);
    }

    // Check if there are changes to commit
    const status = await git(['status', '--porcelain'], cwd);
    if (!status.trim()) {
      log.info('Git checkpoint: no changes to commit', { iteration });
      return null;
    }

    // Commit
    const shortHypothesis = hypothesis.slice(0, 72);
    const message = `experiment(${iteration}): ${shortHypothesis}`;
    await git(['commit', '-m', message], cwd);

    const sha = await git(['rev-parse', 'HEAD'], cwd);

    // Track first commit for squash
    if (!this.firstCommitSha) {
      this.firstCommitSha = sha;
    }

    log.info('Git checkpoint: speculative commit', { iteration, sha: sha.slice(0, 8) });
    return sha;
  }

  /** Revert last commit (discard experiment) */
  async revert(): Promise<void> {
    const cwd = this.config.workingDir;
    await git(['reset', '--hard', 'HEAD~1'], cwd);
    log.info('Git checkpoint: reverted last commit');
  }

  /** Keep last commit (noop — commit already exists) */
  async keep(): Promise<void> {
    log.info('Git checkpoint: keeping commit (branch tip advanced)');
  }

  /** Get list of files modified since last commit */
  async getModifiedFiles(): Promise<string[]> {
    const cwd = this.config.workingDir;
    const output = await git(['diff', '--name-only', 'HEAD'], cwd).catch(() => '');
    const staged = await git(['diff', '--cached', '--name-only'], cwd).catch(() => '');
    return [...new Set([...output.split('\n'), ...staged.split('\n')].filter(Boolean))];
  }

  /** Squash all experiment commits into one */
  async squashAll(message: string): Promise<string | null> {
    if (!this.firstCommitSha) return null;

    const cwd = this.config.workingDir;

    // Soft reset to before first experiment commit, then recommit
    const parentSha = await git(['rev-parse', `${this.firstCommitSha}~1`], cwd).catch(() => null);
    if (!parentSha) return null;

    await git(['reset', '--soft', parentSha], cwd);

    const status = await git(['status', '--porcelain'], cwd);
    if (!status.trim()) return null;

    await git(['commit', '-m', message], cwd);
    const sha = await git(['rev-parse', 'HEAD'], cwd);

    log.info('Git checkpoint: squashed all commits', { sha: sha.slice(0, 8) });
    return sha;
  }

  /** Create PR from experiment branch */
  async createPR(title: string, body: string): Promise<string | null> {
    const cwd = this.config.workingDir;
    try {
      // Push branch
      await git(['push', '-u', 'origin', this.branchName], cwd);

      // Create PR
      const proc = Bun.spawn(
        ['gh', 'pr', 'create', '--title', title, '--body', body, '--base', this.baseBranch],
        { cwd, stdout: 'pipe', stderr: 'pipe' }
      );
      const url = await new Response(proc.stdout).text();
      const exitCode = await proc.exited;

      if (exitCode !== 0) {
        log.warn('Git checkpoint: PR creation failed');
        return null;
      }

      log.info('Git checkpoint: PR created', { url: url.trim() });
      return url.trim();
    } catch (err) {
      log.warn('Git checkpoint: PR creation error', { error: (err as Error).message });
      return null;
    }
  }

  /** Cleanup experiment branch (on cancel) */
  async cleanup(): Promise<void> {
    const cwd = this.config.workingDir;
    try {
      await git(['checkout', this.baseBranch], cwd);
      await git(['branch', '-D', this.branchName], cwd);
      log.info('Git checkpoint: branch cleaned up', { branch: this.branchName });
    } catch {
      log.warn('Git checkpoint: cleanup failed (branch may not exist)');
    }
  }

  /** Return to base branch (on completion) */
  async returnToBase(): Promise<void> {
    const cwd = this.config.workingDir;
    await git(['checkout', this.baseBranch], cwd);
  }
}

// ── Glob matching helper ──

function matchesGlobs(filePath: string, globs: string[]): boolean {
  for (const glob of globs) {
    if (minimatch(filePath, glob)) return true;
  }
  return false;
}

/** Simple glob matcher (supports * and **) */
function minimatch(filePath: string, pattern: string): boolean {
  // Convert glob to regex
  const regex = pattern
    .replace(/\./g, '\\.')
    .replace(/\*\*/g, '{{DOUBLESTAR}}')
    .replace(/\*/g, '[^/]*')
    .replace(/\{\{DOUBLESTAR\}\}/g, '.*')
    .replace(/\?/g, '.');

  return new RegExp(`^${regex}$`).test(filePath);
}
