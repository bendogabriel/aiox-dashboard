import { AlertTriangle, Info } from 'lucide-react';
import { CockpitCard, CockpitButton } from '../ui';
import type { BobDecision } from '../../stores/bobStore';
import { cn } from '../../lib/utils';

const severityBorder: Record<BobDecision['severity'], string> = {
  info: 'border-[var(--aiox-blue)]/30',
  warning: 'border-[var(--bb-warning)]/40',
  error: 'border-[var(--bb-error)]/40',
};

const severityIcon: Record<BobDecision['severity'], React.ReactNode> = {
  info: <Info className="h-4 w-4 text-[var(--aiox-blue)]" />,
  warning: <AlertTriangle className="h-4 w-4 text-[var(--bb-warning)]" />,
  error: <AlertTriangle className="h-4 w-4 text-[var(--bb-error)]" />,
};

export default function SurfaceAlerts({
  decisions,
  onResolve,
}: {
  decisions: BobDecision[];
  onResolve: (id: string) => void;
}) {
  const unresolved = decisions.filter((d) => !d.resolved);

  if (unresolved.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-tertiary">No pending decisions</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {unresolved.map((decision) => (
          <div
            key={decision.id}
          >
            <CockpitCard
              padding="sm"
              className={cn('border', severityBorder[decision.severity])}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">{severityIcon[decision.severity]}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-primary">{decision.message}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <CockpitButton size="sm" variant="primary" onClick={() => onResolve(decision.id)}>
                      Acknowledge
                    </CockpitButton>
                    <span className="text-[10px] text-tertiary">
                      {new Date(decision.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            </CockpitCard>
          </div>
        ))}
</div>
  );
}
