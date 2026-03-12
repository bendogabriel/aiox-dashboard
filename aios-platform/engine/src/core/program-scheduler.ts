/**
 * Program Scheduler — Story 8.11
 *
 * Integrates overnight programs with the CronScheduler.
 * Scans programs/ directory on startup, registers scheduled programs as cron jobs.
 *
 * Features:
 * - Auto-discovery of program.md files with schedule field
 * - Overlap detection (skip if previous run still active)
 * - Manual "Run Now" trigger
 * - Schedule editing (runtime, without modifying program.md)
 */

import { Cron } from 'croner';
import { readdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { log } from '../lib/logger';
import { broadcast } from '../lib/ws';
import { ProgramRunner, type ProgramState } from './program-runner';

// ── Types ──

export interface ScheduledProgram {
  id: string;
  name: string;
  definitionPath: string;
  schedule: string;
  enabled: boolean;
  nextRun: string | null;
  lastRun: string | null;
  lastRunId: string | null;
  isRunning: boolean;
}

// ── Program Scheduler ──

export class ProgramScheduler {
  private runner: ProgramRunner;
  private programsDir: string;
  private activeCrons: Map<string, Cron> = new Map();
  private scheduledPrograms: Map<string, ScheduledProgram> = new Map();
  private activeRuns: Map<string, string> = new Map(); // definitionPath → programId

  constructor(runner: ProgramRunner, programsDir: string) {
    this.runner = runner;
    this.programsDir = resolve(programsDir);
  }

  /** Initialize: scan programs directory and register crons */
  init(): void {
    if (!existsSync(this.programsDir)) {
      log.info('Programs directory not found, skipping scheduler init', { dir: this.programsDir });
      return;
    }

    const programs = this.discoverPrograms();
    let registered = 0;

    for (const prog of programs) {
      if (prog.schedule && prog.enabled) {
        this.registerCron(prog);
        registered++;
      }
      this.scheduledPrograms.set(prog.id, prog);
    }

    log.info('Program scheduler initialized', {
      discovered: programs.length,
      scheduled: registered,
    });
  }

  /** Discover all program.md files in programs directory */
  private discoverPrograms(): ScheduledProgram[] {
    const programs: ScheduledProgram[] = [];

    try {
      const entries = readdirSync(this.programsDir, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        const programPath = join(this.programsDir, entry.name, 'program.md');
        if (!existsSync(programPath)) continue;

        try {
          const definition = this.runner.parseProgram(programPath);
          const id = `sched-${entry.name}`;

          programs.push({
            id,
            name: definition.name,
            definitionPath: programPath,
            schedule: definition.schedule ?? '',
            enabled: definition.enabled,
            nextRun: null,
            lastRun: null,
            lastRunId: null,
            isRunning: false,
          });
        } catch (err) {
          log.warn('Failed to parse program', {
            path: programPath,
            error: (err as Error).message,
          });
        }
      }
    } catch (err) {
      log.error('Failed to scan programs directory', { error: (err as Error).message });
    }

    return programs;
  }

  /** Register a cron job for a scheduled program */
  private registerCron(prog: ScheduledProgram): void {
    // Stop existing cron if any
    const existing = this.activeCrons.get(prog.id);
    if (existing) existing.stop();

    try {
      const cron = new Cron(prog.schedule, () => {
        this.executeCronTrigger(prog);
      });

      this.activeCrons.set(prog.id, cron);
      prog.nextRun = cron.nextRun()?.toISOString() ?? null;

      log.info('Program cron registered', {
        id: prog.id,
        name: prog.name,
        schedule: prog.schedule,
        nextRun: prog.nextRun,
      });
    } catch (err) {
      log.warn('Invalid cron schedule for program', {
        id: prog.id,
        schedule: prog.schedule,
        error: (err as Error).message,
      });
    }
  }

  /** Execute when cron fires */
  private async executeCronTrigger(prog: ScheduledProgram): Promise<void> {
    // Overlap detection: skip if previous run still active
    if (this.activeRuns.has(prog.definitionPath)) {
      log.info('Program cron skipped (previous still running)', {
        id: prog.id,
        name: prog.name,
        activeRunId: this.activeRuns.get(prog.definitionPath),
      });
      return;
    }

    log.info('Program cron triggered', { id: prog.id, name: prog.name });

    try {
      const state = await this.runner.start(prog.definitionPath, 'scheduled');
      this.activeRuns.set(prog.definitionPath, state.id);

      // Update scheduled program state
      prog.lastRun = new Date().toISOString();
      prog.lastRunId = state.id;
      prog.isRunning = true;

      // Update next run
      const cron = this.activeCrons.get(prog.id);
      prog.nextRun = cron?.nextRun()?.toISOString() ?? null;

      broadcast({
        type: 'program:scheduled:triggered',
        data: {
          scheduleId: prog.id,
          programId: state.id,
          name: prog.name,
          nextRun: prog.nextRun,
        },
      });

      // Watch for completion (poll periodically)
      this.watchCompletion(prog, state.id);
    } catch (err) {
      log.error('Failed to start scheduled program', {
        id: prog.id,
        error: (err as Error).message,
      });
    }
  }

  /** Watch for program completion to clear activeRuns */
  private watchCompletion(prog: ScheduledProgram, programId: string): void {
    const interval = setInterval(() => {
      const state = this.runner.getProgram(programId);
      if (!state) {
        clearInterval(interval);
        this.activeRuns.delete(prog.definitionPath);
        prog.isRunning = false;
        return;
      }

      const terminalStatuses = ['completed', 'failed', 'exhausted'];
      if (terminalStatuses.includes(state.status)) {
        clearInterval(interval);
        this.activeRuns.delete(prog.definitionPath);
        prog.isRunning = false;

        log.info('Scheduled program completed', {
          scheduleId: prog.id,
          programId,
          status: state.status,
        });
      }
    }, 30_000); // Check every 30s
  }

  /** Manual "Run Now" trigger */
  async runNow(scheduleId: string): Promise<ProgramState | null> {
    const prog = this.scheduledPrograms.get(scheduleId);
    if (!prog) return null;

    // Check for overlap
    if (this.activeRuns.has(prog.definitionPath)) {
      log.warn('Cannot run now — previous run still active', { id: scheduleId });
      return null;
    }

    const state = await this.runner.start(prog.definitionPath, 'manual');
    this.activeRuns.set(prog.definitionPath, state.id);
    prog.lastRun = new Date().toISOString();
    prog.lastRunId = state.id;
    prog.isRunning = true;

    this.watchCompletion(prog, state.id);
    return state;
  }

  /** Update schedule without modifying program.md */
  updateSchedule(scheduleId: string, newSchedule: string): boolean {
    const prog = this.scheduledPrograms.get(scheduleId);
    if (!prog) return false;

    // Validate
    try {
      const testCron = new Cron(newSchedule);
      testCron.stop();
    } catch {
      return false;
    }

    prog.schedule = newSchedule;
    this.registerCron(prog);
    return true;
  }

  /** Enable/disable a scheduled program */
  toggleSchedule(scheduleId: string, enabled: boolean): boolean {
    const prog = this.scheduledPrograms.get(scheduleId);
    if (!prog) return false;

    prog.enabled = enabled;

    if (enabled) {
      this.registerCron(prog);
    } else {
      const cron = this.activeCrons.get(scheduleId);
      if (cron) {
        cron.stop();
        this.activeCrons.delete(scheduleId);
      }
      prog.nextRun = null;
    }

    return true;
  }

  /** List all scheduled programs */
  listScheduled(): ScheduledProgram[] {
    return Array.from(this.scheduledPrograms.values());
  }

  /** Get a specific scheduled program */
  getScheduled(scheduleId: string): ScheduledProgram | null {
    return this.scheduledPrograms.get(scheduleId) ?? null;
  }

  /** Stop all crons (shutdown) */
  stopAll(): void {
    for (const [, cron] of this.activeCrons) {
      cron.stop();
    }
    this.activeCrons.clear();
    log.info('Program scheduler stopped');
  }

  /** Format cron to human-readable */
  static formatSchedule(schedule: string): string {
    if (!schedule) return 'Manual';
    try {
      const cron = new Cron(schedule);
      const next = cron.nextRun();
      cron.stop();
      if (!next) return schedule;

      const parts = schedule.split(' ');
      if (parts.length !== 5) return schedule;
      const [min, hour, , , dow] = parts;

      const dayMap: Record<string, string> = {
        '*': 'Daily',
        '0': 'Sunday',
        '1': 'Monday',
        '1-5': 'Mon-Fri',
        '0,6': 'Weekends',
        '6': 'Saturday',
      };

      const days = dayMap[dow] ?? `Day ${dow}`;
      return `${hour}:${min.padStart(2, '0')} ${days}`;
    } catch {
      return schedule;
    }
  }
}
