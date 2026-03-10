import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Server, Database, KeyRound, MessageSquare, Send,
  Check, X, ChevronRight, ChevronLeft, Zap, Plus, Trash2, Copy,
} from 'lucide-react';
import { useSetupWizardStore, STEPS, type WizardStep } from '../../stores/setupWizardStore';
import { useIntegrationStore } from '../../stores/integrationStore';
import { getEngineUrl, discoverEngineUrl } from '../../lib/connection';
import { primaryBtnStyle, secondaryBtnStyle, inputStyle, labelStyle, hintStyle, statusBoxStyle } from './shared-styles';

// ── Step metadata ────────────────────────────────────────

const STEP_META: Record<WizardStep, { title: string; subtitle: string; icon: React.ReactNode; color: string }> = {
  engine: {
    title: 'Engine Connection',
    subtitle: 'Connect to the AIOS Execution Engine',
    icon: <Server size={24} />,
    color: 'var(--aiox-blue, #0099FF)',
  },
  supabase: {
    title: 'Database',
    subtitle: 'Configure Supabase for persistence',
    icon: <Database size={24} />,
    color: '#3ECF8E',
  },
  'api-keys': {
    title: 'API Keys',
    subtitle: 'Add LLM provider keys for AI capabilities',
    icon: <KeyRound size={24} />,
    color: 'var(--aiox-lime, #D1FF00)',
  },
  channels: {
    title: 'Channels',
    subtitle: 'Configure messaging channels (optional)',
    icon: <MessageSquare size={24} />,
    color: '#25D366',
  },
};

// ── Step 1: Engine ───────────────────────────────────────

function EngineStep({ onDone }: { onDone: () => void }) {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const testConnection = async () => {
    setTesting(true);
    setResult(null);

    // Try configured URL first, then auto-discover
    let url = getEngineUrl();
    if (!url) {
      url = await discoverEngineUrl();
    }

    if (!url) {
      setResult({ ok: false, msg: 'No engine found. Start with: cd engine && bun run dev' });
      setTesting(false);
      return;
    }

    try {
      const res = await fetch(`${url}/health`);
      const data = await res.json() as { status: string; version: string; ws_clients: number };
      setResult({ ok: true, msg: `v${data.version} — ${data.ws_clients} WS clients — ${url}` });
      onDone();
    } catch {
      setResult({ ok: false, msg: `Cannot reach ${url}` });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <p style={{ ...hintStyle, fontSize: '12px', margin: 0 }}>
        The engine handles agent execution, webhooks, and real-time communication.
        It auto-discovers on common ports (4002, 4001, 8002).
      </p>

      <div>
        <label style={labelStyle}>Current URL</label>
        <input
          readOnly
          value={getEngineUrl() || '(auto-discovery)'}
          style={{ ...inputStyle, opacity: getEngineUrl() ? 1 : 0.5 }}
        />
        <p style={hintStyle}>
          Override: set <code style={{ color: 'var(--aiox-lime)' }}>VITE_ENGINE_URL</code> in <code>.env</code>
        </p>
      </div>

      <button onClick={testConnection} disabled={testing} style={primaryBtnStyle}>
        {testing ? 'Discovering...' : 'Test Connection'}
      </button>

      {result && (
        <div style={statusBoxStyle(result.ok)}>
          {result.ok ? <Check size={14} style={{ display: 'inline', marginRight: 6 }} /> : <X size={14} style={{ display: 'inline', marginRight: 6 }} />}
          {result.msg}
        </div>
      )}

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
        <p style={hintStyle}>
          Quick start: <code style={{ color: 'var(--aiox-lime)' }}>cd engine && bun run dev</code>
        </p>
      </div>
    </div>
  );
}

// ── Step 2: Supabase ─────────────────────────────────────

function SupabaseStep({ onDone }: { onDone: () => void }) {
  const currentUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const hasKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY;
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const testConnection = async () => {
    if (!currentUrl || !hasKey) {
      setResult({ ok: false, msg: 'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env' });
      return;
    }
    setTesting(true);
    setResult(null);
    try {
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const res = await fetch(`${currentUrl}/rest/v1/`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      });
      if (res.ok) {
        setResult({ ok: true, msg: `Connected to ${new URL(currentUrl).hostname}` });
        onDone();
      } else {
        setResult({ ok: false, msg: `HTTP ${res.status}` });
      }
    } catch {
      setResult({ ok: false, msg: 'Unreachable' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <p style={{ ...hintStyle, fontSize: '12px', margin: 0 }}>
        Supabase provides database persistence, auth, and realtime.
        Optional — the platform works without it using local storage.
      </p>

      <div>
        <label style={labelStyle}>Project URL</label>
        <input readOnly value={currentUrl || '(not configured)'} style={{ ...inputStyle, opacity: currentUrl ? 1 : 0.5 }} />
      </div>

      <div>
        <label style={labelStyle}>Anon Key</label>
        <input readOnly value={hasKey ? '••••••••••••••••••••' : '(not configured)'} style={{ ...inputStyle, opacity: hasKey ? 1 : 0.5 }} />
      </div>

      <p style={hintStyle}>
        Set in <code>.env</code>:<br />
        <code style={{ color: 'var(--aiox-lime)' }}>VITE_SUPABASE_URL=https://xxx.supabase.co</code><br />
        <code style={{ color: 'var(--aiox-lime)' }}>VITE_SUPABASE_ANON_KEY=eyJ...</code>
      </p>

      <button onClick={testConnection} disabled={testing} style={primaryBtnStyle}>
        {testing ? 'Testing...' : 'Test Connection'}
      </button>

      {result && (
        <div style={statusBoxStyle(result.ok)}>
          {result.ok ? <Check size={14} style={{ display: 'inline', marginRight: 6 }} /> : <X size={14} style={{ display: 'inline', marginRight: 6 }} />}
          {result.msg}
        </div>
      )}
    </div>
  );
}

// ── Step 3: API Keys ─────────────────────────────────────

const API_KEYS_STORAGE = 'aios-api-keys';

interface ApiKeyEntry {
  id: string;
  label: string;
  key: string;
}

function loadKeys(): ApiKeyEntry[] {
  try {
    const raw = localStorage.getItem(API_KEYS_STORAGE);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveKeys(keys: ApiKeyEntry[]) {
  localStorage.setItem(API_KEYS_STORAGE, JSON.stringify(keys));
}

function ApiKeysStep({ onDone }: { onDone: () => void }) {
  const [keys, setKeys] = useState<ApiKeyEntry[]>(loadKeys);
  const [label, setLabel] = useState('');
  const [key, setKey] = useState('');

  const addKey = () => {
    if (!label.trim() || !key.trim()) return;
    const next = [...keys, { id: crypto.randomUUID(), label: label.trim(), key: key.trim() }];
    setKeys(next);
    saveKeys(next);
    setLabel('');
    setKey('');
    onDone();
  };

  const removeKey = (id: string) => {
    const next = keys.filter((k) => k.id !== id);
    setKeys(next);
    saveKeys(next);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <p style={{ ...hintStyle, fontSize: '12px', margin: 0 }}>
        Add at least one LLM provider key to enable AI agent capabilities.
      </p>

      {keys.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {keys.map((entry) => (
            <div
              key={entry.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div>
                <div style={{ fontSize: '12px', fontFamily: 'var(--font-family-mono)', color: 'var(--aiox-cream)' }}>{entry.label}</div>
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-family-mono)', color: 'var(--aiox-gray-dim)' }}>
                  {entry.key.slice(0, 8)}••••{entry.key.slice(-4)}
                </div>
              </div>
              <button
                onClick={() => removeKey(entry.id)}
                style={{ background: 'none', border: 'none', color: 'var(--color-status-error)', cursor: 'pointer', padding: 4 }}
                aria-label={`Remove ${entry.label}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: keys.length ? '8px' : 0, borderTop: keys.length ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
        <div>
          <label style={labelStyle}>Provider</label>
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. OpenAI, Anthropic" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>API Key</label>
          <input value={key} onChange={(e) => setKey(e.target.value)} placeholder="sk-..." type="password" style={inputStyle} />
        </div>
        <button onClick={addKey} disabled={!label.trim() || !key.trim()} style={primaryBtnStyle}>
          <Plus size={14} style={{ display: 'inline', marginRight: 6 }} />
          Add Key
        </button>
      </div>
    </div>
  );
}

// ── Step 4: Channels ─────────────────────────────────────

function ChannelsStep() {
  const { openSetup } = useIntegrationStore();
  const integrations = useIntegrationStore((s) => s.integrations);

  const channels = [
    { id: 'whatsapp' as const, name: 'WhatsApp', icon: <MessageSquare size={16} />, color: '#25D366' },
    { id: 'telegram' as const, name: 'Telegram', icon: <Send size={16} />, color: '#26A5E4' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <p style={{ ...hintStyle, fontSize: '12px', margin: 0 }}>
        Messaging channels are optional. You can configure them later from the Integrations page.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {channels.map((ch) => {
          const status = integrations[ch.id].status;
          const isConnected = status === 'connected';
          return (
            <button
              key={ch.id}
              onClick={() => openSetup(ch.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                background: isConnected ? `${ch.color}10` : 'rgba(255,255,255,0.02)',
                border: `1px solid ${isConnected ? `${ch.color}40` : 'rgba(255,255,255,0.08)'}`,
                color: isConnected ? ch.color : 'var(--aiox-cream)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: ch.color }}>{ch.icon}</span>
                <div>
                  <div style={{ fontSize: '13px', fontFamily: 'var(--font-family-mono)', fontWeight: 500 }}>{ch.name}</div>
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-family-mono)', color: 'var(--aiox-gray-dim)', marginTop: '2px' }}>
                    {integrations[ch.id].message || status}
                  </div>
                </div>
              </div>
              {isConnected ? (
                <Check size={16} style={{ color: ch.color }} />
              ) : (
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-family-mono)', color: 'var(--aiox-gray-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Configure
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Progress dots ────────────────────────────────────────

function StepIndicator({ current, total, stepResults }: { current: number; total: number; stepResults: Record<WizardStep, { completed: boolean; skipped: boolean }> }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
      {Array.from({ length: total }, (_, i) => {
        const step = STEPS[i];
        const result = stepResults[step];
        const isCurrent = i === current;
        const isDone = result.completed;
        const isSkipped = result.skipped;

        return (
          <div
            key={i}
            style={{
              width: isCurrent ? '24px' : '8px',
              height: '8px',
              background: isDone
                ? 'var(--aiox-lime, #D1FF00)'
                : isSkipped
                  ? 'var(--aiox-gray-dim, #696969)'
                  : isCurrent
                    ? 'var(--aiox-lime, #D1FF00)'
                    : 'rgba(255,255,255,0.1)',
              transition: 'all 0.2s ease',
            }}
          />
        );
      })}
    </div>
  );
}

// ── Main Wizard ──────────────────────────────────────────

// ── Auto-validate: map integration status to step ────────

const STEP_INTEGRATION_MAP: Record<WizardStep, string[]> = {
  engine: ['engine'],
  supabase: ['supabase'],
  'api-keys': ['api-keys'],
  channels: ['whatsapp', 'telegram'],
};

function useAutoValidateSteps() {
  const integrations = useIntegrationStore((s) => s.integrations);
  const { stepResults, markStepCompleted } = useSetupWizardStore();

  useEffect(() => {
    for (const step of STEPS) {
      if (stepResults[step].completed) continue;
      const ids = STEP_INTEGRATION_MAP[step];
      const anyConnected = ids.some(
        (id) => integrations[id as keyof typeof integrations]?.status === 'connected',
      );
      if (anyConnected) {
        markStepCompleted(step);
      }
    }
  }, [integrations, stepResults, markStepCompleted]);
}

export function SetupWizard() {
  const {
    isOpen, currentStep, stepResults,
    nextStep, prevStep, dismiss, complete,
    markStepCompleted, markStepSkipped,
  } = useSetupWizardStore();

  // Auto-mark steps as completed when integration is already connected
  useAutoValidateSteps();

  if (!isOpen) return null;

  const step = STEPS[currentStep];
  const meta = STEP_META[step];
  const isLastStep = currentStep === STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  const handleSkip = () => {
    markStepSkipped(step);
    if (isLastStep) {
      complete();
    } else {
      nextStep();
    }
  };

  const handleNext = () => {
    if (isLastStep) {
      complete();
    } else {
      nextStep();
    }
  };

  const handleStepDone = () => {
    markStepCompleted(step);
  };

  const renderStep = () => {
    switch (step) {
      case 'engine': return <EngineStep onDone={handleStepDone} />;
      case 'supabase': return <SupabaseStep onDone={handleStepDone} />;
      case 'api-keys': return <ApiKeysStep onDone={handleStepDone} />;
      case 'channels': return <ChannelsStep />;
    }
  };

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(5, 5, 5, 0.95)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.96 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: '100%',
          maxWidth: 560,
          maxHeight: '90vh',
          overflow: 'auto',
          background: 'var(--aiox-dark, #050505)',
          border: '1px solid rgba(209, 255, 0, 0.15)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Zap size={18} style={{ color: 'var(--aiox-lime, #D1FF00)' }} />
            <div>
              <h1 style={{
                margin: 0,
                fontSize: '14px',
                fontFamily: 'var(--font-family-display, var(--font-family-mono, monospace))',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontWeight: 700,
                color: 'var(--aiox-lime, #D1FF00)',
              }}>
                Setup Wizard
              </h1>
              <p style={{
                margin: '2px 0 0',
                fontSize: '11px',
                fontFamily: 'var(--font-family-mono)',
                color: 'var(--aiox-gray-dim, #696969)',
              }}>
                Step {currentStep + 1} of {STEPS.length}
              </p>
            </div>
          </div>
          <button
            onClick={dismiss}
            style={{ background: 'none', border: 'none', color: 'var(--aiox-gray-dim)', cursor: 'pointer', padding: 4 }}
            aria-label="Close wizard"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step Header */}
        <div style={{
          padding: '20px 24px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <div style={{ color: meta.color }}>{meta.icon}</div>
          <div>
            <h2 style={{
              margin: 0,
              fontSize: '16px',
              fontFamily: 'var(--font-family-mono)',
              fontWeight: 600,
              color: 'var(--aiox-cream, #E5E5E5)',
            }}>
              {meta.title}
            </h2>
            <p style={{
              margin: '2px 0 0',
              fontSize: '12px',
              fontFamily: 'var(--font-family-mono)',
              color: 'var(--aiox-gray-muted, #999)',
            }}>
              {meta.subtitle}
            </p>
          </div>
          {stepResults[step].completed && (
            <Check size={20} style={{ color: 'var(--aiox-lime)', marginLeft: 'auto' }} />
          )}
        </div>

        {/* Step Content */}
        <div style={{ padding: '0 24px 20px' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          {/* Progress */}
          <StepIndicator current={currentStep} total={STEPS.length} stepResults={stepResults} />

          {/* Navigation */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {!isFirstStep && (
              <button onClick={prevStep} style={{ ...secondaryBtnStyle, flex: 0, width: 'auto', padding: '10px 16px' }}>
                <ChevronLeft size={14} style={{ display: 'inline', marginRight: 4 }} />
                Back
              </button>
            )}

            <button onClick={handleSkip} style={{ ...secondaryBtnStyle, flex: 1 }}>
              {isLastStep ? 'Skip & Finish' : 'Skip'}
            </button>

            <button onClick={handleNext} style={{ ...primaryBtnStyle, flex: 1 }}>
              {isLastStep ? 'Finish' : 'Next'}
              {!isLastStep && <ChevronRight size={14} style={{ display: 'inline', marginLeft: 4 }} />}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}
