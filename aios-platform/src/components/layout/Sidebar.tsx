import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  BarChart3,
  Globe,
  LayoutDashboard,
  Bot,
  Cpu,
  Terminal,
  Activity,
  TrendingUp,
  Brain,
  Map,
  Network,
  Github,
  Settings,
  ChevronLeft,
  Menu,
  X,
} from 'lucide-react';
import { GlassCard, GlassButton } from '../ui';
import { useUIStore } from '../../stores/uiStore';
import { cn } from '../../lib/utils';

// Logo components
const Logo = () => (
  <div className="flex items-center gap-3">
    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
      <span className="text-white font-bold text-lg">A</span>
    </div>
    <div className="flex flex-col">
      <span className="text-primary font-semibold text-lg leading-tight">AIOS</span>
      <span className="text-secondary text-xs">Core Platform</span>
    </div>
  </div>
);

const LogoSmall = () => (
  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg mx-auto">
    <span className="text-white font-bold text-lg">A</span>
  </div>
);

// Navigation items — existing views + 11 PRD views
const navItems = [
  // Core views (pre-existing)
  { id: 'chat' as const, icon: MessageSquare, label: 'Chat', shortcut: 'H', separator: false },
  { id: 'dashboard' as const, icon: BarChart3, label: 'Dashboard', shortcut: 'D', separator: false },
  { id: 'world' as const, icon: Globe, label: 'World', shortcut: 'W', separator: true },
  // PRD views
  { id: 'kanban' as const, icon: LayoutDashboard, label: 'Kanban', shortcut: 'K', separator: false },
  { id: 'agents' as const, icon: Bot, label: 'Agents', shortcut: 'A', separator: false },
  { id: 'bob' as const, icon: Cpu, label: 'Bob', shortcut: 'B', separator: false },
  { id: 'terminals' as const, icon: Terminal, label: 'Terminals', shortcut: 'T', separator: false },
  { id: 'monitor' as const, icon: Activity, label: 'Monitor', shortcut: 'M', separator: false },
  { id: 'insights' as const, icon: TrendingUp, label: 'Insights', shortcut: 'I', separator: false },
  { id: 'context' as const, icon: Brain, label: 'Context', shortcut: 'C', separator: false },
  { id: 'roadmap' as const, icon: Map, label: 'Roadmap', shortcut: 'R', separator: false },
  { id: 'squads' as const, icon: Network, label: 'Squads', shortcut: 'Q', separator: false },
  { id: 'github' as const, icon: Github, label: 'GitHub', shortcut: 'G', separator: false },
  { id: 'settings' as const, icon: Settings, label: 'Settings', shortcut: 'S', separator: false },
] as const;

// Navigation component — vertical list
function ViewNavigation({ collapsed = false }: { collapsed?: boolean }) {
  const { currentView, setCurrentView } = useUIStore();

  return (
    <nav className="flex-1 p-2 overflow-y-auto glass-scrollbar">
      <div className="space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <div key={item.id}>
            {item.separator && (
              <div className={cn('my-2', collapsed ? 'mx-2' : 'mx-3', 'border-t border-white/10')} />
            )}
            <button
              onClick={() => setCurrentView(item.id)}
              title={collapsed ? `${item.label} (${item.shortcut})` : undefined}
              className={cn(
                'w-full flex items-center gap-3 rounded-xl transition-all text-left group',
                collapsed ? 'justify-center p-2.5' : 'px-3 py-2',
                isActive
                  ? 'glass-card border border-blue-500/30 bg-blue-500/10 text-primary'
                  : 'text-secondary hover:text-primary hover:bg-white/5'
              )}
            >
              <Icon
                size={18}
                className={cn(
                  'flex-shrink-0 transition-colors',
                  isActive ? 'text-blue-500' : 'text-tertiary group-hover:text-secondary'
                )}
              />
              {!collapsed && (
                <>
                  <span className="flex-1 text-sm font-medium truncate">{item.label}</span>
                  <kbd className={cn(
                    'hidden lg:inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded text-[10px] font-mono',
                    isActive
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-white/5 text-tertiary'
                  )}>
                    {item.shortcut}
                  </kbd>
                </>
              )}
            </button>
            </div>
          );
        })}
      </div>
    </nav>
  );
}

// Desktop Sidebar
function DesktopSidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <aside
      className={cn(
        'hidden md:flex h-screen glass-panel border-r border-glass-border flex-col transition-all duration-300 ease-out',
        sidebarCollapsed ? 'w-[72px]' : 'w-[220px]'
      )}
    >
      {/* Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-glass-border">
        <AnimatePresence mode="wait">
          {sidebarCollapsed ? (
            <motion.div
              key="small"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <LogoSmall />
            </motion.div>
          ) : (
            <motion.div
              key="full"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              <Logo />
            </motion.div>
          )}
        </AnimatePresence>

        {!sidebarCollapsed && (
          <GlassButton
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft size={18} />
          </GlassButton>
        )}
      </div>

      {/* Navigation */}
      {sidebarCollapsed ? (
        <div className="flex flex-col items-center pt-2">
          <GlassButton
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-10 w-10 mb-2"
            aria-label="Expand sidebar"
          >
            <Menu size={18} />
          </GlassButton>
          <ViewNavigation collapsed />
        </div>
      ) : (
        <ViewNavigation />
      )}

      {/* Footer */}
      {!sidebarCollapsed && (
        <div className="p-3 border-t border-glass-border">
          <GlassCard variant="subtle" padding="sm" className="text-center">
            <span className="text-xs text-secondary">
              v2.0.0 · AIOS Core
            </span>
          </GlassCard>
        </div>
      )}
    </aside>
  );
}

// Mobile Sidebar (Drawer)
function MobileSidebar() {
  const { mobileMenuOpen, setMobileMenuOpen } = useUIStore();

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [mobileMenuOpen, setMobileMenuOpen]);

  // Prevent body scroll when open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <AnimatePresence>
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="md:hidden fixed inset-y-0 left-0 w-[85%] max-w-[280px] glass-panel border-r border-glass-border flex flex-col z-50"
          >
            {/* Header */}
            <div className="h-16 px-4 flex items-center justify-between border-b border-glass-border">
              <Logo />
              <GlassButton
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
                className="h-9 w-9"
                aria-label="Close menu"
              >
                <X size={18} />
              </GlassButton>
            </div>

            {/* Navigation */}
            <ViewNavigation />

            {/* Footer */}
            <div className="p-3 border-t border-glass-border">
              <GlassCard variant="subtle" padding="sm" className="text-center">
                <span className="text-xs text-secondary">
                  v2.0.0 · AIOS Core
                </span>
              </GlassCard>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

// Combined Sidebar component
export function Sidebar() {
  return (
    <>
      <DesktopSidebar />
      <MobileSidebar />
    </>
  );
}

// Export mobile menu button for Header
export function MobileMenuButton() {
  const { setMobileMenuOpen } = useUIStore();

  return (
    <GlassButton
      variant="ghost"
      size="icon"
      onClick={() => setMobileMenuOpen(true)}
      className="md:hidden h-10 w-10"
      aria-label="Open menu"
    >
      <Menu size={18} />
    </GlassButton>
  );
}
