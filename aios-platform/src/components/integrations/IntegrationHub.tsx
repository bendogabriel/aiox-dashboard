import { Server, MessageSquare, Database, KeyRound, Mic } from 'lucide-react';
import { useIntegrationStatus } from '../../hooks/useIntegrationStatus';
import { useIntegrationStore, type IntegrationId } from '../../stores/integrationStore';
import { IntegrationCard } from './IntegrationCard';
import { IntegrationSetupModal } from './SetupModals';

const integrationsMeta: {
  id: IntegrationId;
  name: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'engine',
    name: 'AIOS Engine',
    description: 'Execution engine for agents and workflows',
    icon: <Server size={20} />,
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    description: 'Business messaging via WAHA or Meta Cloud API',
    icon: <MessageSquare size={20} />,
  },
  {
    id: 'supabase',
    name: 'Supabase',
    description: 'Database, auth and realtime backend',
    icon: <Database size={20} />,
  },
  {
    id: 'api-keys',
    name: 'API Keys',
    description: 'LLM provider keys (OpenAI, Anthropic, etc.)',
    icon: <KeyRound size={20} />,
  },
  {
    id: 'voice',
    name: 'Voice / TTS',
    description: 'Text-to-speech provider configuration',
    icon: <Mic size={20} />,
  },
];

export default function IntegrationHub() {
  const { integrations, checkOne } = useIntegrationStatus();
  const { openSetup } = useIntegrationStore();

  const connectedCount = Object.values(integrations).filter((i) => i.status === 'connected').length;
  const total = Object.keys(integrations).length;

  return (
    <div
      style={{
        height: '100%',
        overflow: 'auto',
        padding: '32px',
        background: 'var(--aiox-dark, #050505)',
      }}
    >
      {/* Header */}
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1
            style={{
              margin: 0,
              fontSize: '18px',
              fontFamily: 'var(--font-family-display, var(--font-family-mono, monospace))',
              textTransform: 'uppercase' as const,
              letterSpacing: '0.1em',
              fontWeight: 700,
              color: 'var(--aiox-lime, #D1FF00)',
            }}
          >
            Integrations
          </h1>
          <p
            style={{
              margin: '8px 0 0',
              fontSize: '13px',
              fontFamily: 'var(--font-family-mono, monospace)',
              color: 'var(--aiox-gray-muted, #999)',
            }}
          >
            {connectedCount}/{total} connected — configure services to enable full platform capabilities
          </p>
        </div>

        {/* Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '16px',
          }}
        >
          {integrationsMeta.map((meta) => (
            <IntegrationCard
              key={meta.id}
              name={meta.name}
              description={meta.description}
              icon={meta.icon}
              status={integrations[meta.id].status}
              message={integrations[meta.id].message}
              onConfigure={() => openSetup(meta.id)}
              onRefresh={() => checkOne(meta.id)}
            />
          ))}
        </div>
      </div>

      {/* Setup modals */}
      <IntegrationSetupModal />
    </div>
  );
}
