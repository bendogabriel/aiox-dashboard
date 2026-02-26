import { Cpu, HardDrive, Clock, Zap } from 'lucide-react';
import { GlassCard, ProgressBar } from '../ui';
import { useMonitorStore } from '../../stores/monitorStore';
import { cn } from '../../lib/utils';

interface MetricCardProps {
  icon: typeof Cpu;
  label: string;
  value: number;
  unit: string;
  showProgress?: boolean;
  color: string;
}

function getVariant(value: number): 'default' | 'warning' | 'error' {
  if (value > 80) return 'error';
  if (value > 60) return 'warning';
  return 'default';
}

function MetricCard({ icon: Icon, label, value, unit, showProgress, color }: MetricCardProps) {
  const variant = showProgress ? getVariant(value) : 'default';

  return (
    <GlassCard padding="sm" variant="subtle">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn('h-4 w-4', color)} />
        <span className="text-[10px] text-tertiary uppercase tracking-wider font-medium">
          {label}
        </span>
      </div>
      <div className="text-lg font-bold text-primary tabular-nums">
        {value}
        <span className="text-xs text-tertiary font-normal ml-0.5">{unit}</span>
      </div>
      {showProgress && (
        <ProgressBar
          value={value}
          size="sm"
          variant={variant}
          glow={variant === 'error'}
          className="mt-2"
        />
      )}
    </GlassCard>
  );
}

export default function MetricsPanel() {
  const metrics = useMonitorStore((s) => s.metrics);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <MetricCard
        icon={Cpu}
        label="CPU"
        value={metrics.cpu}
        unit="%"
        showProgress
        color="text-blue-400"
      />
      <MetricCard
        icon={HardDrive}
        label="Memory"
        value={metrics.memory}
        unit="%"
        showProgress
        color="text-purple-400"
      />
      <MetricCard
        icon={Clock}
        label="Latency"
        value={metrics.latency}
        unit="ms"
        color="text-yellow-400"
      />
      <MetricCard
        icon={Zap}
        label="Throughput"
        value={metrics.throughput}
        unit="req/s"
        color="text-green-400"
      />
    </div>
  );
}
