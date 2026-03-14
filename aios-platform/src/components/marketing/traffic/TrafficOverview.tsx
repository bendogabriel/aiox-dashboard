import { Gauge, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { ModuleHeader, MarketingKpiCard, DateRangePicker, PlatformToggle, HeroKpiStrip, SecondaryMetrics, SectionNumber, type HeroKpi } from '../shared';
import { ChartContainer, AreaTimeChart, ScatterBubbleChart } from '../charts';
import { FilterBar } from '../filters';
import { useTrafficDashboard } from '../../../hooks/useTrafficData';
import { CampaignTable } from './CampaignTable';

// Demo trend data for when live data doesn't include time series
const TREND_DATA = [
  { date: 'D1', spend: 480, clicks: 1200 },
  { date: 'D3', spend: 520, clicks: 1350 },
  { date: 'D5', spend: 490, clicks: 1100 },
  { date: 'D7', spend: 560, clicks: 1500 },
  { date: 'D9', spend: 510, clicks: 1280 },
  { date: 'D11', spend: 600, clicks: 1600 },
  { date: 'D13', spend: 550, clicks: 1450 },
  { date: 'D14', spend: 580, clicks: 1520 },
];

const SCATTER_DATA = [
  { spend: 2100, roas: 6.2, conversions: 180, name: 'MPG Perpetua' },
  { spend: 1800, roas: 5.1, conversions: 140, name: 'GPO Remarketing' },
  { spend: 1400, roas: 4.3, conversions: 95, name: 'MAM Search' },
  { spend: 980, roas: 3.8, conversions: 72, name: 'MCPM Lookalike' },
  { spend: 750, roas: 2.8, conversions: 45, name: 'FDS Display' },
  { spend: 1200, roas: 3.2, conversions: 60, name: 'WPG Retarget' },
];

export default function TrafficOverview() {
  const { data, isLoading, isError, refetch, isFetching } = useTrafficDashboard();

  // Build hero KPIs from data (first 6 KPIs in strip format)
  const heroKpis: HeroKpi[] = data?.kpis.slice(0, 6).map((kpi) => ({
    label: kpi.label,
    value: kpi.formatted,
    trend: kpi.trend,
  })) ?? [];

  // Build secondary metrics from remaining KPIs
  const secondaryMetrics = data?.kpis.slice(6).map((kpi) => ({
    label: kpi.label,
    value: kpi.formatted,
  })) ?? [];

  return (
    <div>
      <ModuleHeader title="Traffic" subtitle="Performance de trafego pago" icon={Gauge}>
        <PlatformToggle availablePlatforms={['meta', 'google', 'ga4']} />
        <DateRangePicker />
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-2 transition-colors hover:bg-white/5"
          style={{ border: '1px solid rgba(156, 156, 156, 0.12)' }}
          title="Atualizar dados"
          aria-label="Atualizar dados"
        >
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} style={{ color: 'var(--aiox-gray-muted)' }} />
        </button>
      </ModuleHeader>

      {/* Data source indicator */}
      {data && (
        <div className="flex items-center gap-2 mb-4">
          {data.source === 'live' ? (
            <Wifi size={12} style={{ color: 'var(--aiox-lime)' }} />
          ) : (
            <WifiOff size={12} style={{ color: 'var(--aiox-gray-dim)' }} />
          )}
          <span
            style={{
              fontFamily: 'var(--font-family-mono)',
              fontSize: '0.55rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: data.source === 'live' ? 'var(--aiox-lime)' : 'var(--aiox-gray-dim)',
            }}
          >
            {data.source === 'live' ? 'dados ao vivo' : 'dados demo — configure META_ACCESS_TOKEN no .env'}
          </span>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center h-48">
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-6 h-6 border-2 border-t-transparent animate-spin"
              style={{ borderColor: 'var(--aiox-lime)', borderTopColor: 'transparent' }}
            />
            <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.6rem', color: 'var(--aiox-gray-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Buscando dados de trafego...
            </span>
          </div>
        </div>
      )}

      {/* Error state */}
      {isError && !data && (
        <div
          className="p-4 mb-4"
          style={{ background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
        >
          <p style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.7rem', color: 'var(--color-status-error)' }}>
            Erro ao buscar dados. Verifique se o Engine esta rodando em localhost:4002.
          </p>
          <button
            onClick={() => refetch()}
            className="mt-2 px-3 py-1 text-xs font-mono uppercase tracking-wider"
            style={{ background: 'var(--aiox-surface)', border: '1px solid rgba(156, 156, 156, 0.2)', color: 'var(--aiox-cream)' }}
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Data loaded */}
      {data && (
        <>
          {/* Cross-filter bar */}
          <FilterBar />

          {/* Hero KPI strip */}
          {heroKpis.length > 0 && <HeroKpiStrip kpis={heroKpis} />}

          {/* Secondary metrics */}
          {secondaryMetrics.length > 0 && <SecondaryMetrics metrics={secondaryMetrics} />}

          {/* Section: Detailed KPIs */}
          <SectionNumber number="01" title="Metricas" subtitle="Performance detalhada do periodo" />
          <div
            className="grid gap-px"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              border: '1px solid rgba(156, 156, 156, 0.12)',
              marginBottom: '2.5rem',
            }}
          >
            {data.kpis.map((kpi) => (
              <MarketingKpiCard
                key={kpi.key}
                label={kpi.label}
                value={kpi.formatted}
                trend={kpi.trend}
              />
            ))}
          </div>

          {/* Section: Charts */}
          <SectionNumber number="02" title="Tendencias" subtitle="Investimento, cliques e eficiencia" />
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', marginBottom: '2.5rem' }}
          >
            <ChartContainer title="Spend + Clicks" subtitle="Ultimos 14 dias" height={220}>
              <AreaTimeChart
                data={TREND_DATA}
                series={[
                  { key: 'clicks', label: 'Cliques', color: '#D1FF00' },
                  { key: 'spend', label: 'Spend (R$)', color: '#0099FF' },
                ]}
              />
            </ChartContainer>
            <ChartContainer title="Eficiencia por Campanha" subtitle="ROAS vs Spend (bolha = conversoes)" height={220}>
              <ScatterBubbleChart
                data={SCATTER_DATA}
                xKey="spend"
                yKey="roas"
                sizeKey="conversions"
                xLabel="Spend (R$)"
                yLabel="ROAS"
              />
            </ChartContainer>
          </div>

          {/* Section: Campaigns */}
          <SectionNumber number="03" title="Campanhas" subtitle={`${data.allCampaigns.length} campanhas encontradas`} />
          <CampaignTable campaigns={data.allCampaigns} />
        </>
      )}
    </div>
  );
}
