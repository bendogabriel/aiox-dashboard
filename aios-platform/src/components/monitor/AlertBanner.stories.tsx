import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { CockpitCard } from '../ui';
import { cn } from '../../lib/utils';

/**
 * AlertBanner uses the monitorStore internally. This presentational
 * wrapper renders the same markup using inline mock data.
 */

interface MockAlert {
  id: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  timestamp: string;
  dismissed: boolean;
}

const severityConfig = {
  info: { icon: Info, borderClass: 'border-l-2 border-l-[var(--aiox-blue)]', iconColor: 'text-[var(--aiox-blue)]' },
  warning: { icon: AlertTriangle, borderClass: 'border-l-2 border-l-[var(--bb-warning)]', iconColor: 'text-[var(--bb-warning)]' },
  error: { icon: AlertCircle, borderClass: 'border-l-2 border-l-[var(--bb-error)]', iconColor: 'text-[var(--bb-error)]' },
} as const;

function formatAlertTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function AlertBannerPresentation({
  alerts,
  onDismiss,
}: {
  alerts: MockAlert[];
  onDismiss: (id: string) => void;
}) {
  const active = alerts.filter((a) => !a.dismissed);
  if (active.length === 0) return <p className="text-sm text-tertiary text-center py-4">No active alerts</p>;

  return (
    <div className="flex flex-col gap-2 flex-shrink-0">
      {active.map((alert) => {
          const config = severityConfig[alert.severity];
          const Icon = config.icon;
          return (
            <div
              key={alert.id}
            >
              <CockpitCard padding="sm" variant="subtle" className={cn('flex items-center gap-3', config.borderClass)}>
                <Icon className={cn('h-4 w-4 flex-shrink-0', config.iconColor)} />
                <span className="text-xs text-primary flex-1 min-w-0">{alert.message}</span>
                <span className="text-[10px] text-tertiary font-mono whitespace-nowrap">{formatAlertTime(alert.timestamp)}</span>
                <button onClick={() => onDismiss(alert.id)} className="p-0.5 rounded hover:bg-white/10 transition-colors flex-shrink-0" aria-label="Dismiss alert">
                  <X className="h-3.5 w-3.5 text-tertiary" />
                </button>
              </CockpitCard>
            </div>
          );
        })}
</div>
  );
}

const now = new Date().toISOString();

const mockAlerts: MockAlert[] = [
  { id: 'a1', message: 'High CPU usage detected on worker node', severity: 'warning', timestamp: now, dismissed: false },
  { id: 'a2', message: 'Agent @dex disconnected unexpectedly', severity: 'error', timestamp: now, dismissed: false },
  { id: 'a3', message: 'New deployment available v2.4.1', severity: 'info', timestamp: now, dismissed: false },
];

const meta: Meta<typeof AlertBannerPresentation> = {
  title: 'Monitor/AlertBanner',
  component: AlertBannerPresentation,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Dismissable alert banners with severity levels (info, warning, error). Renders at the top of the monitoring dashboard.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onDismiss: { action: 'dismissed' },
  },
  decorators: [
    (Story) => (
      <div className="w-[600px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const AllSeverities: Story = {
  args: {
    alerts: mockAlerts,
    onDismiss: fn(),
  },
};

export const WarningOnly: Story = {
  args: {
    alerts: [mockAlerts[0]],
    onDismiss: fn(),
  },
};

export const ErrorOnly: Story = {
  args: {
    alerts: [mockAlerts[1]],
    onDismiss: fn(),
  },
};

export const NoAlerts: Story = {
  args: {
    alerts: [],
    onDismiss: fn(),
  },
};
