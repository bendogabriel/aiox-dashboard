import { Eye, EyeOff } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { CockpitButton } from './cockpit/CockpitButton';
import { cn } from '../../lib/utils';

export function FocusModeIndicator() {
  const { focusMode, toggleFocusMode } = useUIStore();

  return (
    <>
    {focusMode && (
        <button
          onClick={toggleFocusMode}
          className="fixed bottom-6 right-6 z-[100] flex items-center gap-2 px-3 py-2 rounded-full glass-lg border border-[var(--aiox-lime)]/30 text-[var(--aiox-lime)] hover:text-[var(--aiox-lime)] hover:border-[var(--aiox-lime)]/50 transition-colors shadow-lg shadow-[var(--aiox-lime)]/10 cursor-pointer"
          aria-label="Sair do Modo Foco (⌘⇧F)"
          title="Sair do Modo Foco (⌘⇧F)"
        >
          <Eye size={14} />
          <span className="text-xs font-medium">Foco</span>
          <kbd className="px-1 py-0.5 rounded text-[9px] font-mono bg-white/10 text-white/60">⌘⇧F</kbd>
        </button>
      )}
    </>
);
}

export function FocusToggle() {
  const { focusMode, toggleFocusMode } = useUIStore();

  return (
    <CockpitButton
      variant="ghost"
      size="icon"
      onClick={toggleFocusMode}
      className={cn('hidden sm:flex', focusMode && 'bg-[var(--aiox-lime)]/10 text-[var(--aiox-lime)]')}
      aria-label={focusMode ? 'Sair do Modo Foco (⌘⇧F)' : 'Modo Foco (⌘⇧F)'}
    >
      {focusMode ? <EyeOff size={18} /> : <Eye size={18} />}
    </CockpitButton>
  );
}
