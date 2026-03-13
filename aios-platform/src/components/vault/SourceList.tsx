import { Cloud, CloudOff, HardDrive, RefreshCw } from 'lucide-react';
import { CockpitCard, Badge, StatusDot } from '../ui';
import type { DataSource, SourceType } from '../../types/vault';

interface SourceListProps {
  sources: DataSource[];
}

const SOURCE_ICONS: Record<SourceType, React.ElementType> = {
  manual: HardDrive,
  google_drive: Cloud,
  notion: Cloud,
  claude_memory: Cloud,
  api: Cloud,
  file_upload: HardDrive,
};

const SOURCE_LABELS: Record<SourceType, string> = {
  manual: 'Manual Upload',
  google_drive: 'Google Drive',
  notion: 'Notion',
  claude_memory: 'Claude Memory',
  api: 'API',
  file_upload: 'File Upload',
};

const STATUS_MAP: Record<string, 'success' | 'error' | 'waiting' | 'offline'> = {
  connected: 'success',
  disconnected: 'offline',
  syncing: 'waiting',
  error: 'error',
};

export default function SourceList({ sources }: SourceListProps) {
  if (sources.length === 0) {
    return (
      <div className="text-center py-12">
        <CloudOff size={32} className="mx-auto text-tertiary mb-3" />
        <p className="text-sm text-tertiary">Nenhuma fonte de dados configurada.</p>
        <p className="text-xs text-tertiary mt-1">Conectores serao adicionados na Phase 2.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sources.map((source) => {
        const Icon = SOURCE_ICONS[source.type] || Cloud;
        const formatDate = (iso: string | null) => {
          if (!iso) return 'Never';
          try {
            return new Date(iso).toLocaleDateString('pt-BR', {
              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
            });
          } catch { return iso; }
        };

        return (
          <CockpitCard
            key={source.id}
            variant="subtle"
            padding="md"
            aria-label={`Source: ${source.name}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Icon size={20} className="text-secondary" />
                <div>
                  <div className="text-sm font-medium text-primary">{source.name}</div>
                  <div className="text-[10px] text-tertiary">{SOURCE_LABELS[source.type]}</div>
                </div>
              </div>
              <StatusDot
                status={STATUS_MAP[source.status] || 'offline'}
                size="sm"
                label={source.status}
              />
            </div>

            <div className="space-y-2 text-xs text-tertiary">
              <div className="flex justify-between">
                <span>Documents</span>
                <span className="text-secondary">{source.documentsCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Last sync</span>
                <span className="text-secondary">{formatDate(source.lastSyncAt)}</span>
              </div>
            </div>

            {source.status === 'syncing' && (
              <div className="mt-3 flex items-center gap-1.5 text-xs text-[var(--bb-warning)]">
                <RefreshCw size={12} className="animate-spin" />
                <span>Sincronizando...</span>
              </div>
            )}
          </CockpitCard>
        );
      })}

      {/* Add Source placeholder */}
      <CockpitCard
        variant="subtle"
        padding="md"
        className="border-dashed border-white/10 flex items-center justify-center min-h-[120px] opacity-50 cursor-not-allowed"
      >
        <div className="text-center">
          <Cloud size={24} className="mx-auto text-tertiary mb-2" />
          <p className="text-xs text-tertiary">Add Source</p>
          <Badge variant="subtle" size="sm" className="mt-1">Phase 2</Badge>
        </div>
      </CockpitCard>
    </div>
  );
}
