import { useState } from 'react';
import { Server, MessageSquare, Database, KeyRound, Mic, Send, HardDrive, CalendarDays, RefreshCw, Wand2 } from 'lucide-react';
import { useIntegrationStatus } from '../../hooks/useIntegrationStatus';
import { useIntegrationStore, type IntegrationId } from '../../stores/integrationStore';
import { useSetupWizardStore } from '../../stores/setupWizardStore';
import { IntegrationCard } from './IntegrationCard';
import { IntegrationSetupModal } from './SetupModals';
import { ConfigExportImport } from './ConfigExportImport';
import { EnvGenerator } from './EnvGenerator';
import { ConfigShareQR } from './ConfigShareQR';
import { WebhookAlerts } from './WebhookAlerts';
import { ProfileSwitcher } from './ProfileSwitcher';
import { IntegrationTestPanel } from './IntegrationTestPanel';
import { IntegrationDocsPanel } from './IntegrationDocsPanel';
import { TeamConfigSync } from './TeamConfigSync';

// ── Integration metadata with categories ──────────────────

interface IntegrationMeta {
  id: IntegrationId;
  name: string;
  description: string;
  icon: React.ReactNode;
}

interface IntegrationCategory {
  label: string;
  items: IntegrationMeta[];
}

const categories: IntegrationCategory[] = [
  {
    label: 'Core Infrastructure',
    items: [
      { id: 'engine', name: 'AIOS Engine', description: 'Execution engine for agents and workflows', icon: <Server size={20} /> },
      { id: 'supabase', name: 'Supabase', description: 'Database, auth and realtime backend', icon: <Database size={20} /> },
      { id: 'api-keys', name: 'API Keys', description: 'LLM provider keys (OpenAI, Anthropic, etc.)', icon: <KeyRound size={20} /> },
    ],
  },
  {
    label: 'Channels',
    items: [
      { id: 'whatsapp', name: 'WhatsApp', description: 'Business messaging via WAHA or Meta Cloud API', icon: <MessageSquare size={20} /> },
      { id: 'telegram', name: 'Telegram', description: 'Bot messaging via Telegram Bot API', icon: <Send size={20} /> },
      { id: 'voice', name: 'Voice / TTS', description: 'Text-to-speech provider configuration', icon: <Mic size={20} /> },
    ],
  },
  {
    label: 'Google Services',
    items: [
      { id: 'google-drive', name: 'Google Drive', description: 'File storage, docs, and shared drives', icon: <HardDrive size={20} /> },
      { id: 'google-calendar', name: 'Google Calendar', description: 'Calendar events, scheduling, and availability', icon: <CalendarDays size={20} /> },
    ],
  },
];

// ── Category section header ───────────────────────────────

function CategoryHeader({ label, connectedCount, total }: { label: string; connectedCount: number; total: number }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '12px',
        marginTop: '8px',
      }}
    >
      <h2
        style={{
          margin: 0,
          fontSize: '11px',
          fontFamily: 'var(--font-family-mono, monospace)',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.1em',
          fontWeight: 600,
          color: 'var(--aiox-gray-muted, #999)',
        }}
      >
        {label}
      </h2>
      <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
      <span
        style={{
          fontSize: '11px',
          fontFamily: 'var(--font-family-mono, monospace)',
          color: connectedCount === total
            ? 'var(--color-status-success, #4ADE80)'
            : 'var(--aiox-gray-dim, #696969)',
        }}
      >
        {connectedCount}/{total}
      </span>
    </div>
  );
}

// ── Main Hub ──────────────────────────────────────────────

export default function IntegrationHub() {
  const { integrations, checkAll, checkOne } = useIntegrationStatus();
  const { openSetup } = useIntegrationStore();
  const openWizard = useSetupWizardStore((s) => s.open);
  const [refreshing, setRefreshing] = useState(false);

  const connectedCount = Object.values(integrations).filter((i) => i.status === 'connected').length;
  const total = Object.keys(integrations).length;

  const handleRefreshAll = async () => {
    setRefreshing(true);
    await checkAll();
    setRefreshing(false);
  };

  return (
    <div
      style={{
        height: '100%',
        overflow: 'auto',
        padding: '24px 32px',
        background: 'var(--aiox-dark, #050505)',
      }}
    >
      <div style={{ maxWidth: 1060, margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: '28px',
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: '18px',
                fontFamily: 'var(--font-family-display, var(--font-family-mono, monospace))',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.1em',
                fontWeight: 700,
                color: 'var(--aiox-cream, #FAF9F6)',
              }}
            >
              Integrations
            </h1>
            <p
              style={{
                margin: '6px 0 0',
                fontSize: '13px',
                fontFamily: 'var(--font-family-mono, monospace)',
                color: 'var(--aiox-gray-muted, #999)',
              }}
            >
              {connectedCount}/{total} connected — configure services to enable full platform capabilities
            </p>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Setup Wizard */}
          <button
            onClick={openWizard}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              fontSize: '11px',
              fontFamily: 'var(--font-family-mono, monospace)',
              textTransform: 'uppercase' as const,
              letterSpacing: '0.06em',
              fontWeight: 500,
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: 'var(--aiox-cream, #E5E5E5)',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            title="Run Setup Wizard"
          >
            <Wand2 size={13} />
            Wizard
          </button>

          {/* Export / Import */}
          <ConfigExportImport />

          {/* Refresh All */}
          <button
            onClick={handleRefreshAll}
            disabled={refreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              fontSize: '11px',
              fontFamily: 'var(--font-family-mono, monospace)',
              textTransform: 'uppercase' as const,
              letterSpacing: '0.06em',
              fontWeight: 500,
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)',
              color: refreshing ? 'var(--aiox-cream, #E5E5E5)' : 'var(--aiox-gray-muted, #999)',
              cursor: refreshing ? 'wait' : 'pointer',
              transition: 'color 0.15s, border-color 0.15s',
            }}
            onMouseEnter={(e) => {
              if (!refreshing) {
                e.currentTarget.style.color = 'var(--aiox-cream, #E5E5E5)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              }
            }}
            onMouseLeave={(e) => {
              if (!refreshing) {
                e.currentTarget.style.color = 'var(--aiox-gray-muted, #999)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
              }
            }}
          >
            <RefreshCw size={13} style={refreshing ? { animation: 'spin 1s linear infinite' } : undefined} />
            {refreshing ? 'Checking...' : 'Refresh All'}
          </button>
          </div>
        </div>

        {/* Categorized Grid */}
        {categories.map((cat) => {
          const catConnected = cat.items.filter((m) => integrations[m.id].status === 'connected').length;
          return (
            <div key={cat.label} style={{ marginBottom: '24px' }}>
              <CategoryHeader label={cat.label} connectedCount={catConnected} total={cat.items.length} />
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '12px',
                }}
              >
                {cat.items.map((meta) => (
                  <IntegrationCard
                    key={meta.id}
                    name={meta.name}
                    description={meta.description}
                    icon={meta.icon}
                    status={integrations[meta.id].status}
                    message={integrations[meta.id].message}
                    lastChecked={integrations[meta.id].lastChecked}
                    onConfigure={() => openSetup(meta.id)}
                    onRefresh={() => checkOne(meta.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* Deploy Tools */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          marginTop: '8px',
        }}>
          <ProfileSwitcher />
          <IntegrationTestPanel />
          <EnvGenerator />
          <ConfigShareQR />
          <WebhookAlerts />
          <IntegrationDocsPanel />
          <TeamConfigSync />
        </div>
      </div>

      {/* Setup modals */}
      <IntegrationSetupModal />
    </div>
  );
}
