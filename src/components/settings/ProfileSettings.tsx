import { useState, useRef, useEffect, useCallback } from 'react';
import { CockpitCard, CockpitButton, CockpitInput } from '../ui';
import { useToast } from '../ui/Toast';
import { SettingRow } from './SettingsHelpers';
import { Crown, Shield, Zap, Lock, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  getTier, getTierLabel, setTierOverride, isMaster, setMasterMode,
  getAllTiers, getExclusiveFeatures, onTierChange,
  type Tier,
} from '../../lib/tier';

export function ProfileSettings() {
  const [name, setName] = useState('Rafael Costa');
  const [email, setEmail] = useState('rafael@example.com');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { success, error: showError } = useToast();

  // Tier state
  const [currentTier, setCurrentTier] = useState<Tier>(getTier());
  const [masterMode, setMaster] = useState(isMaster());

  useEffect(() => {
    return onTierChange((t) => setCurrentTier(t));
  }, []);

  const handleTierChange = useCallback((tier: Tier) => {
    setTierOverride(tier);
    setCurrentTier(tier);
    success('Plano alterado', `Agora usando: ${tier.charAt(0).toUpperCase() + tier.slice(1)}`);
    // Force re-render across the app
    window.dispatchEvent(new CustomEvent('tier-changed', { detail: tier }));
  }, [success]);

  const handleMasterToggle = useCallback(() => {
    const next = !masterMode;
    setMasterMode(next);
    setMaster(next);
    if (next) {
      success('Master Mode', 'Acesso total habilitado');
    }
    setCurrentTier(getTier());
    window.dispatchEvent(new CustomEvent('tier-changed', { detail: getTier() }));
  }, [masterMode, success]);

  const handleSave = () => {
    success('Salvo!', 'Perfil atualizado com sucesso');
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showError('Formato inválido', 'Selecione um arquivo JPG ou PNG');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showError('Arquivo muito grande', 'O tamanho máximo é 2MB');
      return;
    }

    const url = URL.createObjectURL(file);
    setAvatarUrl(url);
    success('Foto atualizada', 'A foto do perfil foi alterada');
  };

  return (
    <div className="space-y-6">
      <CockpitCard>
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="h-20 w-20 rounded-none bg-gradient-to-br from-[var(--aiox-lime)] to-[var(--aiox-gray-muted)] flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              name.split(' ').map(n => n[0]).join('').slice(0, 2)
            )}
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={handlePhotoChange}
            />
            <CockpitButton variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
              Alterar foto
            </CockpitButton>
            <p className="text-xs text-tertiary mt-1">JPG, PNG. Max 2MB</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-secondary mb-2">Nome completo</label>
            <CockpitInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
            />
          </div>

          <div>
            <label className="block text-sm text-secondary mb-2">Email</label>
            <CockpitInput
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
            />
          </div>
        </div>
      </CockpitCard>

      <CockpitCard>
        <h2 className="text-lg font-semibold text-primary mb-4">Preferências de Conta</h2>

        <div className="space-y-4">
          <SettingRow
            label="Idioma"
            description="Idioma da interface"
            action={
              <select className="p-2 rounded-lg text-sm border border-white/10 bg-[#1a1a1a] text-white cursor-pointer" aria-label="Selecionar idioma">
                <option value="pt-BR">Português (BR)</option>
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            }
          />

          <SettingRow
            label="Fuso horário"
            description="Para exibição de datas e horários"
            action={
              <select className="p-2 rounded-lg text-sm border border-white/10 bg-[#1a1a1a] text-white cursor-pointer" aria-label="Selecionar fuso horário">
                <option value="America/Sao_Paulo">São Paulo (GMT-3)</option>
                <option value="America/New_York">New York (GMT-5)</option>
                <option value="Europe/London">London (GMT+0)</option>
              </select>
            }
          />
        </div>
      </CockpitCard>

      {/* Plan & Access */}
      <CockpitCard>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Crown size={18} className="text-[var(--aiox-lime)]" />
            <h2 className="text-lg font-semibold text-primary">Plano & Acesso</h2>
          </div>
          {masterMode && (
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-[var(--aiox-lime)]/10 text-[var(--aiox-lime)] border border-[var(--aiox-lime)]/20 font-mono">
              Master
            </span>
          )}
        </div>

        {/* Tier Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {(getAllTiers() as Tier[]).map((tier) => {
            const isActive = currentTier === tier;
            const exclusive = getExclusiveFeatures(tier);
            const tierConfig: Record<Tier, { icon: React.ReactNode; color: string; bg: string; border: string; label: string; desc: string }> = {
              free: {
                icon: <Lock size={16} />,
                color: 'text-zinc-400',
                bg: 'bg-zinc-500/5',
                border: isActive ? 'border-zinc-400/50' : 'border-white/5',
                label: 'Free',
                desc: 'Funcionalidades essenciais',
              },
              pro: {
                icon: <Zap size={16} />,
                color: 'text-[var(--aiox-blue)]',
                bg: 'bg-[var(--aiox-blue)]/5',
                border: isActive ? 'border-[var(--aiox-blue)]/50' : 'border-white/5',
                label: 'Pro',
                desc: 'Todas as ferramentas',
              },
              enterprise: {
                icon: <Shield size={16} />,
                color: 'text-[var(--aiox-lime)]',
                bg: 'bg-[var(--aiox-lime)]/5',
                border: isActive ? 'border-[var(--aiox-lime)]/50' : 'border-white/5',
                label: 'Enterprise',
                desc: 'Recursos avancados + SSO',
              },
            };
            const cfg = tierConfig[tier];

            return (
              <button
                key={tier}
                onClick={() => handleTierChange(tier)}
                className={cn(
                  'relative p-4 rounded-none border text-left transition-all',
                  cfg.bg, cfg.border,
                  isActive && 'ring-1 ring-white/10',
                  'hover:bg-white/5'
                )}
              >
                {isActive && (
                  <div className="absolute top-2 right-2">
                    <Check size={14} className={cfg.color} />
                  </div>
                )}
                <div className={cn('mb-2', cfg.color)}>{cfg.icon}</div>
                <p className={cn('text-sm font-semibold', cfg.color)}>{cfg.label}</p>
                <p className="text-[11px] text-tertiary mt-1">{cfg.desc}</p>
                {exclusive.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {exclusive.slice(0, 4).map(f => (
                      <p key={f} className="text-[10px] text-secondary font-mono">+ {f}</p>
                    ))}
                    {exclusive.length > 4 && (
                      <p className="text-[10px] text-tertiary font-mono">+{exclusive.length - 4} mais</p>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Master Mode Toggle */}
        <div className={cn(
          'p-4 rounded-none border transition-all',
          masterMode
            ? 'bg-[var(--aiox-lime)]/5 border-[var(--aiox-lime)]/20'
            : 'bg-white/[0.02] border-white/5',
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crown size={18} className={masterMode ? 'text-[var(--aiox-lime)]' : 'text-tertiary'} />
              <div>
                <p className="text-sm font-semibold text-primary">Master Mode</p>
                <p className="text-xs text-tertiary">
                  Acesso total a todos os recursos. Permite alternar entre planos para testar.
                </p>
              </div>
            </div>
            <button
              onClick={handleMasterToggle}
              className={cn(
                'relative w-11 h-6 rounded-full transition-colors duration-200',
                masterMode ? 'bg-[var(--aiox-lime)]' : 'bg-white/10',
              )}
              role="switch"
              aria-checked={masterMode}
              aria-label="Ativar Master Mode"
            >
              <span
                className={cn(
                  'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-black transition-transform duration-200',
                  masterMode && 'translate-x-5',
                )}
              />
            </button>
          </div>
        </div>
      </CockpitCard>

      <div className="flex justify-end">
        <CockpitButton variant="primary" onClick={handleSave}>
          Salvar alterações
        </CockpitButton>
      </div>
    </div>
  );
}
