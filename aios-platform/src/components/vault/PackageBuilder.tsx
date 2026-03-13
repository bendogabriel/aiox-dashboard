import { useState, useEffect } from 'react';
import { Package, Plus, Play, Download, Loader2, Trash2 } from 'lucide-react';
import { CockpitCard, CockpitButton, CockpitKpiCard, Badge } from '../ui';
import { vaultApiService } from '../../services/api/vault';
import type { ContextPackageRow } from '../../services/api/vault';

interface PackageBuilderProps {
  workspaceId: string;
}

export default function PackageBuilder({ workspaceId }: PackageBuilderProps) {
  const [packages, setPackages] = useState<ContextPackageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [buildingId, setBuildingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    loadPackages();
  }, [workspaceId]);

  const loadPackages = async () => {
    setLoading(true);
    try {
      const data = await vaultApiService.listPackages(workspaceId);
      setPackages(data);
    } catch {
      // Fallback to empty
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await vaultApiService.createPackage({
        workspaceId,
        name: newName.trim(),
        description: newDesc.trim(),
      });
      setNewName('');
      setNewDesc('');
      setShowCreate(false);
      await loadPackages();
    } catch {
      // Handle error
    } finally {
      setCreating(false);
    }
  };

  const handleBuild = async (id: string) => {
    setBuildingId(id);
    try {
      await vaultApiService.buildPackage(id);
      await loadPackages();
    } catch {
      // Handle error
    } finally {
      setBuildingId(null);
    }
  };

  const handleExport = async (id: string, format: 'markdown' | 'json' | 'yaml') => {
    try {
      const content = await vaultApiService.exportPackage(id, format);
      const ext = format === 'markdown' ? 'md' : format;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `package.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Handle error
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await vaultApiService.deletePackage(id);
      setPackages((prev) => prev.filter((p) => p.id !== id));
    } catch {
      // Handle error
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-tertiary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package size={16} className="text-[var(--aiox-lime)]" />
          <span className="text-xs text-tertiary uppercase tracking-wider">Context Packages</span>
        </div>
        <CockpitButton
          size="sm"
          variant="ghost"
          leftIcon={<Plus size={14} />}
          onClick={() => setShowCreate(true)}
        >
          New Package
        </CockpitButton>
      </div>

      {/* Create form */}
      {showCreate && (
        <CockpitCard variant="subtle" padding="md">
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Package name (e.g. CMO Kit, Copywriter Context)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-sm text-primary placeholder-tertiary focus:outline-none focus:border-[var(--aiox-lime)]/50"
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-sm text-primary placeholder-tertiary focus:outline-none focus:border-[var(--aiox-lime)]/50"
            />
            <div className="flex justify-end gap-2">
              <CockpitButton size="sm" variant="ghost" onClick={() => setShowCreate(false)}>Cancel</CockpitButton>
              <CockpitButton size="sm" variant="primary" onClick={handleCreate} disabled={!newName.trim() || creating}>
                {creating ? <Loader2 size={14} className="animate-spin" /> : 'Create'}
              </CockpitButton>
            </div>
          </div>
        </CockpitCard>
      )}

      {/* Package list */}
      {packages.length === 0 && !showCreate ? (
        <div className="text-center py-12">
          <Package size={32} className="mx-auto text-tertiary mb-3" />
          <p className="text-sm text-tertiary">Nenhum context package criado.</p>
          <p className="text-xs text-tertiary mt-1">Packages agrupam documentos em bundles AI-ready para agentes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {packages.map((pkg) => (
            <CockpitCard key={pkg.id} variant="subtle" padding="md">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="text-sm font-medium text-primary">{pkg.name}</h4>
                  {pkg.description && <p className="text-xs text-tertiary mt-0.5">{pkg.description}</p>}
                </div>
                <Badge variant="status" status={pkg.status === 'built' ? 'success' : 'warning'} size="sm">
                  {pkg.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3 text-xs text-tertiary">
                <div>
                  <span className="text-secondary font-medium">{pkg.document_count}</span> docs
                </div>
                <div>
                  <span className="text-secondary font-medium">{(pkg.total_tokens / 1000).toFixed(1)}k</span> tokens
                </div>
              </div>

              <div className="flex items-center gap-2">
                <CockpitButton
                  size="sm"
                  variant="ghost"
                  leftIcon={buildingId === pkg.id ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                  onClick={() => handleBuild(pkg.id)}
                  disabled={buildingId === pkg.id}
                >
                  Build
                </CockpitButton>
                {pkg.total_tokens > 0 && (
                  <CockpitButton
                    size="sm"
                    variant="ghost"
                    leftIcon={<Download size={12} />}
                    onClick={() => handleExport(pkg.id, 'markdown')}
                  >
                    Export
                  </CockpitButton>
                )}
                <CockpitButton
                  size="sm"
                  variant="ghost"
                  className="ml-auto text-[var(--bb-error)]"
                  onClick={() => handleDelete(pkg.id)}
                >
                  <Trash2 size={12} />
                </CockpitButton>
              </div>
            </CockpitCard>
          ))}
        </div>
      )}
    </div>
  );
}
