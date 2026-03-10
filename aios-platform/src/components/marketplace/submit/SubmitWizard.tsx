/**
 * SubmitWizard — 5-step guided submission wizard
 * Stories 4.2, 4.3
 */
import { useState, lazy, Suspense, useCallback } from 'react';
import {
  ArrowLeft, ArrowRight, Check, FileText, Bot,
  DollarSign, FlaskConical, ClipboardCheck, Send,
} from 'lucide-react';
import { useUIStore } from '../../../stores/uiStore';
import { useSubmissionStore, CHECKLIST_KEYS } from '../../../stores/marketplaceSubmissionStore';
import type { SubmitWizardStep, PricingModel, MarketplaceCategory } from '../../../types/marketplace';

const ReactMarkdown = lazy(() => import('react-markdown'));

// --- Step labels ---
const STEPS: { step: SubmitWizardStep; label: string; icon: typeof FileText }[] = [
  { step: 1, label: 'Info Basica', icon: FileText },
  { step: 2, label: 'Agent Config', icon: Bot },
  { step: 3, label: 'Pricing', icon: DollarSign },
  { step: 4, label: 'Teste', icon: FlaskConical },
  { step: 5, label: 'Revisao', icon: ClipboardCheck },
];

// --- Categories ---
const CATEGORIES: { value: MarketplaceCategory; label: string }[] = [
  { value: 'development', label: 'Development' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'design', label: 'Design' },
  { value: 'content', label: 'Content' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'copywriting', label: 'Copywriting' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'creator', label: 'Sales' },
  { value: 'advisory', label: 'Advisory' },
  { value: 'orchestrator', label: 'Orchestration' },
];

// --- Pricing Models ---
const PRICING_MODELS: { value: PricingModel; label: string; desc: string }[] = [
  { value: 'free', label: 'Gratis', desc: 'Sem custo para o buyer' },
  { value: 'per_task', label: 'Por Task', desc: 'Cobranca por execucao' },
  { value: 'hourly', label: 'Por Hora', desc: 'Rate por hora de trabalho' },
  { value: 'monthly', label: 'Mensal', desc: 'Assinatura mensal' },
  { value: 'credits', label: 'Creditos', desc: 'Pacote de creditos' },
];

// --- Shared input class ---
const inputCls = `
  w-full px-3 py-2 text-sm font-mono
  bg-[var(--color-bg-surface,#0a0a0a)]
  border border-[var(--color-border-default,#333)]
  text-[var(--color-text-primary,#fff)]
  placeholder:text-[var(--color-text-muted,#666)]
  focus:outline-none focus:border-[var(--aiox-lime,#D1FF00)]/50
`;

const labelCls = 'block text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted,#666)] mb-1';

// ============================================================
// STEP 1: Basic Info
// ============================================================
function StepBasicInfo() {
  const { basicInfo, updateBasicInfo } = useSubmissionStore();
  const [previewMd, setPreviewMd] = useState(false);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Nome do Agente *</label>
          <input
            type="text"
            value={basicInfo.name}
            onChange={(e) => updateBasicInfo({ name: e.target.value })}
            className={inputCls}
            placeholder="ex: Code Reviewer Pro"
          />
        </div>
        <div>
          <label className={labelCls}>Categoria *</label>
          <select
            value={basicInfo.category}
            onChange={(e) => updateBasicInfo({ category: e.target.value as MarketplaceCategory })}
            className={inputCls}
          >
            <option value="default">Selecione...</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls}>Tagline *</label>
        <input
          type="text"
          value={basicInfo.tagline}
          onChange={(e) => updateBasicInfo({ tagline: e.target.value })}
          className={inputCls}
          placeholder="Uma frase que descreve o agente"
          maxLength={120}
        />
        <p className="text-[10px] font-mono text-[var(--color-text-muted,#666)] mt-0.5 text-right">
          {basicInfo.tagline.length}/120
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className={labelCls}>Descricao (Markdown) *</label>
          <button
            type="button"
            onClick={() => setPreviewMd(!previewMd)}
            className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted,#666)] hover:text-[var(--aiox-lime,#D1FF00)] transition-colors"
          >
            {previewMd ? 'Editar' : 'Preview'}
          </button>
        </div>
        {previewMd ? (
          <div className="prose prose-invert prose-sm max-w-none p-3 bg-[var(--color-bg-surface,#0a0a0a)] border border-[var(--color-border-default,#333)] min-h-[200px] text-[var(--color-text-secondary,#999)]">
            <Suspense fallback={<div className="animate-pulse h-20 bg-[var(--color-bg-elevated,#1a1a1a)]" />}>
              <ReactMarkdown>{basicInfo.description || '*Nada para mostrar*'}</ReactMarkdown>
            </Suspense>
          </div>
        ) : (
          <textarea
            value={basicInfo.description}
            onChange={(e) => updateBasicInfo({ description: e.target.value })}
            className={`${inputCls} resize-none`}
            rows={8}
            placeholder="Descreva o que seu agente faz, seus diferenciais e como o buyer pode usa-lo..."
          />
        )}
      </div>

      <div>
        <label className={labelCls}>Tags (separadas por virgula)</label>
        <input
          type="text"
          value={basicInfo.tags.join(', ')}
          onChange={(e) => updateBasicInfo({ tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })}
          className={inputCls}
          placeholder="react, code-review, testing"
        />
      </div>

      <div>
        <label className={labelCls}>Icon (nome do Lucide icon)</label>
        <input
          type="text"
          value={basicInfo.icon}
          onChange={(e) => updateBasicInfo({ icon: e.target.value })}
          className={inputCls}
          placeholder="ex: Code, Palette, Megaphone"
        />
      </div>
    </div>
  );
}

// ============================================================
// STEP 2: Agent Config
// ============================================================
function StepAgentConfig() {
  const { agentConfig, updateAgentConfig, addCommand, removeCommand, addCapability, removeCapability } = useSubmissionStore();
  const [newCmd, setNewCmd] = useState({ command: '', action: '', description: '' });
  const [newCap, setNewCap] = useState('');

  return (
    <div className="space-y-5">
      {/* Persona fields */}
      <div>
        <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--color-text-primary,#fff)] mb-3">
          Persona
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(['role', 'style', 'identity', 'background', 'focus'] as const).map((field) => (
            <div key={field}>
              <label className={labelCls}>{field} {field === 'role' && '*'}</label>
              <input
                type="text"
                value={(agentConfig.persona?.[field] as string) || ''}
                onChange={(e) =>
                  updateAgentConfig({
                    persona: { ...agentConfig.persona, [field]: e.target.value },
                  })
                }
                className={inputCls}
                placeholder={`Persona ${field}`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Commands */}
      <div>
        <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--color-text-primary,#fff)] mb-3">
          Comandos ({agentConfig.commands?.length ?? 0})
        </h3>
        {(agentConfig.commands ?? []).length > 0 && (
          <div className="space-y-1.5 mb-3">
            {(agentConfig.commands ?? []).map((cmd, i) => (
              <div key={i} className="flex items-center gap-2 p-2 bg-[var(--color-bg-elevated,#1a1a1a)] border border-[var(--color-border-default,#333)]">
                <span className="text-xs font-mono text-[var(--aiox-lime,#D1FF00)]">*{cmd.command}</span>
                <span className="text-xs text-[var(--color-text-secondary,#999)] flex-1 truncate">{cmd.action}</span>
                <button type="button" onClick={() => removeCommand(i)} className="text-[var(--color-text-muted,#666)] hover:text-[var(--bb-error,#EF4444)] text-xs">✕</button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={newCmd.command}
            onChange={(e) => setNewCmd({ ...newCmd, command: e.target.value })}
            className={`${inputCls} flex-1`}
            placeholder="comando"
          />
          <input
            type="text"
            value={newCmd.action}
            onChange={(e) => setNewCmd({ ...newCmd, action: e.target.value })}
            className={`${inputCls} flex-1`}
            placeholder="acao"
          />
          <button
            type="button"
            onClick={() => {
              if (newCmd.command && newCmd.action) {
                addCommand(newCmd);
                setNewCmd({ command: '', action: '', description: '' });
              }
            }}
            className="px-3 py-2 bg-[var(--color-bg-elevated,#1a1a1a)] border border-[var(--color-border-default,#333)] text-[var(--aiox-lime,#D1FF00)] text-xs font-mono hover:bg-[var(--aiox-lime,#D1FF00)]/5 transition-colors"
          >
            +
          </button>
        </div>
      </div>

      {/* Capabilities */}
      <div>
        <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--color-text-primary,#fff)] mb-3">
          Capabilities
        </h3>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {(agentConfig.capabilities ?? []).map((cap) => (
            <span key={cap} className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--color-bg-elevated,#1a1a1a)] border border-[var(--color-border-default,#333)] text-xs font-mono text-[var(--color-text-secondary,#999)]">
              {cap}
              <button type="button" onClick={() => removeCapability(cap)} className="text-[var(--color-text-muted,#666)] hover:text-[var(--bb-error,#EF4444)]">✕</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newCap}
            onChange={(e) => setNewCap(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newCap.trim()) {
                addCapability(newCap.trim());
                setNewCap('');
              }
            }}
            className={`${inputCls} flex-1`}
            placeholder="Adicionar capability (Enter para confirmar)"
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// STEP 3: Pricing
// ============================================================
function StepPricing() {
  const { pricing, updatePricing } = useSubmissionStore();

  return (
    <div className="space-y-5">
      {/* Pricing Model */}
      <div>
        <label className={labelCls}>Modelo de Cobranca</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PRICING_MODELS.map((pm) => (
            <button
              key={pm.value}
              type="button"
              onClick={() => updatePricing({ model: pm.value, amount: pm.value === 'free' ? 0 : pricing.amount })}
              className={`
                p-3 text-left border transition-colors
                ${pricing.model === pm.value
                  ? 'border-[var(--aiox-lime,#D1FF00)]/50 bg-[var(--aiox-lime,#D1FF00)]/5'
                  : 'border-[var(--color-border-default,#333)] hover:border-[var(--color-text-muted,#666)]'
                }
              `}
            >
              <p className="text-xs font-mono font-semibold text-[var(--color-text-primary,#fff)]">{pm.label}</p>
              <p className="text-[10px] font-mono text-[var(--color-text-muted,#666)] mt-0.5">{pm.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Price Amount */}
      {pricing.model !== 'free' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Valor (R$)</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={pricing.amount}
              onChange={(e) => updatePricing({ amount: parseFloat(e.target.value) || 0 })}
              className={inputCls}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className={labelCls}>Moeda</label>
            <select
              value={pricing.currency}
              onChange={(e) => updatePricing({ currency: e.target.value })}
              className={inputCls}
            >
              <option value="BRL">BRL (R$)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>
        </div>
      )}

      {/* Credits per use */}
      {pricing.model === 'credits' && (
        <div>
          <label className={labelCls}>Creditos por Uso</label>
          <input
            type="number"
            min={1}
            value={pricing.credits_per_use ?? 1}
            onChange={(e) => updatePricing({ credits_per_use: parseInt(e.target.value) || 1 })}
            className={inputCls}
          />
        </div>
      )}

      {/* SLA (optional) */}
      <div>
        <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--color-text-primary,#fff)] mb-3">
          SLA (Opcional)
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Resposta (ms)</label>
            <input
              type="number"
              min={0}
              value={pricing.sla_response_ms ?? ''}
              onChange={(e) => updatePricing({ sla_response_ms: parseInt(e.target.value) || null })}
              className={inputCls}
              placeholder="5000"
            />
          </div>
          <div>
            <label className={labelCls}>Uptime (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={pricing.sla_uptime_pct ?? ''}
              onChange={(e) => updatePricing({ sla_uptime_pct: parseFloat(e.target.value) || null })}
              className={inputCls}
              placeholder="99.9"
            />
          </div>
          <div>
            <label className={labelCls}>Max Tokens</label>
            <input
              type="number"
              min={0}
              value={pricing.sla_max_tokens ?? ''}
              onChange={(e) => updatePricing({ sla_max_tokens: parseInt(e.target.value) || null })}
              className={inputCls}
              placeholder="8000"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// STEP 4: Testing (Sandbox)
// ============================================================
function StepTesting() {
  const { basicInfo, agentConfig } = useSubmissionStore();
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'agent'; text: string }>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const suggestedPrompts = [
    'Explique o que voce faz',
    'Quais sao suas limitacoes?',
    'Liste seus comandos',
    `Execute o comando principal`,
    'Qual seu diferencial?',
  ];

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setInput('');
    setLoading(true);

    // Simulated sandbox response
    await new Promise((r) => setTimeout(r, 1200));
    setMessages((prev) => [
      ...prev,
      {
        role: 'agent',
        text: `[Sandbox] Sou ${basicInfo.name}, ${agentConfig.persona?.role || 'um agente IA'}. Recebi sua mensagem: "${text}". Em producao, esta resposta viria do Engine API com o agent_config configurado.`,
      },
    ]);
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-[var(--color-text-secondary,#999)]">
        Teste seu agente antes de submeter. Envie mensagens para verificar se o comportamento esta correto.
      </p>

      {/* Suggested prompts */}
      <div className="flex flex-wrap gap-1.5">
        {suggestedPrompts.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => sendMessage(p)}
            disabled={loading}
            className="px-2 py-1 text-[10px] font-mono border border-[var(--color-border-default,#333)] text-[var(--color-text-secondary,#999)] hover:border-[var(--aiox-lime,#D1FF00)]/40 hover:text-[var(--color-text-primary,#fff)] transition-colors disabled:opacity-50"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Chat area */}
      <div className="h-64 overflow-y-auto bg-[var(--color-bg-surface,#0a0a0a)] border border-[var(--color-border-default,#333)] p-3 space-y-2">
        {messages.length === 0 && (
          <p className="text-xs text-[var(--color-text-muted,#666)] font-mono text-center py-8">
            Envie uma mensagem para testar o agente
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`
              max-w-[80%] px-3 py-2 text-xs font-mono
              ${msg.role === 'user'
                ? 'bg-[var(--aiox-lime,#D1FF00)]/10 text-[var(--color-text-primary,#fff)] border border-[var(--aiox-lime,#D1FF00)]/20'
                : 'bg-[var(--color-bg-elevated,#1a1a1a)] text-[var(--color-text-secondary,#999)] border border-[var(--color-border-default,#333)]'
              }
            `}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="px-3 py-2 bg-[var(--color-bg-elevated,#1a1a1a)] border border-[var(--color-border-default,#333)] text-xs font-mono text-[var(--color-text-muted,#666)]">
              Processando...
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
          className={`${inputCls} flex-1`}
          placeholder="Envie uma mensagem de teste..."
          disabled={loading}
        />
        <button
          type="button"
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          className="px-4 py-2 bg-[var(--aiox-lime,#D1FF00)] text-[var(--aiox-dark,#050505)] font-mono text-xs uppercase tracking-wider font-semibold disabled:opacity-50 transition-colors"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}

// ============================================================
// STEP 5: Review & Checklist
// ============================================================
const CHECKLIST_LABELS: Record<string, string> = {
  description_clear: 'Descricao clara e detalhada',
  persona_defined: 'Persona do agente definida',
  has_commands: 'Pelo menos 1 comando configurado',
  pricing_set: 'Modelo de pricing definido',
  tested_3_prompts: 'Testei com 3+ prompts diferentes',
  screenshots_added: 'Screenshots adicionados',
  tags_relevant: 'Tags relevantes selecionadas',
  terms_accepted: 'Li e aceito os termos de uso',
};

function StepReview() {
  const { basicInfo, agentConfig, pricing, preSubmitChecklist, toggleChecklistItem } = useSubmissionStore();

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--color-text-primary,#fff)]">
          Resumo
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <SummaryField label="Nome" value={basicInfo.name} />
          <SummaryField label="Categoria" value={basicInfo.category} />
          <SummaryField label="Tagline" value={basicInfo.tagline} />
          <SummaryField label="Role" value={agentConfig.persona?.role || '-'} />
          <SummaryField label="Comandos" value={String(agentConfig.commands?.length ?? 0)} />
          <SummaryField label="Capabilities" value={String(agentConfig.capabilities?.length ?? 0)} />
          <SummaryField label="Pricing" value={pricing.model === 'free' ? 'Gratis' : `R$ ${pricing.amount} / ${pricing.model}`} />
          <SummaryField label="Tags" value={basicInfo.tags.join(', ') || '-'} />
        </div>
      </div>

      {/* Checklist */}
      <div>
        <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--color-text-primary,#fff)] mb-3">
          Checklist Pre-Submissao
        </h3>
        <div className="space-y-2">
          {CHECKLIST_KEYS.map((key) => (
            <label key={key} className="flex items-center gap-2.5 cursor-pointer group">
              <div className={`
                w-4 h-4 border flex items-center justify-center transition-colors shrink-0
                ${preSubmitChecklist[key]
                  ? 'bg-[var(--aiox-lime,#D1FF00)] border-[var(--aiox-lime,#D1FF00)]'
                  : 'border-[var(--color-border-default,#333)] group-hover:border-[var(--color-text-muted,#666)]'
                }
              `}>
                {preSubmitChecklist[key] && (
                  <Check size={10} strokeWidth={3} className="text-[var(--aiox-dark,#050505)]" />
                )}
              </div>
              <span className={`text-xs font-mono transition-colors ${preSubmitChecklist[key] ? 'text-[var(--color-text-primary,#fff)]' : 'text-[var(--color-text-secondary,#999)]'}`}>
                {CHECKLIST_LABELS[key] ?? key}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function SummaryField({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2 bg-[var(--color-bg-elevated,#1a1a1a)] border border-[var(--color-border-default,#333)]">
      <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted,#666)]">{label}</p>
      <p className="text-xs font-mono text-[var(--color-text-primary,#fff)] truncate mt-0.5">{value}</p>
    </div>
  );
}

// ============================================================
// MAIN WIZARD
// ============================================================
export default function SubmitWizard() {
  const setCurrentView = useUIStore((s) => s.setCurrentView);
  const { currentStep, setStep, nextStep, prevStep, validateStep, stepValid, resetWizard, preSubmitChecklist } = useSubmissionStore();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const allChecked = Object.values(preSubmitChecklist).every(Boolean);

  const handleNext = useCallback(() => {
    const valid = validateStep(currentStep);
    if (valid) nextStep();
  }, [currentStep, validateStep, nextStep]);

  const handleSubmit = async () => {
    if (!allChecked) return;
    setSubmitting(true);
    // In production: call marketplaceService.createSubmission(...)
    await new Promise((r) => setTimeout(r, 2000));
    setSubmitting(false);
    setSubmitted(true);
  };

  // Success screen
  if (submitted) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 p-8">
        <div className="w-16 h-16 flex items-center justify-center bg-[var(--aiox-lime,#D1FF00)]/10 border border-[var(--aiox-lime,#D1FF00)]/30 text-[var(--aiox-lime,#D1FF00)]">
          <Check size={28} />
        </div>
        <h2 className="font-mono text-lg font-semibold text-[var(--color-text-primary,#fff)] uppercase tracking-wider">
          Submetido!
        </h2>
        <p className="text-sm text-[var(--color-text-secondary,#999)] text-center max-w-md">
          Seu agente foi enviado para revisao. O processo leva de 2 a 7 dias uteis.
          Voce pode acompanhar o status no Seller Dashboard.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              resetWizard();
              setSubmitted(false);
              setCurrentView('marketplace-seller' as never);
            }}
            className="px-4 py-2 font-mono text-xs uppercase tracking-wider bg-[var(--aiox-lime,#D1FF00)] text-[var(--aiox-dark,#050505)] font-semibold hover:bg-[var(--aiox-lime,#D1FF00)]/90 transition-colors"
          >
            Ver Dashboard
          </button>
          <button
            type="button"
            onClick={() => {
              resetWizard();
              setSubmitted(false);
            }}
            className="px-4 py-2 font-mono text-xs uppercase tracking-wider border border-[var(--color-border-default,#333)] text-[var(--color-text-secondary,#999)] hover:text-[var(--color-text-primary,#fff)] transition-colors"
          >
            Submeter Outro
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b border-[var(--color-border-default,#333)]">
        <div className="flex items-center gap-3 mb-3">
          <button
            type="button"
            onClick={() => setCurrentView('marketplace-seller' as never)}
            className="text-[var(--color-text-muted,#666)] hover:text-[var(--color-text-primary,#fff)] transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <h1 className="font-mono text-sm font-semibold uppercase tracking-wider text-[var(--color-text-primary,#fff)]">
            Submeter Agente
          </h1>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1">
          {STEPS.map(({ step, label, icon: Icon }) => (
            <button
              key={step}
              type="button"
              onClick={() => setStep(step)}
              className={`
                flex-1 flex items-center justify-center gap-1.5 py-2
                text-[10px] font-mono uppercase tracking-wider
                border-b-2 transition-colors
                ${currentStep === step
                  ? 'border-[var(--aiox-lime,#D1FF00)] text-[var(--aiox-lime,#D1FF00)]'
                  : stepValid[step]
                    ? 'border-[var(--status-success,#4ADE80)]/50 text-[var(--status-success,#4ADE80)]'
                    : 'border-transparent text-[var(--color-text-muted,#666)] hover:text-[var(--color-text-secondary,#999)]'
                }
              `}
            >
              <Icon size={12} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {currentStep === 1 && <StepBasicInfo />}
        {currentStep === 2 && <StepAgentConfig />}
        {currentStep === 3 && <StepPricing />}
        {currentStep === 4 && <StepTesting />}
        {currentStep === 5 && <StepReview />}
      </div>

      {/* Footer Navigation */}
      <div className="shrink-0 px-4 py-3 border-t border-[var(--color-border-default,#333)] flex items-center justify-between">
        <button
          type="button"
          onClick={prevStep}
          disabled={currentStep === 1}
          className="
            flex items-center gap-1.5 px-4 py-2 font-mono text-xs uppercase tracking-wider
            border border-[var(--color-border-default,#333)]
            text-[var(--color-text-secondary,#999)]
            hover:text-[var(--color-text-primary,#fff)]
            disabled:opacity-30 disabled:cursor-not-allowed
            transition-colors
          "
        >
          <ArrowLeft size={12} />
          Anterior
        </button>

        {currentStep < 5 ? (
          <button
            type="button"
            onClick={handleNext}
            className="
              flex items-center gap-1.5 px-4 py-2 font-mono text-xs uppercase tracking-wider font-semibold
              bg-[var(--aiox-lime,#D1FF00)] text-[var(--aiox-dark,#050505)]
              hover:bg-[var(--aiox-lime,#D1FF00)]/90
              transition-colors
            "
          >
            Proximo
            <ArrowRight size={12} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!allChecked || submitting}
            className="
              flex items-center gap-1.5 px-4 py-2 font-mono text-xs uppercase tracking-wider font-semibold
              bg-[var(--aiox-lime,#D1FF00)] text-[var(--aiox-dark,#050505)]
              hover:bg-[var(--aiox-lime,#D1FF00)]/90
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
            "
          >
            {submitting ? 'Submetendo...' : 'Submeter para Aprovacao'}
            <Send size={12} />
          </button>
        )}
      </div>
    </div>
  );
}
