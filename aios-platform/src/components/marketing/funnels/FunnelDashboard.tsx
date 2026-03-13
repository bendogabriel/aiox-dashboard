import { Layers, FileCode, LayoutTemplate, FlaskConical, BarChart } from 'lucide-react';
import { ModuleHeader } from '../shared';

const FUNNEL_TOOLS = [
  { label: 'Template Gallery', description: '19 templates de paginas prontos', icon: LayoutTemplate, status: 'Fase 3' },
  { label: 'Funnel Builder', description: 'Editor visual de fluxo de funil', icon: Layers, status: 'Fase 3' },
  { label: 'Page Editor', description: 'Editor de paginas com preview ao vivo', icon: FileCode, status: 'Fase 3' },
  { label: 'Quiz Builder', description: 'Construtor de quiz funnels', icon: FlaskConical, status: 'Fase 3' },
  { label: 'Funnel Analytics', description: 'Metricas de conversao por etapa', icon: BarChart, status: 'Fase 3' },
];

export default function FunnelDashboard() {
  return (
    <div>
      <ModuleHeader title="Funnels" subtitle="Landing pages, VSL, quiz funnels" icon={Layers} />

      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        {FUNNEL_TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <div
              key={tool.label}
              className="relative"
              style={{
                padding: '1.5rem',
                background: 'var(--aiox-surface)',
                border: '1px solid rgba(156, 156, 156, 0.12)',
                opacity: 0.6,
              }}
            >
              <div className="flex items-start gap-3">
                <span
                  style={{
                    width: 40,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(245, 158, 11, 0.06)',
                    border: '1px solid rgba(245, 158, 11, 0.12)',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={18} style={{ color: '#f59e0b' }} />
                </span>
                <div>
                  <span style={{ fontFamily: 'var(--font-family-display)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--aiox-cream)', display: 'block' }}>
                    {tool.label}
                  </span>
                  <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.6rem', color: 'var(--aiox-gray-muted)', letterSpacing: '0.04em' }}>
                    {tool.description}
                  </span>
                </div>
              </div>
              <span
                className="absolute top-3 right-3"
                style={{
                  fontFamily: 'var(--font-family-mono)',
                  fontSize: '0.5rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'var(--aiox-gray-dim)',
                  background: 'rgba(156, 156, 156, 0.08)',
                  padding: '0.15rem 0.4rem',
                }}
              >
                {tool.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
