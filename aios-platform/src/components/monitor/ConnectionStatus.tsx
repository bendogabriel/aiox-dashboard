import { StatusDot } from '../ui';
import { useMonitorStore } from '../../stores/monitorStore';

export default function ConnectionStatus() {
  const connected = useMonitorStore((s) => s.connected);

  return (
    <StatusDot
      status={connected ? 'working' : 'offline'}
      size="md"
      glow={connected}
      pulse={connected}
      label={connected ? 'Connected' : 'Disconnected'}
    />
  );
}
