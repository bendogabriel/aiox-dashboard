import { cn } from '../../lib/utils';
import type { WorkflowMission } from './types';

export function WorkflowListView({
  mission,
  selectedNodeId,
  onSelectNode,
}: {
  mission: WorkflowMission;
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
}) {
  return (
    <div className="p-6 space-y-4 overflow-y-auto h-full">
      {mission.nodes.map((node, index) => (
        <div
          key={node.id}
          onClick={() => onSelectNode(node.id)}
          className={cn(
            'glass-subtle rounded-none p-4 cursor-pointer transition-all',
            'hover:bg-white/10',
            selectedNodeId === node.id && 'ring-2 ring-[var(--aiox-lime)]'
          )}
        >
          <div className="flex items-center gap-4">
            <div
              className={cn(
                'h-10 w-10 rounded-none flex items-center justify-center text-sm font-bold',
                node.status === 'completed' && 'bg-[var(--color-status-success)]/20 text-[var(--color-status-success)]',
                node.status === 'active' && 'bg-[var(--bb-flare)]/20 text-[var(--bb-flare)]',
                node.status === 'waiting' && 'bg-[var(--bb-warning)]/20 text-[var(--bb-warning)]',
                node.status === 'idle' && 'bg-[var(--aiox-gray-dim)]/20 text-tertiary'
              )}
            >
              {index + 1}
            </div>
            <div className="flex-1">
              <p className="text-sm text-primary font-medium">{node.label}</p>
              {node.agentName && (
                <p className="text-secondary text-sm">{node.agentName}</p>
              )}
            </div>
            {node.progress !== undefined && (
              <div className="text-right">
                <p className="text-primary text-sm font-medium">{node.progress}%</p>
                <p className="text-tertiary text-xs">{node.status}</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
