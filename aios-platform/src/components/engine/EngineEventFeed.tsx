import { useRef, useEffect } from 'react';
import {
  Wrench,
  MessageSquare,
  AlertOctagon,
  Settings,
  Trash2,
} from 'lucide-react';
import { CockpitCard, CockpitButton, Badge } from '../ui';
import { cn } from '../../lib/utils';
import { useMonitorStore, type MonitorEvent } from '../../stores/monitorStore';

const typeConfig: Record<MonitorEvent['type'], { icon: typeof Settings; color: string; label: string }> = {
  system: { icon: Settings, color: 'text-[var(--aiox-blue)]', label: 'System' },
  message: { icon: MessageSquare, color: 'text-[var(--color-status-success)]', label: 'Message' },
  error: { icon: AlertOctagon, color: 'text-[var(--bb-error)]', label: 'Error' },
  tool_call: { icon: Wrench, color: 'text-[var(--bb-warning)]', label: 'Tool' },
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '--:--:--';
  return d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default function EngineEventFeed() {
  const events = useMonitorStore((s) => s.events);
  const connected = useMonitorStore((s) => s.connected);
  const clearEvents = useMonitorStore((s) => s.clearEvents);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new events
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events.length]);

  // Show events newest-last (chronological)
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'h-2 w-2 rounded-full',
              connected ? 'bg-[var(--color-status-success)] animate-pulse' : 'bg-[var(--bb-error)]',
            )}
          />
          <span className="text-xs text-tertiary">
            {connected ? 'WebSocket conectado' : 'Desconectado'}
          </span>
          <Badge variant="default" className="text-[10px]">
            {events.length} eventos
          </Badge>
        </div>
        {events.length > 0 && (
          <CockpitButton
            size="sm"
            variant="ghost"
            leftIcon={<Trash2 className="h-3 w-3" />}
            onClick={clearEvents}
          >
            Limpar
          </CockpitButton>
        )}
      </div>

      {/* Event list */}
      {sortedEvents.length === 0 ? (
        <CockpitCard padding="md" variant="subtle">
          <div className="text-center space-y-2">
            {connected ? (
              <>
                <div className="h-8 w-8 mx-auto rounded-full bg-[var(--color-status-success)]/10 flex items-center justify-center">
                  <div className="h-3 w-3 rounded-full bg-[var(--color-status-success)] animate-pulse" />
                </div>
                <p className="text-secondary text-sm">Conectado — aguardando eventos</p>
                <p className="text-tertiary text-xs">
                  Eventos aparecerão aqui em tempo real quando agentes forem executados ou houver atividade no engine.
                </p>
              </>
            ) : (
              <>
                <div className="h-8 w-8 mx-auto rounded-full bg-[var(--bb-error)]/10 flex items-center justify-center">
                  <div className="h-3 w-3 rounded-full bg-[var(--bb-error)]" />
                </div>
                <p className="text-secondary text-sm">WebSocket desconectado</p>
                <p className="text-tertiary text-xs">
                  Verifique se o engine está rodando na porta 4002. Eventos serão exibidos automaticamente quando a conexão for restabelecida.
                </p>
              </>
            )}
          </div>
        </CockpitCard>
      ) : (
        <div ref={scrollRef} className="space-y-1 max-h-[60vh] overflow-auto">
          {sortedEvents.map((event) => {
              const config = typeConfig[event.type] || typeConfig.system;
              const Icon = config.icon;
              return (
                <div
                  key={event.id}
                >
                  <CockpitCard
                    padding="sm"
                    variant="subtle"
                    className={cn(
                      event.type === 'error' && 'border-l-2 border-[var(--bb-error)]/40',
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <Icon className={cn('h-3.5 w-3.5 mt-0.5 flex-shrink-0', config.color)} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-primary">
                            {event.agent}
                          </span>
                          <Badge variant="default" className="text-[9px]">
                            {config.label}
                          </Badge>
                          {event.duration !== undefined && (
                            <span className="text-[10px] text-tertiary">
                              {event.duration}ms
                            </span>
                          )}
                          {event.success === false && (
                            <span className="text-[10px] text-[var(--bb-error)]">FAILED</span>
                          )}
                        </div>
                        <div className="text-xs text-secondary mt-0.5 break-words">
                          {event.description}
                        </div>
                      </div>
                      <span className="text-[10px] text-tertiary flex-shrink-0">
                        {formatTime(event.timestamp)}
                      </span>
                    </div>
                  </CockpitCard>
                </div>
              );
            })}
</div>
      )}
    </div>
  );
}
