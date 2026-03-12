/**
 * Alert Dispatcher — Story 8.10
 *
 * Notification system for overnight program events.
 * Delivers alerts via: WebSocket (dashboard), log file, optional webhook.
 *
 * Alert types:
 * - program:started, program:completed, program:failed
 * - budget:warning (80% of any limit)
 * - stale:detected (no improvement for N iterations)
 * - errors:consecutive (3+ errors in a row)
 * - circuit:breaker (5 consecutive errors → pause)
 * - disk:low (< 1GB available)
 */

import { log } from '../lib/logger';
import { broadcast } from '../lib/ws';

// ── Types ──

export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';

export type AlertType =
  | 'program:started'
  | 'program:completed'
  | 'program:failed'
  | 'budget:warning'
  | 'stale:detected'
  | 'errors:consecutive'
  | 'circuit:breaker'
  | 'disk:low'
  | 'recovery:attempt'
  | 'recovery:success'
  | 'recovery:failed';

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  programId: string;
  programName: string;
  title: string;
  message: string;
  data: Record<string, unknown>;
  timestamp: string;
}

export type ErrorSeverityClass = 'trivial' | 'moderate' | 'fundamental';

export interface AlertConfig {
  webhookUrl: string | null;
  webhookEnabled: boolean;
  logEnabled: boolean;
  wsEnabled: boolean;
}

// ── Alert Dispatcher ──

export class AlertDispatcher {
  private config: AlertConfig;
  private alerts: Alert[] = [];
  private maxAlertHistory = 200;

  constructor(config?: Partial<AlertConfig>) {
    this.config = {
      webhookUrl: config?.webhookUrl ?? null,
      webhookEnabled: config?.webhookEnabled ?? false,
      logEnabled: config?.logEnabled ?? true,
      wsEnabled: config?.wsEnabled ?? true,
    };
  }

  /** Dispatch an alert through all configured channels */
  async dispatch(alert: Omit<Alert, 'id' | 'timestamp'>): Promise<void> {
    const fullAlert: Alert = {
      ...alert,
      id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
    };

    // Store in memory (ring buffer)
    this.alerts.push(fullAlert);
    if (this.alerts.length > this.maxAlertHistory) {
      this.alerts = this.alerts.slice(-this.maxAlertHistory);
    }

    // Channel: Log
    if (this.config.logEnabled) {
      const logFn = fullAlert.severity === 'critical' || fullAlert.severity === 'error'
        ? log.error : fullAlert.severity === 'warning' ? log.warn : log.info;
      logFn(`[ALERT] ${fullAlert.title}`, {
        type: fullAlert.type,
        programId: fullAlert.programId,
        message: fullAlert.message,
        ...fullAlert.data,
      });
    }

    // Channel: WebSocket
    if (this.config.wsEnabled) {
      broadcast({
        type: 'program:alert',
        data: fullAlert,
      });
    }

    // Channel: Webhook (async, non-blocking)
    if (this.config.webhookEnabled && this.config.webhookUrl) {
      this.sendWebhook(fullAlert).catch((err) => {
        log.warn('Webhook delivery failed', { error: (err as Error).message });
      });
    }
  }

  /** Get recent alerts (for dashboard) */
  getAlerts(programId?: string, limit = 50): Alert[] {
    const filtered = programId
      ? this.alerts.filter((a) => a.programId === programId)
      : this.alerts;
    return filtered.slice(-limit);
  }

  /** Clear alerts for a program */
  clearAlerts(programId: string): void {
    this.alerts = this.alerts.filter((a) => a.programId !== programId);
  }

  // ── Convenience methods ──

  async programStarted(programId: string, programName: string): Promise<void> {
    await this.dispatch({
      type: 'program:started',
      severity: 'info',
      programId,
      programName,
      title: `Program started: ${programName}`,
      message: `Overnight program "${programName}" has started execution.`,
      data: {},
    });
  }

  async programCompleted(
    programId: string,
    programName: string,
    stats: { iterations: number; improvement: string; convergenceReason: string | null },
  ): Promise<void> {
    await this.dispatch({
      type: 'program:completed',
      severity: 'info',
      programId,
      programName,
      title: `Program completed: ${programName}`,
      message: `Completed after ${stats.iterations} iterations. Improvement: ${stats.improvement}. Reason: ${stats.convergenceReason ?? 'N/A'}.`,
      data: stats,
    });
  }

  async programFailed(programId: string, programName: string, error: string): Promise<void> {
    await this.dispatch({
      type: 'program:failed',
      severity: 'error',
      programId,
      programName,
      title: `Program failed: ${programName}`,
      message: error,
      data: { error },
    });
  }

  async budgetWarning(
    programId: string,
    programName: string,
    metric: string,
    currentPct: number,
  ): Promise<void> {
    await this.dispatch({
      type: 'budget:warning',
      severity: 'warning',
      programId,
      programName,
      title: `Budget warning: ${programName}`,
      message: `${metric} usage at ${currentPct.toFixed(0)}% of limit.`,
      data: { metric, currentPct },
    });
  }

  async staleDetected(
    programId: string,
    programName: string,
    staleCount: number,
  ): Promise<void> {
    await this.dispatch({
      type: 'stale:detected',
      severity: 'warning',
      programId,
      programName,
      title: `Stale detection: ${programName}`,
      message: `No improvement in last ${staleCount} iterations.`,
      data: { staleCount },
    });
  }

  async consecutiveErrors(
    programId: string,
    programName: string,
    errorCount: number,
  ): Promise<void> {
    const isCritical = errorCount >= 5;
    await this.dispatch({
      type: isCritical ? 'circuit:breaker' : 'errors:consecutive',
      severity: isCritical ? 'critical' : 'warning',
      programId,
      programName,
      title: isCritical
        ? `Circuit breaker: ${programName}`
        : `Consecutive errors: ${programName}`,
      message: isCritical
        ? `${errorCount} consecutive errors — program paused automatically.`
        : `${errorCount} consecutive errors detected.`,
      data: { errorCount },
    });
  }

  async diskLow(programId: string, programName: string, availableGb: number): Promise<void> {
    await this.dispatch({
      type: 'disk:low',
      severity: 'critical',
      programId,
      programName,
      title: `Low disk space`,
      message: `Only ${availableGb.toFixed(1)}GB available. Program paused.`,
      data: { availableGb },
    });
  }

  async recoveryAttempt(
    programId: string,
    programName: string,
    errorClass: ErrorSeverityClass,
    attempt: number,
  ): Promise<void> {
    await this.dispatch({
      type: 'recovery:attempt',
      severity: 'info',
      programId,
      programName,
      title: `Recovery attempt: ${programName}`,
      message: `Attempting auto-recovery for ${errorClass} error (attempt ${attempt}).`,
      data: { errorClass, attempt },
    });
  }

  // ── Webhook delivery ──

  private async sendWebhook(alert: Alert): Promise<void> {
    if (!this.config.webhookUrl) return;

    // Slack-compatible payload
    const payload = {
      text: `*${alert.title}*\n${alert.message}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${alert.title}*\n${alert.message}`,
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `Program: \`${alert.programName}\` | Severity: ${alert.severity} | ${alert.timestamp}`,
            },
          ],
        },
      ],
    };

    await fetch(this.config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    });
  }
}
