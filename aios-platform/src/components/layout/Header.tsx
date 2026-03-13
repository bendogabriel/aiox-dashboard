import { useState, useRef, useEffect } from 'react';
import {
  type LucideIcon,
  User,
  Settings,
  Palette,
  BarChart3,
  BookOpen,
  MessageSquare,
  LogOut,
  Sun,
  Moon,
  Layers,
  Terminal,
  Crosshair,
  Monitor,
  ChevronRight,
  Globe,
  Store,
} from 'lucide-react';
import { NotificationCenter } from '../ui/NotificationCenter';
import { MobileMenuButton } from './Sidebar';
import { useGlobalSearch } from '../search';
import { useUIStore } from '../../stores/uiStore';
import { cn } from '../../lib/utils';
import { ICON_SIZES } from '../../lib/icons';

// Icons
const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

const BobIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

export function Header() {
  const globalSearch = useGlobalSearch();

  return (
    <header aria-label="Cabecalho principal" className="h-16 px-4 md:px-6 flex items-center justify-between border-b border-[var(--color-border-default)] surface-base gap-4 relative z-50">
      {/* Mobile Menu Button */}
      <MobileMenuButton />

      {/* Search Button */}
      <button
        onClick={globalSearch.open}
        aria-label="Buscar agents, squads (⌘K)"
        className="flex-1 max-w-md h-10 px-3 md:px-4 flex items-center gap-2 md:gap-3 rounded-none bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] transition-colors text-left group"
      >
        <SearchIcon />
        <span className="text-tertiary text-sm flex-1 hidden sm:block">Buscar agents, squads...</span>
        <span className="text-tertiary text-sm flex-1 sm:hidden">Buscar...</span>
        <div className="hidden sm:flex items-center gap-1 text-[10px] text-tertiary opacity-60 group-hover:opacity-100 transition-opacity">
          <kbd className="px-1.5 py-0.5 rounded-none bg-[var(--color-bg-tertiary)] font-mono">⌘</kbd>
          <kbd className="px-1.5 py-0.5 rounded-none bg-[var(--color-bg-tertiary)] font-mono">K</kbd>
        </div>
      </button>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {/* Bob Button (renamed from AIOS Master) */}
        <BobButton />

        {/* Notifications */}
        <NotificationCenter />

        {/* User Avatar with Menu + Theme */}
        <UserMenu />
      </div>
    </header>
  );
}

// Bob Button (renamed from AIOS Master)
function BobButton() {
  const { setSelectedAgentId, setCurrentView } = useUIStore();

  const handleClick = () => {
    setSelectedAgentId('roteador');
    setCurrentView('chat');
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-none',
        'bg-[var(--color-accent-subtle)]',
        'border border-[var(--color-accent)]/30',
        'text-[var(--color-accent)] hover:brightness-110',
        'hover:bg-[var(--color-accent)]/20',
        'transition-all duration-200'
      )}
      aria-label="Falar com Bob"
    >
      <BobIcon />
      <span className="hidden sm:inline text-sm font-medium">Bob</span>
    </button>
  );
}

// Theme options for inline picker
type ThemeOption = { value: string; label: string; icon: LucideIcon };
const THEME_OPTIONS: ThemeOption[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'glass', label: 'Glass', icon: Layers },
  { value: 'matrix', label: 'Matrix', icon: Terminal },
  { value: 'aiox', label: 'AIOX', icon: Crosshair },
  { value: 'system', label: 'System', icon: Monitor },
];

function UserMenu() {
  const [showMenu, setShowMenu] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { setCurrentView, theme, setTheme } = useUIStore();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
        setShowThemePicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative ml-2" ref={menuRef}>
      <button
        onClick={() => { setShowMenu(!showMenu); setShowThemePicker(false); }}
        aria-label="RC — Menu do usuario"
        className="h-10 w-10 sm:h-9 sm:w-9 rounded-none bg-[var(--color-accent)] flex items-center justify-center text-[var(--aiox-surface,#050505)] text-sm font-medium hover:brightness-110 transition-all duration-200 touch-manipulation"
      >
        RC
      </button>

      {showMenu && (
        <div
          className="absolute top-full right-0 mt-2 w-[calc(100vw-2rem)] sm:w-64 max-w-64 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-none overflow-hidden z-[999]"
        >
          {/* User Info */}
          <div className="px-4 py-3 border-b border-[var(--color-border)]">
            <p className="text-primary font-medium">Rafael Costa</p>
            <p className="text-tertiary text-xs">rafael@example.com</p>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            <MenuItem icon={User} label="Meu Perfil" onClick={() => { setCurrentView('settings'); setShowMenu(false); }} />
            <MenuItem icon={Settings} label="Configuracoes" onClick={() => { setCurrentView('settings'); setShowMenu(false); }} />

            {/* Theme picker toggle */}
            <button
              onClick={() => setShowThemePicker(!showThemePicker)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-none text-sm transition-colors text-left text-primary hover:bg-[var(--color-bg-tertiary)]"
            >
              <Palette size={ICON_SIZES.md} />
              <span className="flex-1">Aparencia</span>
              <ChevronRight size={12} className={cn('transition-transform duration-200', showThemePicker && 'rotate-90')} />
            </button>

            {/* Inline theme grid */}
            {showThemePicker && (
              <div className="overflow-hidden">
                <div className="grid grid-cols-3 gap-1 px-2 py-2 mx-1 rounded-none bg-[var(--color-bg-secondary)]">
                  {THEME_OPTIONS.map((opt) => {
                    const ThemeIcon = opt.icon;
                    const isSelected = theme === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setTheme(opt.value as any)}
                        className={cn(
                          'flex flex-col items-center gap-1 px-2 py-2 rounded-none text-[10px] transition-all duration-200',
                          isSelected
                            ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] ring-1 ring-[var(--color-accent)]/30'
                            : 'text-tertiary hover:text-primary hover:bg-[var(--color-bg-tertiary)]'
                        )}
                      >
                        <ThemeIcon size={14} />
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <MenuItem icon={Globe} label="Linguagem" onClick={() => setShowMenu(false)} />
            <MenuItem icon={BarChart3} label="Uso e Limites" onClick={() => { setCurrentView('dashboard'); setShowMenu(false); }} />
            <div className="h-px bg-[var(--color-border)] my-2" />
            <MenuItem icon={Store} label="Marketplace" onClick={() => { setCurrentView('marketplace' as any); setShowMenu(false); }} />
            <MenuItem icon={BookOpen} label="Documentacao" />
            <MenuItem icon={MessageSquare} label="Suporte" />
            <div className="h-px bg-[var(--color-border)] my-2" />
            <MenuItem icon={LogOut} label="Sair" danger />
          </div>
        </div>
      )}
    </div>
  );
}

interface MenuItemProps {
  icon: LucideIcon;
  label: string;
  danger?: boolean;
  onClick?: () => void;
}

function MenuItem({ icon: Icon, label, danger, onClick }: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 rounded-none text-sm transition-colors text-left',
        danger
          ? 'text-[var(--color-error,#EF4444)] hover:bg-[var(--color-error,#EF4444)]/10'
          : 'text-primary hover:bg-[var(--color-bg-tertiary)]'
      )}
    >
      <Icon size={ICON_SIZES.md} />
      <span>{label}</span>
    </button>
  );
}
