import { memo } from 'react';
import { Workflow, Rocket, Search, Calendar, BarChart3, Palette, Zap, RefreshCw, Link, Repeat, Settings, type LucideIcon } from 'lucide-react';
import { getSquadInlineStyle } from '../../lib/theme';
import { aiosRegistry } from '../../data/aios-registry.generated';

interface OrchestrationTemplate {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  demand: string;
  squads: string[];
}

const CURATED_TEMPLATES: OrchestrationTemplate[] = [
  {
    id: 'launch-campaign',
    icon: Rocket,
    title: 'Campanha de Lancamento',
    description: 'Copy + design + conteudo social para lancamento de produto',
    demand: 'Criar uma campanha completa de lancamento incluindo headlines, body copy, design visual e conteudo para redes sociais',
    squads: ['copywriting', 'design-system', 'creative-studio'],
  },
  {
    id: 'tech-audit',
    icon: Search,
    title: 'Auditoria Tecnica',
    description: 'Analise completa de divida tecnica e recomendacoes',
    demand: 'Realizar auditoria tecnica completa do sistema, identificar divida tecnica, vulnerabilidades de seguranca e propor plano de melhoria',
    squads: ['aios-core-dev', 'full-stack-dev'],
  },
  {
    id: 'content-calendar',
    icon: Calendar,
    title: 'Calendario de Conteudo',
    description: '30 dias de conteudo para multiplas plataformas',
    demand: 'Criar calendario editorial de 30 dias com posts para Instagram, LinkedIn e TikTok, incluindo copies e briefings visuais',
    squads: ['content-ecosystem', 'copywriting'],
  },
  {
    id: 'market-research',
    icon: BarChart3,
    title: 'Pesquisa de Mercado',
    description: 'Analise competitiva e identificacao de oportunidades',
    demand: 'Realizar pesquisa de mercado completa: analise de concorrentes, identificacao de gaps, definicao de personas e proposta de posicionamento',
    squads: ['copywriting', 'data-analytics'],
  },
  {
    id: 'brand-strategy',
    icon: Palette,
    title: 'Estrategia de Marca',
    description: 'Posicionamento, tom de voz e identidade visual',
    demand: 'Desenvolver estrategia de marca completa: proposta de valor, manifesto, tom de voz, guidelines de comunicacao e identidade visual',
    squads: ['copywriting', 'design-system'],
  },
  {
    id: 'full-product',
    icon: Zap,
    title: 'Produto Completo',
    description: 'Spec + arquitetura + implementacao + QA',
    demand: 'Especificar, arquitetar e implementar uma nova feature completa com testes automatizados e documentacao',
    squads: ['aios-core-dev', 'full-stack-dev'],
  },
];

const WORKFLOW_TYPE_ICONS: Record<string, LucideIcon> = {
  loop: RefreshCw,
  pipeline: Link,
  cycle: Repeat,
};

const WORKFLOW_TEMPLATES: OrchestrationTemplate[] = aiosRegistry.workflows
  .filter(w => w.description && w.phases.length > 0)
  .slice(0, 6)
  .map(w => ({
    id: `wf-${w.id}`,
    icon: WORKFLOW_TYPE_ICONS[w.type] || Settings,
    title: w.name,
    description: w.description.slice(0, 80) + (w.description.length > 80 ? '...' : ''),
    demand: `Execute workflow "${w.name}": ${w.description}`,
    squads: w.agents.slice(0, 3),
  }));

const TemplateCard = memo(function TemplateCard({
  template,
  onSelect,
}: {
  template: OrchestrationTemplate;
  onSelect: (demand: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect(template.demand)}
      className="text-left p-4 rounded-none border border-white/10 bg-white/[0.03] backdrop-blur-sm hover:bg-white/[0.06] hover:border-white/20 transition-all group"
    >
      <div className="flex items-start gap-3 mb-3">
        <span className="text-white/60 flex-shrink-0" aria-hidden="true">
          <template.icon size={22} />
        </span>
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-white group-hover:text-white/95 truncate">
            {template.title}
          </h4>
          <p className="text-[11px] text-white/40 mt-0.5 line-clamp-2">
            {template.description}
          </p>
        </div>
      </div>

      {/* Squad badges */}
      <div className="flex flex-wrap gap-1.5">
        {template.squads.map((squadId) => {
          const style = getSquadInlineStyle(squadId);
          return (
            <span
              key={squadId}
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{
                background: style.bg,
                color: style.text,
                border: `1px solid ${style.border}`,
              }}
            >
              {squadId}
            </span>
          );
        })}
      </div>
    </button>
  );
});

export function OrchestrationTemplates({ onSelect }: { onSelect: (demand: string) => void }) {
  return (
    <div
      className="w-full max-w-3xl px-4"
    >
      <h3 className="text-sm font-medium text-white/50 mb-4 text-center">Templates</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {CURATED_TEMPLATES.map((template) => (
          <TemplateCard key={template.id} template={template} onSelect={onSelect} />
        ))}
      </div>

      {WORKFLOW_TEMPLATES.length > 0 && (
        <>
          <h3 className="text-sm font-medium text-white/50 mb-4 mt-8 text-center flex items-center justify-center gap-2">
            <Workflow size={14} /> AIOS Workflows
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {WORKFLOW_TEMPLATES.map((template) => (
              <TemplateCard key={template.id} template={template} onSelect={onSelect} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
