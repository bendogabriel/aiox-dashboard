import { Clock, Calendar, Play, Pause, RefreshCw } from 'lucide-react';
import { CockpitCard, CockpitButton, Badge } from '../ui';
import type { OvernightProgram } from '../../types/overnight';

interface ScheduleInfoProps {
  program: OvernightProgram;
}

function formatSchedule(schedule: string | null): string {
  if (!schedule) return 'Manual';
  const parts = schedule.split(' ');
  if (parts.length !== 5) return schedule;
  const [min, hour, , , dow] = parts;

  const dayMap: Record<string, string> = {
    '*': 'Daily',
    '0': 'Sunday',
    '1': 'Monday',
    '1-5': 'Mon-Fri',
    '0,6': 'Weekends',
  };

  const days = dayMap[dow] ?? `Day ${dow}`;
  return `${hour}:${min.padStart(2, '0')} ${days}`;
}

function getNextRun(schedule: string | null): string {
  if (!schedule) return '--';
  // Simple estimation based on cron pattern
  const now = new Date();
  const parts = schedule.split(' ');
  if (parts.length !== 5) return '--';

  const [min, hour] = parts;
  const h = parseInt(hour, 10);
  const m = parseInt(min, 10);

  const next = new Date(now);
  next.setHours(h, m, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);

  const diff = next.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export default function ScheduleInfo({ program }: ScheduleInfoProps) {
  const isScheduled = program.triggerType === 'scheduled' && program.schedule;

  return (
    <CockpitCard padding="md">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-primary flex items-center gap-2">
          <Calendar size={14} />
          Schedule
        </h3>
        <Badge variant={isScheduled ? 'primary' : 'subtle'} size="sm">
          {isScheduled ? 'Scheduled' : 'Manual'}
        </Badge>
      </div>

      {isScheduled ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-tertiary uppercase tracking-wide mb-0.5">Frequency</p>
              <p className="text-sm text-primary font-mono">{formatSchedule(program.schedule)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-tertiary uppercase tracking-wide mb-0.5">Next Run</p>
              <p className="text-sm text-primary flex items-center gap-1">
                <Clock size={12} className="text-[var(--aiox-blue)]" />
                {getNextRun(program.schedule)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-white/5">
            <CockpitButton
              size="sm"
              variant="primary"
              leftIcon={<Play size={12} />}
              className="flex-1"
            >
              Run Now
            </CockpitButton>
            <CockpitButton
              size="sm"
              variant="ghost"
              leftIcon={<Pause size={12} />}
            >
              Disable
            </CockpitButton>
          </div>

          <p className="text-[10px] text-tertiary font-mono">
            cron: {program.schedule}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-tertiary">
            This program runs on-demand only. No automatic schedule configured.
          </p>
          <CockpitButton
            size="sm"
            variant="primary"
            leftIcon={<Play size={12} />}
            className="w-full"
          >
            Run Now
          </CockpitButton>
        </div>
      )}
    </CockpitCard>
  );
}
