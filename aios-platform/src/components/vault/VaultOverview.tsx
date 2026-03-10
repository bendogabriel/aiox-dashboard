import { Shield, FileText, Layout, Plus } from 'lucide-react';
import { GlassCard, GlassButton, Badge, ProgressBar } from '../ui';
import { cn } from '../../lib/utils';
import { useVaultStore } from '../../stores/vaultStore';
import type { VaultWorkspace, VaultActivityType } from '../../types/vault';

// ── Props ──

interface VaultOverviewProps {
  searchQuery?: string;
  onSelectWorkspace: (id: string) => void;
}

// ── Helpers ──

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

const activityTypeColors: Record<VaultActivityType, string> = {
  taxonomy_updated: 'text-blue-400',
  template_created: 'text-green-400',
  document_ingested: 'text-purple-400',
  document_validated: 'text-emerald-400',
  workspace_created: 'text-yellow-400',
  csuite_activated: 'text-orange-400',
};

const activityDotBg: Record<VaultActivityType, string> = {
  taxonomy_updated: 'bg-blue-400',
  template_created: 'bg-green-400',
  document_ingested: 'bg-purple-400',
  document_validated: 'bg-emerald-400',
  workspace_created: 'bg-yellow-400',
  csuite_activated: 'bg-orange-400',
};

const statusBadge: Record<VaultWorkspace['status'], { label: string; status: 'success' | 'warning' | 'offline' }> = {
  active: { label: 'Active', status: 'success' },
  setup: { label: 'Setup', status: 'warning' },
  inactive: { label: 'Inactive', status: 'offline' },
};

const healthVariant = (percent: number): 'success' | 'warning' | 'error' => {
  if (percent >= 70) return 'success';
  if (percent >= 40) return 'warning';
  return 'error';
};

// ── Component ──

export default function VaultOverview({ searchQuery = '', onSelectWorkspace }: VaultOverviewProps) {
  const { workspaces, activities } = useVaultStore();

  const filteredWorkspaces = searchQuery
    ? workspaces.filter((w) => w.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : workspaces;

  const hasEnterprise = workspaces.some((w) => w.status === 'active');
  const totalDocs = workspaces.reduce((sum, w) => sum + w.documentsCount, 0);
  const totalTemplates = workspaces.reduce((sum, w) => sum + w.templatesCount, 0);
  const recentActivities = activities.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-3 gap-3">
        <GlassCard padding="sm" aria-label="Enterprise status">
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex items-center justify-center w-9 h-9 rounded-lg',
              hasEnterprise ? 'bg-green-500/15 text-green-400' : 'bg-gray-500/15 text-gray-400'
            )}>
              <Shield className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-tertiary truncate">Enterprise Status</p>
              <p className={cn(
                'text-sm font-semibold',
                hasEnterprise ? 'text-green-400' : 'text-gray-400'
              )}>
                {hasEnterprise ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>
        </GlassCard>

        <GlassCard padding="sm" aria-label="Total documents">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-500/15 text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-tertiary truncate">Total Documents</p>
              <p className="text-sm font-semibold text-primary">{totalDocs}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard padding="sm" aria-label="Total templates">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-purple-500/15 text-purple-400">
              <Layout className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-tertiary truncate">Total Templates</p>
              <p className="text-sm font-semibold text-primary">{totalTemplates}</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* ── Workspaces ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-primary">Workspaces</h3>
          <GlassButton variant="ghost" size="sm" disabled leftIcon={<Plus className="w-4 h-4" />}>
            Novo Workspace
          </GlassButton>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredWorkspaces.map((ws) => {
            const badge = statusBadge[ws.status];
            return (
              <GlassCard
                key={ws.id}
                interactive
                padding="sm"
                className="cursor-pointer"
                aria-label={`Workspace ${ws.name}`}
                onClick={() => onSelectWorkspace(ws.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg flex-shrink-0" aria-hidden="true">{ws.icon}</span>
                    <span className="text-sm font-medium text-primary truncate">{ws.name}</span>
                  </div>
                  <Badge variant="status" status={badge.status} size="sm">
                    {badge.label}
                  </Badge>
                </div>

                <p className="text-xs text-tertiary mb-2">
                  {ws.documentsCount} docs
                </p>

                <ProgressBar
                  value={ws.healthPercent}
                  size="sm"
                  variant={healthVariant(ws.healthPercent)}
                  showLabel
                  label="Health"
                />
              </GlassCard>
            );
          })}
        </div>
      </section>

      {/* ── Atividade Recente ── */}
      <section>
        <h3 className="text-sm font-semibold text-primary mb-3">Atividade Recente</h3>

        <GlassCard padding="sm" aria-label="Recent activity feed">
          {recentActivities.length === 0 ? (
            <p className="text-xs text-tertiary text-center py-4">Nenhuma atividade recente</p>
          ) : (
            <ul className="space-y-3">
              {recentActivities.map((activity) => (
                <li key={activity.id} className="flex items-start gap-2.5">
                  <span
                    className={cn(
                      'mt-1.5 w-2 h-2 rounded-full flex-shrink-0',
                      activityDotBg[activity.type]
                    )}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-xs', activityTypeColors[activity.type])}>
                      {activity.description}
                    </p>
                  </div>
                  <span className="text-[10px] text-tertiary flex-shrink-0">
                    {timeAgo(activity.timestamp)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      </section>
    </div>
  );
}
