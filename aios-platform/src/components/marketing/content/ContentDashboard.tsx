import { FileImage, Image, Calendar, Send, Play, PenTool } from 'lucide-react';
import { ModuleHeader } from '../shared';

const CONTENT_TOOLS = [
  { label: 'Thumbnail Creator', description: 'Gerar thumbnails com IA (fal-ai)', icon: Image, status: 'Fase 2' },
  { label: 'Carousel Builder', description: 'Montar carrosseis para Instagram', icon: PenTool, status: 'Fase 2' },
  { label: 'Calendario Editorial', description: 'Planejar conteudo semanal/mensal', icon: Calendar, status: 'Fase 2' },
  { label: 'Social Publisher', description: 'Agendar posts via Blotato', icon: Send, status: 'Fase 2' },
  { label: 'Video Shorts', description: 'Pipeline de Shorts/Reels', icon: Play, status: 'Fase 2' },
];

export default function ContentDashboard() {
  return (
    <div>
      <ModuleHeader title="Content" subtitle="Criacao e distribuicao de conteudo" icon={FileImage} />

      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        {CONTENT_TOOLS.map((tool) => {
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
                    background: 'rgba(237, 70, 9, 0.06)',
                    border: '1px solid rgba(237, 70, 9, 0.12)',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={18} style={{ color: '#ED4609' }} />
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
