/**
 * OnboardingBanner — First-visit welcome + "How it works" section
 * Story 6.4
 */
import { useState, useEffect } from 'react';
import { X, Search, UserPlus, Zap } from 'lucide-react';

const STORAGE_KEY = 'marketplace-onboarded';

// --- Welcome Banner ---
export function WelcomeBanner() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch { /* noop */ }
  };

  if (dismissed) return null;

  return (
    <div className="
      relative p-4 mb-4
      bg-gradient-to-r from-[var(--aiox-lime,#D1FF00)]/10 to-transparent
      border border-[var(--aiox-lime,#D1FF00)]/20
    ">
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 text-[var(--color-text-muted,#666)] hover:text-[var(--color-text-primary,#fff)] transition-colors"
      >
        <X size={14} />
      </button>
      <h2 className="font-mono text-sm font-semibold text-[var(--aiox-lime,#D1FF00)] mb-1">
        Bem-vindo ao Marketplace!
      </h2>
      <p className="text-xs text-[var(--color-text-secondary,#999)] max-w-lg">
        Explore agentes de IA especializados ou publique os seus para venda.
        Encontre o agente perfeito para cada tarefa do seu workflow.
      </p>
    </div>
  );
}

// --- How It Works ---
const STEPS = [
  {
    icon: Search,
    title: 'Explore',
    description: 'Busque agentes por categoria, skill ou caso de uso.',
  },
  {
    icon: UserPlus,
    title: 'Contrate',
    description: 'Escolha o modelo (task, hora, mensal) e contrate.',
  },
  {
    icon: Zap,
    title: 'Use',
    description: 'O agente e ativado no seu workspace, pronto para trabalhar.',
  },
];

export function HowItWorks() {
  return (
    <div className="mb-4">
      <h3 className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted,#666)] mb-3">
        Como Funciona
      </h3>
      <div className="grid grid-cols-3 gap-3">
        {STEPS.map((step, i) => (
          <div
            key={i}
            className="p-3 bg-[var(--color-bg-surface,#0a0a0a)] border border-[var(--color-border-default,#333)] text-center"
          >
            <div className="w-8 h-8 mx-auto mb-2 flex items-center justify-center bg-[var(--color-bg-elevated,#1a1a1a)] border border-[var(--color-border-default,#333)] text-[var(--aiox-lime,#D1FF00)]">
              <step.icon size={14} />
            </div>
            <p className="text-xs font-mono font-semibold text-[var(--color-text-primary,#fff)] mb-1">
              {i + 1}. {step.title}
            </p>
            <p className="text-[10px] text-[var(--color-text-secondary,#999)]">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Seller Onboarding Checklist ---
interface SellerOnboardingItem {
  key: string;
  label: string;
  completed: boolean;
  action?: string;
}

export function SellerOnboardingChecklist({
  items,
  onAction,
}: {
  items: SellerOnboardingItem[];
  onAction: (key: string) => void;
}) {
  const completedCount = items.filter((i) => i.completed).length;
  const allDone = completedCount === items.length;

  if (allDone) return null;

  return (
    <div className="p-4 bg-[var(--color-bg-surface,#0a0a0a)] border border-[var(--color-border-default,#333)] mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-[var(--color-text-primary,#fff)]">
          Setup do Seller
        </h3>
        <span className="text-[10px] font-mono text-[var(--color-text-muted,#666)]">
          {completedCount}/{items.length}
        </span>
      </div>
      {/* Progress bar */}
      <div className="h-1 bg-[var(--color-bg-elevated,#1a1a1a)] mb-3">
        <div
          className="h-full bg-[var(--aiox-lime,#D1FF00)] transition-all"
          style={{ width: `${(completedCount / items.length) * 100}%` }}
        />
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.key} className="flex items-center gap-2">
            <div className={`
              w-4 h-4 flex items-center justify-center border shrink-0
              ${item.completed
                ? 'bg-[var(--status-success,#4ADE80)] border-[var(--status-success,#4ADE80)]'
                : 'border-[var(--color-border-default,#333)]'
              }
            `}>
              {item.completed && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2.5 2.5L8 3" stroke="var(--aiox-dark)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span className={`text-xs font-mono flex-1 ${item.completed ? 'text-[var(--color-text-muted,#666)] line-through' : 'text-[var(--color-text-secondary,#999)]'}`}>
              {item.label}
            </span>
            {!item.completed && item.action && (
              <button
                type="button"
                onClick={() => onAction(item.key)}
                className="text-[10px] font-mono text-[var(--aiox-lime,#D1FF00)] hover:underline"
              >
                {item.action}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Tooltip component ---
export function InfoTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);

  return (
    <span className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        className="w-3.5 h-3.5 flex items-center justify-center text-[9px] font-mono border border-[var(--color-border-default,#333)] text-[var(--color-text-muted,#666)] hover:text-[var(--color-text-secondary,#999)] transition-colors"
        aria-label={text}
      >
        ?
      </button>
      {show && (
        <div className="
          absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-50
          px-2 py-1.5 w-48
          bg-[var(--color-bg-elevated,#1a1a1a)]
          border border-[var(--color-border-default,#333)]
          text-[10px] text-[var(--color-text-secondary,#999)]
          shadow-lg
        ">
          {text}
        </div>
      )}
    </span>
  );
}
