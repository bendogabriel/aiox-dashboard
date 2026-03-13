import { CockpitCard, CockpitButton } from '../ui';
import { useToast } from '../ui/Toast';
import { SettingToggle } from './SettingsHelpers';

export function PrivacySettings() {
  const { success } = useToast();

  return (
    <div className="space-y-6">
      <CockpitCard>
        <h2 className="text-lg font-semibold text-primary mb-4">Dados e Privacidade</h2>

        <div className="space-y-4">
          <SettingToggle
            label="Salvar histórico"
            description="Manter histórico de conversas localmente"
            defaultChecked={true}
          />

          <SettingToggle
            label="Analytics"
            description="Enviar dados de uso anônimos para melhorias"
            defaultChecked={false}
          />

          <SettingToggle
            label="Logs de debug"
            description="Armazenar logs para diagnóstico"
            defaultChecked={false}
          />
        </div>
      </CockpitCard>

      <CockpitCard>
        <h2 className="text-lg font-semibold text-primary mb-4">Gerenciar Dados</h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-none glass-subtle">
            <div>
              <p className="text-primary font-medium">Exportar dados</p>
              <p className="text-xs text-tertiary">Baixar todos os seus dados</p>
            </div>
            <CockpitButton variant="ghost" size="sm">
              Exportar
            </CockpitButton>
          </div>

          <div className="flex items-center justify-between p-3 rounded-none glass-subtle">
            <div>
              <p className="text-primary font-medium">Limpar histórico</p>
              <p className="text-xs text-tertiary">Remover todas as conversas</p>
            </div>
            <CockpitButton
              variant="ghost"
              size="sm"
              className="text-[var(--bb-error)] hover:bg-[var(--bb-error)]/10"
              onClick={() => success('Histórico limpo', 'Todas as conversas foram removidas')}
            >
              Limpar
            </CockpitButton>
          </div>

          <div className="flex items-center justify-between p-3 rounded-none border border-[var(--bb-error)]/20 bg-[var(--bb-error)]/5">
            <div>
              <p className="text-[var(--bb-error)] font-medium">Excluir conta</p>
              <p className="text-xs text-tertiary">Remover permanentemente sua conta</p>
            </div>
            <CockpitButton
              variant="ghost"
              size="sm"
              className="text-[var(--bb-error)] hover:bg-[var(--bb-error)]/10"
            >
              Excluir
            </CockpitButton>
          </div>
        </div>
      </CockpitCard>
    </div>
  );
}
