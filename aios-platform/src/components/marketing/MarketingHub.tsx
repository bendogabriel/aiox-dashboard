import { lazy, Suspense } from 'react';
import { cn } from '../../lib/utils';
import { useMarketingStore, type MarketingModule } from '../../stores/marketingStore';
import {
  LayoutDashboard,
  Gauge,
  FileImage,
  Layers,
  Palette,
  BarChart3,
  Sparkles,
  FlaskConical,
  type LucideIcon,
} from 'lucide-react';

// Lazy-load modules
const MarketingOverview = lazy(() => import('./overview/MarketingOverview'));
const TrafficModule = lazy(() => import('./traffic/TrafficOverview'));
const ContentModule = lazy(() => import('./content/ContentDashboard'));
const FunnelsModule = lazy(() => import('./funnels/FunnelDashboard'));
const DesignSystemModule = lazy(() => import('./design-system/DSBrowser'));
const AnalyticsModule = lazy(() => import('./analytics/UnifiedDashboard'));
const CreativesModule = lazy(() => import('./creatives/CreativeStudio'));
const ScenariosModule = lazy(() => import('./scenarios/ScenariosDashboard'));

interface ModuleTab {
  id: MarketingModule;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

const MODULES: ModuleTab[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'traffic', label: 'Traffic', icon: Gauge, badge: '10' },
  { id: 'content', label: 'Content', icon: FileImage },
  { id: 'creatives', label: 'Criativos', icon: Sparkles },
  { id: 'funnels', label: 'Funnels', icon: Layers },
  { id: 'design-system', label: 'Design System', icon: Palette },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'scenarios', label: 'Cenarios', icon: FlaskConical },
];

const MODULE_MAP: Record<MarketingModule, React.ComponentType> = {
  overview: MarketingOverview,
  traffic: TrafficModule,
  content: ContentModule,
  funnels: FunnelsModule,
  'design-system': DesignSystemModule,
  analytics: AnalyticsModule,
  creatives: CreativesModule,
  scenarios: ScenariosModule,
};

function ModuleLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-8 h-8 border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--aiox-lime)', borderTopColor: 'transparent' }}
        />
        <span
          style={{
            fontFamily: 'var(--font-family-mono)',
            fontSize: '0.65rem',
            color: 'var(--aiox-gray-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          Carregando modulo...
        </span>
      </div>
    </div>
  );
}

export default function MarketingHub() {
  const { activeModule, setActiveModule } = useMarketingStore();
  const ActiveComponent = MODULE_MAP[activeModule];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Top navigation bar */}
      <div
        className="flex-shrink-0 flex items-center gap-0 overflow-x-auto"
        style={{
          borderBottom: '1px solid rgba(156, 156, 156, 0.12)',
          background: 'rgba(5, 5, 5, 0.6)',
        }}
      >
        {/* Hub branding */}
        <div
          className="flex items-center gap-2 px-4 flex-shrink-0"
          style={{
            borderRight: '1px solid rgba(156, 156, 156, 0.12)',
            height: '100%',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-family-display)',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--aiox-lime)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            MKT Hub
          </span>
        </div>

        {/* Module tabs */}
        {MODULES.map((module) => {
          const Icon = module.icon;
          const isActive = activeModule === module.id;
          return (
            <button
              key={module.id}
              onClick={() => setActiveModule(module.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-xs font-mono uppercase tracking-wider transition-all flex-shrink-0 relative',
                isActive
                  ? 'text-[var(--aiox-cream)]'
                  : 'text-[var(--aiox-gray-muted)] hover:text-[var(--aiox-gray-silver)]'
              )}
              style={
                isActive
                  ? { background: 'rgba(209, 255, 0, 0.04)' }
                  : undefined
              }
            >
              <Icon size={14} style={isActive ? { color: 'var(--aiox-lime)' } : undefined} />
              <span>{module.label}</span>
              {/* Badge */}
              {module.badge && (
                <span
                  style={{
                    fontFamily: 'var(--font-family-mono)',
                    fontSize: '0.5rem',
                    padding: '0.1rem 0.35rem',
                    background: isActive ? 'rgba(209, 255, 0, 0.15)' : 'rgba(156, 156, 156, 0.12)',
                    color: isActive ? 'var(--aiox-lime)' : 'var(--aiox-gray-dim)',
                    lineHeight: 1.2,
                  }}
                >
                  {module.badge}
                </span>
              )}
              {/* Active indicator */}
              {isActive && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-[2px]"
                  style={{ background: 'var(--aiox-lime)' }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Module content */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 glass-scrollbar">
        <Suspense fallback={<ModuleLoader />}>
          <ActiveComponent />
        </Suspense>
      </div>
    </div>
  );
}
