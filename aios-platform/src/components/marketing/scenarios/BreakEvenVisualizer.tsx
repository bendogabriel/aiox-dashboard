import { ChartContainer, AreaTimeChart, formatBRL } from '../charts';

// Generate cumulative revenue vs cost over days
const DAYS = 30;
const DAILY_SPEND = 500;
const DAILY_REV_BASE = 420; // starts below breakeven then surpasses

function generateBreakEvenData() {
  const data = [];
  let cumCost = 0;
  let cumRevenue = 0;
  let breakEvenDay: number | null = null;

  for (let d = 1; d <= DAYS; d++) {
    cumCost += DAILY_SPEND;
    // Revenue accelerates slightly as campaigns optimize
    const dailyRev = DAILY_REV_BASE * (1 + (d / DAYS) * 0.6);
    cumRevenue += dailyRev;

    if (breakEvenDay === null && cumRevenue >= cumCost) {
      breakEvenDay = d;
    }

    data.push({
      date: `D${d}`,
      receita: Math.round(cumRevenue),
      custo: Math.round(cumCost),
    });
  }

  return { data, breakEvenDay };
}

export function BreakEvenVisualizer() {
  const { data, breakEvenDay } = generateBreakEvenData();
  const lastPoint = data[data.length - 1];
  const profit = lastPoint.receita - lastPoint.custo;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Summary */}
      <div
        className="grid gap-px"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          border: '1px solid rgba(156, 156, 156, 0.12)',
        }}
      >
        <div style={{ padding: '1rem 1.25rem', background: 'var(--aiox-surface)' }}>
          <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--aiox-gray-muted)', display: 'block', marginBottom: '0.25rem' }}>
            Break-Even
          </span>
          <span style={{ fontFamily: 'var(--font-family-display)', fontSize: '1.25rem', fontWeight: 700, color: breakEvenDay ? 'var(--aiox-lime)' : 'var(--color-status-error)' }}>
            {breakEvenDay ? `Dia ${breakEvenDay}` : 'Nao atingido'}
          </span>
        </div>
        <div style={{ padding: '1rem 1.25rem', background: 'var(--aiox-surface)' }}>
          <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--aiox-gray-muted)', display: 'block', marginBottom: '0.25rem' }}>
            Lucro 30 Dias
          </span>
          <span style={{ fontFamily: 'var(--font-family-display)', fontSize: '1.25rem', fontWeight: 700, color: profit >= 0 ? 'var(--aiox-lime)' : 'var(--color-status-error)' }}>
            {formatBRL(profit)}
          </span>
        </div>
        <div style={{ padding: '1rem 1.25rem', background: 'var(--aiox-surface)' }}>
          <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--aiox-gray-muted)', display: 'block', marginBottom: '0.25rem' }}>
            Receita Acumulada
          </span>
          <span style={{ fontFamily: 'var(--font-family-display)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--aiox-cream)' }}>
            {formatBRL(lastPoint.receita)}
          </span>
        </div>
      </div>

      {/* Chart */}
      <ChartContainer title="Break-Even Acumulado" subtitle="Receita vs Custo acumulados em 30 dias" height={280}>
        <AreaTimeChart
          data={data}
          series={[
            { key: 'receita', label: 'Receita Acumulada', color: '#D1FF00' },
            { key: 'custo', label: 'Custo Acumulado', color: '#ED4609' },
          ]}
        />
      </ChartContainer>
    </div>
  );
}
