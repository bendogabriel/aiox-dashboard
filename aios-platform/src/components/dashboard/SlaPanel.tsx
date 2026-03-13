/**
 * SlaPanel — P13 SLA / Uptime Goals Panel
 *
 * Displays SLA goals per integration, progress bars, violation alerts,
 * and an add/edit form. Follows AIOX brutalist theme with inline styles.
 */

import React, { useState, useMemo } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Plus,
  Trash2,
  AlertTriangle,
  Target,
  ChevronDown,
} from 'lucide-react';
import { useSlaStore } from '../../stores/slaStore';
import { useHealthMonitorStore } from '../../stores/healthMonitorStore';
import type { IntegrationId } from '../../stores/integrationStore';
import type { SlaGoal } from '../../stores/slaStore';

// ── Constants ─────────────────────────────────────────────

const INTEGRATION_LABELS: Record<IntegrationId, string> = {
  engine: 'Engine',
  supabase: 'Supabase',
  'api-keys': 'API Keys',
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  voice: 'Voice',
  'google-drive': 'Google Drive',
  'google-calendar': 'Google Calendar',
};

const ALL_INTEGRATION_IDS: IntegrationId[] = [
  'engine',
  'supabase',
  'api-keys',
  'whatsapp',
  'telegram',
  'voice',
  'google-drive',
  'google-calendar',
];

const WINDOW_OPTIONS = [
  { label: '1H', hours: 1 },
  { label: '6H', hours: 6 },
  { label: '12H', hours: 12 },
  { label: '24H', hours: 24 },
  { label: '7D', hours: 168 },
];

// ── Styles ────────────────────────────────────────────────

const monoFont = 'var(--font-family-mono, monospace)';

const panelStyle: React.CSSProperties = {
  background: 'var(--aiox-surface, #0a0a0a)',
  border: '1px solid rgba(156, 156, 156, 0.15)',
  borderRadius: 0,
  padding: '1rem',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '1rem',
};

const titleStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  fontFamily: monoFont,
  fontSize: '0.7rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--aiox-cream, #E5E5E5)',
};

const badgeBaseStyle: React.CSSProperties = {
  fontFamily: monoFont,
  fontSize: '0.55rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  padding: '3px 8px',
  borderRadius: 0,
};

const rowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 70px 70px 1fr 80px 32px',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.6rem 0.75rem',
  borderBottom: '1px solid rgba(156, 156, 156, 0.08)',
};

const rowHeaderStyle: React.CSSProperties = {
  ...rowStyle,
  borderBottom: '1px solid rgba(156, 156, 156, 0.15)',
  padding: '0.4rem 0.75rem',
};

const cellLabelStyle: React.CSSProperties = {
  fontFamily: monoFont,
  fontSize: '0.55rem',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--aiox-gray-muted, #999)',
};

const cellValueStyle: React.CSSProperties = {
  fontFamily: monoFont,
  fontSize: '0.65rem',
  color: 'var(--aiox-cream, #E5E5E5)',
};

const progressBarBg: React.CSSProperties = {
  height: '6px',
  background: 'rgba(255, 255, 255, 0.06)',
  borderRadius: 0,
  overflow: 'hidden',
  width: '100%',
};

const addBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.35rem',
  fontFamily: monoFont,
  fontSize: '0.55rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  padding: '4px 10px',
  background: 'transparent',
  color: 'var(--aiox-cream, #E5E5E5)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: 0,
  cursor: 'pointer',
};

const deleteBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '24px',
  height: '24px',
  background: 'transparent',
  color: 'var(--aiox-gray-dim, #696969)',
  border: '1px solid rgba(156, 156, 156, 0.1)',
  borderRadius: 0,
  cursor: 'pointer',
  padding: 0,
};

const formContainerStyle: React.CSSProperties = {
  marginTop: '0.75rem',
  padding: '0.75rem',
  background: 'rgba(255, 255, 255, 0.02)',
  border: '1px solid rgba(156, 156, 156, 0.12)',
  borderRadius: 0,
};

const formRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0.75rem',
  alignItems: 'flex-end',
  flexWrap: 'wrap',
};

const formGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const formLabelStyle: React.CSSProperties = {
  fontFamily: monoFont,
  fontSize: '0.5rem',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--aiox-gray-muted, #999)',
};

const selectStyle: React.CSSProperties = {
  fontFamily: monoFont,
  fontSize: '0.6rem',
  padding: '6px 8px',
  background: 'rgba(255, 255, 255, 0.03)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  color: 'var(--aiox-cream, #E5E5E5)',
  borderRadius: 0,
  outline: 'none',
  minWidth: '120px',
};

const inputStyle: React.CSSProperties = {
  fontFamily: monoFont,
  fontSize: '0.6rem',
  padding: '6px 8px',
  background: 'rgba(255, 255, 255, 0.03)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  color: 'var(--aiox-cream, #E5E5E5)',
  borderRadius: 0,
  outline: 'none',
  width: '70px',
};

const windowBtnStyle = (active: boolean): React.CSSProperties => ({
  fontFamily: monoFont,
  fontSize: '0.5rem',
  fontWeight: 600,
  padding: '4px 8px',
  background: active ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
  color: active ? 'var(--aiox-cream, #E5E5E5)' : 'var(--aiox-gray-muted, #999)',
  border: `1px solid ${active ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)'}`,
  borderRadius: 0,
  cursor: 'pointer',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
});

const submitBtnStyle: React.CSSProperties = {
  fontFamily: monoFont,
  fontSize: '0.55rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  padding: '6px 14px',
  background: 'rgba(255, 255, 255, 0.06)',
  color: 'var(--aiox-cream, #E5E5E5)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: 0,
  cursor: 'pointer',
};

const cancelBtnStyle: React.CSSProperties = {
  fontFamily: monoFont,
  fontSize: '0.55rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  padding: '6px 14px',
  background: 'transparent',
  color: 'var(--aiox-gray-muted, #999)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: 0,
  cursor: 'pointer',
};

const emptyStyle: React.CSSProperties = {
  fontFamily: monoFont,
  fontSize: '0.6rem',
  color: 'var(--aiox-gray-dim, #696969)',
  textAlign: 'center',
  padding: '2rem 1rem',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};

// ── Component ─────────────────────────────────────────────

export function SlaPanel() {
  const goals = useSlaStore((s) => s.goals);
  const setGoal = useSlaStore((s) => s.setGoal);
  const removeGoal = useSlaStore((s) => s.removeGoal);
  const getViolations = useSlaStore((s) => s.getViolations);
  const getUptimePercent = useHealthMonitorStore((s) => s.getUptimePercent);

  const [showForm, setShowForm] = useState(false);
  const [formIntegration, setFormIntegration] = useState<IntegrationId>('engine');
  const [formTarget, setFormTarget] = useState('99');
  const [formWindow, setFormWindow] = useState(24);

  const violations = useMemo(() => getViolations(), [goals, getViolations]);
  const violationMap = useMemo(() => {
    const map = new Map<IntegrationId, typeof violations[number]>();
    for (const v of violations) {
      map.set(v.integrationId, v);
    }
    return map;
  }, [violations]);

  const availableIntegrations = ALL_INTEGRATION_IDS.filter(
    (id) => !goals.some((g) => g.integrationId === id),
  );

  const handleSubmit = () => {
    const target = Math.max(90, Math.min(100, parseFloat(formTarget) || 99));
    setGoal(formIntegration, target, formWindow);
    setShowForm(false);
    setFormTarget('99');
    setFormWindow(24);
    // Reset to first available after adding
    const nextAvailable = ALL_INTEGRATION_IDS.filter(
      (id) => id !== formIntegration && !goals.some((g) => g.integrationId === id),
    );
    if (nextAvailable.length > 0) {
      setFormIntegration(nextAvailable[0]);
    }
  };

  const allMet = violations.length === 0;
  const enabledGoals = goals.filter((g) => g.enabled);

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={titleStyle}>
          <Shield size={14} />
          <span>SLA Goals</span>
          {enabledGoals.length > 0 && (
            <span style={{ fontWeight: 400, color: 'var(--aiox-gray-dim, #696969)' }}>
              ({enabledGoals.length})
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Overall badge */}
          {enabledGoals.length > 0 && (
            <div
              style={{
                ...badgeBaseStyle,
                background: allMet ? 'rgba(74, 222, 128, 0.08)' : 'rgba(239, 68, 68, 0.1)',
                color: allMet ? 'var(--color-status-success, #4ADE80)' : 'var(--color-status-error, #EF4444)',
                border: `1px solid ${allMet ? 'rgba(74, 222, 128, 0.2)' : 'rgba(239, 68, 68, 0.25)'}`,
              }}
            >
              {allMet ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={10} /> All SLAs Met
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldAlert size={10} /> {violations.length} Violation{violations.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}
          {/* Add button */}
          {availableIntegrations.length > 0 && (
            <button
              style={addBtnStyle}
              onClick={() => {
                setFormIntegration(availableIntegrations[0]);
                setShowForm(!showForm);
              }}
              aria-label="Add SLA goal"
            >
              <Plus size={10} />
              Add
            </button>
          )}
        </div>
      </div>

      {/* Goal list */}
      {goals.length > 0 ? (
        <div>
          {/* Header row */}
          <div style={rowHeaderStyle}>
            <span style={cellLabelStyle}>Integration</span>
            <span style={cellLabelStyle}>Target</span>
            <span style={cellLabelStyle}>Actual</span>
            <span style={cellLabelStyle}>Progress</span>
            <span style={cellLabelStyle}>Status</span>
            <span />
          </div>

          {/* Goal rows */}
          {goals.map((goal) => (
            <SlaGoalRow
              key={goal.integrationId}
              goal={goal}
              violation={violationMap.get(goal.integrationId)}
              actualPercent={getUptimePercent(goal.integrationId, goal.windowHours * 3_600_000)}
              onRemove={() => removeGoal(goal.integrationId)}
            />
          ))}
        </div>
      ) : (
        <div style={emptyStyle}>
          <Target size={16} style={{ marginBottom: '0.5rem', opacity: 0.4 }} />
          <div>No SLA goals configured</div>
          <div style={{ fontSize: '0.5rem', marginTop: '0.25rem', color: 'var(--aiox-gray-muted, #999)' }}>
            Add a goal to monitor integration uptime targets
          </div>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div style={formContainerStyle}>
          <div style={formRowStyle}>
            {/* Integration select */}
            <div style={formGroupStyle}>
              <label style={formLabelStyle}>Integration</label>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <select
                  value={formIntegration}
                  onChange={(e) => setFormIntegration(e.target.value as IntegrationId)}
                  style={selectStyle}
                  aria-label="Select integration"
                >
                  {availableIntegrations.map((id) => (
                    <option key={id} value={id}>
                      {INTEGRATION_LABELS[id]}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={10}
                  style={{
                    position: 'absolute',
                    right: '6px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    color: 'var(--aiox-gray-muted, #999)',
                  }}
                />
              </div>
            </div>

            {/* Target % */}
            <div style={formGroupStyle}>
              <label style={formLabelStyle}>Target %</label>
              <input
                type="number"
                min={90}
                max={100}
                step={0.1}
                value={formTarget}
                onChange={(e) => setFormTarget(e.target.value)}
                style={inputStyle}
                aria-label="Target percentage"
              />
            </div>

            {/* Window */}
            <div style={formGroupStyle}>
              <label style={formLabelStyle}>Window</label>
              <div style={{ display: 'flex', gap: '2px' }}>
                {WINDOW_OPTIONS.map((opt) => (
                  <button
                    key={opt.hours}
                    onClick={() => setFormWindow(opt.hours)}
                    style={windowBtnStyle(formWindow === opt.hours)}
                    aria-label={`Window ${opt.label}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
              <button onClick={handleSubmit} style={submitBtnStyle} aria-label="Save SLA goal">
                Save
              </button>
              <button onClick={() => setShowForm(false)} style={cancelBtnStyle} aria-label="Cancel">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Row sub-component ─────────────────────────────────────

function SlaGoalRow({
  goal,
  violation,
  actualPercent,
  onRemove,
}: {
  goal: SlaGoal;
  violation?: { deficit: number };
  actualPercent: number;
  onRemove: () => void;
}) {
  const isViolated = !!violation;
  const progress = Math.min(100, (actualPercent / goal.targetPercent) * 100);
  const windowLabel =
    goal.windowHours >= 168
      ? `${Math.round(goal.windowHours / 24)}d`
      : `${goal.windowHours}h`;

  return (
    <div
      style={{
        ...rowStyle,
        opacity: goal.enabled ? 1 : 0.45,
        borderLeft: isViolated
          ? '2px solid var(--color-status-error, #EF4444)'
          : '2px solid transparent',
      }}
    >
      {/* Integration name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        {isViolated && (
          <AlertTriangle
            size={11}
            style={{ color: 'var(--color-status-error, #EF4444)', flexShrink: 0 }}
          />
        )}
        <span style={cellValueStyle}>{INTEGRATION_LABELS[goal.integrationId]}</span>
        <span
          style={{
            fontFamily: monoFont,
            fontSize: '0.45rem',
            color: 'var(--aiox-gray-dim, #696969)',
            textTransform: 'uppercase',
          }}
        >
          {windowLabel}
        </span>
      </div>

      {/* Target */}
      <span
        style={{
          ...cellValueStyle,
          color: 'var(--aiox-gray-muted, #999)',
          fontSize: '0.6rem',
        }}
      >
        {goal.targetPercent}%
      </span>

      {/* Actual */}
      <span
        style={{
          ...cellValueStyle,
          color: isViolated
            ? 'var(--color-status-error, #EF4444)'
            : 'var(--color-status-success, #4ADE80)',
          fontSize: '0.6rem',
          fontWeight: 600,
        }}
      >
        {actualPercent}%
      </span>

      {/* Progress bar */}
      <div style={progressBarBg}>
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            background: isViolated
              ? 'var(--color-status-error, #EF4444)'
              : 'var(--color-status-success, #4ADE80)',
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      {/* Status badge */}
      <div
        style={{
          ...badgeBaseStyle,
          background: isViolated
            ? 'rgba(239, 68, 68, 0.1)'
            : 'rgba(74, 222, 128, 0.08)',
          color: isViolated
            ? 'var(--color-status-error, #EF4444)'
            : 'var(--color-status-success, #4ADE80)',
          border: `1px solid ${
            isViolated ? 'rgba(239, 68, 68, 0.2)' : 'rgba(74, 222, 128, 0.2)'
          }`,
          textAlign: 'center',
        }}
      >
        {isViolated ? 'VIOLATED' : 'MET'}
      </div>

      {/* Delete */}
      <button
        onClick={onRemove}
        style={deleteBtnStyle}
        aria-label={`Remove SLA goal for ${INTEGRATION_LABELS[goal.integrationId]}`}
      >
        <Trash2 size={11} />
      </button>
    </div>
  );
}
