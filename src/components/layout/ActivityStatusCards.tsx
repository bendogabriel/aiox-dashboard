import { CockpitCard } from '../ui';
import { SpinnerIcon, CheckIcon, ClockIcon } from './activity-panel-icons';

// Streaming Status
export function StreamingStatus({ agentName }: { agentName: string }) {
  return (
    <CockpitCard variant="subtle" padding="md" className="border border-[var(--bb-flare)]/20">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-none bg-[var(--bb-flare)]/10 flex items-center justify-center text-[var(--bb-flare)]">
          <SpinnerIcon />
        </div>
        <div>
          <p className="text-primary text-sm font-medium">Processando...</p>
          <p className="text-tertiary text-xs">{agentName} está gerando resposta</p>
        </div>
      </div>
      <div className="mt-3">
        <div className="h-1.5 bg-black/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[var(--bb-flare)] to-[var(--bb-warning)] rounded-full"
          />
        </div>
      </div>
    </CockpitCard>
  );
}

// Ready Status
export function ReadyStatus({ messageCount }: { messageCount: number }) {
  return (
    <CockpitCard variant="subtle" padding="md" className="border border-[var(--color-status-success)]/20">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-none bg-[var(--color-status-success)]/10 flex items-center justify-center text-[var(--color-status-success)]">
          <CheckIcon />
        </div>
        <div>
          <p className="text-primary text-sm font-medium">Pronto</p>
          <p className="text-tertiary text-xs">{messageCount} mensagens na conversa</p>
        </div>
      </div>
    </CockpitCard>
  );
}

// Waiting Status
export function WaitingStatus({ agentName }: { agentName: string }) {
  return (
    <CockpitCard variant="subtle" padding="md" className="border border-[var(--aiox-blue)]/20">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-none bg-[var(--aiox-blue)]/10 flex items-center justify-center text-[var(--aiox-blue)]">
          <ClockIcon />
        </div>
        <div>
          <p className="text-primary text-sm font-medium">Aguardando</p>
          <p className="text-tertiary text-xs">Envie uma mensagem para {agentName}</p>
        </div>
      </div>
    </CockpitCard>
  );
}
