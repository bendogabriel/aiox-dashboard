import { useState } from 'react';
import { Play } from 'lucide-react';
import { Dialog, CockpitButton, CockpitInput, CockpitTextarea, useToast } from '../ui';
import { useStartWorkflow } from '../../hooks/useEngine';
import type { WorkflowDef } from '../../services/api/engine';

interface WorkflowTriggerModalProps {
  workflow: WorkflowDef | null;
  onClose: () => void;
}

export default function WorkflowTriggerModal({ workflow, onClose }: WorkflowTriggerModalProps) {
  const startWorkflow = useStartWorkflow();
  const toast = useToast();
  const [message, setMessage] = useState('');
  const [parentJobId, setParentJobId] = useState('');
  const [error, setError] = useState('');

  function handleSubmit() {
    if (!workflow) return;
    if (!message.trim()) {
      setError('Mensagem obrigatória');
      return;
    }
    setError('');
    startWorkflow.mutate(
      {
        workflowId: workflow.id,
        input: { message: message.trim() },
        parentJobId: parentJobId.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Workflow iniciado', workflow.name);
          setMessage('');
          setParentJobId('');
          onClose();
        },
      },
    );
  }

  function handleClose() {
    setError('');
    setMessage('');
    setParentJobId('');
    onClose();
  }

  const footer = (
    <>
      <CockpitButton variant="ghost" onClick={handleClose}>
        Cancelar
      </CockpitButton>
      <CockpitButton
        variant="primary"
        leftIcon={<Play className="h-3.5 w-3.5" />}
        onClick={handleSubmit}
        loading={startWorkflow.isPending}
      >
        Iniciar Workflow
      </CockpitButton>
    </>
  );

  return (
    <Dialog
      isOpen={!!workflow}
      onClose={handleClose}
      title={`Iniciar: ${workflow?.name || ''}`}
      description={`${workflow?.phases || 0} fases • ${workflow?.id || ''}`}
      size="md"
      footer={footer}
    >
      <div className="space-y-4">
        <CockpitTextarea
          label="O que este workflow deve processar?"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          error={error}
          placeholder="Ex: Analisar o módulo de autenticação e gerar relatório de debt técnico..."
          rows={4}
          hint="Descreva em linguagem natural a tarefa para o workflow executar"
        />

        <CockpitInput
          label="Vincular a um Job existente (opcional)"
          value={parentJobId}
          onChange={(e) => setParentJobId(e.target.value)}
          placeholder="Cole aqui o ID de um job pai, se quiser vincular"
          hint="Deixe vazio para criar um workflow independente"
        />

        {startWorkflow.isError && (
          <div className="text-sm text-[var(--bb-error)] bg-[var(--bb-error)]/10 p-3 rounded-lg">
            {(startWorkflow.error as Error).message || 'Erro ao iniciar workflow'}
          </div>
        )}
      </div>
    </Dialog>
  );
}
