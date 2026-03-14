import { useState, useMemo } from 'react';
import { formatBRL } from '../charts';

const BASELINE = {
  convRate: 0.0183,
  ctr: 0.028,
  cpc: 0.42,
  avgTicket: 163,
};

type GoalMode = 'sales' | 'revenue';

export function GoalCalculator() {
  const [mode, setMode] = useState<GoalMode>('sales');
  const [goalValue, setGoalValue] = useState(100);

  const calc = useMemo(() => {
    const targetConversions = mode === 'sales' ? goalValue : goalValue / BASELINE.avgTicket;
    const requiredClicks = targetConversions / BASELINE.convRate;
    const requiredBudget = requiredClicks * BASELINE.cpc;
    const requiredImpressions = requiredClicks / BASELINE.ctr;
    const estimatedRevenue = mode === 'sales' ? targetConversions * BASELINE.avgTicket : goalValue;
    const cpaTarget = targetConversions > 0 ? requiredBudget / targetConversions : 0;

    return { targetConversions, requiredClicks, requiredBudget, requiredImpressions, estimatedRevenue, cpaTarget };
  }, [mode, goalValue]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Mode + Input */}
      <div
        style={{
          padding: '1.25rem',
          background: 'var(--aiox-surface)',
          border: '1px solid rgba(156, 156, 156, 0.12)',
        }}
      >
        <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--aiox-lime)', display: 'block', marginBottom: '0.75rem' }}>
          Calculadora de Meta
        </span>

        {/* Mode toggle */}
        <div className="flex gap-0 mb-4" style={{ border: '1px solid rgba(156, 156, 156, 0.12)' }}>
          {([
            { id: 'sales' as GoalMode, label: 'Vendas/mes' },
            { id: 'revenue' as GoalMode, label: 'Receita/mes' },
          ]).map((opt) => (
            <button
              key={opt.id}
              onClick={() => setMode(opt.id)}
              className="flex-1 py-2 text-xs font-mono uppercase tracking-wider transition-all"
              style={{
                background: mode === opt.id ? 'rgba(209, 255, 0, 0.06)' : 'transparent',
                color: mode === opt.id ? 'var(--aiox-cream)' : 'var(--aiox-gray-muted)',
                borderRight: opt.id === 'sales' ? '1px solid rgba(156, 156, 156, 0.12)' : undefined,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Goal input */}
        <div className="flex items-center gap-3">
          <label style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.6rem', color: 'var(--aiox-gray-muted)', flexShrink: 0 }}>
            {mode === 'sales' ? 'Quero' : 'Quero'}
          </label>
          <input
            type="number"
            value={goalValue}
            onChange={(e) => setGoalValue(Math.max(1, Number(e.target.value)))}
            min={1}
            className="flex-1 px-3 py-2 text-right"
            style={{
              fontFamily: 'var(--font-family-display)',
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--aiox-cream)',
              background: 'rgba(156, 156, 156, 0.06)',
              border: '1px solid rgba(156, 156, 156, 0.2)',
              borderRadius: 0,
              outline: 'none',
            }}
            aria-label={mode === 'sales' ? 'Quantidade de vendas' : 'Receita alvo'}
          />
          <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.6rem', color: 'var(--aiox-gray-muted)', flexShrink: 0 }}>
            {mode === 'sales' ? 'vendas/mes' : 'R$/mes'}
          </span>
        </div>
      </div>

      {/* Results */}
      <div
        className="grid gap-px"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          border: '1px solid rgba(156, 156, 156, 0.12)',
        }}
      >
        {[
          { label: 'Budget Necessario', value: formatBRL(calc.requiredBudget), highlight: true },
          { label: 'CPA Alvo', value: formatBRL(calc.cpaTarget) },
          { label: 'Cliques Necessarios', value: Math.round(calc.requiredClicks).toLocaleString() },
          { label: 'Impressoes Necessarias', value: Math.round(calc.requiredImpressions).toLocaleString() },
          { label: mode === 'sales' ? 'Receita Estimada' : 'Vendas Estimadas', value: mode === 'sales' ? formatBRL(calc.estimatedRevenue) : Math.round(calc.targetConversions).toLocaleString() },
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
            <span style={{ fontFamily: 'var(--font-family-display)', fontSize: '1.25rem', fontWeight: 700, color: kpi.highlight ? 'var(--aiox-lime)' : 'var(--aiox-cream)' }}>
              {kpi.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
