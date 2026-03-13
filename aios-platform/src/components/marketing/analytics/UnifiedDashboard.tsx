import { BarChart3 } from 'lucide-react';
import { ModuleHeader, DateRangePicker, PlatformToggle } from '../shared';

export default function UnifiedDashboard() {
  return (
    <div>
      <ModuleHeader title="Analytics" subtitle="Dashboard unificado cross-platform" icon={BarChart3}>
        <PlatformToggle />
        <DateRangePicker />
      </ModuleHeader>

      <div
        className="flex items-center justify-center"
        style={{
          height: 300,
          background: 'var(--aiox-surface)',
          border: '1px dashed rgba(156, 156, 156, 0.15)',
        }}
      >
        <div className="text-center">
          <BarChart3 size={40} style={{ color: 'var(--aiox-gray-dim)', margin: '0 auto 0.75rem' }} />
          <p style={{ fontFamily: 'var(--font-family-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--aiox-cream)', marginBottom: '0.25rem' }}>
            Dashboard Unificado
          </p>
          <p style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.6rem', color: 'var(--aiox-gray-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            [Fase 5] Meta Ads + Google Ads + GA4 + YouTube + Instagram + Hotmart
          </p>
        </div>
      </div>
    </div>
  );
}
