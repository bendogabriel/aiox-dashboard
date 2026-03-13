import { Dialog, Badge, CockpitButton } from '../ui';
import { cn } from '../../lib/utils';
import type { Story } from '../../stores/storyStore';

interface StoryDetailModalProps {
  story: Story | null;
  isOpen: boolean;
  onClose: () => void;
}

const statusLabels: Record<Story['status'], string> = {
  backlog: 'Backlog',
  in_progress: 'In Progress',
  ai_review: 'AI Review',
  human_review: 'Human Review',
  pr_created: 'PR Created',
  done: 'Done',
  error: 'Error',
};

const statusColors: Record<Story['status'], string> = {
  backlog: 'bg-[var(--aiox-gray-dim)]/15 text-tertiary',
  in_progress: 'bg-[var(--aiox-blue)]/15 text-[var(--aiox-blue)]',
  ai_review: 'bg-[var(--aiox-gray-muted)]/15 text-[var(--aiox-gray-muted)]',
  human_review: 'bg-[var(--bb-flare)]/15 text-[var(--bb-flare)]',
  pr_created: 'bg-[var(--aiox-blue)]/15 text-[var(--aiox-blue)]',
  done: 'bg-[var(--color-status-success)]/15 text-[var(--color-status-success)]',
  error: 'bg-[var(--bb-error)]/15 text-[var(--bb-error)]',
};

const priorityColors: Record<Story['priority'], string> = {
  low: 'bg-[var(--aiox-gray-dim)]/15 text-tertiary',
  medium: 'bg-[var(--aiox-blue)]/15 text-[var(--aiox-blue)]',
  high: 'bg-[var(--bb-flare)]/15 text-[var(--bb-flare)]',
  critical: 'bg-[var(--bb-error)]/15 text-[var(--bb-error)]',
};

const complexityColors: Record<Story['complexity'], string> = {
  simple: 'bg-[var(--color-status-success)]/15 text-[var(--color-status-success)]',
  standard: 'bg-[var(--aiox-blue)]/15 text-[var(--aiox-blue)]',
  complex: 'bg-[var(--aiox-gray-muted)]/15 text-[var(--aiox-gray-muted)]',
};

const categoryColors: Record<Story['category'], string> = {
  feature: 'bg-[var(--aiox-blue)]/15 text-[var(--aiox-blue)]',
  fix: 'bg-[var(--bb-error)]/15 text-[var(--bb-error)]',
  refactor: 'bg-[var(--bb-warning)]/15 text-[var(--bb-warning)]',
  docs: 'bg-[var(--color-status-success)]/15 text-[var(--color-status-success)]',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function StoryDetailModal({ story, isOpen, onClose }: StoryDetailModalProps) {
  if (!story) return null;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={story.title}
      size="lg"
      footer={
        <CockpitButton variant="ghost" onClick={onClose}>
          Fechar
        </CockpitButton>
      }
    >
      <div className="space-y-4">
        {/* Story ID */}
        <span className="text-xs font-mono text-tertiary">ID: {story.id}</span>

        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={cn('inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md', statusColors[story.status])}>
            {statusLabels[story.status]}
          </span>
          <span className={cn('inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md', priorityColors[story.priority])}>
            {story.priority}
          </span>
          <span className={cn('inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md', complexityColors[story.complexity])}>
            {story.complexity}
          </span>
          <span className={cn('inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md', categoryColors[story.category])}>
            {story.category}
          </span>
          {story.assignedAgent && (
            <Badge size="md" variant="default">
              {story.assignedAgent}
            </Badge>
          )}
          {story.epicId && (
            <Badge size="md" variant="default">
              {story.epicId}
            </Badge>
          )}
        </div>

        {/* Description */}
        {story.description && (
          <div>
            <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5">
              Descricao
            </h3>
            <p className="text-sm text-primary leading-relaxed">{story.description}</p>
          </div>
        )}

        {/* Acceptance Criteria */}
        {story.acceptanceCriteria && story.acceptanceCriteria.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5">
              Criterios de Aceitacao
            </h3>
            <ul className="space-y-1">
              {story.acceptanceCriteria.map((criterion, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-primary">
                  <span className="text-tertiary mt-0.5">&#x2022;</span>
                  <span>{criterion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Technical Notes */}
        {story.technicalNotes && (
          <div>
            <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5">
              Notas Tecnicas
            </h3>
            <pre className="text-xs text-primary font-mono bg-[var(--color-background-hover)] p-3 rounded-none whitespace-pre-wrap leading-relaxed">
              {story.technicalNotes}
            </pre>
          </div>
        )}

        {/* Timestamps */}
        <div className="flex items-center gap-4 pt-2 border-t border-glass-border">
          <div>
            <span className="text-[10px] font-semibold text-tertiary uppercase tracking-wider">Criado em</span>
            <p className="text-xs text-secondary">{formatDate(story.createdAt)}</p>
          </div>
          <div>
            <span className="text-[10px] font-semibold text-tertiary uppercase tracking-wider">Atualizado em</span>
            <p className="text-xs text-secondary">{formatDate(story.updatedAt)}</p>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
