import { Gauge, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { ModuleHeader, MarketingKpiCard, DateRangePicker, PlatformToggle } from '../shared';
import { useTrafficDashboard } from '../../../hooks/useTrafficData';
import { CampaignTable } from './CampaignTable';

export default function TrafficOverview() {
  const { data, isLoading, isError, refetch, isFetching } = useTrafficDashboard();

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

      {/* KPI Grid */}
      {data && (
        <>
          <div
            className="grid gap-px"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              border: '1px solid rgba(156, 156, 156, 0.12)',
              marginBottom: '2rem',
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

          {/* Campaigns Table */}
          <CampaignTable campaigns={data.allCampaigns} />
        </>
      )}
    </div>
  );
}
