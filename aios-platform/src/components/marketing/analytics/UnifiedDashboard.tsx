import { useState } from 'react';
import { BarChart3, DollarSign, TrendingUp, TrendingDown, Users, Eye, ShoppingCart, type LucideIcon } from 'lucide-react';
import { ModuleHeader, MarketingKpiCard, DateRangePicker, PlatformToggle } from '../shared';

type AnalyticsTab = 'overview' | 'pnl' | 'channels';

interface TabDef { id: AnalyticsTab; label: string; icon: LucideIcon }

const TABS: TabDef[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'pnl', label: 'P&L', icon: DollarSign },
  { id: 'channels', label: 'Canais', icon: Users },
];

// ── Demo data ────────────────────────────────────────────────

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

// ── Overview tab ─────────────────────────────────────────────

function OverviewTab() {
  const kpis = Object.values(PNL_DATA);
  return (
    <div>
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

      {/* Monthly P&L bars */}
      <h4 style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.6rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--aiox-gray-muted)', marginBottom: '0.75rem' }}>
        Evolucao Mensal
      </h4>
      <div style={{ border: '1px solid rgba(156,156,156,0.12)' }}>
        {MONTHLY_PNL.map((month, i) => {
          const maxRevenue = Math.max(...MONTHLY_PNL.map((m) => m.revenue));
          const revWidth = (month.revenue / maxRevenue) * 100;
          const spendWidth = (month.spend / maxRevenue) * 100;
          return (
            <div
              key={month.month}
              className="flex items-center gap-4 px-4 py-3"
              style={{ borderBottom: i < MONTHLY_PNL.length - 1 ? '1px solid rgba(156,156,156,0.06)' : 'none' }}
            >
              <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.7rem', color: 'var(--aiox-cream)', width: 60, flexShrink: 0 }}>
                {month.month}
              </span>
              <div className="flex-1">
                {/* Revenue bar */}
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 h-3 relative" style={{ background: 'rgba(156,156,156,0.06)' }}>
                    <div style={{ width: `${revWidth}%`, height: '100%', background: 'var(--aiox-lime)', transition: 'width 0.5s' }} />
                  </div>
                  <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.6rem', color: 'var(--aiox-lime)', width: 60, textAlign: 'right' }}>
                    R$ {(month.revenue / 1000).toFixed(1)}K
                  </span>
                </div>
                {/* Spend bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 relative" style={{ background: 'rgba(156,156,156,0.06)' }}>
                    <div style={{ width: `${spendWidth}%`, height: '100%', background: 'var(--color-status-error)', opacity: 0.6, transition: 'width 0.5s' }} />
                  </div>
                  <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.55rem', color: 'var(--aiox-gray-dim)', width: 60, textAlign: 'right' }}>
                    R$ {(month.spend / 1000).toFixed(1)}K
                  </span>
                </div>
              </div>
              <span style={{ fontFamily: 'var(--font-family-display)', fontSize: '0.85rem', fontWeight: 700, color: month.profit > 0 ? 'var(--aiox-lime)' : 'var(--color-status-error)', width: 70, textAlign: 'right', flexShrink: 0 }}>
                R$ {(month.profit / 1000).toFixed(1)}K
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Channels tab ─────────────────────────────────────────────

function ChannelsTab() {
  const totalRevenue = CHANNEL_DATA.reduce((a, c) => a + c.revenue, 0);

  return (
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
          {CHANNEL_DATA.map((ch, i) => {
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
                  {ch.spend > 0 ? `R$ ${(ch.spend / 1000).toFixed(1)}K` : '—'}
                </td>
                <td className="px-4 py-2.5" style={{ fontFamily: 'var(--font-family-display)', fontSize: '0.85rem', color: 'var(--aiox-lime)' }}>
                  R$ {(ch.revenue / 1000).toFixed(1)}K
                </td>
                <td className="px-4 py-2.5" style={{ fontFamily: 'var(--font-family-display)', fontSize: '0.85rem', color: ch.roas === Infinity ? 'var(--aiox-lime)' : 'var(--aiox-cream)' }}>
                  {ch.roas === Infinity ? '∞' : `${ch.roas.toFixed(1)}x`}
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

      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'pnl' && <OverviewTab />}
      {activeTab === 'channels' && <ChannelsTab />}
    </div>
  );
}
