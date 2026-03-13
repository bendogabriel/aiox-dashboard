/**
 * IntegrationTestPanel — P12 Integration Test Suite UI
 *
 * Collapsible panel that runs all 8 integration probes sequentially,
 * displays per-integration results with latency, and provides
 * summary + JSON export.
 */

import { useState, useCallback, useRef } from 'react';
import {
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Download,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  runIntegrationTests,
  ALL_INTEGRATION_IDS,
  type TestSuiteResult,
  type IntegrationTestResult,
} from '../../lib/integration-test-runner';
import type { IntegrationId } from '../../stores/integrationStore';

// ── Integration display names ─────────────────────────────

const INTEGRATION_NAMES: Record<IntegrationId, string> = {
  engine: 'AIOS Engine',
  supabase: 'Supabase',
  'api-keys': 'API Keys',
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  voice: 'Voice / TTS',
  'google-drive': 'Google Drive',
  'google-calendar': 'Google Calendar',
};

// ── Latency color helper ──────────────────────────────────

function latencyColor(ms: number): string {
  if (ms < 500) return 'var(--color-status-success, #4ADE80)';
  if (ms <= 2000) return 'var(--aiox-warning, #f59e0b)';
  return 'var(--color-status-error, #EF4444)';
}

// ── Component ─────────────────────────────────────────────

export function IntegrationTestPanel() {
  const [expanded, setExpanded] = useState(false);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ index: number; id: IntegrationId } | null>(null);
  const [result, setResult] = useState<TestSuiteResult | null>(null);
  const runningRef = useRef(false);

  const handleRun = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    setRunning(true);
    setResult(null);

    try {
      const suiteResult = await runIntegrationTests((index, id) => {
        setProgress({ index, id });
      });
      setResult(suiteResult);
    } finally {
      setRunning(false);
      setProgress(null);
      runningRef.current = false;
    }
  }, []);

  const handleExport = useCallback(() => {
    if (!result) return;
    const json = JSON.stringify(result, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `integration-test-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [result]);

  return (
    <div
      style={{
        border: '1px solid rgba(255,255,255,0.08)',
        fontFamily: 'var(--font-family-mono, monospace)',
      }}
    >
      {/* Collapsible header */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 14px',
          background: 'rgba(255,255,255,0.02)',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--aiox-cream, #E5E5E5)',
          fontSize: '12px',
          fontFamily: 'inherit',
          textAlign: 'left',
        }}
      >
        <Play size={14} style={{ color: 'var(--aiox-gray-dim, #696969)' }} />
        <span
          style={{
            flex: 1,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            fontWeight: 600,
          }}
        >
          Integration Tests
        </span>
        {result && (
          <span
            style={{
              fontSize: '10px',
              color:
                result.summary.failed === 0
                  ? 'var(--color-status-success, #4ADE80)'
                  : 'var(--color-status-error, #EF4444)',
            }}
          >
            {result.summary.passed}/{result.summary.total} passed
          </span>
        )}
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {expanded && (
        <div style={{ padding: '0 14px 14px' }}>
          {/* Run / Re-run button + progress */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px',
            }}
          >
            <button
              onClick={handleRun}
              disabled={running}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                flex: 1,
                padding: '8px 14px',
                fontSize: '11px',
                fontFamily: 'inherit',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 600,
                background: running
                  ? 'rgba(0, 153, 255, 0.08)'
                  : 'rgba(0, 153, 255, 0.12)',
                border: `1px solid ${running ? 'rgba(0, 153, 255, 0.2)' : 'rgba(0, 153, 255, 0.3)'}`,
                color: 'var(--aiox-blue, #0099FF)',
                cursor: running ? 'wait' : 'pointer',
              }}
            >
              {running ? (
                <>
                  <Loader2
                    size={13}
                    style={{ animation: 'spin 1s linear infinite' }}
                  />
                  Testing...
                </>
              ) : result ? (
                <>
                  <RotateCcw size={13} />
                  Re-run All Checks
                </>
              ) : (
                <>
                  <Play size={13} />
                  Run All Checks
                </>
              )}
            </button>

            {/* Export button (only when results exist) */}
            {result && !running && (
              <button
                onClick={handleExport}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  fontSize: '11px',
                  fontFamily: 'inherit',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'var(--aiox-cream, #E5E5E5)',
                  cursor: 'pointer',
                }}
                title="Export results as JSON"
                aria-label="Export test results as JSON"
              >
                <Download size={12} />
                JSON
              </button>
            )}
          </div>

          {/* Progress indicator */}
          {running && progress && (
            <div
              style={{
                padding: '8px 10px',
                marginBottom: '10px',
                background: 'rgba(0, 153, 255, 0.04)',
                border: '1px solid rgba(0, 153, 255, 0.12)',
                fontSize: '11px',
                color: 'var(--aiox-blue, #0099FF)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Loader2
                size={12}
                style={{ animation: 'spin 1s linear infinite' }}
              />
              <span>
                Testing {progress.index + 1}/{ALL_INTEGRATION_IDS.length}
                {' — '}
                {INTEGRATION_NAMES[progress.id]}
              </span>
              {/* Progress bar */}
              <div
                style={{
                  flex: 1,
                  height: '2px',
                  background: 'rgba(0, 153, 255, 0.12)',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${((progress.index + 1) / ALL_INTEGRATION_IDS.length) * 100}%`,
                    background: 'var(--aiox-blue, #0099FF)',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>
          )}

          {/* Results grid */}
          {result && (
            <>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  marginBottom: '10px',
                }}
              >
                {result.results.map((r: IntegrationTestResult) => (
                  <ResultRow key={r.id} result={r} />
                ))}
              </div>

              {/* Summary bar */}
              <SummaryBar result={result} />
            </>
          )}

          {/* Hint when no results */}
          {!result && !running && (
            <p
              style={{
                margin: 0,
                fontSize: '10px',
                color: 'var(--aiox-gray-dim, #696969)',
              }}
            >
              Run all 8 integration health probes sequentially and measure
              latency per service.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Result row ────────────────────────────────────────────

function ResultRow({ result }: { result: IntegrationTestResult }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 10px',
        background: result.ok
          ? 'rgba(74, 222, 128, 0.03)'
          : 'rgba(239, 68, 68, 0.03)',
        border: `1px solid ${
          result.ok
            ? 'rgba(74, 222, 128, 0.1)'
            : 'rgba(239, 68, 68, 0.1)'
        }`,
      }}
    >
      {/* Status icon */}
      {result.ok ? (
        <CheckCircle2
          size={14}
          style={{ color: 'var(--color-status-success, #4ADE80)', flexShrink: 0 }}
        />
      ) : (
        <XCircle
          size={14}
          style={{ color: 'var(--color-status-error, #EF4444)', flexShrink: 0 }}
        />
      )}

      {/* Name */}
      <span
        style={{
          flex: 1,
          fontSize: '11px',
          fontFamily: 'var(--font-family-mono, monospace)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          color: 'var(--aiox-cream, #E5E5E5)',
        }}
      >
        {INTEGRATION_NAMES[result.id]}
      </span>

      {/* Status badge */}
      <span
        style={{
          fontSize: '9px',
          fontFamily: 'var(--font-family-mono, monospace)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          fontWeight: 600,
          padding: '2px 6px',
          background: result.ok
            ? 'rgba(74, 222, 128, 0.08)'
            : 'rgba(239, 68, 68, 0.1)',
          color: result.ok
            ? 'var(--color-status-success, #4ADE80)'
            : 'var(--color-status-error, #EF4444)',
        }}
      >
        {result.ok ? 'PASS' : 'FAIL'}
      </span>

      {/* Latency */}
      <span
        style={{
          fontSize: '10px',
          fontFamily: 'var(--font-family-mono, monospace)',
          color: latencyColor(result.latencyMs),
          minWidth: '52px',
          textAlign: 'right',
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
          justifyContent: 'flex-end',
        }}
      >
        <Clock size={10} />
        {result.latencyMs}ms
      </span>

      {/* Message */}
      <span
        style={{
          fontSize: '10px',
          color: 'var(--aiox-gray-muted, #999)',
          maxWidth: '140px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        title={result.message}
      >
        {result.message}
      </span>
    </div>
  );
}

// ── Summary bar ───────────────────────────────────────────

function SummaryBar({ result }: { result: TestSuiteResult }) {
  const { summary } = result;
  const allPassed = summary.failed === 0;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '8px 10px',
        background: allPassed
          ? 'rgba(74, 222, 128, 0.04)'
          : 'rgba(239, 68, 68, 0.04)',
        border: `1px solid ${
          allPassed
            ? 'rgba(74, 222, 128, 0.12)'
            : 'rgba(239, 68, 68, 0.15)'
        }`,
        fontSize: '10px',
        fontFamily: 'var(--font-family-mono, monospace)',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      }}
    >
      {/* Pass/fail count */}
      <span
        style={{
          fontWeight: 600,
          color: allPassed
            ? 'var(--color-status-success, #4ADE80)'
            : 'var(--color-status-error, #EF4444)',
        }}
      >
        {summary.passed}/{summary.total} passed
      </span>

      <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>

      {/* Total duration */}
      <span style={{ color: 'var(--aiox-gray-muted, #999)' }}>
        Total: {summary.totalDurationMs}ms
      </span>

      <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>

      {/* Avg latency */}
      <span style={{ color: latencyColor(summary.avgLatencyMs) }}>
        Avg: {summary.avgLatencyMs}ms
      </span>
    </div>
  );
}
