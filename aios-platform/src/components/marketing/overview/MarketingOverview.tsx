import {
  Gauge,
  FileImage,
  Layers,
  Palette,
  BarChart3,
  Sparkles,
  TrendingUp,
  DollarSign,
  Users,
  Eye,
  MousePointer,
  ShoppingCart,
  type LucideIcon,
} from 'lucide-react';
import { ModuleHeader, MarketingKpiCard, DateRangePicker } from '../shared';
import { useMarketingStore, type MarketingModule } from '../../../stores/marketingStore';

interface QuickAccessCard {
  id: MarketingModule;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
}

const QUICK_ACCESS: QuickAccessCard[] = [
  { id: 'traffic', label: 'Traffic', description: 'Campanhas Meta + Google', icon: Gauge, color: '#0099FF' },
  { id: 'content', label: 'Content', description: 'Thumbnails, carrosseis, posts', icon: FileImage, color: '#ED4609' },
  { id: 'creatives', label: 'Criativos', description: 'Assets e galeria criativa', icon: Sparkles, color: '#E1306C' },
  { id: 'funnels', label: 'Funnels', description: 'Landing pages e funis', icon: Layers, color: '#f59e0b' },
  { id: 'design-system', label: 'Design System', description: '93+ componentes, tokens', icon: Palette, color: '#D1FF00' },
  { id: 'analytics', label: 'Analytics', description: 'Dashboard unificado', icon: BarChart3, color: '#8B5CF6' },
];

// Demo KPIs (will be replaced with real data in Phase 1)
const OVERVIEW_KPIS = [
  { label: 'Investimento', value: 'R$ 12.450', change: '+8.2%', trend: 'up' as const, icon: DollarSign },
  { label: 'Impressoes', value: '2.4M', change: '+12.5%', trend: 'up' as const, icon: Eye },
  { label: 'Cliques', value: '45.2K', change: '+5.8%', trend: 'up' as const, icon: MousePointer },
  { label: 'Conversoes', value: '1.240', change: '+18.3%', trend: 'up' as const, icon: ShoppingCart },
  { label: 'ROAS', value: '4.2x', change: '+0.4x', trend: 'up' as const, icon: TrendingUp },
  { label: 'Receita', value: 'R$ 52.3K', change: '+22.1%', trend: 'up' as const, icon: DollarSign },
  { label: 'Leads', value: '3.850', change: '-2.1%', trend: 'down' as const, icon: Users },
  { label: 'CPA', value: 'R$ 10.04', change: '-8.5%', trend: 'up' as const, icon: DollarSign },
];

export default function MarketingOverview() {
  const { setActiveModule } = useMarketingStore();

  return (
    <div>
      <ModuleHeader title="Marketing Hub" subtitle="Visao geral de todas as operacoes">
        <DateRangePicker />
      </ModuleHeader>

      {/* KPI Grid */}
      <div
        className="grid gap-px"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          border: '1px solid rgba(156, 156, 156, 0.12)',
          marginBottom: '2rem',
        }}
      >
        {OVERVIEW_KPIS.map((kpi) => (
          <MarketingKpiCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            change={kpi.change}
            trend={kpi.trend}
            icon={kpi.icon}
          />
        ))}
      </div>

      {/* Quick access modules */}
      <h3
        style={{
          fontFamily: 'var(--font-family-mono)',
          fontSize: '0.6rem',
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: 'var(--aiox-gray-muted)',
          marginBottom: '1rem',
        }}
      >
        Modulos
      </h3>

      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}
      >
        {QUICK_ACCESS.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              onClick={() => setActiveModule(card.id)}
              className="text-left group transition-all"
              style={{
                padding: '1.25rem',
                background: 'var(--aiox-surface)',
                border: '1px solid rgba(156, 156, 156, 0.12)',
              }}
            >
              <div className="flex items-start gap-3">
                <span
                  style={{
                    width: 36,
                    height: 36,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `${card.color}10`,
                    border: `1px solid ${card.color}20`,
                    flexShrink: 0,
                  }}
                >
                  <Icon size={16} style={{ color: card.color }} />
                </span>
                <div className="min-w-0">
                  <span
                    style={{
                      fontFamily: 'var(--font-family-display)',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      color: 'var(--aiox-cream)',
                      display: 'block',
                    }}
                  >
                    {card.label}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-family-mono)',
                      fontSize: '0.6rem',
                      color: 'var(--aiox-gray-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {card.description}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
