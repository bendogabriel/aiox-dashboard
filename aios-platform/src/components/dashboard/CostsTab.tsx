import { CockpitCard } from '../ui';
import { useCostSummary } from '../../hooks/useDashboard';
import { useTokenUsage } from '../../hooks/useExecute';
import { useDashboardOverview } from '../../hooks/useDashboardOverview';
import { LineChart, BarChart } from './Charts';
import { CostProviderRow } from './DashboardHelpers';
import { TrendUpIcon } from './dashboard-icons';

export function CostsTab() {
  const { data: rawCostSummary } = useCostSummary();
  const { data: rawTokenUsage } = useTokenUsage();
  const { costs: dashCosts } = useDashboardOverview();

  // Prefer real analytics cost data, fall back to unified endpoint, then zeros
  const costSummary = rawCostSummary || (dashCosts ? {
    today: dashCosts.today,
    thisWeek: dashCosts.thisWeek,
    thisMonth: dashCosts.thisMonth,
    byProvider: dashCosts.byProvider,
    bySquad: dashCosts.bySquad,
    trend: dashCosts.trend,
  } : { today: 0, thisWeek: 0, thisMonth: 0, byProvider: { claude: 0, openai: 0 }, bySquad: {}, trend: [0, 0, 0, 0, 0, 0, 0] });

  const tokenUsage = rawTokenUsage || (dashCosts ? dashCosts.tokens : {
    total: { input: 0, output: 0, requests: 0 },
    claude: { input: 0, output: 0, requests: 0 },
    openai: { input: 0, output: 0, requests: 0 },
  });

  return (
    <div
      className="space-y-6 pb-6"
    >
      {/* Cost Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <CockpitCard className="bg-gradient-to-br from-[var(--color-status-success)]/10 to-transparent border-[var(--color-status-success)]/20">
          <p className="text-sm text-secondary mb-1">Hoje</p>
          <p className="text-lg font-bold text-primary">${(costSummary?.today ?? 0).toFixed(2)}</p>
          <div className="flex items-center gap-1 mt-2 text-xs text-[var(--color-status-success)]">
            <TrendUpIcon />
            <span>Estimativa</span>
          </div>
        </CockpitCard>

        <CockpitCard className="bg-gradient-to-br from-[var(--aiox-blue)]/10 to-transparent border-[var(--aiox-blue)]/20">
          <p className="text-sm text-secondary mb-1">Esta Semana</p>
          <p className="text-lg font-bold text-primary">${(costSummary?.thisWeek ?? 0).toFixed(2)}</p>
        </CockpitCard>

        <CockpitCard className="bg-gradient-to-br from-[var(--aiox-gray-muted)]/10 to-transparent border-[var(--aiox-gray-muted)]/20">
          <p className="text-sm text-secondary mb-1">Este Mês</p>
          <p className="text-lg font-bold text-primary">${(costSummary?.thisMonth ?? 0).toFixed(2)}</p>
        </CockpitCard>
      </div>

      {/* Cost by Provider */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CockpitCard>
          <h2 className="font-semibold text-primary mb-4">Custo por Provider</h2>
          <div className="space-y-4">
            <CostProviderRow
              name="Claude (Anthropic)"
              cost={costSummary?.byProvider?.claude || 0}
              tokens={(tokenUsage?.claude?.input ?? 0) + (tokenUsage?.claude?.output ?? 0)}
              color="purple"
            />
            <CostProviderRow
              name="OpenAI"
              cost={costSummary?.byProvider?.openai || 0}
              tokens={(tokenUsage?.openai?.input ?? 0) + (tokenUsage?.openai?.output ?? 0)}
              color="green"
            />
          </div>
        </CockpitCard>

        <CockpitCard>
          <h2 className="font-semibold text-primary mb-4">Trend de Custos (7 dias)</h2>
          {costSummary?.trend && (
            <LineChart
              data={costSummary.trend}
              labels={['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom']}
              height={140}
              showLabels
            />
          )}
        </CockpitCard>
      </div>

      {/* Cost by Squad */}
      <CockpitCard>
        <h2 className="font-semibold text-primary mb-4">Custo por Squad</h2>
        {costSummary?.bySquad && Object.keys(costSummary.bySquad).length > 0 ? (
          <BarChart
            data={Object.entries(costSummary.bySquad)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 8)
              .map(([squad, cost]) => ({
                label: squad.split('-')[0] || squad,
                value: Math.round(cost * 100) / 100,
              }))}
            horizontal
            height={200}
          />
        ) : (
          <p className="text-center text-tertiary py-8">Nenhum dado de custo por squad</p>
        )}
      </CockpitCard>
    </div>
  );
}
