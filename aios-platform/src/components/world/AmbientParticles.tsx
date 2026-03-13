import { useMemo } from 'react';
import type { DomainId } from './world-layout';
import { useDomains } from './DomainContext';

interface AmbientParticlesProps {
  domain: DomainId;
  roomWidth: number;
  roomHeight: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  driftX: number;
  driftY: number;
  opacity: number;
  char?: string;
}

// Domain-specific particle characters (ASCII-only)
const DOMAIN_CHARS: Record<DomainId, string[]> = {
  content: ['+', '*', ':'],
  sales:   ['$', '#', '^'],
  dev:     ['<', '/', '>'],
  design:  ['.', '~', '-'],
  data:    ['0', '1', '|'],
  ops:     ['=', '%', '&'],
};

const PARTICLE_COUNT = 12;

function hashNum(seed: number): number {
  let h = seed;
  h = ((h >> 16) ^ h) * 0x45d9f3b;
  h = ((h >> 16) ^ h) * 0x45d9f3b;
  return Math.abs(h);
}

export function AmbientParticles({ domain, roomWidth, roomHeight }: AmbientParticlesProps) {
  const domains = useDomains();
  const d = domains[domain];
  const chars = DOMAIN_CHARS[domain];

  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      const h = hashNum(i * 7919 + domain.charCodeAt(0));
      return {
        id: i,
        x: (h % roomWidth),
        y: ((h >> 8) % roomHeight),
        size: 6 + (h % 8),
        delay: (h % 5000) / 1000,
        duration: 8 + (h % 12),
        driftX: ((h >> 4) % 60) - 30,
        driftY: -20 - ((h >> 6) % 40),
        opacity: 0.08 + ((h % 10) / 100),
        char: chars[h % chars.length],
      };
    });
  }, [domain, roomWidth, roomHeight, chars]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute select-none"
          style={{
            left: p.x,
            top: p.y,
            fontSize: p.size,
            color: d.tileColor,
            fontFamily: 'monospace',
          }}
        >
          {p.char}
        </div>
      ))}
    </div>
  );
}
