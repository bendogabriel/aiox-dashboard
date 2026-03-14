import { useEffect, useRef } from 'react';

interface TickerItem {
  label: string;
  value: string;
  trend?: 'up' | 'down';
}

export interface MarqueeTickerProps {
  items?: TickerItem[];
  speed?: number; // pixels per second
}

const DEFAULT_ITEMS: TickerItem[] = [
  { label: 'ROAS', value: '4.46x', trend: 'up' },
  { label: 'CTR', value: '2.8%', trend: 'up' },
  { label: 'CPC', value: 'R$ 0.42', trend: 'down' },
  { label: 'CPM', value: 'R$ 12.30', trend: 'down' },
  { label: 'RECEITA', value: 'R$ 52.3K', trend: 'up' },
  { label: 'LEADS', value: '3.850', trend: 'up' },
  { label: 'CONVERSOES', value: '1.240', trend: 'up' },
  { label: 'CPA', value: 'R$ 10.04', trend: 'down' },
  { label: 'SESSOES', value: '28K', trend: 'up' },
  { label: 'BOUNCE', value: '42.3%', trend: 'down' },
];

export function MarqueeTicker({ items = DEFAULT_ITEMS, speed = 40 }: MarqueeTickerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const posRef = useRef(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let lastTime = performance.now();

    function tick(now: number) {
      const delta = (now - lastTime) / 1000;
      lastTime = now;
      posRef.current -= speed * delta;

      // Reset position when half scrolled (seamless loop)
      const halfWidth = el!.scrollWidth / 2;
      if (Math.abs(posRef.current) >= halfWidth) {
        posRef.current += halfWidth;
      }

      el!.style.transform = `translateX(${posRef.current}px)`;
      animRef.current = requestAnimationFrame(tick);
    }

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [speed]);

  const renderItem = (item: TickerItem, idx: number) => (
    <span
      key={`${item.label}-${idx}`}
      className="flex items-center gap-2 flex-shrink-0"
      style={{ padding: '0 1.5rem' }}
    >
      <span
        style={{
          fontFamily: 'var(--font-family-mono)',
          fontSize: '0.55rem',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--aiox-gray-muted)',
        }}
      >
        {item.label}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-family-display)',
          fontSize: '0.75rem',
          fontWeight: 700,
          color: item.trend === 'up' ? 'var(--aiox-lime)' : item.trend === 'down' ? 'var(--color-status-error)' : 'var(--aiox-cream)',
        }}
      >
        {item.value}
      </span>
      {item.trend && (
        <span
          style={{
            fontSize: '0.55rem',
            color: item.trend === 'up' ? 'var(--aiox-lime)' : 'var(--color-status-error)',
          }}
        >
          {item.trend === 'up' ? '\u25B2' : '\u25BC'}
        </span>
      )}
    </span>
  );

  return (
    <div
      style={{
        overflow: 'hidden',
        borderBottom: '1px solid rgba(156, 156, 156, 0.08)',
        background: 'rgba(5, 5, 5, 0.4)',
        height: 32,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div
        ref={scrollRef}
        className="flex items-center"
        style={{ whiteSpace: 'nowrap', willChange: 'transform' }}
      >
        {/* Render items twice for seamless loop */}
        {items.map((item, i) => renderItem(item, i))}
        {items.map((item, i) => renderItem(item, i + items.length))}
      </div>
    </div>
  );
}
