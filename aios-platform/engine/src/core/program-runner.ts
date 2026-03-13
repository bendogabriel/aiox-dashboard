/**
 * Program Runner — Story 8.1
 *
 * Orchestrates the autonomous overnight loop.
 * Composes: GitCheckpoint, MetricEvaluator, DecisionJournal, ConvergenceEngine, BudgetController.
 *
 * The "main loop" of the autoresearch pattern, generalized for any task type.
 *
 * Loop:
 *   Phase 0: Setup (parse program, create branch, establish baseline)
 *   Phase 1: Hypothesize (inject context + journal summary into agent)
 *   Phase 2: Implement (spawn agent via process pool)
 *   Phase 3: Measure (run metric command, extract value)
 *   Phase 4: Decide (keep or discard based on metric)
 *   Phase 5: Convergence check (should we stop?)
 *   → Loop back to Phase 1 or terminate
 */

import { readFileSync, existsSync } from 'fs';
import { log } from '../lib/logger';
import { broadcast } from '../lib/ws';
import { GitCheckpoint } from './git-checkpoint';
import { MetricEvaluator, type MetricConfig } from './metric-evaluator';
import { DecisionJournal, type ExperimentEntry } from './decision-journal';
import { ConvergenceEngine, type ConvergenceReason } from './convergence-engine';
import { BudgetController } from './convergence-engine';

// ── Types ──

export interface ProgramDefinition {
  // Frontmatter fields
  name: string;
  version: string;
  type: string;
  squadId: string;
  agentId: string;
  editableScope: string[];
  readonlyScope: string[];
  metric: MetricConfig;
  budget: {
    iterationTimeoutMs: number;
    maxIterations: number;
    maxTotalHours: number;
    maxTokens: number;
    maxCostUsd: number;
  };
  convergence: {
    staleIterations: number;
    minDeltaPercent: number;
    targetValue: number | null;
  };
  git: {
    enabled: boolean;
    branchPrefix: string;
    commitOnKeep: boolean;
    squashOnComplete: boolean;
    autoPR: boolean;
  };
  schedule: string | null;
  enabled: boolean;
  // Body (markdown instructions for agent)
  body: string;
}

export type ProgramStatus = 'idle' | 'running' | 'paused' | 'completed' | 'failed' | 'exhausted';

export interface ProgramState {
  id: string;
  name: string;
  definitionPath: string;
  status: ProgramStatus;
  currentIteration: number;
  maxIterations: number;
  baselineMetric: number | null;
  bestMetric: number | null;
  bestIteration: number | null;
  branchName: string | null;
  convergenceReason: ConvergenceReason | null;
  tokensUsed: number;
  estimatedCost: number;
  wallClockMs: number;
  triggerType: 'manual' | 'scheduled';
  startedAt: string | null;
  completedAt: string | null;
}

export interface ProgramRunnerDeps {
  /** Spawn an agent and get its output. Wraps the existing process pool. */
  spawnAgent: (opts: {
    squadId: string;
    agentId: string;
    prompt: string;
    workingDir: string;
    timeoutMs: number;
  }) => Promise<{ output: string; tokensUsed: number; exitCode: number }>;

  /** SQLite database instance */
  db: {
    run: (sql: string, ...params: unknown[]) => void;
    query: <T>(sql: string) => { get: (...params: unknown[]) => T | null; all: (...params: unknown[]) => T[] };
  };

  /** Working directory (project root) */
  workingDir: string;
}

// ── Program Runner ──

export class ProgramRunner {
  private deps: ProgramRunnerDeps;
  private activePrograms: Map<string, { paused: boolean; cancel: boolean }> = new Map();

  constructor(deps: ProgramRunnerDeps) {
    this.deps = deps;
  }

  /** Parse program.md file into ProgramDefinition */
  parseProgram(filePath: string): ProgramDefinition {
    if (!existsSync(filePath)) {
      throw new Error(`Program file not found: ${filePath}`);
    }

    const content = readFileSync(filePath, 'utf-8');
    const { frontmatter, body } = parseFrontmatter(content);

    return {
      name: frontmatter.name ?? 'unnamed',
      version: frontmatter.version ?? '1.0.0',
      type: frontmatter.type ?? 'custom',
      squadId: frontmatter.squad_id ?? 'engineering',
      agentId: frontmatter.agent_id ?? 'dev',
      editableScope: frontmatter.editable_scope ?? [],
      readonlyScope: frontmatter.readonly_scope ?? [],
      metric: {
        command: frontmatter.metric?.command ?? 'echo 0',
        extract: frontmatter.metric?.extract ?? 'last_number',
        pattern: frontmatter.metric?.pattern,
        jsonPath: frontmatter.metric?.json_path,
        customScript: frontmatter.metric?.custom_script,
        direction: frontmatter.metric?.direction ?? 'minimize',
        baseline: frontmatter.metric?.baseline ?? null,
        timeoutMs: frontmatter.metric?.timeout_ms,
      },
      budget: {
        iterationTimeoutMs: frontmatter.budget?.iteration_timeout_ms ?? 300_000,
        maxIterations: frontmatter.budget?.max_iterations ?? 50,
        maxTotalHours: frontmatter.budget?.max_total_hours ?? 8,
        maxTokens: frontmatter.budget?.max_tokens ?? 500_000,
        maxCostUsd: frontmatter.budget?.max_cost_usd ?? 10.0,
      },
      convergence: {
        staleIterations: frontmatter.convergence?.stale_iterations ?? 5,
        minDeltaPercent: frontmatter.convergence?.min_delta_percent ?? 0.1,
        targetValue: frontmatter.convergence?.target_value ?? null,
      },
      git: {
        enabled: frontmatter.git !== false && frontmatter.git?.enabled !== false,
        branchPrefix: frontmatter.git?.branch_prefix ?? 'overnight',
        commitOnKeep: frontmatter.git?.commit_on_keep ?? true,
        squashOnComplete: frontmatter.git?.squash_on_complete ?? true,
        autoPR: frontmatter.git?.auto_pr ?? false,
      },
      schedule: frontmatter.schedule ?? null,
      enabled: frontmatter.enabled ?? true,
      body,
    };
  }

  /** Start executing a program (main entry point) */
  async start(definitionPath: string, triggerType: 'manual' | 'scheduled' = 'manual'): Promise<ProgramState> {
    const program = this.parseProgram(definitionPath);
    const programId = `prog-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Initialize subsystems
    const gitCheckpoint = program.git.enabled
      ? new GitCheckpoint({
          branchPrefix: program.git.branchPrefix,
          programName: program.name.replace(/\s+/g, '-').toLowerCase(),
          editableScope: program.editableScope,
          readonlyScope: program.readonlyScope,
          squashOnComplete: program.git.squashOnComplete,
          autoPR: program.git.autoPR,
          workingDir: this.deps.workingDir,
        })
      : null;

    const metricEval = new MetricEvaluator();
    const journal = new DecisionJournal(program.name.replace(/\s+/g, '-').toLowerCase());
    const convergence = new ConvergenceEngine({
      maxIterations: program.budget.maxIterations,
      staleIterations: program.convergence.staleIterations,
      minDeltaPercent: program.convergence.minDeltaPercent,
      targetValue: program.convergence.targetValue,
    });
    const budget = new BudgetController({
      maxTotalHours: program.budget.maxTotalHours,
      maxTokens: program.budget.maxTokens,
      maxCostUsd: program.budget.maxCostUsd,
      inputPricePer1K: 0.003,
      outputPricePer1K: 0.015,
    });

    budget.init(programId);
    this.activePrograms.set(programId, { paused: false, cancel: false });

    // Persist program state
    const state: ProgramState = {
      id: programId,
      name: program.name,
      definitionPath,
      status: 'running',
      currentIteration: 0,
      maxIterations: program.budget.maxIterations,
      baselineMetric: null,
      bestMetric: null,
      bestIteration: null,
      branchName: gitCheckpoint?.branch ?? null,
      convergenceReason: null,
      tokensUsed: 0,
      estimatedCost: 0,
      wallClockMs: 0,
      triggerType,
      startedAt: new Date().toISOString(),
      completedAt: null,
    };

    this.persistState(state, program);
    broadcast({ type: 'program:started', data: { programId, name: program.name } });

    // Run the loop (async, non-blocking)
    this.runLoop(state, program, gitCheckpoint, metricEval, journal, convergence, budget)
      .catch((err) => {
        log.error('Program runner: fatal error', { programId, error: (err as Error).message });
        state.status = 'failed';
        state.completedAt = new Date().toISOString();
        this.persistState(state, program);
        broadcast({ type: 'program:failed', data: { programId, error: (err as Error).message } });
      });

    return state;
  }

  /** Pause a running program */
  pause(programId: string): boolean {
    const ctrl = this.activePrograms.get(programId);
    if (!ctrl) return false;
    ctrl.paused = true;
    log.info('Program paused', { programId });
    broadcast({ type: 'program:paused', data: { programId } });
    return true;
  }

  /** Resume a paused program */
  resume(programId: string): boolean {
    const ctrl = this.activePrograms.get(programId);
    if (!ctrl) return false;
    ctrl.paused = false;
    log.info('Program resumed', { programId });
    broadcast({ type: 'program:resumed', data: { programId } });
    return true;
  }

  /** Cancel a running program */
  cancel(programId: string): boolean {
    const ctrl = this.activePrograms.get(programId);
    if (!ctrl) return false;
    ctrl.cancel = true;
    log.info('Program cancelled', { programId });
    broadcast({ type: 'program:cancelled', data: { programId } });
    return true;
  }

  /** Get program state from DB */
  getProgram(programId: string): ProgramState | null {
    return this.deps.db.query<ProgramState>(
      'SELECT * FROM programs WHERE id = ?'
    ).get(programId);
  }

  /** List all programs */
  listPrograms(): ProgramState[] {
    return this.deps.db.query<ProgramState>(
      'SELECT * FROM programs ORDER BY created_at DESC'
    ).all();
  }

  // ── Main Loop ──

  private async runLoop(
    state: ProgramState,
    program: ProgramDefinition,
    gitCheckpoint: GitCheckpoint | null,
    metricEval: MetricEvaluator,
    journal: DecisionJournal,
    convergence: ConvergenceEngine,
    budget: BudgetController,
  ): Promise<void> {
    const cwd = this.deps.workingDir;

    // ── Phase 0: Setup ──
    log.info('Program runner: Phase 0 — Setup', { id: state.id, name: state.name });

    // Create experiment branch
    if (gitCheckpoint) {
      state.branchName = await gitCheckpoint.createBranch();
    }

    // Establish baseline metric
    try {
      state.baselineMetric = await metricEval.evaluateBaseline(program.metric, cwd);
      state.bestMetric = state.baselineMetric;
    } catch (err) {
      log.error('Program runner: baseline evaluation failed', { error: (err as Error).message });
      state.status = 'failed';
      state.completedAt = new Date().toISOString();
      this.persistState(state, program);
      return;
    }

    this.persistState(state, program);

    // ── Iteration Loop ──
    while (true) {
      const ctrl = this.activePrograms.get(state.id);

      // Check cancel
      if (ctrl?.cancel) {
        state.status = 'failed';
        state.convergenceReason = null;
        state.completedAt = new Date().toISOString();
        if (gitCheckpoint) await gitCheckpoint.cleanup();
        break;
      }

      // Check pause (wait loop)
      while (ctrl?.paused && !ctrl?.cancel) {
        await Bun.sleep(1000);
      }
      if (ctrl?.cancel) continue; // will be caught at top of loop

      state.currentIteration++;
      const iterationStart = Date.now();

      broadcast({
        type: 'program:iteration:started',
        data: { programId: state.id, iteration: state.currentIteration },
      });

      log.info('Program runner: iteration start', {
        id: state.id,
        iteration: state.currentIteration,
      });

      // ── Phase 1: Hypothesize (build agent prompt) ──
      const journalSummary = journal.summary(state.bestMetric, state.baselineMetric);
      const agentPrompt = buildAgentPrompt(program, journalSummary, state);

      // ── Phase 2: Implement (spawn agent) ──
      let agentResult: { output: string; tokensUsed: number; exitCode: number };
      try {
        agentResult = await this.deps.spawnAgent({
          squadId: program.squadId,
          agentId: program.agentId,
          prompt: agentPrompt,
          workingDir: cwd,
          timeoutMs: program.budget.iterationTimeoutMs,
        });
      } catch (err) {
        // Agent spawn/execution failed
        const entry: ExperimentEntry = {
          event: 'experiment',
          iteration: state.currentIteration,
          timestamp: new Date().toISOString(),
          hypothesis: 'Agent execution failed',
          commitSha: null,
          metricBefore: state.bestMetric,
          metricAfter: null,
          delta: null,
          deltaPct: null,
          status: 'error',
          filesModified: [],
          durationMs: Date.now() - iterationStart,
          tokensUsed: 0,
          errorMessage: (err as Error).message,
        };
        journal.append(entry);
        journal.mirrorToSQLite(this.deps.db, state.id, entry);

        broadcast({
          type: 'program:iteration:completed',
          data: { programId: state.id, iteration: state.currentIteration, status: 'error' },
        });

        // Check convergence after error
        const convergenceResult = convergence.check(
          state.currentIteration, journal.getAll(), state.bestMetric, program.metric.direction
        );
        if (convergenceResult.shouldStop) {
          state.convergenceReason = convergenceResult.reason;
          state.status = state.bestMetric !== state.baselineMetric ? 'completed' : 'exhausted';
          state.completedAt = new Date().toISOString();
          break;
        }
        this.persistState(state, program);
        continue;
      }

      // Track budget
      budget.track(state.id, agentResult.tokensUsed);
      state.tokensUsed += agentResult.tokensUsed;

      // Extract hypothesis from agent output (first line or first sentence)
      const hypothesis = extractHypothesis(agentResult.output);

      // ── Scope validation (if git enabled) ──
      if (gitCheckpoint) {
        const violations = await gitCheckpoint.validateScope();
        if (violations.length > 0) {
          // Contract violation — auto-discard
          log.warn('Program runner: scope violation', { violations });
          // Revert any changes the agent made
          await Bun.spawn(['git', 'checkout', '.'], { cwd }).exited;

          const entry: ExperimentEntry = {
            event: 'experiment',
            iteration: state.currentIteration,
            timestamp: new Date().toISOString(),
            hypothesis,
            commitSha: null,
            metricBefore: state.bestMetric,
            metricAfter: null,
            delta: null,
            deltaPct: null,
            status: 'error',
            filesModified: violations.map((v) => v.file),
            durationMs: Date.now() - iterationStart,
            tokensUsed: agentResult.tokensUsed,
            errorMessage: `Scope violation: ${violations.map((v) => `${v.file} (${v.reason})`).join(', ')}`,
          };
          journal.append(entry);
          journal.mirrorToSQLite(this.deps.db, state.id, entry);
          this.persistState(state, program);
          continue;
        }
      }

      // ── Speculative commit ──
      let commitSha: string | null = null;
      if (gitCheckpoint) {
        commitSha = await gitCheckpoint.speculativeCommit(state.currentIteration, hypothesis);
        if (!commitSha) {
          // No changes made — skip measurement
          const entry: ExperimentEntry = {
            event: 'experiment',
            iteration: state.currentIteration,
            timestamp: new Date().toISOString(),
            hypothesis,
            commitSha: null,
            metricBefore: state.bestMetric,
            metricAfter: null,
            delta: null,
            deltaPct: null,
            status: 'skipped',
            filesModified: [],
            durationMs: Date.now() - iterationStart,
            tokensUsed: agentResult.tokensUsed,
            errorMessage: 'No file changes detected',
          };
          journal.append(entry);
          journal.mirrorToSQLite(this.deps.db, state.id, entry);
          this.persistState(state, program);
          continue;
        }
      }

      const filesModified = gitCheckpoint ? await gitCheckpoint.getModifiedFiles() : [];

      // ── Phase 3: Measure ──
      let metricAfter: number;
      try {
        const result = await metricEval.evaluate(program.metric, cwd);
        metricAfter = result.value;
      } catch (err) {
        // Metric evaluation failed — discard
        if (gitCheckpoint && commitSha) await gitCheckpoint.revert();

        const entry: ExperimentEntry = {
          event: 'experiment',
          iteration: state.currentIteration,
          timestamp: new Date().toISOString(),
          hypothesis,
          commitSha,
          metricBefore: state.bestMetric,
          metricAfter: null,
          delta: null,
          deltaPct: null,
          status: 'error',
          filesModified,
          durationMs: Date.now() - iterationStart,
          tokensUsed: agentResult.tokensUsed,
          errorMessage: `Metric evaluation failed: ${(err as Error).message}`,
        };
        journal.append(entry);
        journal.mirrorToSQLite(this.deps.db, state.id, entry);
        this.persistState(state, program);
        continue;
      }

      // ── Phase 4: Decide ──
      const comparison = metricEval.compare(metricAfter, state.bestMetric!, program.metric.direction);
      const decision = comparison.improved ? 'keep' : 'discard';

      if (decision === 'keep') {
        if (gitCheckpoint) await gitCheckpoint.keep();
        state.bestMetric = metricAfter;
        state.bestIteration = state.currentIteration;
        log.info('Program runner: KEEP', {
          iteration: state.currentIteration,
          metric: metricAfter,
          delta: comparison.delta,
        });
      } else {
        if (gitCheckpoint && commitSha) await gitCheckpoint.revert();
        log.info('Program runner: DISCARD', {
          iteration: state.currentIteration,
          metric: metricAfter,
          delta: comparison.delta,
        });
      }

      // Log experiment
      const entry: ExperimentEntry = {
        event: 'experiment',
        iteration: state.currentIteration,
        timestamp: new Date().toISOString(),
        hypothesis,
        commitSha,
        metricBefore: comparison.baseline,
        metricAfter: comparison.current,
        delta: comparison.delta,
        deltaPct: comparison.deltaPct,
        status: decision,
        filesModified,
        durationMs: Date.now() - iterationStart,
        tokensUsed: agentResult.tokensUsed,
      };
      journal.append(entry);
      journal.mirrorToSQLite(this.deps.db, state.id, entry);

      broadcast({
        type: 'program:iteration:completed',
        data: {
          programId: state.id,
          iteration: state.currentIteration,
          status: decision,
          metric: metricAfter,
          delta: comparison.delta,
        },
      });

      // Update usage
      const usage = budget.getUsage(state.id);
      state.estimatedCost = usage.estimatedCost;
      state.wallClockMs = usage.wallClockMs;

      // Budget warnings
      const warnings = budget.checkWarnings(state.id);
      for (const warning of warnings) {
        broadcast({
          type: 'program:budget:warning',
          data: { programId: state.id, ...warning },
        });
      }

      // ── Phase 5: Convergence check ──
      const convergenceResult = convergence.check(
        state.currentIteration, journal.getAll(), state.bestMetric, program.metric.direction
      );

      if (convergenceResult.shouldStop) {
        state.convergenceReason = convergenceResult.reason;
        state.status = state.bestMetric !== state.baselineMetric ? 'completed' : 'exhausted';
        state.completedAt = new Date().toISOString();
        log.info('Program runner: converged', { reason: convergenceResult.reason, details: convergenceResult.details });
        break;
      }

      // Budget check
      const estimatedTokens = budget.estimateIterationTokens(journal.getAll());
      const budgetResult = budget.canAffordIteration(state.id, estimatedTokens);
      if (budgetResult.shouldStop) {
        state.convergenceReason = budgetResult.reason;
        state.status = state.bestMetric !== state.baselineMetric ? 'completed' : 'exhausted';
        state.completedAt = new Date().toISOString();
        log.info('Program runner: budget exhausted', { reason: budgetResult.reason });
        break;
      }

      this.persistState(state, program);
    }

    // ── Finalization ──
    if (gitCheckpoint && state.status === 'completed' && program.git.squashOnComplete) {
      const totalImprovement = state.baselineMetric && state.bestMetric
        ? ((state.bestMetric - state.baselineMetric) / Math.abs(state.baselineMetric) * 100).toFixed(1)
        : '0';
      await gitCheckpoint.squashAll(
        `overnight(${program.name}): ${program.metric.direction} metric by ${totalImprovement}% over ${state.currentIteration} iterations`
      );

      if (program.git.autoPR) {
        const patterns = journal.getPatterns();
        await gitCheckpoint.createPR(
          `overnight: ${program.name} (${totalImprovement}% improvement)`,
          `## Overnight Program Results\n\n` +
          `- **Iterations:** ${state.currentIteration}\n` +
          `- **Baseline:** ${state.baselineMetric}\n` +
          `- **Best:** ${state.bestMetric}\n` +
          `- **Improvement:** ${totalImprovement}%\n` +
          `- **Keep rate:** ${patterns.keepCount}/${patterns.totalExperiments}\n` +
          `- **Convergence:** ${state.convergenceReason}\n\n` +
          `Generated by AIOS Overnight Programs.`
        );
      }

      await gitCheckpoint.returnToBase();
    }

    this.persistState(state, program);
    budget.cleanup(state.id);
    this.activePrograms.delete(state.id);

    broadcast({
      type: 'program:completed',
      data: {
        programId: state.id,
        status: state.status,
        iterations: state.currentIteration,
        improvement: state.baselineMetric && state.bestMetric
          ? ((state.bestMetric - state.baselineMetric) / Math.abs(state.baselineMetric) * 100).toFixed(1) + '%'
          : 'N/A',
        convergenceReason: state.convergenceReason,
      },
    });
  }

  // ── Persistence ──

  private persistState(state: ProgramState, program: ProgramDefinition): void {
    const existing = this.deps.db.query('SELECT id FROM programs WHERE id = ?').get(state.id);

    if (existing) {
      this.deps.db.run(
        `UPDATE programs SET status = ?, current_iteration = ?, baseline_metric = ?, best_metric = ?, best_iteration = ?, branch_name = ?, convergence_reason = ?, tokens_used = ?, estimated_cost = ?, wall_clock_ms = ?, completed_at = ? WHERE id = ?`,
        state.status, state.currentIteration, state.baselineMetric, state.bestMetric,
        state.bestIteration, state.branchName, state.convergenceReason,
        state.tokensUsed, state.estimatedCost, state.wallClockMs,
        state.completedAt, state.id,
      );
    } else {
      this.deps.db.run(
        `INSERT INTO programs (id, name, definition_path, status, current_iteration, max_iterations, baseline_metric, best_metric, best_iteration, branch_name, convergence_reason, config_json, tokens_used, estimated_cost, wall_clock_ms, trigger_type, started_at, completed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        state.id, state.name, state.definitionPath, state.status,
        state.currentIteration, state.maxIterations,
        state.baselineMetric, state.bestMetric, state.bestIteration,
        state.branchName, state.convergenceReason,
        JSON.stringify(program),
        state.tokensUsed, state.estimatedCost, state.wallClockMs,
        state.triggerType, state.startedAt, state.completedAt,
      );
    }
  }
}

// ── Helpers ──

/** Parse YAML frontmatter from program.md content */
function parseFrontmatter(content: string): { frontmatter: Record<string, unknown>; body: string } {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, body: content };
  }

  // Simple YAML parser (handles the program.md schema — no external dep needed)
  const yamlStr = match[1];
  const body = match[2].trim();

  try {
    const frontmatter = parseSimpleYaml(yamlStr);
    return { frontmatter, body };
  } catch {
    log.warn('Program runner: failed to parse frontmatter, using defaults');
    return { frontmatter: {}, body };
  }
}

/** Minimal YAML parser for program.md frontmatter (flat + 1 level nested) */
function parseSimpleYaml(yaml: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  let currentKey: string | null = null;
  let currentObj: Record<string, unknown> | null = null;

  for (const line of yaml.split('\n')) {
    if (line.trim() === '' || line.trim().startsWith('#')) continue;

    const indent = line.length - line.trimStart().length;
    const trimmed = line.trim();

    if (indent === 0 && trimmed.includes(':')) {
      // Top-level key
      const [key, ...valueParts] = trimmed.split(':');
      const value = valueParts.join(':').trim();

      if (value === '' || value === '|') {
        // Nested object or block scalar
        currentKey = key.trim();
        currentObj = {};
        result[currentKey] = currentObj;
      } else {
        currentKey = null;
        currentObj = null;
        result[key.trim()] = parseYamlValue(value);
      }
    } else if (indent > 0 && currentKey && currentObj) {
      // Nested key-value
      if (trimmed.startsWith('- ')) {
        // Array item
        const arr = (result[currentKey] as unknown[]) ?? [];
        if (!Array.isArray(result[currentKey])) {
          result[currentKey] = arr;
          currentObj = null;
        }
        (result[currentKey] as unknown[]).push(parseYamlValue(trimmed.slice(2).trim()));
      } else if (trimmed.includes(':')) {
        const [key, ...valueParts] = trimmed.split(':');
        currentObj[key.trim()] = parseYamlValue(valueParts.join(':').trim());
      }
    }
  }

  return result;
}

function parseYamlValue(value: string): unknown {
  if (value === 'null' || value === '~') return null;
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^-?\d+$/.test(value)) return parseInt(value, 10);
  if (/^-?\d+\.\d+$/.test(value)) return parseFloat(value);
  // Remove quotes
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value;
}

/** Build the agent prompt with program instructions + journal context */
function buildAgentPrompt(program: ProgramDefinition, journalSummary: string, state: ProgramState): string {
  return `# Overnight Program: ${program.name}

## Your Task (Iteration ${state.currentIteration})

You are running as part of an autonomous overnight optimization loop.
Your goal: ${program.metric.direction === 'minimize' ? 'MINIMIZE' : 'MAXIMIZE'} the target metric.

**Current best metric:** ${state.bestMetric}
**Baseline:** ${state.baselineMetric}
**Iteration:** ${state.currentIteration}/${state.maxIterations}

## Rules

- Only modify files matching: ${program.editableScope.join(', ') || 'any file'}
- NEVER modify: ${program.readonlyScope.join(', ') || 'N/A'}
- Make exactly ONE focused change per iteration
- The metric will be measured automatically after your changes

## Program Instructions

${program.body}

## Experiment History

${journalSummary}

## Action

Based on the program instructions and experiment history above, make your next improvement attempt.
State your hypothesis clearly at the start of your response (one sentence describing what you're changing and why).
Then implement the change.`;
}

/** Extract hypothesis from agent output (first meaningful line) */
function extractHypothesis(output: string): string {
  const lines = output.split('\n').filter((l) => l.trim().length > 10);
  if (lines.length === 0) return 'Unknown hypothesis';

  // Look for a line that starts with hypothesis-like patterns
  for (const line of lines.slice(0, 5)) {
    const trimmed = line.trim();
    if (trimmed.startsWith('Hypothesis:') || trimmed.startsWith('hypothesis:')) {
      return trimmed.replace(/^[Hh]ypothesis:\s*/, '').slice(0, 200);
    }
    if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
      return trimmed.replace(/^#+\s*/, '').slice(0, 200);
    }
  }

  // Fallback: first line
  return lines[0].trim().slice(0, 200);
}
