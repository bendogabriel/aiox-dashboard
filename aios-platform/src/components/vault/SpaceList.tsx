import { FolderOpen } from 'lucide-react';
import { CockpitCard, CockpitKpiCard, Badge } from '../ui';
import { ProgressBar } from '../ui';
import { getIconComponent } from '../../lib/icons';
import { useVaultStore } from '../../stores/vaultStore';
import type { VaultSpace } from '../../types/vault';

interface SpaceListProps {
  spaces: VaultSpace[];
}

export default function SpaceList({ spaces }: SpaceListProps) {
  const selectSpace = useVaultStore((s) => s.selectSpace);
  const selectedSpaceId = useVaultStore((s) => s.selectedSpaceId);
  const setActiveTab = useVaultStore((s) => s.setActiveTab);

  if (spaces.length === 0) {
    return (
      <div className="text-center py-12">
        <FolderOpen size={32} className="mx-auto text-tertiary mb-3" />
        <p className="text-sm text-tertiary">Nenhum space criado ainda.</p>
        <p className="text-xs text-tertiary mt-1">Spaces organizam documentos por produto, projeto ou area.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <CockpitKpiCard label="Spaces" value={spaces.length} size="sm" />
        <CockpitKpiCard
          label="Documents"
          value={spaces.reduce((sum, s) => sum + s.documentsCount, 0)}
          size="sm"
        />
        <CockpitKpiCard
          label="Tokens"
          value={`${(spaces.reduce((sum, s) => sum + s.totalTokens, 0) / 1000).toFixed(1)}k`}
          size="sm"
        />
      </div>

      {/* Space cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {spaces.map((space) => {
          const Icon = getIconComponent(space.icon || 'Folder');
          const isSelected = space.id === selectedSpaceId;

          return (
            <CockpitCard
              key={space.id}
              variant="subtle"
              padding="md"
              className={`cursor-pointer transition-all ${isSelected ? 'ring-1 ring-[var(--aiox-lime)]/50' : 'hover:bg-white/5'}`}
              onClick={() => {
                selectSpace(space.id);
                setActiveTab('documents');
              }}
              aria-label={`Space: ${space.name}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon size={20} className="text-[var(--aiox-lime)]" />
                  <div>
                    <div className="text-sm font-medium text-primary">{space.name}</div>
                    <div className="text-[10px] text-tertiary">{space.slug}</div>
                  </div>
                </div>
                <Badge variant="status" status={space.status === 'active' ? 'success' : 'offline'} size="sm">
                  {space.status}
                </Badge>
              </div>

              {space.description && (
                <p className="text-xs text-secondary mb-3 line-clamp-2">{space.description}</p>
              )}

              <div className="flex items-center justify-between text-xs text-tertiary mb-2">
                <span>{space.documentsCount} docs</span>
                <span>{(space.totalTokens / 1000).toFixed(1)}k tokens</span>
              </div>

              <ProgressBar
                value={space.healthPercent}
                size="sm"
                variant={space.healthPercent >= 80 ? 'success' : space.healthPercent >= 50 ? 'default' : 'error'}
              />
            </CockpitCard>
          );
        })}
      </div>
    </div>
  );
}
