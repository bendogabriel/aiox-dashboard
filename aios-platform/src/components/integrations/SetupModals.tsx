import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Server, MessageSquare, Database, Copy, Check, ExternalLink, QrCode, KeyRound, Mic, Plus, Trash2 } from 'lucide-react';
import { useIntegrationStore } from '../../stores/integrationStore';
import { getEngineUrl } from '../../lib/connection';

// ── Shared Modal Shell ────────────────────────────────────

function ModalShell({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.85)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.97 }}
        transition={{ duration: 0.2 }}
        style={{
          width: '100%',
          maxWidth: 520,
          maxHeight: '90vh',
          overflow: 'auto',
          background: 'var(--aiox-dark, #050505)',
          border: '1px solid rgba(209, 255, 0, 0.15)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '14px',
              fontFamily: 'var(--font-family-mono, monospace)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 600,
              color: 'var(--aiox-lime, #D1FF00)',
            }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--aiox-gray-dim, #696969)',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px' }}>
          {children}
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}

// ── Shared Styles ─────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  fontSize: '13px',
  fontFamily: 'var(--font-family-mono, monospace)',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: 'var(--aiox-cream, #E5E5E5)',
  outline: 'none',
  borderRadius: 0,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  fontFamily: 'var(--font-family-mono, monospace)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--aiox-gray-muted, #999)',
  marginBottom: '6px',
};

const hintStyle: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--aiox-gray-dim, #696969)',
  marginTop: '6px',
  fontFamily: 'var(--font-family-mono, monospace)',
};

const primaryBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px',
  fontSize: '13px',
  fontFamily: 'var(--font-family-mono, monospace)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  fontWeight: 600,
  background: 'var(--aiox-lime, #D1FF00)',
  color: 'var(--aiox-dark, #050505)',
  border: '1px solid var(--aiox-lime, #D1FF00)',
  cursor: 'pointer',
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{ background: 'none', border: 'none', color: 'var(--aiox-gray-muted)', cursor: 'pointer', padding: 2 }}
      title="Copy"
    >
      {copied ? <Check size={14} style={{ color: 'var(--aiox-lime)' }} /> : <Copy size={14} />}
    </button>
  );
}

// ── Engine Setup ──────────────────────────────────────────

function EngineSetup({ onClose }: { onClose: () => void }) {
  const currentUrl = getEngineUrl() || '';
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const testConnection = async () => {
    const url = currentUrl;
    if (!url) { setResult({ ok: false, msg: 'VITE_ENGINE_URL not set in .env' }); return; }
    setTesting(true);
    setResult(null);
    try {
      const res = await fetch(`${url}/health`);
      const data = await res.json() as { status: string; version: string; ws_clients: number };
      setResult({ ok: true, msg: `v${data.version} — ${data.ws_clients} WS clients — ${data.status}` });
    } catch {
      setResult({ ok: false, msg: `Cannot reach ${url}` });
    } finally {
      setTesting(false);
    }
  };

  return (
    <ModalShell title="Engine Connection" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--aiox-blue, #0099FF)' }}>
          <Server size={20} />
          <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '13px' }}>AIOS Execution Engine</span>
        </div>

        <div>
          <label style={labelStyle}>Engine URL</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              readOnly
              value={currentUrl || '(not configured)'}
              style={{ ...inputStyle, opacity: currentUrl ? 1 : 0.5 }}
            />
            {currentUrl && <CopyButton text={currentUrl} />}
          </div>
          <p style={hintStyle}>
            Set <code style={{ color: 'var(--aiox-lime)' }}>VITE_ENGINE_URL</code> in your <code>.env</code> file.
            Default: <code>http://localhost:4002</code>
          </p>
        </div>

        <button onClick={testConnection} disabled={testing} style={primaryBtnStyle}>
          {testing ? 'Testing...' : 'Test Connection'}
        </button>

        {result && (
          <div
            style={{
              padding: '10px 12px',
              fontSize: '12px',
              fontFamily: 'var(--font-family-mono)',
              background: result.ok ? 'rgba(209,255,0,0.06)' : 'rgba(239,68,68,0.06)',
              border: `1px solid ${result.ok ? 'rgba(209,255,0,0.2)' : 'rgba(239,68,68,0.2)'}`,
              color: result.ok ? 'var(--aiox-lime)' : 'var(--color-status-error)',
            }}
          >
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
    </ModalShell>
  );
}

// ── WhatsApp Setup ────────────────────────────────────────

function WhatsAppSetup({ onClose }: { onClose: () => void }) {
  const engineUrl = getEngineUrl() || '';
  const [provider, setProvider] = useState<'waha' | 'meta'>('waha');
  const [qrLoading, setQrLoading] = useState(false);
  const [qrData, setQrData] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const fetchQR = async () => {
    if (!engineUrl) { setStatusMsg('Engine not configured'); return; }
    setQrLoading(true);
    setQrData(null);
    try {
      const res = await fetch(`${engineUrl}/whatsapp/qr`);
      const data = await res.json() as { qr?: string; error?: string; message?: string };
      if (data.qr) {
        setQrData(data.qr);
      } else {
        setStatusMsg(data.message || data.error || 'QR not available');
      }
    } catch {
      setStatusMsg('Cannot reach engine');
    } finally {
      setQrLoading(false);
    }
  };

  const checkStatus = async () => {
    if (!engineUrl) return;
    try {
      const res = await fetch(`${engineUrl}/whatsapp/status`);
      const data = await res.json() as { configured: boolean; provider?: string; session?: { status?: string } };
      setStatusMsg(
        data.configured
          ? `${data.provider} — session: ${data.session?.status || 'unknown'}`
          : 'Not configured',
      );
    } catch {
      setStatusMsg('Cannot reach engine');
    }
  };

  return (
    <ModalShell title="WhatsApp Integration" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#25D366' }}>
          <MessageSquare size={20} />
          <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '13px' }}>WhatsApp Business</span>
        </div>

        {/* Provider selector */}
        <div>
          <label style={labelStyle}>Provider</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['waha', 'meta'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setProvider(p)}
                style={{
                  flex: 1,
                  padding: '8px',
                  fontSize: '12px',
                  fontFamily: 'var(--font-family-mono)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  background: provider === p ? 'rgba(37, 211, 102, 0.1)' : 'transparent',
                  border: `1px solid ${provider === p ? 'rgba(37, 211, 102, 0.3)' : 'rgba(255,255,255,0.08)'}`,
                  color: provider === p ? '#25D366' : 'var(--aiox-gray-muted)',
                  cursor: 'pointer',
                }}
              >
                {p === 'waha' ? 'WAHA (Self-hosted)' : 'Meta Cloud API'}
              </button>
            ))}
          </div>
        </div>

        {provider === 'waha' ? (
          <>
            <div style={hintStyle}>
              <strong style={{ color: 'var(--aiox-cream)' }}>WAHA setup:</strong><br />
              1. Run <code style={{ color: 'var(--aiox-lime)' }}>docker run -p 3000:3000 devlikeapro/waha</code><br />
              2. Set env vars in <code>engine/.env</code>:<br />
              <code style={{ color: 'var(--aiox-lime)' }}>WHATSAPP_PROVIDER=waha</code><br />
              <code style={{ color: 'var(--aiox-lime)' }}>WAHA_URL=http://localhost:3000</code><br />
              3. Restart engine, then scan QR below
            </div>
            <button onClick={fetchQR} disabled={qrLoading} style={primaryBtnStyle}>
              <QrCode size={14} style={{ display: 'inline', marginRight: 6 }} />
              {qrLoading ? 'Loading QR...' : 'Get QR Code'}
            </button>
            {qrData && (
              <div style={{ textAlign: 'center', padding: '16px', background: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
                <img src={qrData} alt="WhatsApp QR" style={{ maxWidth: 256, imageRendering: 'pixelated' }} />
              </div>
            )}
          </>
        ) : (
          <div style={hintStyle}>
            <strong style={{ color: 'var(--aiox-cream)' }}>Meta Cloud API setup:</strong><br />
            1. Create a Meta Business App at{' '}
            <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" style={{ color: 'var(--aiox-blue)' }}>
              developers.facebook.com <ExternalLink size={11} style={{ display: 'inline' }} />
            </a><br />
            2. Set env vars in <code>engine/.env</code>:<br />
            <code style={{ color: 'var(--aiox-lime)' }}>WHATSAPP_PROVIDER=meta</code><br />
            <code style={{ color: 'var(--aiox-lime)' }}>WHATSAPP_ACCESS_TOKEN=...</code><br />
            <code style={{ color: 'var(--aiox-lime)' }}>WHATSAPP_PHONE_NUMBER_ID=...</code><br />
            <code style={{ color: 'var(--aiox-lime)' }}>WHATSAPP_VERIFY_TOKEN=...</code><br />
            3. Set webhook URL to <code style={{ color: 'var(--aiox-lime)' }}>{engineUrl}/whatsapp/webhook</code>
          </div>
        )}

        <button onClick={checkStatus} style={{ ...primaryBtnStyle, background: 'transparent', color: 'var(--aiox-cream)', border: '1px solid rgba(255,255,255,0.1)' }}>
          Check Status
        </button>

        {statusMsg && (
          <div style={{ padding: '8px 12px', fontSize: '12px', fontFamily: 'var(--font-family-mono)', color: 'var(--aiox-gray-muted)', background: 'rgba(255,255,255,0.02)', borderLeft: '2px solid rgba(37, 211, 102, 0.3)' }}>
            {statusMsg}
          </div>
        )}
      </div>
    </ModalShell>
  );
}

// ── Supabase Setup ────────────────────────────────────────

function SupabaseSetup({ onClose }: { onClose: () => void }) {
  const currentUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const hasKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY;
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const testConnection = async () => {
    if (!currentUrl || !hasKey) {
      setResult({ ok: false, msg: 'VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set' });
      return;
    }
    setTesting(true);
    setResult(null);
    try {
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const res = await fetch(`${currentUrl}/rest/v1/`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      });
      if (res.ok || res.status === 200) {
        setResult({ ok: true, msg: `Connected to ${new URL(currentUrl).hostname}` });
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
    <ModalShell title="Supabase Connection" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#3ECF8E' }}>
          <Database size={20} />
          <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '13px' }}>Supabase</span>
        </div>

        <div>
          <label style={labelStyle}>Project URL</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input readOnly value={currentUrl || '(not configured)'} style={{ ...inputStyle, opacity: currentUrl ? 1 : 0.5 }} />
            {currentUrl && <CopyButton text={currentUrl} />}
          </div>
        </div>

        <div>
          <label style={labelStyle}>Anon Key</label>
          <input
            readOnly
            value={hasKey ? '••••••••••••••••••••' : '(not configured)'}
            style={{ ...inputStyle, opacity: hasKey ? 1 : 0.5 }}
          />
        </div>

        <p style={hintStyle}>
          Set in your <code>.env</code> file:<br />
          <code style={{ color: 'var(--aiox-lime)' }}>VITE_SUPABASE_URL=https://xxx.supabase.co</code><br />
          <code style={{ color: 'var(--aiox-lime)' }}>VITE_SUPABASE_ANON_KEY=eyJ...</code>
        </p>

        <button onClick={testConnection} disabled={testing} style={primaryBtnStyle}>
          {testing ? 'Testing...' : 'Test Connection'}
        </button>

        {result && (
          <div
            style={{
              padding: '10px 12px',
              fontSize: '12px',
              fontFamily: 'var(--font-family-mono)',
              background: result.ok ? 'rgba(62,207,142,0.06)' : 'rgba(239,68,68,0.06)',
              border: `1px solid ${result.ok ? 'rgba(62,207,142,0.2)' : 'rgba(239,68,68,0.2)'}`,
              color: result.ok ? '#3ECF8E' : 'var(--color-status-error)',
            }}
          >
            {result.ok ? <Check size={14} style={{ display: 'inline', marginRight: 6 }} /> : <X size={14} style={{ display: 'inline', marginRight: 6 }} />}
            {result.msg}
          </div>
        )}
      </div>
    </ModalShell>
  );
}

// ── API Keys Setup ───────────────────────────────────────

const STORAGE_KEY = 'aios-api-keys';

interface ApiKeyEntry {
  id: string;
  label: string;
  key: string;
}

function loadKeys(): ApiKeyEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveKeys(keys: ApiKeyEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
}

function ApiKeysSetup({ onClose }: { onClose: () => void }) {
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
  };

  const removeKey = (id: string) => {
    const next = keys.filter((k) => k.id !== id);
    setKeys(next);
    saveKeys(next);
  };

  return (
    <ModalShell title="API Keys" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--aiox-lime, #D1FF00)' }}>
          <KeyRound size={20} />
          <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '13px' }}>LLM Provider Keys</span>
        </div>

        {/* Existing keys */}
        {keys.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                  <div style={{ fontSize: '12px', fontFamily: 'var(--font-family-mono)', color: 'var(--aiox-cream, #E5E5E5)' }}>
                    {entry.label}
                  </div>
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-family-mono)', color: 'var(--aiox-gray-dim, #696969)' }}>
                    {entry.key.slice(0, 8)}••••{entry.key.slice(-4)}
                  </div>
                </div>
                <button
                  onClick={() => removeKey(entry.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--color-status-error, #EF4444)', cursor: 'pointer', padding: 4 }}
                  title="Remove"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add new key */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <label style={labelStyle}>Provider</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. OpenAI, Anthropic, Google"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>API Key</label>
            <input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="sk-..."
              type="password"
              style={inputStyle}
            />
          </div>
          <button onClick={addKey} disabled={!label.trim() || !key.trim()} style={primaryBtnStyle}>
            <Plus size={14} style={{ display: 'inline', marginRight: 6 }} />
            Add Key
          </button>
        </div>

        <p style={hintStyle}>
          Keys are stored in <code>localStorage</code> and sent to the engine for LLM calls.
          For production, use environment variables instead.
        </p>
      </div>
    </ModalShell>
  );
}

// ── Voice Setup ──────────────────────────────────────────

const VOICE_STORAGE_KEY = 'aios-voice-settings';

function VoiceSetup({ onClose }: { onClose: () => void }) {
  const [provider, setProvider] = useState<string>(() => {
    try {
      const raw = localStorage.getItem(VOICE_STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        return data?.state?.ttsProvider || data?.state?.provider || 'browser';
      }
    } catch { /* empty */ }
    return 'browser';
  });

  const saveProvider = (p: string) => {
    setProvider(p);
    const existing = (() => {
      try {
        const raw = localStorage.getItem(VOICE_STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
      } catch { return {}; }
    })();
    localStorage.setItem(VOICE_STORAGE_KEY, JSON.stringify({
      ...existing,
      state: { ...(existing.state || {}), ttsProvider: p, provider: p },
    }));
  };

  const providers = [
    { value: 'browser', label: 'Browser TTS', hint: 'Built-in, no API key needed' },
    { value: 'elevenlabs', label: 'ElevenLabs', hint: 'High quality, requires API key' },
    { value: 'openai', label: 'OpenAI TTS', hint: 'Requires OpenAI API key' },
  ];

  return (
    <ModalShell title="Voice / TTS" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--aiox-blue, #0099FF)' }}>
          <Mic size={20} />
          <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '13px' }}>Text-to-Speech Provider</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {providers.map((p) => (
            <button
              key={p.value}
              onClick={() => saveProvider(p.value)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px',
                background: provider === p.value ? 'rgba(0, 153, 255, 0.08)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${provider === p.value ? 'rgba(0, 153, 255, 0.3)' : 'rgba(255,255,255,0.06)'}`,
                color: provider === p.value ? 'var(--aiox-blue, #0099FF)' : 'var(--aiox-cream, #E5E5E5)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div>
                <div style={{ fontSize: '13px', fontFamily: 'var(--font-family-mono)', fontWeight: 500 }}>{p.label}</div>
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-family-mono)', color: 'var(--aiox-gray-dim)', marginTop: '2px' }}>{p.hint}</div>
              </div>
              {provider === p.value && <Check size={16} />}
            </button>
          ))}
        </div>

        <p style={hintStyle}>
          Selected provider is saved to <code>localStorage</code> and used by the voice module.
          API-based providers require a valid key in the API Keys section.
        </p>
      </div>
    </ModalShell>
  );
}

// ── Router ────────────────────────────────────────────────

const modals: Record<string, React.ComponentType<{ onClose: () => void }>> = {
  engine: EngineSetup,
  whatsapp: WhatsAppSetup,
  supabase: SupabaseSetup,
  'api-keys': ApiKeysSetup,
  voice: VoiceSetup,
};

export function IntegrationSetupModal() {
  const { setupModalOpen, closeSetup } = useIntegrationStore();

  const Modal = setupModalOpen ? modals[setupModalOpen] : null;

  return (
    <AnimatePresence>
      {Modal && <Modal onClose={closeSetup} />}
    </AnimatePresence>
  );
}
