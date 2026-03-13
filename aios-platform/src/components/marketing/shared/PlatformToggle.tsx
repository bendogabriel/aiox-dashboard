import { cn } from '../../../lib/utils';
import { useMarketingStore, type Platform } from '../../../stores/marketingStore';

const PLATFORMS: { id: Platform; label: string; color: string }[] = [
  { id: 'meta', label: 'Meta', color: '#0099FF' },
  { id: 'google', label: 'Google', color: '#D1FF00' },
  { id: 'ga4', label: 'GA4', color: '#ED4609' },
  { id: 'youtube', label: 'YouTube', color: '#EF4444' },
  { id: 'instagram', label: 'IG', color: '#E1306C' },
  { id: 'hotmart', label: 'Hotmart', color: '#f59e0b' },
];

interface PlatformToggleProps {
  className?: string;
  availablePlatforms?: Platform[];
}

export function PlatformToggle({ className, availablePlatforms }: PlatformToggleProps) {
  const { selectedPlatforms, togglePlatform } = useMarketingStore();
  const platforms = availablePlatforms
    ? PLATFORMS.filter((p) => availablePlatforms.includes(p.id))
    : PLATFORMS;

  return (
    <div
      className={cn('flex items-center gap-1', className)}
      style={{
        background: 'var(--aiox-surface)',
        border: '1px solid rgba(156, 156, 156, 0.12)',
        padding: '0.25rem',
      }}
    >
      {platforms.map((platform) => {
        const isActive = selectedPlatforms.includes(platform.id);
        return (
          <button
            key={platform.id}
            onClick={() => togglePlatform(platform.id)}
            className={cn(
              'px-2.5 py-1 text-xs font-mono uppercase tracking-wider transition-all',
              !isActive && 'opacity-40 hover:opacity-70'
            )}
            style={{
              color: isActive ? platform.color : 'var(--aiox-gray-dim)',
              background: isActive ? `${platform.color}12` : 'transparent',
              borderBottom: isActive ? `2px solid ${platform.color}` : '2px solid transparent',
            }}
          >
            {platform.label}
          </button>
        );
      })}
    </div>
  );
}
