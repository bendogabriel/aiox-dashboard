import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

// Icons
const SunIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="5" />
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
);

const MoonIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
  </svg>
);

const SystemIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export type Theme = 'light' | 'dark' | 'system';

export interface ThemeToggleProps {
  theme?: Theme;
  onThemeChange?: (theme: Theme) => void;
  showDropdown?: boolean;
  size?: 'sm' | 'md';
}

export function ThemeToggle({
  theme: controlledTheme,
  onThemeChange,
  showDropdown = false,
  size = 'md'
}: ThemeToggleProps) {
  const [internalTheme, setInternalTheme] = useState<Theme>('system');
  const theme = controlledTheme ?? internalTheme;
  const setTheme = onThemeChange ?? setInternalTheme;

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const effectiveTheme = theme === 'system' ? getSystemTheme() : theme;
  const isDark = effectiveTheme === 'dark';

  const handleToggle = () => {
    if (showDropdown) {
      setIsOpen(!isOpen);
    } else {
      setTheme(isDark ? 'light' : 'dark');
    }
  };

  const buttonSize = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  const iconSize = size === 'sm' ? 14 : 16;

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        onClick={handleToggle}
        className={cn(
          buttonSize,
          'relative rounded-xl flex items-center justify-center',
          'glass glass-border hover:glass-shadow-hover',
          'transition-colors overflow-hidden'
        )}
        whileTap={{ scale: 0.95 }}
        aria-label={`Theme: ${theme === 'system' ? 'System' : isDark ? 'Dark' : 'Light'}`}
      >
        <div className="relative w-full h-full flex items-center justify-center">
          <AnimatePresence mode="wait">
            {theme === 'system' ? (
              <motion.div
                key="system"
                initial={{ scale: 0, rotate: -180, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                exit={{ scale: 0, rotate: 180, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="text-blue-500"
              >
                <SystemIcon size={iconSize} />
              </motion.div>
            ) : isDark ? (
              <motion.div
                key="moon"
                initial={{ scale: 0, rotate: 90, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                exit={{ scale: 0, rotate: -90, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="text-blue-400"
              >
                <MoonIcon size={iconSize} />
              </motion.div>
            ) : (
              <motion.div
                key="sun"
                initial={{ scale: 0, rotate: -90, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                exit={{ scale: 0, rotate: 90, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="text-amber-500"
              >
                <SunIcon size={iconSize} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.button>

      <AnimatePresence>
        {showDropdown && isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 w-40 glass-strong glass-border glass-shadow rounded-xl overflow-hidden z-50 p-1"
          >
            <ThemeOption
              icon={<SunIcon />}
              label="Light"
              isSelected={theme === 'light'}
              onClick={() => { setTheme('light'); setIsOpen(false); }}
            />
            <ThemeOption
              icon={<MoonIcon />}
              label="Dark"
              isSelected={theme === 'dark'}
              onClick={() => { setTheme('dark'); setIsOpen(false); }}
            />
            <ThemeOption
              icon={<SystemIcon />}
              label="System"
              isSelected={theme === 'system'}
              onClick={() => { setTheme('system'); setIsOpen(false); }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ThemeOptionProps {
  icon: React.ReactNode;
  label: string;
  isSelected: boolean;
  onClick: () => void;
}

function ThemeOption({ icon, label, isSelected, onClick }: ThemeOptionProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
        isSelected
          ? 'bg-blue-500/15 text-blue-500'
          : 'hover:bg-white/10'
      )}
    >
      <span className={cn('transition-colors', isSelected ? 'text-blue-500' : 'text-muted-foreground')}>
        {icon}
      </span>
      <span className="flex-1 text-left font-medium">{label}</span>
      {isSelected && (
        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-blue-500">
          <CheckIcon />
        </motion.span>
      )}
    </button>
  );
}

export { SunIcon, MoonIcon, SystemIcon };
