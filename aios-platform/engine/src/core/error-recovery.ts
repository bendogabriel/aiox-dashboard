/**
 * Error Recovery — Story 8.10
 *
 * Graduated error recovery for overnight programs.
 * Classifies errors into 3 severity classes and applies appropriate recovery.
 *
 * From autoresearch pattern:
 * - TRIVIAL (syntax error, import error): auto-fix 1 attempt, re-run
 * - MODERATE (test failure, logic error): 2 attempts with understanding, then abandon
 * - FUNDAMENTAL (dependency conflict, architecture issue): abandon immediately
 *
 * Additional safeguards:
 * - Circuit breaker: pause after 5 consecutive errors
 * - Disk space guard: check available space before iteration
 * - Process orphan cleanup on startup
 */

import { log } from '../lib/logger';
import { AlertDispatcher, type ErrorSeverityClass } from './alert-dispatcher';

// ── Error Classifier ──

/** Patterns that indicate error severity */
const TRIVIAL_PATTERNS = [
  /SyntaxError/i,
  /Cannot find module/i,
  /unexpected token/i,
  /Missing semicolon/i,
  /Unterminated string/i,
  /is not defined/i,
  /Unexpected identifier/i,
  /Missing closing/i,
  /Expected.*got/i,
];

const MODERATE_PATTERNS = [
  /Test failed/i,
  /AssertionError/i,
  /AssertError/i,
  /TypeError/i,
  /ReferenceError/i,
  /Build failed/i,
  /Compilation error/i,
  /type.*not assignable/i,
  /Property.*does not exist/i,
  /FAIL\s+src\//i,
];

const FUNDAMENTAL_PATTERNS = [
  /ENOSPC/i,
  /out of memory/i,
  /SIGKILL/i,
  /ENOMEM/i,
  /FATAL ERROR/i,
  /heap.*limit/i,
  /JavaScript heap/i,
  /Segmentation fault/i,
  /core dumped/i,
  /permission denied/i,
  /EACCES/i,
];

export function classifyError(errorMessage: string): ErrorSeverityClass {
  // Check fundamental first (most critical)
  for (const pattern of FUNDAMENTAL_PATTERNS) {
    if (pattern.test(errorMessage)) return 'fundamental';
  }

  // Check moderate
  for (const pattern of MODERATE_PATTERNS) {
    if (pattern.test(errorMessage)) return 'moderate';
  }

  // Check trivial
  for (const pattern of TRIVIAL_PATTERNS) {
    if (pattern.test(errorMessage)) return 'trivial';
  }

  // Default: moderate (safe middle ground)
  return 'moderate';
}

// ── Recovery Manager ──

export interface RecoveryConfig {
  maxTrivialRetries: number;    // default: 1
  maxModerateRetries: number;   // default: 2
  circuitBreakerThreshold: number; // default: 5
  minDiskSpaceGb: number;       // default: 1
}

interface RecoveryState {
  consecutiveErrors: number;
  lastErrorClass: ErrorSeverityClass | null;
  retryCount: number;
}

export class ErrorRecovery {
  private config: RecoveryConfig;
  private states: Map<string, RecoveryState> = new Map();
  private alertDispatcher: AlertDispatcher;

  constructor(alertDispatcher: AlertDispatcher, config?: Partial<RecoveryConfig>) {
    this.alertDispatcher = alertDispatcher;
    this.config = {
      maxTrivialRetries: config?.maxTrivialRetries ?? 1,
      maxModerateRetries: config?.maxModerateRetries ?? 2,
      circuitBreakerThreshold: config?.circuitBreakerThreshold ?? 5,
      minDiskSpaceGb: config?.minDiskSpaceGb ?? 1,
    };
  }

  /** Get or create recovery state for a program */
  private getState(programId: string): RecoveryState {
    let state = this.states.get(programId);
    if (!state) {
      state = { consecutiveErrors: 0, lastErrorClass: null, retryCount: 0 };
      this.states.set(programId, state);
    }
    return state;
  }

  /** Record a successful iteration (resets error counters) */
  recordSuccess(programId: string): void {
    const state = this.getState(programId);
    state.consecutiveErrors = 0;
    state.lastErrorClass = null;
    state.retryCount = 0;
  }

  /**
   * Handle an error and determine recovery action.
   * Returns the action to take.
   */
  async handleError(
    programId: string,
    programName: string,
    errorMessage: string,
  ): Promise<RecoveryAction> {
    const state = this.getState(programId);
    const errorClass = classifyError(errorMessage);

    state.consecutiveErrors++;
    state.lastErrorClass = errorClass;

    log.warn('Error recovery: handling error', {
      programId,
      errorClass,
      consecutiveErrors: state.consecutiveErrors,
      errorMessage: errorMessage.slice(0, 200),
    });

    // Circuit breaker check
    if (state.consecutiveErrors >= this.config.circuitBreakerThreshold) {
      await this.alertDispatcher.consecutiveErrors(programId, programName, state.consecutiveErrors);
      return { action: 'pause', reason: `Circuit breaker: ${state.consecutiveErrors} consecutive errors` };
    }

    // Alert on 3+ consecutive errors
    if (state.consecutiveErrors >= 3) {
      await this.alertDispatcher.consecutiveErrors(programId, programName, state.consecutiveErrors);
    }

    // Recovery by error class
    switch (errorClass) {
      case 'trivial': {
        if (state.retryCount < this.config.maxTrivialRetries) {
          state.retryCount++;
          await this.alertDispatcher.recoveryAttempt(programId, programName, errorClass, state.retryCount);
          return {
            action: 'retry',
            reason: `Trivial error — auto-retry (attempt ${state.retryCount}/${this.config.maxTrivialRetries})`,
            hint: `Fix the syntax/import error and try again. Error: ${errorMessage.slice(0, 100)}`,
          };
        }
        state.retryCount = 0;
        return { action: 'skip', reason: 'Trivial error — max retries exceeded, skipping iteration' };
      }

      case 'moderate': {
        if (state.retryCount < this.config.maxModerateRetries) {
          state.retryCount++;
          await this.alertDispatcher.recoveryAttempt(programId, programName, errorClass, state.retryCount);
          return {
            action: 'retry',
            reason: `Moderate error — retry with context (attempt ${state.retryCount}/${this.config.maxModerateRetries})`,
            hint: `The previous attempt failed with: ${errorMessage.slice(0, 150)}. Understand the error and try a different approach.`,
          };
        }
        state.retryCount = 0;
        return { action: 'skip', reason: 'Moderate error — max retries exceeded, abandoning iteration' };
      }

      case 'fundamental':
        return {
          action: 'skip',
          reason: `Fundamental error — cannot recover. ${errorMessage.slice(0, 100)}`,
        };
    }
  }

  /** Check disk space before iteration */
  async checkDiskSpace(programId: string, programName: string): Promise<boolean> {
    try {
      const result = Bun.spawnSync(['df', '-g', '.']);
      const output = result.stdout.toString();
      const lines = output.trim().split('\n');
      if (lines.length < 2) return true;

      // Parse available space (4th column in df -g output)
      const parts = lines[1].split(/\s+/);
      const availableGb = parseInt(parts[3], 10);

      if (availableGb < this.config.minDiskSpaceGb) {
        await this.alertDispatcher.diskLow(programId, programName, availableGb);
        log.error('Disk space too low', { availableGb, threshold: this.config.minDiskSpaceGb });
        return false;
      }

      return true;
    } catch {
      // If we can't check, allow proceeding
      log.warn('Failed to check disk space, proceeding anyway');
      return true;
    }
  }

  /** Cleanup orphaned agent processes on startup */
  static async cleanupOrphans(): Promise<number> {
    try {
      // Find processes matching our agent spawn pattern
      const result = Bun.spawnSync(['pgrep', '-f', 'overnight-agent|program-runner']);
      const output = result.stdout.toString().trim();

      if (!output) return 0;

      const pids = output.split('\n').filter((p) => p.trim().length > 0);
      let killed = 0;

      for (const pid of pids) {
        try {
          // Only kill if it's not the current process
          const pidNum = parseInt(pid, 10);
          if (pidNum !== process.pid) {
            process.kill(pidNum, 'SIGTERM');
            killed++;
          }
        } catch {
          // Process may have already exited
        }
      }

      if (killed > 0) {
        log.info('Orphaned processes cleaned up', { killed });
      }

      return killed;
    } catch {
      return 0;
    }
  }

  /** Detect and resume programs that were interrupted by engine crash */
  static getInterruptedPrograms(db: {
    query: <T>(sql: string) => { all: (...params: unknown[]) => T[] };
  }): Array<{ id: string; name: string; definitionPath: string; currentIteration: number }> {
    return db.query<{ id: string; name: string; definitionPath: string; currentIteration: number }>(
      `SELECT id, name, definition_path as definitionPath, current_iteration as currentIteration
       FROM programs WHERE status = 'running'`
    ).all();
  }

  /** Cleanup state for completed program */
  cleanup(programId: string): void {
    this.states.delete(programId);
  }
}

// ── Types ──

export interface RecoveryAction {
  action: 'retry' | 'skip' | 'pause';
  reason: string;
  hint?: string;
}
