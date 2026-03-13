import { CockpitButton } from '../ui';
import { PlayIcon } from './WorkflowIcons';

interface ExecuteDialogProps {
  isOpen: boolean;
  demandInput: string;
  onDemandChange: (value: string) => void;
  onExecute: () => void;
  onClose: () => void;
}

export function ExecuteWorkflowDialog({
  isOpen,
  demandInput,
  onDemandChange,
  onExecute,
  onClose,
}: ExecuteDialogProps) {
  return (
    <>
    {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backdropFilter: 'blur(8px)', background: 'color-mix(in srgb, var(--palette-black) 50%, transparent)' }}
          onClick={onClose}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-none p-6"
            style={{
              background: 'linear-gradient(135deg, rgba(30, 30, 35, 0.95) 0%, rgba(20, 20, 25, 0.98) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            <h3 className="text-xl font-semibold text-white mb-2">Executar Workflow</h3>
            <p className="text-sm text-white/60 mb-4">
              Descreva o que você deseja que o workflow produza. Seja específico para melhores resultados.
            </p>
            <textarea
              value={demandInput}
              onChange={(e) => onDemandChange(e.target.value)}
              placeholder="Ex: Crie uma campanha de marketing para lançamento de um novo produto de tecnologia voltado para jovens de 18-25 anos..."
              className="w-full h-32 px-4 py-3 rounded-none text-white placeholder-white/40 resize-none"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
              autoFocus
            />
            <div className="flex justify-end gap-3 mt-4">
              <CockpitButton variant="ghost" onClick={onClose}>
                Cancelar
              </CockpitButton>
              <CockpitButton
                variant="primary"
                onClick={onExecute}
                disabled={!demandInput.trim()}
              >
                <PlayIcon />
                <span className="ml-2">Iniciar Execução</span>
              </CockpitButton>
            </div>
          </div>
        </div>
      )}
    </>
);
}

interface OrchestrationDialogProps {
  isOpen: boolean;
  demand: string;
  onDemandChange: (value: string) => void;
  onStart: () => void;
  onClose: () => void;
}

export function SmartOrchestrationDialog({
  isOpen,
  demand,
  onDemandChange,
  onStart,
  onClose,
}: OrchestrationDialogProps) {
  return (
    <>
    {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backdropFilter: 'blur(8px)', background: 'color-mix(in srgb, var(--palette-black) 50%, transparent)' }}
          onClick={onClose}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-none p-6"
            style={{
              background: 'linear-gradient(135deg, rgba(30, 30, 35, 0.95) 0%, rgba(20, 20, 25, 0.98) 100%)',
              border: '1px solid rgba(209, 255, 0, 0.3)',
              boxShadow: '0 25px 50px -12px rgba(209, 255, 0, 0.15)',
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-none bg-gradient-to-br from-[var(--aiox-lime)] to-[var(--aiox-blue)] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
                  <path d="M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Orquestração Inteligente</h3>
                <p className="text-sm text-white/60">O orquestrador vai analisar e criar o workflow automaticamente</p>
              </div>
            </div>
            <textarea
              value={demand}
              onChange={(e) => onDemandChange(e.target.value)}
              placeholder="Descreva o que você precisa... Ex: Preciso criar uma campanha de lançamento para um novo produto de software. Quero copy persuasivo, identidade visual e conteúdo para redes sociais."
              className="w-full h-40 px-4 py-3 rounded-none text-white placeholder-white/40 resize-none"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid color-mix(in srgb, var(--aiox-gray-muted) 20%, transparent)',
              }}
              autoFocus
            />
            <div className="mt-4 p-3 rounded-lg bg-[var(--aiox-gray-muted)]/10 border border-[var(--aiox-gray-muted)]/20">
              <p className="text-xs text-[var(--aiox-gray-muted)]">
                <strong>Como funciona:</strong> O orquestrador vai analisar sua demanda, selecionar os squads e agentes mais adequados, criar um workflow dinâmico e executá-lo automaticamente.
              </p>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <CockpitButton variant="ghost" onClick={onClose}>
                Cancelar
              </CockpitButton>
              <CockpitButton
                variant="primary"
                onClick={onStart}
                disabled={!demand.trim() || demand.trim().length < 10}
                className="bg-gradient-to-r from-[var(--aiox-gray-muted)] to-[var(--aiox-blue)]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
                </svg>
                <span>Iniciar Orquestração</span>
              </CockpitButton>
            </div>
          </div>
        </div>
      )}
    </>
);
}
