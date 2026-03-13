import { useState, useEffect, useRef } from 'react';
import type { DomainId } from './world-layout';
import { useDomains } from './DomainContext';
import { useMonitorStore, type MonitorEvent } from '../../stores/monitorStore';

interface WorldNotification {
  id: string;
  message: string;
  domain: DomainId;
  type: 'info' | 'success' | 'warning' | 'task';
  timestamp: number;
}

interface WorldNotificationsProps {
  /** Max notifications to show at once */
  maxVisible?: number;
}

import { Info, CheckCircle, AlertTriangle, ArrowRight, type LucideIcon } from 'lucide-react';

const TYPE_ICONS: Record<WorldNotification['type'], LucideIcon> = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  task: ArrowRight,
};

// Demo notifications that cycle for ambience
const DEMO_NOTIFICATIONS: Array<Omit<WorldNotification, 'id' | 'timestamp'>> = [
  { message: 'copywriting finished sales page draft', domain: 'content', type: 'success' },
  { message: 'media-buy optimizing campaign CPA', domain: 'sales', type: 'task' },
  { message: 'dev deployed v2.3.1 to staging', domain: 'dev', type: 'success' },
  { message: 'data-analytics report ready for review', domain: 'data', type: 'info' },
  { message: 'design-system updated component library', domain: 'design', type: 'success' },
  { message: 'devops running health check on VPS', domain: 'ops', type: 'task' },
  { message: 'youtube-content publishing new video', domain: 'content', type: 'task' },
  { message: 'funnel-creator A/B test results in', domain: 'sales', type: 'info' },
  { message: 'architect reviewing PR #142', domain: 'dev', type: 'task' },
  { message: 'creative-studio generating thumbnails', domain: 'design', type: 'task' },
];

// Map agent name to a plausible domain
function agentToDomain(agent: string): DomainId {
  const a = agent.toLowerCase();
  if (a.includes('dev') || a.includes('dex') || a.includes('architect') || a.includes('aria')) return 'dev';
  if (a.includes('design') || a.includes('brad') || a.includes('dan')) return 'design';
  if (a.includes('data') || a.includes('dara') || a.includes('analyst')) return 'data';
  if (a.includes('ops') || a.includes('gage') || a.includes('devops')) return 'ops';
  if (a.includes('sale') || a.includes('funnel') || a.includes('media')) return 'sales';
  return 'content';
}

// Map monitor event to notification type
function eventToType(event: MonitorEvent): WorldNotification['type'] {
  if (event.type === 'error') return 'warning';
  if (event.success === true) return 'success';
  if (event.type === 'tool_call') return 'task';
  return 'info';
}

export function WorldNotifications({ maxVisible = 4 }: WorldNotificationsProps) {
  const domains = useDomains();
  const [notifications, setNotifications] = useState<WorldNotification[]>([]);
  const [, setDemoIdx] = useState(0);
  const counterRef = useRef(0);
  const monitorConnected = useMonitorStore((s) => s.connected);
  const monitorEvents = useMonitorStore((s) => s.events);
  const lastEventCountRef = useRef(0);

  // When connected to monitor, use real events
  useEffect(() => {
    if (!monitorConnected) return;

    if (monitorEvents.length > lastEventCountRef.current) {
      const newEvents = monitorEvents.slice(lastEventCountRef.current);
      lastEventCountRef.current = monitorEvents.length;

      // Only show significant events (not every tool call)
      const significant = newEvents.filter(
        (e) => e.type === 'error' || e.success !== undefined || e.type === 'message'
      );

      if (significant.length > 0) {
        const latest = significant[significant.length - 1];
        counterRef.current += 1;
        const desc = latest.description.length > 50
          ? latest.description.slice(0, 47) + '...'
          : latest.description;

        const notif: WorldNotification = {
          id: `live-${counterRef.current}-${Date.now()}`,
          message: `${latest.agent}: ${desc}`,
          domain: agentToDomain(latest.agent),
          type: eventToType(latest),
          timestamp: Date.now(),
        };

        setNotifications((prev) => [notif, ...prev].slice(0, maxVisible + 2));
      }
    } else if (monitorEvents.length < lastEventCountRef.current) {
      lastEventCountRef.current = monitorEvents.length;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- trigger on .length only; full array ref would over-fire
  }, [monitorEvents.length, monitorConnected, maxVisible]);

  // Auto-generate demo notifications for ambience (only when not connected)
  useEffect(() => {
    if (monitorConnected) return;

    const interval = setInterval(() => {
      setDemoIdx((prev) => {
        const idx = prev % DEMO_NOTIFICATIONS.length;
        const demo = DEMO_NOTIFICATIONS[idx];
        counterRef.current += 1;
        const notif: WorldNotification = {
          ...demo,
          id: `notif-${counterRef.current}-${Date.now()}`,
          timestamp: Date.now(),
        };

        setNotifications((prev) => {
          const next = [notif, ...prev];
          return next.slice(0, maxVisible + 2);
        });

        return prev + 1;
      });
    }, 8000 + Math.random() * 7000);

    return () => clearInterval(interval);
  }, [maxVisible, monitorConnected]);

  // Auto-dismiss after 6 seconds
  useEffect(() => {
    if (notifications.length === 0) return;

    const timer = setTimeout(() => {
      setNotifications((prev) => prev.slice(0, -1));
    }, 6000);

    return () => clearTimeout(timer);
  }, [notifications]);

  return (
    <div
      className="absolute top-4 right-4 flex flex-col gap-1.5 z-30 pointer-events-none"
      style={{ maxWidth: 280 }}
    >
      {/* Live indicator when connected */}
      {monitorConnected && notifications.length > 0 && (
        <div
          className="flex items-center gap-1 self-end mr-1 pointer-events-none"
        >
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: '#10B981' }}
          />
          <span className="text-[7px] font-bold" style={{ color: '#10B981' }}>LIVE FEED</span>
        </div>
      )}
      {notifications.slice(0, maxVisible).map((notif) => {
          const d = domains[notif.domain];
          return (
            <div
              key={notif.id}
              className="pointer-events-auto rounded-lg px-2.5 py-1.5 flex items-start gap-2"
              style={{
                background: 'rgba(0,0,0,0.75)',
                backdropFilter: 'blur(8px)',
                border: `1px solid ${d.tileColor}33`,
              }}
            >
              {/* Type icon */}
              <span
                className="flex-shrink-0 flex items-center justify-center rounded-full mt-0.5"
                style={{
                  width: 14,
                  height: 14,
                  background: `${d.tileColor}33`,
                  color: d.tileColor,
                }}
              >
                {(() => { const Icon = TYPE_ICONS[notif.type]; return <Icon size={8} />; })()}
              </span>

              {/* Message */}
              <div className="flex-1 min-w-0">
                <span
                  className="text-[9px] leading-tight block"
                  style={{ color: 'var(--color-text-primary)', fontFamily: 'monospace' }}
                >
                  {notif.message}
                </span>
                <span className="text-[7px]" style={{ color: d.tileColor, fontFamily: 'monospace' }}>
                  {d.label}
                </span>
              </div>
            </div>
          );
        })}
</div>
  );
}
