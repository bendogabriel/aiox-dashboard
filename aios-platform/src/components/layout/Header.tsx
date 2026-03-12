import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { GlassButton } from '../ui';
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
    <header aria-label="Cabecalho principal" className="h-16 px-4 md:px-6 flex items-center justify-between glass border-b border-glass-border gap-4 relative z-50">
      {/* Mobile Menu Button */}
      <MobileMenuButton />

      {/* Search Button */}
      <button
        onClick={globalSearch.open}
        aria-label="Buscar agents, squads (⌘K)"
        className="flex-1 max-w-md h-10 px-3 md:px-4 flex items-center gap-2 md:gap-3 rounded-xl bg-white/5 hover:bg-white/10 border border-glass-border transition-colors text-left group"
      >
        <SearchIcon />
        <span className="text-tertiary text-sm flex-1 hidden sm:block">Buscar agents, squads...</span>
        <span className="text-tertiary text-sm flex-1 sm:hidden">Buscar...</span>
        <div className="hidden sm:flex items-center gap-1 text-[10px] text-tertiary opacity-60 group-hover:opacity-100 transition-opacity">
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono">⌘</kbd>
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono">K</kbd>
        </div>
      </button>

      {/* Right Actions — Simplified */}
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
    <motion.button
      onClick={handleClick}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-xl',
        'bg-gradient-to-r from-[#D1FF00]/20 to-[#a8cc00]/20',
        'border border-[#D1FF00]/30',
        'text-[#D1FF00] hover:text-[#e5ff4d]',
        'hover:from-[#D1FF00]/30 hover:to-[#a8cc00]/30',
        'transition-all duration-200',
        'shadow-lg shadow-[#D1FF00]/10'
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      aria-label="Falar com Bob"
    >
      <BobIcon />
      <span className="hidden sm:inline text-sm font-medium">Bob</span>
    </motion.button>
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
        className="h-10 w-10 sm:h-9 sm:w-9 rounded-full bg-gradient-to-br from-[#D1FF00] to-[#a8cc00] flex items-center justify-center text-[#0a0a0a] text-sm font-medium hover:scale-105 transition-transform touch-manipulation"
      >
        RC
      </button>

      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full right-0 mt-2 w-[calc(100vw-2rem)] sm:w-64 max-w-64 glass-lg rounded-xl overflow-hidden z-[999]"
          >
            {/* User Info */}
            <div className="px-4 py-3 border-b border-glass-border">
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
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left text-primary hover:bg-white/10"
              >
                <Palette size={ICON_SIZES.md} />
                <span className="flex-1">Aparencia</span>
                <ChevronRight size={12} className={cn('transition-transform', showThemePicker && 'rotate-90')} />
              </button>

              {/* Inline theme grid */}
              <AnimatePresence>
                {showThemePicker && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-3 gap-1 px-2 py-2 mx-1 rounded-lg bg-white/5">
                      {THEME_OPTIONS.map((opt) => {
                        const ThemeIcon = opt.icon;
                        const isSelected = theme === opt.value;
                        return (
                          <button
                            key={opt.value}
                            onClick={() => setTheme(opt.value as any)}
                            className={cn(
                              'flex flex-col items-center gap-1 px-2 py-2 rounded-md text-[10px] transition-all',
                              isSelected
                                ? 'bg-[#D1FF00]/20 text-[#D1FF00] ring-1 ring-[#D1FF00]/30'
                                : 'text-tertiary hover:text-primary hover:bg-white/10'
                            )}
                          >
                            <ThemeIcon size={14} />
                            <span>{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <MenuItem icon={Globe} label="Linguagem" onClick={() => setShowMenu(false)} />
              <MenuItem icon={BarChart3} label="Uso e Limites" onClick={() => { setCurrentView('dashboard'); setShowMenu(false); }} />
              <div className="h-px bg-glass-border my-2" />
              <MenuItem icon={Store} label="Marketplace" onClick={() => { setCurrentView('marketplace' as any); setShowMenu(false); }} />
              <MenuItem icon={BookOpen} label="Documentacao" />
              <MenuItem icon={MessageSquare} label="Suporte" />
              <div className="h-px bg-glass-border my-2" />
              <MenuItem icon={LogOut} label="Sair" danger />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
        'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left',
        danger
          ? 'text-red-500 hover:bg-red-500/10'
          : 'text-primary hover:bg-white/10'
      )}
    >
      <Icon size={ICON_SIZES.md} />
      <span>{label}</span>
    </button>
  );
}
