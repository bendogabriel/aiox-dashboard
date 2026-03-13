import { Sparkles, Image, Wand2, FolderOpen, Zap } from 'lucide-react';
import { ModuleHeader } from '../shared';

const CREATIVE_TOOLS = [
  { label: 'Galeria de Criativos', description: 'Todos os criativos aprovados e em teste', icon: FolderOpen, status: 'Fase 2' },
  { label: 'Gerador IA', description: 'Criar criativos com fal-ai + nano-banana', icon: Wand2, status: 'Fase 2' },
  { label: 'Editor de Imagem', description: 'Editar, remover fundo, composicao', icon: Image, status: 'Fase 2' },
  { label: 'Teste A/B Visual', description: 'Comparar variantes de criativos', icon: Zap, status: 'Fase 2' },
];

export default function CreativeStudio() {
  return (
    <div>
      <ModuleHeader title="Criativos" subtitle="Assets e studio criativo" icon={Sparkles} />

      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        {CREATIVE_TOOLS.map((tool) => {
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
                    background: 'rgba(225, 48, 108, 0.06)',
                    border: '1px solid rgba(225, 48, 108, 0.12)',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={18} style={{ color: '#E1306C' }} />
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
                style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--aiox-gray-dim)', background: 'rgba(156, 156, 156, 0.08)', padding: '0.15rem 0.4rem' }}
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
