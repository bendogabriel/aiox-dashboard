import { useCallback, useState, useEffect } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { useMonitorStore } from '../../stores/monitorStore';
import { useEngineStore } from '../../stores/engineStore';
import { WorldMap } from './WorldMap';
import { RoomView } from './RoomView';
import { WorldMinimap } from './WorldMinimap';
import { WorldWorkflowPanel } from './WorldWorkflowPanel';
import { WorldNotifications } from './WorldNotifications';
import { rooms } from './world-layout';
import { DomainProvider, useDomains } from './DomainContext';

export function GatherWorld() {
  return (
    <DomainProvider>
      <GatherWorldInner />
    </DomainProvider>
  );
}

function GatherWorldInner() {
  const themedDomains = useDomains();
  const {
    worldZoom,
    selectedRoomId,
    enterRoom,
    exitRoom,
  } = useUIStore();

  // Auto-connect to monitor for live agent activity.
  // Subscribes to engineStore so it reconnects when engine comes online later.
  const { disconnectFromMonitor } = useMonitorStore();
  useEffect(() => {
    const tryConnect = () => {
      const { connected } = useMonitorStore.getState();
      const engineStatus = useEngineStore.getState().status;
      if (connected || engineStatus !== 'online') return;
      useMonitorStore.getState().connectToMonitor();
    };

    // Try immediately if engine is already online
    tryConnect();

    // Subscribe to engine status changes for auto-reconnect
    const unsubscribe = useEngineStore.subscribe((state, prev) => {
      if (state.status === 'online' && prev.status !== 'online') {
        tryConnect();
      }
    });

    return () => {
      unsubscribe();
      disconnectFromMonitor();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Zoom levels for map and room independently
  const [mapZoom, setMapZoom] = useState(1);
  const [roomZoom, setRoomZoom] = useState(1);
  const [workflowPanelExpanded, setWorkflowPanelExpanded] = useState(false);
  const [highlightedRooms, setHighlightedRooms] = useState<string[]>([]);
  const [doorTransition, setDoorTransition] = useState<'entering' | 'exiting' | null>(null);
  const [transitionRoomId, setTransitionRoomId] = useState<string | null>(null);

  const handleRoomClick = useCallback((roomId: string) => {
    setTransitionRoomId(roomId);
    setDoorTransition('entering');
    // Brief overlay before switching to room
    setTimeout(() => {
      enterRoom(roomId);
      setRoomZoom(1);
      setTimeout(() => setDoorTransition(null), 400);
    }, 300);
  }, [enterRoom]);

  const handleBack = useCallback(() => {
    setDoorTransition('exiting');
    setTimeout(() => {
      exitRoom();
      setTimeout(() => {
        setDoorTransition(null);
        setTransitionRoomId(null);
      }, 300);
    }, 250);
  }, [exitRoom]);

  const currentZoom = worldZoom === 'map' ? mapZoom : roomZoom;
  const setCurrentZoom = worldZoom === 'map' ? setMapZoom : setRoomZoom;

  return (
    <div className="h-full flex relative">
      {/* Main content area */}
      <div className="flex-1 min-w-0 h-full">
        {worldZoom === 'map' ? (
            <div
              key="world-map"
              className="h-full"
            >
              <WorldMap
                onRoomClick={handleRoomClick}
                zoom={mapZoom}
                onZoomChange={setMapZoom}
                highlightedRooms={highlightedRooms}
              />
            </div>
          ) : (
            <div
              key="room-view"
              className="h-full"
            >
              {selectedRoomId && (
                <RoomView
                  roomId={selectedRoomId}
                  onBack={handleBack}
                  zoom={roomZoom}
                  onZoomChange={setRoomZoom}
                />
              )}
            </div>
          )}
{/* Door transition overlay */}
        {doorTransition && (
            <div
              className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center"
            >
              {/* Vignette effect */}
              <div
                className="absolute inset-0"
                style={{
                  background: 'radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.6) 100%)',
                }}
              />
              {/* Door frame silhouette */}
              {doorTransition === 'entering' && transitionRoomId && (() => {
                const roomCfg = rooms.find((r) => r.squadId === transitionRoomId);
                const domainCfg = roomCfg ? themedDomains[roomCfg.domain] : null;
                return (
                  <div
                    className="relative rounded-none overflow-hidden"
                    style={{
                      border: `3px solid ${domainCfg?.tileColor || '#fff'}88`,
                      boxShadow: `0 0 60px ${domainCfg?.tileColor || '#fff'}44`,
                    }}
                  >
                    <div
                      className="w-full h-full"
                      style={{ background: domainCfg?.floorColor || 'var(--color-background-base)' }}
                    />
                  </div>
                );
              })()}
            </div>
          )}
</div>

      {/* Zoom controls (bottom-left) */}
      <div
        className="absolute left-4 flex flex-col gap-1 z-30"
        style={{ bottom: worldZoom === 'map' && workflowPanelExpanded ? 230 : 16 }}
      >
        <button
          onClick={() => setCurrentZoom(Math.min(currentZoom + 0.2, worldZoom === 'map' ? 2.0 : 2.5))}
          className="h-8 w-8 flex items-center justify-center rounded-lg glass-subtle hover:bg-white/15 transition-colors text-secondary hover:text-primary"
          aria-label="Aumentar zoom"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        <button
          onClick={() => setCurrentZoom(1)}
          className="h-8 w-8 flex items-center justify-center rounded-lg glass-subtle hover:bg-white/15 transition-colors text-[10px] font-mono text-secondary hover:text-primary"
          aria-label="Resetar zoom"
        >
          {Math.round(currentZoom * 100)}%
        </button>

        <button
          onClick={() => setCurrentZoom(Math.max(currentZoom - 0.2, worldZoom === 'map' ? 0.4 : 0.5))}
          className="h-8 w-8 flex items-center justify-center rounded-lg glass-subtle hover:bg-white/15 transition-colors text-secondary hover:text-primary"
          aria-label="Diminuir zoom"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      {/* In-world notifications (top-right) */}
      <WorldNotifications maxVisible={4} />

      {/* Minimap (bottom-right corner) — only visible on world map */}
      {worldZoom === 'map' && (
        <div
          className="absolute right-4 hidden md:block z-30"
          style={{ bottom: workflowPanelExpanded ? 230 : 16 }}
        >
          <WorldMinimap
            currentRoomId={selectedRoomId}
            onRoomClick={handleRoomClick}
          />
        </div>
      )}

      {/* Workflow panel (bottom bar) — only on world map */}
      {worldZoom === 'map' && (
        <WorldWorkflowPanel
          expanded={workflowPanelExpanded}
          onToggle={() => setWorkflowPanelExpanded(!workflowPanelExpanded)}
          onHighlightRooms={setHighlightedRooms}
          onRoomClick={handleRoomClick}
        />
      )}

    </div>
  );
}
