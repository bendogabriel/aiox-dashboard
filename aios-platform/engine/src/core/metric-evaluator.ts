/**
 * Metric Evaluation Framework — Story 8.3
 *
 * Flexible metric evaluation that works with any measurable output.
 * Supports: regex extraction, JSON path, last number, custom script.
 * Output isolation: captures to temp file to prevent context window flooding.
 *
 * Inspired by autoresearch: "val_bpb" → here: any numeric metric.
 */

import { log } from '../lib/logger';

export type MetricDirection = 'minimize' | 'maximize';
export type ExtractionMode = 'regex' | 'json_path' | 'last_number' | 'custom';

export interface MetricConfig {
  command: string;
  extract: ExtractionMode;
  pattern?: string;          // for regex mode
  jsonPath?: string;         // for json_path mode
  customScript?: string;     // for custom mode
  direction: MetricDirection;
  baseline?: number | null;
  timeoutMs?: number;        // metric command timeout (default 30s)
}

export interface CompositeMetricConfig {
  metrics: Array<MetricConfig & { weight: number }>;
  allMustPass?: boolean;     // all individual metrics must improve
}

export interface MetricResult {
  value: number;
  raw: string;               // raw command output (last N lines)
  durationMs: number;
}

export interface MetricComparison {
  current: number;
  baseline: number;
  delta: number;
  deltaPct: number;
  improved: boolean;
  direction: MetricDirection;
}

const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_OUTPUT_LINES = 50;

export class MetricEvaluator {
  /**
   * Run metric command and extract scalar value.
   * Output is captured to temp file to prevent context window flooding.
   */
  async evaluate(config: MetricConfig, cwd: string): Promise<MetricResult> {
    const startTime = Date.now();
    const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    // Create temp file for output isolation
    const tmpFile = `/tmp/metric-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.txt`;

    try {
      // Run command with output captured to file
      const proc = Bun.spawn(['sh', '-c', `${config.command} > ${tmpFile} 2>&1`], {
        cwd,
        stdout: 'pipe',
        stderr: 'pipe',
      });

      // Timeout handling
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          proc.kill();
          reject(new Error(`Metric command timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      });

      const exitCode = await Promise.race([proc.exited, timeoutPromise]);

      if (exitCode !== 0) {
        const output = await this.readTailLines(tmpFile, 10);
        throw new Error(`Metric command failed (exit ${exitCode}): ${output}`);
      }

      // Read output (last N lines only — output isolation)
      const raw = await this.readTailLines(tmpFile, MAX_OUTPUT_LINES);
      const value = this.extractValue(raw, config);
      const durationMs = Date.now() - startTime;

      log.info('Metric evaluated', { value, durationMs, mode: config.extract });

      return { value, raw, durationMs };
    } finally {
      // Cleanup temp file
      try { await Bun.write(tmpFile, ''); Bun.spawn(['rm', '-f', tmpFile]); } catch {}
    }
  }

  /** Evaluate baseline (first run before any changes) */
  async evaluateBaseline(config: MetricConfig, cwd: string): Promise<number> {
    const result = await this.evaluate(config, cwd);
    log.info('Baseline metric established', { value: result.value });
    return result.value;
  }

  /** Evaluate composite metric (weighted average of multiple metrics) */
  async evaluateComposite(config: CompositeMetricConfig, cwd: string): Promise<MetricResult> {
    const startTime = Date.now();
    let weightedSum = 0;
    let totalWeight = 0;
    const rawParts: string[] = [];

    for (const metricDef of config.metrics) {
      const result = await this.evaluate(metricDef, cwd);
      weightedSum += result.value * metricDef.weight;
      totalWeight += metricDef.weight;
      rawParts.push(`[${metricDef.command}] = ${result.value}`);
    }

    const compositeValue = totalWeight > 0 ? weightedSum / totalWeight : 0;

    return {
      value: compositeValue,
      raw: rawParts.join('\n'),
      durationMs: Date.now() - startTime,
    };
  }

  /** Compare current metric against baseline */
  compare(current: number, baseline: number, direction: MetricDirection): MetricComparison {
    const delta = current - baseline;
    const deltaPct = baseline !== 0 ? (delta / Math.abs(baseline)) * 100 : 0;

    const improved = direction === 'minimize'
      ? current < baseline
      : current > baseline;

    return { current, baseline, delta, deltaPct, improved, direction };
  }

  /** Extract scalar value from command output */
  private extractValue(output: string, config: MetricConfig): number {
    switch (config.extract) {
      case 'regex':
        return this.extractRegex(output, config.pattern ?? '([\\d.]+)');
      case 'json_path':
        return this.extractJsonPath(output, config.jsonPath ?? '$');
      case 'last_number':
        return this.extractLastNumber(output);
      case 'custom':
        return this.extractCustom(output, config.customScript ?? '');
      default:
        return this.extractLastNumber(output);
    }
  }

  /** Extract value using regex pattern */
  private extractRegex(output: string, pattern: string): number {
    const regex = new RegExp(pattern);
    const match = output.match(regex);
    if (!match || !match[1]) {
      throw new Error(`Metric regex "${pattern}" did not match output`);
    }
    const value = parseFloat(match[1]);
    if (isNaN(value)) {
      throw new Error(`Metric regex matched "${match[1]}" but it's not a number`);
    }
    return value;
  }

  /** Extract value using JSON path (simple dot notation) */
  private extractJsonPath(output: string, path: string): number {
    try {
      // Try to find JSON in output (may have non-JSON lines before/after)
      const jsonMatch = output.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('No JSON found in output');

      const json = JSON.parse(jsonMatch[0]);
      const keys = path.replace(/^\$\.?/, '').split('.').filter(Boolean);

      let current: unknown = json;
      for (const key of keys) {
        if (current === null || current === undefined) break;
        current = (current as Record<string, unknown>)[key];
      }

      const value = typeof current === 'number' ? current : parseFloat(String(current));
      if (isNaN(value)) throw new Error(`JSON path "${path}" resolved to non-numeric: ${current}`);
      return value;
    } catch (err) {
      throw new Error(`JSON path extraction failed: ${(err as Error).message}`);
    }
  }

  /** Extract last numeric value from output */
  private extractLastNumber(output: string): number {
    const numbers = output.match(/[\d]+\.?[\d]*/g);
    if (!numbers || numbers.length === 0) {
      throw new Error('No numeric value found in metric output');
    }
    const value = parseFloat(numbers[numbers.length - 1]);
    if (isNaN(value)) {
      throw new Error(`Last number "${numbers[numbers.length - 1]}" is not valid`);
    }
    return value;
  }

  /** Extract value using custom script (eval — only for trusted programs) */
  private extractCustom(output: string, script: string): number {
    if (!script) throw new Error('Custom extraction script is empty');
    try {
      // Create a function that receives `output` and returns a number
      const fn = new Function('output', `"use strict"; ${script}`) as (output: string) => number;
      const value = fn(output);
      if (typeof value !== 'number' || isNaN(value)) {
        throw new Error(`Custom script returned non-numeric: ${value}`);
      }
      return value;
    } catch (err) {
      throw new Error(`Custom extraction failed: ${(err as Error).message}`);
    }
  }

  /** Read last N lines from a file (output isolation) */
  private async readTailLines(filePath: string, maxLines: number): Promise<string> {
    try {
      const file = Bun.file(filePath);
      const content = await file.text();
      const lines = content.split('\n');
      return lines.slice(-maxLines).join('\n');
    } catch {
      return '';
    }
  }
}
