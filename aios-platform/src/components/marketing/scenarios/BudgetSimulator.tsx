import { useState, useMemo } from 'react';
import { ChartContainer, AreaTimeChart, formatBRL } from '../charts';

// Historical averages used as baseline
const BASELINE = {
  roas: 3.51,
  ctr: 0.028,
  cpc: 0.42,
  convRate: 0.0183,
  avgTicket: 163,
};

export function BudgetSimulator() {
  const [budget, setBudget] = useState(15000);

  const projections = useMemo(() => {
    const clicks = budget / BASELINE.cpc;
    const conversions = clicks * BASELINE.convRate;
    const revenue = conversions * BASELINE.avgTicket;
    const roas = budget > 0 ? revenue / budget : 0;
    const cpa = conversions > 0 ? budget / conversions : 0;

    // Build 6-month projection
    const months = ['Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set'];
    const projData = months.map((m, i) => {
      const factor = 1 + (i * 0.03); // slight growth
      return {
        date: m,
        receita: Math.round(revenue * factor),
        investimento: budget,
      };
    });

    return { clicks, conversions, revenue, roas, cpa, projData };
  }, [budget]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Slider */}
      <div
        style={{
          padding: '1.25rem',
          background: 'var(--aiox-surface)',
          border: '1px solid rgba(156, 156, 156, 0.12)',
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--aiox-lime)' }}>
            Budget Mensal
          </span>
          <span style={{ fontFamily: 'var(--font-family-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--aiox-cream)' }}>
            {formatBRL(budget)}
          </span>
        </div>
        <input
          type="range"
          min={500}
          max={50000}
          step={500}
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
          className="w-full"
          style={{ accentColor: '#D1FF00' }}
          aria-label="Budget mensal"
        />
        <div className="flex justify-between" style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.5rem', color: 'var(--aiox-gray-dim)', marginTop: '0.35rem' }}>
          <span>R$ 500</span>
          <span>R$ 50K</span>
        </div>
      </div>

      {/* Projected KPIs */}
      <div
        className="grid gap-px"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          border: '1px solid rgba(156, 156, 156, 0.12)',
        }}
      >
        {[
          { label: 'Receita Estimada', value: formatBRL(projections.revenue) },
          { label: 'ROAS Projetado', value: `${projections.roas.toFixed(2)}x` },
          { label: 'Conversoes Est.', value: Math.round(projections.conversions).toLocaleString() },
          { label: 'CPA Projetado', value: formatBRL(projections.cpa) },
          { label: 'Cliques Est.', value: Math.round(projections.clicks).toLocaleString() },
        ].map((kpi) => (
          <div
            key={kpi.label}
            style={{
              padding: '1rem 1.25rem',
              background: 'var(--aiox-surface)',
            }}
          >
            <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--aiox-gray-muted)', display: 'block', marginBottom: '0.25rem' }}>
              {kpi.label}
            </span>
            <span style={{ fontFamily: 'var(--font-family-display)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--aiox-cream)' }}>
              {kpi.value}
            </span>
          </div>
        ))}
      </div>

      {/* Projection chart */}
      <ChartContainer title="Projecao 6 Meses" subtitle="Receita vs Investimento" height={240}>
        <AreaTimeChart
          data={projections.projData}
          series={[
            { key: 'receita', label: 'Receita', color: '#D1FF00' },
            { key: 'investimento', label: 'Investimento', color: '#ED4609' },
          ]}
        />
      </ChartContainer>
    </div>
  );
}
