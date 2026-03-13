import { cn } from '../../../lib/utils';
import { Calendar } from 'lucide-react';
import { useMarketingStore, type DatePreset } from '../../../stores/marketingStore';

const PRESETS: { id: DatePreset; label: string }[] = [
  { id: 'today', label: 'Hoje' },
  { id: 'yesterday', label: 'Ontem' },
  { id: 'last_7d', label: '7d' },
  { id: 'last_14d', label: '14d' },
  { id: 'last_30d', label: '30d' },
  { id: 'last_90d', label: '90d' },
];

interface DateRangePickerProps {
  className?: string;
}

export function DateRangePicker({ className }: DateRangePickerProps) {
  const { datePreset, setDatePreset } = useMarketingStore();

  return (
    <div
      className={cn('flex items-center gap-1', className)}
      style={{
        background: 'var(--aiox-surface)',
        border: '1px solid rgba(156, 156, 156, 0.12)',
        padding: '0.25rem',
      }}
    >
      <Calendar size={14} style={{ color: 'var(--aiox-gray-muted)', marginLeft: '0.5rem' }} />
      {PRESETS.map((preset) => (
        <button
          key={preset.id}
          onClick={() => setDatePreset(preset.id)}
          className={cn(
            'px-2.5 py-1 text-xs font-mono uppercase tracking-wider transition-all',
            datePreset === preset.id
              ? 'text-black font-bold'
              : 'text-[var(--aiox-gray-muted)] hover:text-[var(--aiox-cream)]'
          )}
          style={
            datePreset === preset.id
              ? { background: 'var(--aiox-lime)', color: '#050505' }
              : undefined
          }
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}
