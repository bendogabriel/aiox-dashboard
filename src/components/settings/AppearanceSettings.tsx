import { useState } from 'react';
import { CockpitCard, ThemeToggleSwitch } from '../ui';
import { useUIStore } from '../../stores/uiStore';
import { useToast } from '../ui/Toast';
import { ThemeIcons } from '../../lib/icons';
import { cn } from '../../lib/utils';
import { SettingRow, SettingToggle, CheckIcon } from './SettingsHelpers';

const themes = [
  { id: 'light' as const, label: 'Claro', description: 'Interface clara para ambientes iluminados' },
  { id: 'dark' as const, label: 'Escuro', description: 'Interface escura para conforto visual' },
  { id: 'glass' as const, label: 'Liquid Glass', description: 'Painéis de vidro fosco sobre fundo colorido vibrante' },
  { id: 'matrix' as const, label: 'Matrix', description: 'Verde neon sobre preto — modo hacker' },
  { id: 'aiox' as const, label: 'AIOX Cockpit', description: 'Dark cockpit com acento neon lime — técnico premium' },
  { id: 'aiox-gold' as const, label: 'AIOX Gold', description: 'Dark cockpit com acento champagne gold — enterprise premium' },
  { id: 'system' as const, label: 'Sistema', description: 'Segue as preferências do sistema' },
];

const accentPresets = [
  { label: 'Blue', value: '#3B82F6' },
  { label: 'Purple', value: 'var(--aiox-gray-muted)' },
  { label: 'Emerald', value: 'var(--color-status-success)' },
  { label: 'Rose', value: 'var(--bb-flare)' },
  { label: 'Amber', value: 'var(--bb-warning)' },
  { label: 'Cyan', value: 'var(--aiox-blue)' },
  { label: 'Lime', value: 'var(--aiox-lime)' },
  { label: 'Orange', value: 'var(--bb-flare)' },
];

function AccentColorPicker() {
  const [active, setActive] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('aios-accent-color') || '#3B82F6';
    }
    return '#3B82F6';
  });

  const applyAccent = (color: string) => {
    setActive(color);
    localStorage.setItem('aios-accent-color', color);
    document.documentElement.style.setProperty('--color-accent', color);
    document.documentElement.style.setProperty('--color-accent-light', color + '33');
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {accentPresets.map((preset) => (
          <button
            key={preset.value}
            onClick={() => applyAccent(preset.value)}
            className={cn(
              'w-8 h-8 rounded-lg border-2 transition-all hover:scale-110',
              active === preset.value ? 'border-white shadow-lg scale-110' : 'border-transparent'
            )}
            style={{ backgroundColor: preset.value }}
            title={preset.label}
            aria-label={`Cor ${preset.label}`}
          />
        ))}
      </div>
      <div className="flex items-center gap-3">
        <label className="text-xs text-secondary" htmlFor="custom-accent">Custom:</label>
        <input
          id="custom-accent"
          type="color"
          value={active}
          onChange={(e) => applyAccent(e.target.value)}
          className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
        />
        <span className="text-xs text-tertiary font-mono">{active}</span>
      </div>
    </div>
  );
}

export function AppearanceSettings() {
  const { theme, setTheme } = useUIStore();
  const { success } = useToast();

  return (
    <div className="space-y-6">
      <CockpitCard>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-primary">Tema</h2>
            <p className="text-sm text-tertiary mt-1">Escolha o visual da interface</p>
          </div>
          <ThemeToggleSwitch />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {themes.map((t) => {
            const isActive = theme === t.id;
            const isMatrixCard = t.id === 'matrix';
            const isCockpitCard = t.id === 'glass';
            const isAioxCard = t.id === 'aiox';
            const isAioxGoldCard = t.id === 'aiox-gold';
            return (
              <button
                key={t.id}
                onClick={() => {
                  setTheme(t.id as 'light' | 'dark' | 'system' | 'matrix' | 'glass' | 'aiox' | 'aiox-gold');
                  success('Tema alterado', `Tema ${t.label} aplicado`);
                }}
                className={cn(
                  'p-4 rounded-none border-2 transition-all text-center group',
                  isActive && isMatrixCard
                    ? 'border-[var(--color-status-success)] bg-[var(--color-status-success)]/10'
                    : isActive && isCockpitCard
                    ? 'border-[var(--aiox-gray-muted)] bg-[var(--aiox-gray-muted)]/10'
                    : isActive && isAioxCard
                    ? 'border-[var(--aiox-lime)] bg-[var(--aiox-lime)]/10'
                    : isActive && isAioxGoldCard
                    ? 'border-[#DDD1BB] bg-[#DDD1BB]/10'
                    : isActive
                    ? 'border-[var(--aiox-blue)] bg-[var(--aiox-blue)]/10'
                    : 'border-transparent glass-subtle hover:border-white/20'
                )}
              >
                <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform">
                  {(() => { const Icon = ThemeIcons[t.id]; return <Icon size={24} />; })()}
                </span>
                <span className="text-sm text-primary font-medium">{t.label}</span>
                <p className="text-[10px] text-tertiary mt-1 leading-tight">{t.description}</p>
                {isActive && (
                  <div className={cn(
                    'mt-2',
                    isMatrixCard ? 'text-[var(--color-status-success)]' : isCockpitCard ? 'text-[var(--aiox-gray-muted)]' : isAioxCard ? 'text-[var(--aiox-lime)]' : isAioxGoldCard ? 'text-[#DDD1BB]' : 'text-[var(--aiox-blue)]'
                  )}>
                    <CheckIcon />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </CockpitCard>

      <CockpitCard>
        <h2 className="text-lg font-semibold text-primary mb-4">Interface</h2>

        <div className="space-y-4">
          <SettingToggle
            label="Sidebar compacta"
            description="Reduzir largura da sidebar"
            defaultChecked={false}
          />

          <SettingToggle
            label="Animações"
            description="Ativar animações de transição"
            defaultChecked={true}
          />

          <SettingToggle
            label="Painel de atividades"
            description="Mostrar painel lateral direito"
            defaultChecked={true}
          />

          <SettingRow
            label="Densidade"
            description="Espaçamento entre elementos"
            action={
              <select className="p-2 rounded-lg text-sm border border-white/10 bg-[#1a1a1a] text-white cursor-pointer" aria-label="Selecionar densidade">
                <option value="comfortable">Confortável</option>
                <option value="compact">Compacto</option>
              </select>
            }
          />
        </div>
      </CockpitCard>

      <CockpitCard>
        <h2 className="text-lg font-semibold text-primary mb-4">Cor de Acento</h2>
        <p className="text-xs text-tertiary mb-4">Escolha uma cor de destaque para botões e indicadores</p>
        <AccentColorPicker />
      </CockpitCard>

      <CockpitCard>
        <h2 className="text-lg font-semibold text-primary mb-4">Fontes</h2>

        <div className="space-y-4">
          <SettingRow
            label="Tamanho da fonte"
            description="Tamanho base do texto"
            action={
              <select className="p-2 rounded-lg text-sm border border-white/10 bg-[#1a1a1a] text-white cursor-pointer" aria-label="Selecionar tamanho da fonte">
                <option value="sm">Pequeno</option>
                <option value="md">Médio</option>
                <option value="lg">Grande</option>
              </select>
            }
          />

          <SettingRow
            label="Fonte do código"
            description="Fonte para blocos de código"
            action={
              <select className="p-2 rounded-lg text-sm border border-white/10 bg-[#1a1a1a] text-white cursor-pointer" aria-label="Selecionar fonte do código">
                <option value="fira">Fira Code</option>
                <option value="jetbrains">JetBrains Mono</option>
                <option value="source">Source Code Pro</option>
              </select>
            }
          />
        </div>
      </CockpitCard>
    </div>
  );
}
