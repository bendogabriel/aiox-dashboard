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
  Activity,
  Target,
  type LucideIcon,
} from 'lucide-react';
import {
  ModuleHeader,
  MarketingKpiCard,
  DateRangePicker,
  HeroKpiStrip,
  SectionNumber,
  PlatformDistribution,
  MarqueeTicker,
  SecondaryMetrics,
  type HeroKpi,
} from '../shared';
import { ChartContainer, DonutChart, AreaTimeChart, FunnelChart } from '../charts';
import { FilterBar } from '../filters';
import { useMarketingStore, type MarketingModule } from '../../../stores/marketingStore';

/* ─── Hero KPI strip (top-level, large values) ─── */
const HERO_KPIS: HeroKpi[] = [
  { label: 'Sessoes', value: '28K', change: '+12.5%', trend: 'up' },
  { label: 'Impressoes', value: '2.68M', change: '+8.2%', trend: 'up' },
  { label: 'Cliques', value: '41.9K', change: '+5.8%', trend: 'up' },
  { label: 'Conversoes', value: '767', change: '+18.3%', trend: 'up' },
  { label: 'ROAS', value: '4.46x', change: '+0.4x', trend: 'up' },
  { label: 'Receita', value: 'R$ 125K', change: '+22.1%', trend: 'up' },
];

/* ─── Sparkline data for hero KPIs (7 data points each) ─── */
const HERO_SPARKLINES = [
  [18, 20, 19, 22, 24, 26, 28],    // Sessoes
  [1.9, 2.0, 2.1, 2.2, 2.3, 2.5, 2.68], // Impressoes
  [32, 34, 36, 35, 38, 40, 41.9],  // Cliques
  [480, 520, 560, 610, 650, 720, 767], // Conversoes
  [3.8, 3.9, 4.0, 4.1, 4.2, 4.3, 4.46], // ROAS
  [82, 90, 95, 102, 110, 118, 125], // Receita
];

/* ─── Secondary metrics bar ─── */
const SECONDARY_METRICS = [
  { label: 'CTR', value: '2.8%' },
  { label: 'CPC', value: 'R$ 0.42' },
  { label: 'CPM', value: 'R$ 12.30' },
  { label: 'CPA', value: 'R$ 10.04' },
  { label: 'Alcance', value: '890K' },
  { label: 'Bounce', value: '42.3%' },
];

/* ─── Detailed KPI cards (Section 01) ─── */
const DETAIL_KPIS = [
  { label: 'Investimento Total', value: 'R$ 12.450', change: '+8.2%', trend: 'up' as const, icon: DollarSign },
  { label: 'Impressoes', value: '2.68M', change: '+12.5%', trend: 'up' as const, icon: Eye },
  { label: 'Cliques Totais', value: '41.9K', change: '+5.8%', trend: 'up' as const, icon: MousePointer },
  { label: 'Conversoes', value: '767', change: '+18.3%', trend: 'up' as const, icon: ShoppingCart },
  { label: 'ROAS Medio', value: '4.46x', change: '+0.4x', trend: 'up' as const, icon: TrendingUp },
  { label: 'Receita Gerada', value: 'R$ 125K', change: '+22.1%', trend: 'up' as const, icon: DollarSign },
  { label: 'Leads Captados', value: '3.850', change: '+15.2%', trend: 'up' as const, icon: Users },
  { label: 'CPA Medio', value: 'R$ 10.04', change: '-8.5%', trend: 'up' as const, icon: Target },
  { label: 'Taxa Engajamento', value: '4.2%', change: '+0.8%', trend: 'up' as const, icon: Activity },
  { label: 'Sessoes Site', value: '28K', change: '+12.5%', trend: 'up' as const, icon: BarChart3 },
  { label: 'Novos Usuarios', value: '22.4K', change: '+9.1%', trend: 'up' as const, icon: Users },
  { label: 'Tempo Medio', value: '3m 42s', change: '+12%', trend: 'up' as const, icon: Activity },
];

/* ─── Quick access module cards (Section 03) ─── */
interface QuickAccessCard {
  id: MarketingModule;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
  stat: string;
}

const QUICK_ACCESS: QuickAccessCard[] = [
  { id: 'traffic', label: 'Traffic', description: 'Campanhas Meta + Google', icon: Gauge, color: '#0099FF', stat: '10 campanhas ativas' },
  { id: 'content', label: 'Content', description: 'Thumbnails, carrosseis, posts', icon: FileImage, color: '#ED4609', stat: '46 pecas/mes' },
  { id: 'creatives', label: 'Criativos', description: 'Assets e galeria criativa', icon: Sparkles, color: '#E1306C', stat: '24 criativos ativos' },
  { id: 'funnels', label: 'Funnels', description: 'Landing pages e funis', icon: Layers, color: '#f59e0b', stat: '8 funis publicados' },
  { id: 'design-system', label: 'Design System', description: '93+ componentes, tokens', icon: Palette, color: '#D1FF00', stat: '93 componentes' },
  { id: 'analytics', label: 'Analytics', description: 'Dashboard unificado', icon: BarChart3, color: '#8B5CF6', stat: '6 plataformas' },
];

export default function MarketingOverview() {
  const { setActiveModule, setActiveFilter } = useMarketingStore();

  return (
    <div>
      {/* ─── Header with date picker ─── */}
      <ModuleHeader title="Marketing Hub" subtitle="Visao geral de todas as operacoes">
        <DateRangePicker />
      </ModuleHeader>

      {/* ─── Cross-filter bar ─── */}
      <FilterBar />

      {/* ─── Scrolling ticker ─── */}
      <div style={{ marginBottom: '1.5rem', marginLeft: '-1rem', marginRight: '-1rem' }}>
        <MarqueeTicker />
      </div>

      {/* ─── Hero KPI strip (large values) ─── */}
      <HeroKpiStrip kpis={HERO_KPIS} sparklines={HERO_SPARKLINES} />

      {/* ─── Secondary metrics bar ─── */}
      <SecondaryMetrics metrics={SECONDARY_METRICS} />

      {/* ─── Section 01: Performance Detalhada ─── */}
      <SectionNumber number="01" title="Performance" subtitle="Metricas detalhadas do periodo" />
      <div
        className="grid gap-px"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          border: '1px solid rgba(156, 156, 156, 0.12)',
          marginBottom: '2.5rem',
        }}
      >
        {DETAIL_KPIS.map((kpi) => (
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

      {/* ─── Section 02: Platform Distribution + Revenue Trend ─── */}
      <SectionNumber number="02" title="Plataformas" subtitle="Distribuicao de investimento e tendencia" />
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', marginBottom: '2.5rem' }}
      >
        <ChartContainer title="Distribuicao por Canal" height={220}>
          <DonutChart
            data={[
              { name: 'Meta Ads', value: 8200, color: '#0099FF' },
              { name: 'Google Ads', value: 3100, color: '#D1FF00' },
              { name: 'TikTok Ads', value: 1150, color: '#ED4609' },
            ]}
            centerValue="R$ 12.4K"
            centerLabel="Total Invest."
            innerRadius={50}
            outerRadius={80}
            onSliceClick={(entry) => setActiveFilter({ source: 'donut', dimension: 'platform', value: entry.name })}
          />
        </ChartContainer>
        <ChartContainer title="Tendencia de Receita" subtitle="Ultimos 6 meses" height={220}>
          <AreaTimeChart
            data={[
              { date: 'Out', receita: 38200, investimento: 11400 },
              { date: 'Nov', receita: 45600, investimento: 13200 },
              { date: 'Dez', receita: 62800, investimento: 18900 },
              { date: 'Jan', receita: 41200, investimento: 12800 },
              { date: 'Fev', receita: 48500, investimento: 14100 },
              { date: 'Mar', receita: 52300, investimento: 14880 },
            ]}
            series={[
              { key: 'receita', label: 'Receita', color: '#D1FF00' },
              { key: 'investimento', label: 'Investimento', color: '#ED4609' },
            ]}
          />
        </ChartContainer>
      </div>

      {/* ─── Section 03: Business Metrics ─── */}
      <SectionNumber number="03" title="Negocios" subtitle="Funil de conversao e top campanhas" />
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', marginBottom: '2.5rem' }}
      >
        {/* Funnel chart */}
        <ChartContainer title="Funil de Conversao" height={240} raw>
          <FunnelChart
            steps={[
              { label: 'Visitantes', value: 28000, formatted: '28.000' },
              { label: 'Leads', value: 3850, formatted: '3.850' },
              { label: 'Oportunidades', value: 1240, formatted: '1.240' },
              { label: 'Vendas', value: 767 },
            ]}
            height={240}
          />
        </ChartContainer>

        {/* Top campaigns card — kept as table for readability */}
        <div
          style={{
            padding: '1.5rem',
            background: 'var(--aiox-surface)',
            border: '1px solid rgba(156, 156, 156, 0.12)',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-family-mono)',
              fontSize: '0.55rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: 'var(--aiox-lime)',
              display: 'block',
              marginBottom: '0.75rem',
            }}
          >
            Top Campanhas
          </span>
          {[
            { name: 'MPG Perpetua', platform: 'META', roas: '6.2x', spend: 'R$ 2.1K' },
            { name: 'GPO Remarketing', platform: 'META', roas: '5.1x', spend: 'R$ 1.8K' },
            { name: 'MAM Search', platform: 'GOOGLE', roas: '4.3x', spend: 'R$ 1.4K' },
            { name: 'MCPM Lookalike', platform: 'META', roas: '3.8x', spend: 'R$ 980' },
          ].map((c, i) => (
            <div
              key={c.name}
              className="flex items-center justify-between"
              style={{
                padding: '0.5rem 0',
                borderBottom: i < 3 ? '1px solid rgba(156, 156, 156, 0.06)' : undefined,
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  style={{
                    fontFamily: 'var(--font-family-mono)',
                    fontSize: '0.5rem',
                    padding: '0.15rem 0.4rem',
                    background: c.platform === 'META' ? 'rgba(0, 153, 255, 0.12)' : 'rgba(209, 255, 0, 0.12)',
                    color: c.platform === 'META' ? '#0099FF' : '#D1FF00',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  {c.platform}
                </span>
                <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.65rem', color: 'var(--aiox-cream)' }}>
                  {c.name}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.55rem', color: 'var(--aiox-gray-dim)' }}>
                  {c.spend}
                </span>
                <span style={{ fontFamily: 'var(--font-family-display)', fontSize: '0.8rem', fontWeight: 700, color: 'var(--aiox-lime)' }}>
                  {c.roas}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Section 04: Quick Access Modules ─── */}
      <SectionNumber number="04" title="Modulos" subtitle="Acesso rapido aos dashboards" />
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}
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
                      display: 'block',
                    }}
                  >
                    {card.description}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-family-mono)',
                      fontSize: '0.5rem',
                      color: 'var(--aiox-lime)',
                      opacity: 0.7,
                      marginTop: '0.35rem',
                      display: 'block',
                    }}
                  >
                    {card.stat}
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
