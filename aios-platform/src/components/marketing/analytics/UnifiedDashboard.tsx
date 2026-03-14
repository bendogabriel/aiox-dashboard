import { useState } from 'react';
import { BarChart3, DollarSign, TrendingUp, TrendingDown, Users, Eye, ShoppingCart, Monitor, Smartphone, Tablet, type LucideIcon } from 'lucide-react';
import { ModuleHeader, MarketingKpiCard, DateRangePicker, PlatformToggle, HeroKpiStrip, SectionNumber, SecondaryMetrics, type HeroKpi } from '../shared';
import { ChartContainer, WaterfallChart, BarComparisonChart, DonutChart, HeatmapChart } from '../charts';
import { FilterBar } from '../filters';
import { useMarketingStore } from '../../../stores/marketingStore';

type AnalyticsTab = 'overview' | 'pnl' | 'channels';

interface TabDef { id: AnalyticsTab; label: string; icon: LucideIcon }

const TABS: TabDef[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'pnl', label: 'P&L', icon: DollarSign },
  { id: 'channels', label: 'Canais', icon: Users },
];

// ── Demo data ────────────────────────────────────────────────

const HERO_KPIS: HeroKpi[] = [
  { label: 'Sessoes', value: '38.2K', change: '+12.5%', trend: 'up' },
  { label: 'Novos Usuarios', value: '28.5K', change: '+9.1%', trend: 'up' },
  { label: 'Bounce Rate', value: '42.3%', change: '-3.2%', trend: 'up' },
  { label: 'Tempo Medio', value: '3m 42s', change: '+12%', trend: 'up' },
  { label: 'Pag/Sessao', value: '4.2', change: '+0.3', trend: 'up' },
  { label: 'Engajamento', value: '72.4%', change: '+5.1%', trend: 'up' },
];

const SECONDARY = [
  { label: 'Receita', value: 'R$ 52.3K' },
  { label: 'ROAS', value: '3.51x' },
  { label: 'Conversoes', value: '1.619' },
  { label: 'CAC', value: 'R$ 10.72' },
  { label: 'LTV/CAC', value: '26.8x' },
];

const PNL_DATA = {
  revenue: { label: 'Receita Total', value: 52300, formatted: 'R$ 52.3K', change: '+22.1%', trend: 'up' as const },
  adSpend: { label: 'Investimento Ads', value: 14880, formatted: 'R$ 14.9K', change: '+8.2%', trend: 'neutral' as const },
  profit: { label: 'Lucro Bruto', value: 37420, formatted: 'R$ 37.4K', change: '+31.5%', trend: 'up' as const },
  margin: { label: 'Margem', value: 71.5, formatted: '71.5%', change: '+5.2pp', trend: 'up' as const },
  roas: { label: 'ROAS Global', value: 3.51, formatted: '3.51x', change: '+0.38x', trend: 'up' as const },
  cac: { label: 'CAC', value: 10.72, formatted: 'R$ 10.72', change: '-12.3%', trend: 'up' as const },
  ltv: { label: 'LTV', value: 287, formatted: 'R$ 287', change: '+8.5%', trend: 'up' as const },
  ltvCac: { label: 'LTV/CAC', value: 26.8, formatted: '26.8x', change: '+4.2x', trend: 'up' as const },
};

const CHANNEL_DATA = [
  { channel: 'Meta Ads', spend: 12450, revenue: 42800, roas: 3.44, conversions: 1240, color: '#0099FF' },
  { channel: 'Google Ads', spend: 2430, revenue: 9500, roas: 3.91, conversions: 143, color: '#D1FF00' },
  { channel: 'Organico (SEO)', spend: 0, revenue: 4200, roas: Infinity, conversions: 89, color: '#10B981' },
  { channel: 'Instagram (organico)', spend: 0, revenue: 2800, roas: Infinity, conversions: 52, color: '#E1306C' },
  { channel: 'YouTube (organico)', spend: 0, revenue: 1800, roas: Infinity, conversions: 28, color: '#FF0000' },
  { channel: 'Direto / Email', spend: 0, revenue: 3200, roas: Infinity, conversions: 67, color: '#f59e0b' },
];

const MONTHLY_PNL = [
  { month: 'Out/25', revenue: 38200, spend: 11400, profit: 26800 },
  { month: 'Nov/25', revenue: 45600, spend: 13200, profit: 32400 },
  { month: 'Dez/25', revenue: 62800, spend: 18900, profit: 43900 },
  { month: 'Jan/26', revenue: 41200, spend: 12800, profit: 28400 },
  { month: 'Fev/26', revenue: 48500, spend: 14100, profit: 34400 },
  { month: 'Mar/26', revenue: 52300, spend: 14880, profit: 37420 },
];

const ENGAGEMENT_METRICS = [
  { label: 'Paginas por Sessao', value: '4.2', change: '+0.3', trend: 'up' as const },
  { label: 'Duracao Media', value: '3m 42s', change: '+12%', trend: 'up' as const },
  { label: 'Taxa de Retorno', value: '34.8%', change: '+2.1%', trend: 'up' as const },
  { label: 'Scroll Depth', value: '68%', change: '+5%', trend: 'up' as const },
  { label: 'Event/Sessao', value: '8.4', change: '+1.2', trend: 'up' as const },
  { label: 'Form Completions', value: '412', change: '+18%', trend: 'up' as const },
];

const AGE_GROUPS = [
  { range: '25-34', count: 312, pct: 41 },
  { range: '35-44', count: 228, pct: 30 },
  { range: '18-24', count: 114, pct: 15 },
  { range: '45-54', count: 76, pct: 10 },
  { range: '55+', count: 37, pct: 4 },
];

const DEVICES = [
  { name: 'Mobile', pct: 62, icon: Smartphone, color: '#0099FF' },
  { name: 'Desktop', pct: 28, icon: Monitor, color: '#D1FF00' },
  { name: 'Tablet', pct: 10, icon: Tablet, color: '#ED4609' },
];

const GEO_DATA = [
  { region: 'Sao Paulo', conversions: 287, revenue: 'R$ 18.2K', pct: 37.4 },
  { region: 'Rio de Janeiro', conversions: 142, revenue: 'R$ 8.9K', pct: 18.5 },
  { region: 'Minas Gerais', conversions: 98, revenue: 'R$ 6.1K', pct: 12.8 },
  { region: 'Parana', conversions: 67, revenue: 'R$ 4.2K', pct: 8.7 },
  { region: 'Bahia', conversions: 54, revenue: 'R$ 3.4K', pct: 7.0 },
  { region: 'Rio Grande do Sul', conversions: 48, revenue: 'R$ 3.0K', pct: 6.3 },
  { region: 'Outros', conversions: 71, revenue: 'R$ 4.5K', pct: 9.3 },
];

// ── Overview tab ─────────────────────────────────────────────

function OverviewTab() {
  const kpis = Object.values(PNL_DATA);
  return (
    <div>
      {/* KPI Grid */}
      <SectionNumber number="01" title="Financeiro" subtitle="Metricas de receita e custo" />
      <div
        className="grid gap-px mb-6"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          border: '1px solid rgba(156,156,156,0.12)',
        }}
      >
        {kpis.map((kpi) => (
          <MarketingKpiCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.formatted}
            change={kpi.change}
            trend={kpi.trend}
          />
        ))}
      </div>

      {/* Monthly P&L waterfall */}
      <SectionNumber number="02" title="Evolucao" subtitle="Waterfall receita vs custo (ultimo mes)" />
      <div style={{ marginBottom: '2.5rem' }}>
        <ChartContainer title="P&L Waterfall — Marco/26" height={260}>
          <WaterfallChart
            data={[
              { name: 'Receita', value: 52300, isTotal: true },
              { name: 'Meta Ads', value: -12450 },
              { name: 'Google Ads', value: -2430 },
              { name: 'Ferramentas', value: -1200 },
              { name: 'Equipe', value: -3500 },
              { name: 'Lucro', value: 32720, isTotal: true },
            ]}
          />
        </ChartContainer>
      </div>

      {/* Engagement metrics grid */}
      <SectionNumber number="03" title="Engajamento" subtitle="Comportamento do usuario no site" />
      <div
        className="grid gap-3 mb-6"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}
      >
        {ENGAGEMENT_METRICS.map((m) => {
          const trendColor = m.trend === 'up' ? 'var(--aiox-lime)' : 'var(--color-status-error)';
          const TrendIcon = m.trend === 'up' ? TrendingUp : TrendingDown;
          return (
            <div
              key={m.label}
              style={{
                padding: '1rem 1.25rem',
                background: 'var(--aiox-surface)',
                border: '1px solid rgba(156,156,156,0.12)',
              }}
            >
              <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--aiox-gray-muted)', display: 'block', marginBottom: '0.35rem' }}>
                {m.label}
              </span>
              <div className="flex items-baseline gap-2">
                <span style={{ fontFamily: 'var(--font-family-display)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--aiox-cream)', lineHeight: 1 }}>
                  {m.value}
                </span>
                <span className="flex items-center gap-1" style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.55rem', color: trendColor }}>
                  <TrendIcon size={9} />
                  {m.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Demographics + Devices + Heatmap */}
      <SectionNumber number="04" title="Audiencia" subtitle="Demografia, dispositivos e performance por horario" />
      <div
        className="grid gap-3 mb-6"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}
      >
        {/* Age groups — bar chart */}
        <ChartContainer title="Faixa Etaria" height={200}>
          <BarComparisonChart
            data={AGE_GROUPS.map((g) => ({ name: g.range, conversoes: g.count }))}
            bars={[{ key: 'conversoes', label: 'Conversoes', color: '#D1FF00' }]}
            layout="horizontal"
          />
        </ChartContainer>

        {/* Devices — donut chart */}
        <ChartContainer title="Dispositivos" height={200}>
          <DonutChart
            data={DEVICES.map((d) => ({ name: d.name, value: d.pct, color: d.color }))}
            innerRadius={40}
            outerRadius={70}
            centerLabel="Total"
          />
        </ChartContainer>

        {/* Heatmap: day x channel performance */}
        <ChartContainer title="Performance por Canal x Dia" height={200} raw>
          <HeatmapChart
            data={[
              { row: 'Meta', col: 'Seg', value: 42 }, { row: 'Meta', col: 'Ter', value: 38 },
              { row: 'Meta', col: 'Qua', value: 55 }, { row: 'Meta', col: 'Qui', value: 48 },
              { row: 'Meta', col: 'Sex', value: 60 }, { row: 'Meta', col: 'Sab', value: 32 },
              { row: 'Meta', col: 'Dom', value: 28 },
              { row: 'Google', col: 'Seg', value: 18 }, { row: 'Google', col: 'Ter', value: 22 },
              { row: 'Google', col: 'Qua', value: 25 }, { row: 'Google', col: 'Qui', value: 20 },
              { row: 'Google', col: 'Sex', value: 28 }, { row: 'Google', col: 'Sab', value: 12 },
              { row: 'Google', col: 'Dom', value: 10 },
              { row: 'Organico', col: 'Seg', value: 8 }, { row: 'Organico', col: 'Ter', value: 12 },
              { row: 'Organico', col: 'Qua', value: 15 }, { row: 'Organico', col: 'Qui', value: 10 },
              { row: 'Organico', col: 'Sex', value: 18 }, { row: 'Organico', col: 'Sab', value: 5 },
              { row: 'Organico', col: 'Dom', value: 4 },
            ]}
            rows={['Meta', 'Google', 'Organico']}
            cols={['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom']}
            height={200}
          />
        </ChartContainer>
      </div>

      {/* Geography — kept as table (data-dense, charts wouldn't add value) */}
      <SectionNumber number="05" title="Geografia" subtitle="Conversoes por regiao" />
      <div
        style={{ padding: '1.25rem', background: 'var(--aiox-surface)', border: '1px solid rgba(156,156,156,0.12)', marginBottom: '2rem' }}
      >
        {GEO_DATA.map((g, i) => (
          <div
            key={g.region}
            className="flex items-center justify-between"
            style={{ padding: '0.45rem 0', borderBottom: i < GEO_DATA.length - 1 ? '1px solid rgba(156,156,156,0.06)' : undefined }}
          >
            <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.65rem', color: 'var(--aiox-cream)', flex: 1 }}>{g.region}</span>
            <span style={{ fontFamily: 'var(--font-family-display)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--aiox-cream)', width: 35, textAlign: 'right' }}>{g.conversions}</span>
            <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.65rem', color: 'var(--aiox-lime)', width: 65, textAlign: 'right' }}>{g.revenue}</span>
            <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.55rem', color: 'var(--aiox-gray-dim)', width: 40, textAlign: 'right' }}>{g.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Channels tab ─────────────────────────────────────────────

function ChannelsTab() {
  const totalRevenue = CHANNEL_DATA.reduce((a, c) => a + c.revenue, 0);

  return (
    <div>
      <SectionNumber number="01" title="Canais" subtitle="Performance por canal de aquisicao" />
      <div style={{ border: '1px solid rgba(156,156,156,0.12)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: 'rgba(209,255,0,0.03)', borderBottom: '1px solid rgba(156,156,156,0.12)' }}>
              {['Canal', 'Investimento', 'Receita', 'ROAS', 'Conversoes', '% Receita'].map((h) => (
                <th key={h} className="text-left px-4 py-2" style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.55rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--aiox-gray-muted)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CHANNEL_DATA.map((ch) => {
              const pct = ((ch.revenue / totalRevenue) * 100).toFixed(1);
              return (
                <tr key={ch.channel} style={{ borderBottom: '1px solid rgba(156,156,156,0.06)' }} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span style={{ width: 8, height: 8, background: ch.color, flexShrink: 0 }} />
                      <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.75rem', color: 'var(--aiox-cream)' }}>{ch.channel}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5" style={{ fontFamily: 'var(--font-family-display)', fontSize: '0.85rem', color: ch.spend > 0 ? 'var(--aiox-cream)' : 'var(--aiox-gray-dim)' }}>
                    {ch.spend > 0 ? `R$ ${(ch.spend / 1000).toFixed(1)}K` : '\u2014'}
                  </td>
                  <td className="px-4 py-2.5" style={{ fontFamily: 'var(--font-family-display)', fontSize: '0.85rem', color: 'var(--aiox-lime)' }}>
                    R$ {(ch.revenue / 1000).toFixed(1)}K
                  </td>
                  <td className="px-4 py-2.5" style={{ fontFamily: 'var(--font-family-display)', fontSize: '0.85rem', color: ch.roas === Infinity ? 'var(--aiox-lime)' : 'var(--aiox-cream)' }}>
                    {ch.roas === Infinity ? '\u221E' : `${ch.roas.toFixed(1)}x`}
                  </td>
                  <td className="px-4 py-2.5" style={{ fontFamily: 'var(--font-family-display)', fontSize: '0.85rem', color: 'var(--aiox-cream)' }}>
                    {ch.conversions.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2" style={{ background: 'rgba(156,156,156,0.06)', maxWidth: 60 }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: ch.color }} />
                      </div>
                      <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.65rem', color: 'var(--aiox-gray-muted)' }}>{pct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────

export default function UnifiedDashboard() {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview');

  return (
    <div>
      <ModuleHeader title="Analytics" subtitle="Dashboard unificado cross-platform" icon={BarChart3}>
        <div className="flex items-center gap-0" style={{ border: '1px solid rgba(156,156,156,0.12)' }}>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-all"
                style={{
                  background: isActive ? 'rgba(209,255,0,0.06)' : 'transparent',
                  color: isActive ? 'var(--aiox-cream)' : 'var(--aiox-gray-muted)',
                  borderRight: '1px solid rgba(156,156,156,0.08)',
                }}
              >
                <Icon size={12} style={isActive ? { color: 'var(--aiox-lime)' } : undefined} />
                {tab.label}
              </button>
            );
          })}
        </div>
        <PlatformToggle />
        <DateRangePicker />
      </ModuleHeader>

      {/* Hero KPI strip (always visible) */}
      <HeroKpiStrip kpis={HERO_KPIS} />
      <SecondaryMetrics metrics={SECONDARY} />

      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'pnl' && <OverviewTab />}
      {activeTab === 'channels' && <ChannelsTab />}
    </div>
  );
}
