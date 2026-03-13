import { useState, useEffect } from 'react';
import {
  MessageSquare,
  BarChart3,
  Globe,
  Bot,
  Cpu,
  Terminal,
  Activity,
  Brain,
  Map,
  Network,
  Github,
  Server,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  BookOpen,
  Database,
  Lock,
  Lightbulb,
  Eye,
  Plug,
  Moon,
  Store,
  ListTodo,
  Gauge,
  ListChecks,
  Zap,
  ZapOff,
  RefreshCw,
  type LucideIcon,
} from 'lucide-react';
import { CockpitCard, CockpitButton, AioxLogo } from '../ui';
import { useUIStore } from '../../stores/uiStore';
import { useOrchestrationStore } from '../../stores/orchestrationStore';
import { useEngineStore } from '../../stores/engineStore';
import { cn } from '../../lib/utils';
import { getTier, getTierLabel, hasFeature, isMaster } from '../../lib/tier';

// Logo components
const Logo = () => (
  <AioxLogo variant="full" size={36} className="text-primary" />
);

const LogoSmall = () => (
  <AioxLogo variant="icon" size={36} className="text-primary mx-auto" />
);

// ── Grouped Navigation Structure ──
interface NavChild {
  id: string;
  label: string;
  icon: LucideIcon;
  shortcut?: string;
}

interface NavGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  shortcut: string;
  children: NavChild[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'chat',
    label: 'Chat',
    icon: MessageSquare,
    shortcut: 'H',
    children: [], // standalone, no children
  },
  {
    id: 'cockpit',
    label: 'Cockpit',
    icon: Gauge,
    shortcut: 'D',
    children: [
      { id: 'dashboard', label: 'Overview', icon: BarChart3 },
      { id: 'agents', label: 'Agents', icon: Bot, shortcut: 'A' },
      { id: 'bob', label: 'Bob', icon: Cpu, shortcut: 'B' },
      { id: 'terminals', label: 'Terminals', icon: Terminal, shortcut: 'T' },
      { id: 'monitor', label: 'Monitor', icon: Activity, shortcut: 'M' },
      { id: 'squads', label: 'Squads', icon: Network, shortcut: 'Q' },
      { id: 'world', label: 'World', icon: Globe, shortcut: 'W' },
      { id: 'engine', label: 'Engine', icon: Server, shortcut: 'E' },
    ],
  },
  {
    id: 'tasks',
    label: 'Tasks',
    icon: ListChecks,
    shortcut: 'Y',
    children: [
      { id: 'stories', label: 'Stories', icon: BookOpen, shortcut: 'Y' },
      { id: 'roadmap', label: 'Roadmap', icon: Map, shortcut: 'R' },
      { id: 'context', label: 'Context', icon: Brain, shortcut: 'C' },
      { id: 'knowledge', label: 'Knowledge', icon: Database, shortcut: 'N' },
      { id: 'brainstorm', label: 'Brainstorm', icon: Lightbulb, shortcut: 'F' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    shortcut: 'S',
    children: [
      { id: 'settings', label: 'General', icon: Settings, shortcut: 'S' },
      { id: 'integrations', label: 'Integrations', icon: Plug, shortcut: 'I' },
      { id: 'vault', label: 'Vault', icon: Lock, shortcut: 'V' },
      { id: 'github', label: 'GitHub', icon: Github, shortcut: 'G' },
    ],
  },
];

// Map view IDs to their parent group
const VIEW_TO_GROUP: Record<string, string> = {};
NAV_GROUPS.forEach((group) => {
  if (group.children.length === 0) {
    VIEW_TO_GROUP[group.id] = group.id;
  } else {
    group.children.forEach((child) => {
      VIEW_TO_GROUP[child.id] = group.id;
    });
  }
});

// Extra items at the bottom (plugins / marketplace)
const EXTRA_ITEMS: { id: string; label: string; icon: LucideIcon; shortcut: string }[] = [
  { id: 'sales-room', label: 'Sales Room', icon: Eye, shortcut: 'L' },
  { id: 'overnight', label: 'Overnight', icon: Moon, shortcut: 'O' },
  { id: 'marketplace', label: 'Marketplace', icon: Store, shortcut: 'K' },
];

// ── GroupItem Component ──
function GroupItem({
  group,
  currentView,
  collapsed,
  expanded,
  onToggle,
  onNavigate,
}: {
  group: NavGroup;
  currentView: string;
  collapsed: boolean;
  expanded: boolean;
  onToggle: () => void;
  onNavigate: (viewId: string) => void;
}) {
  const [showFlyout, setShowFlyout] = useState(false);
  const isStandalone = group.children.length === 0;
  const activeGroupId = VIEW_TO_GROUP[currentView];
  const isGroupActive = activeGroupId === group.id;
  const { badgeCount, isRunning } = useOrchestrationStore();

  const handleClick = () => {
    if (isStandalone) {
      onNavigate(group.id);
    } else {
      // Navigate to first child and expand
      onNavigate(group.children[0].id);
      if (!expanded) onToggle();
    }
  };

  const Icon = group.icon;
  const showBobPulse = group.id === 'cockpit' && isRunning;

  return (
    <li
      className="relative"
      onMouseEnter={() => { if (collapsed && !isStandalone) setShowFlyout(true); }}
      onMouseLeave={() => { if (collapsed && !isStandalone) setShowFlyout(false); }}
    >
      {/* Group header */}
      <div
        className={cn(
          'w-full flex items-center gap-3 rounded-none transition-all text-left group relative',
          collapsed ? 'justify-center p-2.5' : 'px-3 py-2',
          isGroupActive
            ? 'glass-card border text-primary'
            : 'text-secondary hover:text-primary hover:bg-white/5'
        )}
        style={isGroupActive ? {
          backgroundColor: 'var(--sidebar-active-bg)',
          borderColor: 'var(--sidebar-active-border)',
        } : undefined}
      >
        <button
          onClick={handleClick}
          title={collapsed ? `${group.label} (${group.shortcut})` : undefined}
          className="flex items-center gap-3 flex-1 min-w-0"
        >
          <span className="relative flex-shrink-0">
            <Icon
              size={18}
              className={cn('transition-colors', !isGroupActive && 'text-tertiary group-hover:text-secondary')}
              style={isGroupActive ? { color: 'var(--sidebar-active-text)' } : undefined}
            />
            {showBobPulse && (
              <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-[var(--aiox-blue)] animate-pulse" />
            )}
          </span>

          {!collapsed && (
            <span className="flex-1 text-sm font-medium truncate text-left">{group.label}</span>
          )}
        </button>

        {!collapsed && !isStandalone && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            className="p-0.5 rounded hover:bg-white/10 transition-colors flex-shrink-0"
            aria-label={expanded ? `Colapsar ${group.label}` : `Expandir ${group.label}`}
          >
            <ChevronRight
              size={12}
              className={cn('transition-transform duration-200', expanded && 'rotate-90')}
            />
          </button>
        )}

        {!collapsed && isStandalone && (
          <kbd
            className={cn(
              'hidden lg:inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded text-[10px] font-mono flex-shrink-0',
              !isGroupActive && 'bg-white/5 text-tertiary'
            )}
            style={isGroupActive ? {
              backgroundColor: 'var(--sidebar-active-kbd-bg)',
              color: 'var(--sidebar-active-kbd-text)',
            } : undefined}
          >
            {group.shortcut}
          </kbd>
        )}
      </div>

      {/* Children (expanded, desktop) */}
      {!collapsed && !isStandalone && expanded && (
        <ul className="ml-4 mt-0.5 space-y-0.5 border-l border-white/10 pl-3">
          {group.children.map((child) => {
            const ChildIcon = child.icon;
            const isActive = currentView === child.id;
            const showChildBadge = child.id === 'bob' && badgeCount > 0 && !isActive;
            const showChildPulse = child.id === 'bob' && isRunning && !isActive;

            return (
              <li key={child.id}>
                <button
                  onClick={() => onNavigate(child.id)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs rounded-lg transition-all',
                    isActive
                      ? 'bg-white/10 text-primary'
                      : 'text-tertiary hover:text-secondary hover:bg-white/5'
                  )}
                >
                  <ChildIcon size={14} className="flex-shrink-0" />
                  <span className="flex-1 truncate">{child.label}</span>
                  {showChildPulse && <span className="h-2 w-2 rounded-full bg-[var(--aiox-blue)] animate-pulse" />}
                  {showChildBadge && !showChildPulse && (
                    <span className="min-w-[16px] h-4 px-1 rounded-full bg-primary text-[9px] font-bold text-black flex items-center justify-center">
                      {badgeCount > 9 ? '9+' : badgeCount}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Collapsed flyout */}
      {collapsed && !isStandalone && showFlyout && (
        <div
          className="absolute left-full top-0 ml-1 z-50 min-w-[160px] py-1 rounded-none shadow-lg border border-glass-border glass-lg"
          onMouseEnter={() => setShowFlyout(true)}
          onMouseLeave={() => setShowFlyout(false)}
        >
          <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-tertiary">
            {group.label}
          </div>
          {group.children.map((child) => {
            const ChildIcon = child.icon;
            const isActive = currentView === child.id;
            return (
              <button
                key={child.id}
                onClick={() => { onNavigate(child.id); setShowFlyout(false); }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-1.5 text-xs transition-colors',
                  isActive ? 'bg-white/10 text-primary' : 'text-secondary hover:text-primary hover:bg-white/5'
                )}
              >
                <ChildIcon size={14} />
                <span>{child.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </li>
  );
}

// ── ViewNavigation (Grouped) ──
function ViewNavigation({ collapsed = false }: { collapsed?: boolean }) {
  const { currentView, setCurrentView } = useUIStore();
  const { clearPending, badgeCount } = useOrchestrationStore();
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [, setTierTick] = useState(0);

  // Re-render when tier changes
  useEffect(() => {
    const handler = () => setTierTick(t => t + 1);
    window.addEventListener('tier-changed', handler);
    return () => window.removeEventListener('tier-changed', handler);
  }, []);

  // Auto-expand the group containing the active view
  const activeGroupId = VIEW_TO_GROUP[currentView];
  useEffect(() => {
    if (activeGroupId && activeGroupId !== 'chat') {
      setExpandedGroup(activeGroupId);
    }
  }, [activeGroupId]);

  const handleNavigate = (viewId: string) => {
    setCurrentView(viewId as Parameters<typeof setCurrentView>[0]);
    if (viewId === 'bob' && badgeCount > 0) {
      clearPending();
    }
  };

  const handleToggle = (groupId: string) => {
    setExpandedGroup((prev) => (prev === groupId ? null : groupId));
  };

  return (
    <nav id="navigation" className="flex-1 p-2 overflow-y-auto glass-scrollbar" aria-label="Navegacao principal">
      <ul className="space-y-1">
        {/* Main groups */}
        {NAV_GROUPS.map((group) => {
          // Filter children by feature access
          const filteredGroup = {
            ...group,
            children: group.children.filter(child => hasFeature(child.id)),
          };
          // Hide standalone items not available in current tier
          if (filteredGroup.children.length === 0 && group.children.length > 0) {
            // All children filtered — check if at least the group header should show
            if (!hasFeature(group.id)) return null;
          }
          return (
            <GroupItem
              key={group.id}
              group={filteredGroup}
              currentView={currentView}
              collapsed={collapsed}
              expanded={expandedGroup === group.id}
              onToggle={() => handleToggle(group.id)}
              onNavigate={handleNavigate}
            />
          );
        })}

        {/* Separator */}
        <li>
          <div className={cn('my-2', collapsed ? 'mx-2' : 'mx-3', 'border-t border-white/10')} />
        </li>

        {/* Extra items (plugins) — filtered by tier */}
        {EXTRA_ITEMS.filter(item => hasFeature(item.id)).map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <li key={item.id}>
              <button
                onClick={() => handleNavigate(item.id)}
                title={collapsed ? `${item.label} (${item.shortcut})` : undefined}
                className={cn(
                  'w-full flex items-center gap-3 rounded-none transition-all text-left group relative',
                  collapsed ? 'justify-center p-2.5' : 'px-3 py-2',
                  isActive
                    ? 'glass-card border text-primary'
                    : 'text-secondary hover:text-primary hover:bg-white/5'
                )}
                style={isActive ? {
                  backgroundColor: 'var(--sidebar-active-bg)',
                  borderColor: 'var(--sidebar-active-border)',
                } : undefined}
              >
                <Icon
                  size={18}
                  className={cn('transition-colors flex-shrink-0', !isActive && 'text-tertiary group-hover:text-secondary')}
                  style={isActive ? { color: 'var(--sidebar-active-text)' } : undefined}
                />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-sm font-medium truncate">{item.label}</span>
                    <kbd
                      className={cn(
                        'hidden lg:inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded text-[10px] font-mono',
                        !isActive && 'bg-white/5 text-tertiary'
                      )}
                      style={isActive ? {
                        backgroundColor: 'var(--sidebar-active-kbd-bg)',
                        color: 'var(--sidebar-active-kbd-text)',
                      } : undefined}
                    >
                      {item.shortcut}
                    </kbd>
                  </>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// ── Engine Status Footer ──
function EngineStatusFooter({ collapsed }: { collapsed: boolean }) {
  const { status, health } = useEngineStore();
  const { setCurrentView } = useUIStore();

  const isOnline = status === 'online';
  const isDiscovering = status === 'discovering';

  const handleClick = () => {
    setCurrentView('engine' as Parameters<typeof setCurrentView>[0]);
  };

  if (collapsed) {
    return (
      <div className="border-t border-glass-border flex justify-center py-3">
        <button
          onClick={handleClick}
          title={isOnline ? `Engine v${health?.version ?? '?'} — ${health?.ws_clients ?? 0} WS` : 'Engine offline'}
          className="relative"
        >
          {isOnline ? (
            <Zap size={14} className="text-[var(--aiox-lime)]" />
          ) : isDiscovering ? (
            <RefreshCw size={14} className="text-tertiary animate-spin" />
          ) : (
            <ZapOff size={14} className="text-[var(--bb-error)]" />
          )}
          <span
            className={cn(
              'absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full',
              isOnline ? 'bg-[var(--aiox-lime)]' : isDiscovering ? 'bg-[var(--bb-warning)] animate-pulse' : 'bg-[var(--bb-error)]'
            )}
          />
        </button>
      </div>
    );
  }

  return (
    <div className="border-t border-glass-border px-4 py-2.5">
      <button
        onClick={handleClick}
        className="w-full flex items-center gap-2 group"
        title="Abrir Engine"
      >
        <span className="relative flex-shrink-0">
          {isOnline ? (
            <Zap size={14} className="text-[var(--aiox-lime)]" />
          ) : isDiscovering ? (
            <RefreshCw size={14} className="text-tertiary animate-spin" />
          ) : (
            <ZapOff size={14} className="text-[var(--bb-error)]" />
          )}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full flex-shrink-0',
                isOnline ? 'bg-[var(--aiox-lime)]' : isDiscovering ? 'bg-[var(--bb-warning)] animate-pulse' : 'bg-[var(--bb-error)]'
              )}
            />
            <span className={cn(
              'text-[11px] font-medium truncate',
              isOnline ? 'text-primary' : 'text-tertiary'
            )}>
              {isOnline ? 'Engine Online' : isDiscovering ? 'Discovering...' : 'Engine Offline'}
            </span>
          </div>
          {isOnline && health && (
            <span className="text-[9px] text-tertiary font-mono">
              v{health.version} · {health.ws_clients} ws
            </span>
          )}
        </div>

        {isOnline && (
          <span className="text-[9px] text-tertiary opacity-0 group-hover:opacity-100 transition-opacity">
            &gt;
          </span>
        )}
      </button>
    </div>
  );
}

// ── Desktop Sidebar ──
function DesktopSidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const [tierLabel, setTierLabel] = useState(getTierLabel());

  useEffect(() => {
    const handler = () => setTierLabel(getTierLabel());
    window.addEventListener('tier-changed', handler);
    return () => window.removeEventListener('tier-changed', handler);
  }, []);

  return (
    <aside
      aria-label="Barra lateral principal"
      className={cn(
        'hidden md:flex h-screen glass-panel border-r border-glass-border flex-col transition-all duration-300 ease-out',
        sidebarCollapsed ? 'w-[72px]' : 'w-[220px]'
      )}
    >
      {/* Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-glass-border">
        {sidebarCollapsed ? (
            <div
              key="small"
            >
              <LogoSmall />
            </div>
          ) : (
            <div
              key="full"
              className="flex flex-col"
            >
              <Logo />
              <span className="text-[9px] font-semibold tracking-[0.1em] uppercase text-tertiary mt-0.5">{tierLabel}</span>
            </div>
          )}
{!sidebarCollapsed && (
          <CockpitButton
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8"
            aria-label="Colapsar sidebar"
          >
            <ChevronLeft size={18} />
          </CockpitButton>
        )}
      </div>

      {/* Navigation */}
      {sidebarCollapsed ? (
        <div className="flex flex-col items-center pt-2">
          <CockpitButton
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-10 w-10 mb-2"
            aria-label="Expandir sidebar"
          >
            <Menu size={18} />
          </CockpitButton>
          <ViewNavigation collapsed />
        </div>
      ) : (
        <ViewNavigation />
      )}

      {/* Engine status footer */}
      <EngineStatusFooter collapsed={sidebarCollapsed} />

      {/* Spacer for StatusBar (fixed bottom h-7 = 28px) */}
      <div className="h-7 flex-shrink-0" />
    </aside>
  );
}

// ── Mobile Sidebar (Drawer) ──
function MobileSidebar() {
  const { mobileMenuOpen, setMobileMenuOpen } = useUIStore();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [mobileMenuOpen, setMobileMenuOpen]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  return (
    <>
    {mobileMenuOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside
            aria-label="Menu lateral mobile"
            className="md:hidden fixed inset-y-0 left-0 w-[85%] max-w-[280px] glass-panel border-r border-glass-border flex flex-col z-50"
          >
            <div className="h-16 px-4 flex items-center justify-between border-b border-glass-border">
              <Logo />
              <CockpitButton
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
                className="h-9 w-9"
                aria-label="Fechar menu"
              >
                <X size={18} />
              </CockpitButton>
            </div>
            <ViewNavigation />
          </aside>
        </>
      )}
    </>
);
}

// ── Combined Sidebar ──
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
    <CockpitButton
      variant="ghost"
      size="icon"
      onClick={() => setMobileMenuOpen(true)}
      className="md:hidden h-10 w-10"
      aria-label="Abrir menu"
    >
      <Menu size={18} />
    </CockpitButton>
  );
}
