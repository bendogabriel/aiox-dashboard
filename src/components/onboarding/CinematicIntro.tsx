import { useState, useEffect, useCallback } from 'react';
import { Bot, Globe, ClipboardList, MessageSquare } from 'lucide-react';
import { AioxLogo } from '../ui/AioxLogo';

// Cinematic intro phases
type IntroPhase = 'logo' | 'particles' | 'tagline' | 'features' | 'ready';

const PHASE_DURATIONS: Record<IntroPhase, number> = {
  logo: 2000,
  particles: 1200,
  tagline: 2200,
  features: 3000,
  ready: 800,
};

// Feature highlights shown during intro
const FEATURES = [
  { Icon: Bot, label: 'Agentes Especializados', desc: 'Squads com IA para cada domínio' },
  { Icon: Globe, label: 'Mundo Interativo', desc: 'Visualize agentes trabalhando em tempo real' },
  { Icon: ClipboardList, label: 'Kanban Inteligente', desc: 'Gerencie stories com drag & drop' },
  { Icon: MessageSquare, label: 'Chat Contextual', desc: 'Converse com qualquer agente' },
];

// Floating particle for background effect
interface FloatingParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  color: string;
}

function generateParticles(count: number): FloatingParticle[] {
  const colors = [
    'rgba(209, 255, 0, 0.3)',
    'rgba(99, 102, 241, 0.2)',
    'rgba(139, 92, 246, 0.2)',
    'rgba(59, 130, 246, 0.15)',
    'rgba(16, 185, 129, 0.15)',
  ];
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 2 + Math.random() * 4,
    duration: 3 + Math.random() * 4,
    delay: Math.random() * 2,
    color: colors[i % colors.length],
  }));
}

interface CinematicIntroProps {
  onComplete: () => void;
}

export function CinematicIntro({ onComplete }: CinematicIntroProps) {
  const [phase, setPhase] = useState<IntroPhase>('logo');
  const [particles] = useState(() => generateParticles(30));

  const advancePhase = useCallback(() => {
    setPhase((current) => {
      const phases: IntroPhase[] = ['logo', 'particles', 'tagline', 'features', 'ready'];
      const idx = phases.indexOf(current);
      if (idx < phases.length - 1) {
        return phases[idx + 1];
      }
      return current;
    });
  }, []);

  // Auto-advance phases
  useEffect(() => {
    const timer = setTimeout(advancePhase, PHASE_DURATIONS[phase]);
    return () => clearTimeout(timer);
  }, [phase, advancePhase]);

  // Complete when ready phase ends
  useEffect(() => {
    if (phase === 'ready') {
      const timer = setTimeout(onComplete, PHASE_DURATIONS.ready);
      return () => clearTimeout(timer);
    }
  }, [phase, onComplete]);

  // Allow skip on click
  const handleSkip = useCallback(() => {
    onComplete();
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center overflow-hidden"
      style={{ background: '#0a0a0f' }}
      onClick={handleSkip}
      role="dialog"
      aria-label="Introdução AIOX"
    >
      {/* Floating particles background */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.x}%`,
              top: `${p.y}%`,
              background: p.color,
            }}
          />
        ))}
      </div>

      {/* Radial glow behind logo */}
      <div
        className="absolute"
        style={{
          width: 500,
          height: 500,
          background: 'radial-gradient(circle, rgba(209, 255, 0, 0.08) 0%, transparent 70%)',
        }}
      />

      {/* Grid lines background effect */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(209,255,0,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(209,255,0,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
        aria-hidden="true"
      />

      {/* Content container */}
      <div className="relative flex flex-col items-center z-10 max-w-lg px-6">
        {/* Phase: Logo reveal */}
        {(phase === 'logo' || phase === 'particles' || phase === 'tagline' || phase === 'features') && (
            <div
              key="logo"
              className="flex flex-col items-center"
            >
              <div
                style={{ color: 'var(--aiox-lime)' }}
              >
                <AioxLogo variant="full" size={48} />
              </div>

              {/* Accent line under logo */}
              <div
                className="mt-4 rounded-full"
                style={{ background: 'var(--aiox-lime)', height: 2 }}
              />
            </div>
          )}
{/* Phase: Tagline */}
        {(phase === 'tagline' || phase === 'features') && (
            <div
              key="tagline"
              className="text-center"
            >
              <p
                className="text-lg md:text-xl font-light tracking-wide mt-6"
                style={{ color: 'rgba(255, 255, 255, 0.7)' }}
              >
                AI-Orchestrated System
              </p>
              <p
                className="text-sm mt-2 tracking-widest uppercase"
                style={{ color: 'rgba(209, 255, 0, 0.5)' }}
              >
                Multi-Agent Platform
              </p>
            </div>
          )}
{/* Phase: Features grid */}
        {phase === 'features' && (
            <div
              key="features"
              className="grid grid-cols-2 gap-3 mt-8 w-full max-w-sm"
            >
              {FEATURES.map((feat, i) => (
                <div
                  key={feat.label}
                  className="rounded-none p-3 text-center"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <feat.Icon size={24} className="text-white/80 mx-auto" />
                  <p className="text-xs font-semibold text-white/80 mt-1.5">{feat.label}</p>
                  <p className="text-[10px] text-white/40 mt-0.5">{feat.desc}</p>
                </div>
              ))}
            </div>
          )}
{/* Phase: Ready - final flash */}
        {phase === 'ready' && (
            <div
              key="ready"
              className="absolute inset-0 flex items-center justify-center"
            >
              <div
                className="w-[200vw] h-[200vh] absolute"
                style={{
                  background: 'radial-gradient(circle, rgba(209, 255, 0, 0.15) 0%, transparent 50%)',
                }}
              />
            </div>
          )}
</div>

      {/* Skip hint */}
      <p
        className="absolute bottom-8 text-xs tracking-wider"
        style={{ color: 'rgba(255, 255, 255, 0.2)' }}
      >
        CLIQUE PARA PULAR
      </p>
    </div>
  );
}
