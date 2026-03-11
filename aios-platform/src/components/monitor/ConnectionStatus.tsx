import { StatusDot } from '../ui';
import { useMonitorStore } from '../../stores/monitorStore';

export default function ConnectionStatus() {
  const connected = useMonitorStore((s) => s.connected);
  const mode = useMonitorStore((s) => s.connectionMode);
  const source = useMonitorStore((s) => s.connectionSource);

  let label: string;
  if (!connected) {
    label = source === 'demo' ? 'Demo' : 'Disconnected';
  } else if (source === 'sse') {
    label = 'SSE';
  } else if (source === 'ws') {
    label = mode === 'engine' ? 'Engine' : mode === 'cloud' ? 'Cloud' : 'WS';
  } else if (source === 'demo') {
    label = 'Demo';
  } else {
    label = 'Connected';
  }

  const status = connected ? 'working' : source === 'demo' ? 'idle' : 'offline';

  return (
    <StatusDot
      status={status}
      size="md"
      glow={connected}
      pulse={connected}
      label={label}
    />
  );
}
