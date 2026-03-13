import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Dialog, CockpitButton, CockpitTextarea, useToast } from '../ui';
import { useCreateCron } from '../../hooks/useEngine';
import { engineApi } from '../../services/api/engine';
import { useQuery } from '@tanstack/react-query';

interface CronJobEditorProps {
  isOpen: boolean;
  onClose: () => void;
}

const SCHEDULE_PRESETS = [
  { label: 'A cada 5 min', value: '*/5 * * * *' },
  { label: 'A cada 15 min', value: '*/15 * * * *' },
  { label: 'A cada hora', value: '0 * * * *' },
  { label: 'A cada 6h', value: '0 */6 * * *' },
  { label: 'Diário 9h', value: '0 9 * * *' },
  { label: 'Seg-Sex 9h', value: '0 9 * * 1-5' },
];

interface RegistryAgent {
  id: string;
  name: string;
  squad: string;
  title?: string;
}

export default function CronJobEditor({ isOpen, onClose }: CronJobEditorProps) {
  const createCron = useCreateCron();
  const toast = useToast();

  const [name, setName] = useState('');
  const [schedule, setSchedule] = useState('0 * * * *');
  const [squadId, setSquadId] = useState('');
  const [agentId, setAgentId] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch agents from engine registry
  const { data: agentsData } = useQuery({
    queryKey: ['engine', 'registry', 'agents'],
    queryFn: () => engineApi.getRegistryAgents(),
    enabled: isOpen,
    staleTime: 60_000,
  });

  const agents: RegistryAgent[] = agentsData?.agents || [];

  // Derive unique squads from agents
  const squads = [...new Set(agents.map((a) => a.squad))].sort();

  // Filter agents by selected squad
  const filteredAgents = squadId
    ? agents.filter((a) => a.squad === squadId)
    : agents;

  // Auto-select first agent when squad changes
  useEffect(() => {
    if (squadId && filteredAgents.length > 0 && !filteredAgents.find(a => a.id === agentId)) {
      setAgentId(filteredAgents[0].id);
    }
  }, [squadId, filteredAgents, agentId]);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Nome obrigatório';
    if (!schedule.trim()) e.schedule = 'Schedule obrigatório';
    if (!squadId) e.squadId = 'Selecione um squad';
    if (!agentId) e.agentId = 'Selecione um agent';
    if (!message.trim()) e.message = 'Mensagem obrigatória';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    createCron.mutate(
      {
        name: name.trim(),
        schedule: schedule.trim(),
        squad_id: squadId,
        agent_id: agentId,
        message: message.trim(),
      },
      {
        onSuccess: () => {
          toast.success('Cron criado', name.trim());
          resetForm();
          onClose();
        },
      },
    );
  }

  function resetForm() {
    setName('');
    setSchedule('0 * * * *');
    setSquadId('');
    setAgentId('');
    setMessage('');
    setErrors({});
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  const selectClass =
    'glass-input w-full h-11 px-3 rounded-none text-sm bg-transparent border border-white/10 text-primary appearance-none cursor-pointer';

  const footer = (
    <>
      <CockpitButton variant="ghost" onClick={handleClose}>
        Cancelar
      </CockpitButton>
      <CockpitButton
        variant="primary"
        leftIcon={<Plus className="h-3.5 w-3.5" />}
        onClick={handleSubmit}
        loading={createCron.isPending}
      >
        Criar Cron
      </CockpitButton>
    </>
  );

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title="Novo Cron Job"
      description="Agendar execução recorrente de agente"
      size="md"
      footer={footer}
    >
      <div className="space-y-4">
        {/* Nome */}
        <div>
          <label className="text-xs text-secondary mb-1.5 block">Nome</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={selectClass}
            placeholder="daily-review, hourly-sync..."
          />
          {errors.name && <p className="text-xs text-[var(--bb-error)] mt-1">{errors.name}</p>}
        </div>

        {/* Schedule */}
        <div>
          <label className="text-xs text-secondary mb-1.5 block">Schedule (cron expression)</label>
          <div className="flex gap-2">
            <input
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              className={`${selectClass} flex-1 font-mono`}
              placeholder="*/5 * * * *"
            />
            <select
              onChange={(e) => { if (e.target.value) setSchedule(e.target.value); }}
              className={selectClass}
              defaultValue=""
              style={{ width: 'auto', minWidth: 120 }}
            >
              <option value="" disabled>Presets</option>
              {SCHEDULE_PRESETS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          {errors.schedule && (
            <p className="text-xs text-[var(--bb-error)] mt-1">{errors.schedule}</p>
          )}
        </div>

        {/* Squad + Agent selects */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-secondary mb-1.5 block">Squad</label>
            <select
              value={squadId}
              onChange={(e) => { setSquadId(e.target.value); setAgentId(''); }}
              className={selectClass}
            >
              <option value="">Selecione um squad...</option>
              {squads.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {errors.squadId && <p className="text-xs text-[var(--bb-error)] mt-1">{errors.squadId}</p>}
          </div>
          <div>
            <label className="text-xs text-secondary mb-1.5 block">Agent</label>
            <select
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              className={selectClass}
              disabled={!squadId}
            >
              <option value="">{squadId ? 'Selecione um agent...' : 'Escolha o squad primeiro'}</option>
              {filteredAgents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name || a.id} {a.title ? `— ${a.title}` : ''}
                </option>
              ))}
            </select>
            {errors.agentId && <p className="text-xs text-[var(--bb-error)] mt-1">{errors.agentId}</p>}
          </div>
        </div>

        {/* Mensagem */}
        <CockpitTextarea
          label="Mensagem"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          error={errors.message}
          placeholder="Tarefa que o agente deve executar a cada ciclo..."
          rows={3}
        />

        {createCron.isError && (
          <div className="text-sm text-[var(--bb-error)] bg-[var(--bb-error)]/10 p-3 rounded-lg">
            {(createCron.error as Error).message || 'Erro ao criar cron'}
          </div>
        )}
      </div>
    </Dialog>
  );
}
