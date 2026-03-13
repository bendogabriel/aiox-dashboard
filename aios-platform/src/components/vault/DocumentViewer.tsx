import { useState } from 'react';
import { Pencil, Eye, Save, X, CheckCircle } from 'lucide-react';
import { CockpitCard, CockpitButton, CockpitTextarea, Badge, ProgressBar } from '../ui';
import { cn } from '../../lib/utils';
import type { VaultDocument } from '../../types/vault';
import { useVaultStore } from '../../stores/vaultStore';

// ── Type badge color map ──

const typeBadgeColors: Record<string, string> = {
  offerbook: 'bg-[var(--color-status-success)]/15 text-[var(--color-status-success)]',
  brand: 'bg-[var(--bb-flare)]/15 text-[var(--bb-flare)]',
  narrative: 'bg-[var(--aiox-gray-muted)]/15 text-[var(--aiox-gray-muted)]',
  strategy: 'bg-[var(--aiox-blue)]/15 text-[var(--aiox-blue)]',
  diagnostic: 'bg-[var(--bb-warning)]/15 text-[var(--bb-warning)]',
  proof: 'bg-[var(--color-status-success)]/15 text-[var(--color-status-success)]',
  template: 'bg-[var(--aiox-blue)]/15 text-[var(--aiox-blue)]',
  generic: 'bg-[var(--aiox-gray-dim)]/15 text-tertiary',
  sop: 'bg-[var(--aiox-blue)]/15 text-[var(--aiox-blue)]',
  reference: 'bg-[var(--aiox-gray-muted)]/15 text-[var(--aiox-gray-muted)]',
  raw: 'bg-[var(--aiox-gray-dim)]/15 text-tertiary',
};

// ── Status badge mapping ──

const statusBadgeMap: Record<string, { label: string; status: 'success' | 'warning' | 'error' }> = {
  validated: { label: 'Validated', status: 'success' },
  draft: { label: 'Draft', status: 'warning' },
  outdated: { label: 'Outdated', status: 'error' },
  raw: { label: 'Raw', status: 'warning' },
  stale: { label: 'Stale', status: 'error' },
  archived: { label: 'Archived', status: 'error' },
};

// ── Simple markdown renderer ──

function renderMarkdown(content: string) {
  return content.split('\n').map((line, i) => {
    if (line.startsWith('### ')) return <h3 key={i} className="text-sm font-semibold text-primary mt-3 mb-1">{parseBold(line.slice(4))}</h3>;
    if (line.startsWith('## ')) return <h2 key={i} className="text-base font-semibold text-primary mt-4 mb-1">{parseBold(line.slice(3))}</h2>;
    if (line.startsWith('# ')) return <h1 key={i} className="text-lg font-bold text-primary mt-4 mb-2">{parseBold(line.slice(2))}</h1>;
    if (line.startsWith('- ')) return <li key={i} className="text-sm text-secondary ml-4 list-disc">{parseBold(line.slice(2))}</li>;
    if (line.trim() === '') return <div key={i} className="h-2" />;
    return <p key={i} className="text-sm text-secondary leading-relaxed">{parseBold(line)}</p>;
  });
}

/** Parse **bold** segments within a line */
function parseBold(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-primary">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

// ── Props ──

interface DocumentViewerProps {
  document: VaultDocument;
  onSave?: (id: string, content: string) => void;
}

// ── Component ──

function DocumentViewer({ document, onSave }: DocumentViewerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(document.content);

  const handleSave = () => {
    onSave?.(document.id, editContent);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditContent(document.content);
    setIsEditing(false);
  };

  const statusInfo = statusBadgeMap[document.status];

  return (
    <div className="flex flex-col gap-4">
      {/* ── Metadata Bar ── */}
      <CockpitCard padding="sm" aria-label="Document metadata">
        <div className="flex flex-row flex-wrap items-center gap-3">
          {/* Type badge */}
          <Badge className={cn(typeBadgeColors[document.type])}>
            {document.type}
          </Badge>

          {/* Token count */}
          <span className="text-xs text-tertiary">
            <span className="font-medium text-secondary">{document.tokenCount.toLocaleString()}</span> tokens
          </span>

          {/* Source */}
          <span className="text-xs text-tertiary">
            Source: <span className="text-secondary">{document.source}</span>
          </span>

          {/* Status */}
          <Badge variant="status" status={statusInfo.status}>
            {statusInfo.label}
          </Badge>

          {/* Taxonomy path */}
          <Badge variant="subtle" className="font-mono text-[10px]">
            {document.taxonomy}
          </Badge>
        </div>
      </CockpitCard>

      {/* ── Content Area ── */}
      <CockpitCard aria-label="Document content">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-primary">{document.name}</h2>
          {isEditing ? (
            <CockpitButton
              variant="ghost"
              size="sm"
              leftIcon={<Eye className="w-4 h-4" />}
              onClick={() => setIsEditing(false)}
              aria-label="Switch to preview mode"
            >
              Preview
            </CockpitButton>
          ) : (
            <CockpitButton
              variant="ghost"
              size="sm"
              leftIcon={<Pencil className="w-4 h-4" />}
              onClick={() => {
                setEditContent(document.content);
                setIsEditing(true);
              }}
              aria-label="Switch to edit mode"
            >
              Edit
            </CockpitButton>
          )}
        </div>

        {/* Content */}
        {isEditing ? (
          <div className="flex flex-col gap-3">
            <CockpitTextarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
              aria-label="Document content editor"
            />
            <div className="flex items-center gap-2 justify-end">
              <CockpitButton
                variant="ghost"
                size="sm"
                leftIcon={<X className="w-4 h-4" />}
                onClick={handleCancel}
                aria-label="Cancel editing"
              >
                Cancel
              </CockpitButton>
              <CockpitButton
                variant="primary"
                size="sm"
                leftIcon={<Save className="w-4 h-4" />}
                onClick={handleSave}
                aria-label="Save document"
              >
                Save
              </CockpitButton>
            </div>
          </div>
        ) : (
          <div className="prose-vault">{renderMarkdown(document.content)}</div>
        )}
      </CockpitCard>

      {/* ── Quality Scores ── */}
      {document.quality && (document.quality.completeness > 0 || document.quality.freshness > 0) && (
        <CockpitCard padding="sm" aria-label="Quality scores">
          <span className="text-xs text-tertiary font-medium block mb-2">Quality</span>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="flex justify-between text-[10px] text-tertiary mb-1">
                <span>Completeness</span>
                <span>{document.quality.completeness}%</span>
              </div>
              <ProgressBar value={document.quality.completeness} size="sm" variant={document.quality.completeness >= 80 ? 'success' : 'default'} />
            </div>
            <div>
              <div className="flex justify-between text-[10px] text-tertiary mb-1">
                <span>Freshness</span>
                <span>{document.quality.freshness}%</span>
              </div>
              <ProgressBar value={document.quality.freshness} size="sm" variant={document.quality.freshness >= 80 ? 'success' : 'default'} />
            </div>
            <div>
              <div className="flex justify-between text-[10px] text-tertiary mb-1">
                <span>Consistency</span>
                <span>{document.quality.consistency}%</span>
              </div>
              <ProgressBar value={document.quality.consistency} size="sm" variant={document.quality.consistency >= 80 ? 'success' : 'default'} />
            </div>
          </div>
        </CockpitCard>
      )}

      {/* ── Tags ── */}
      {document.tags && document.tags.length > 0 && (
        <CockpitCard padding="sm" aria-label="Document tags">
          <div className="flex flex-row flex-wrap items-center gap-2">
            <span className="text-xs text-tertiary font-medium">Tags:</span>
            {document.tags.map((tag) => (
              <Badge key={tag} variant="subtle" size="sm">
                {tag}
              </Badge>
            ))}
          </div>
        </CockpitCard>
      )}

      {/* ── Agent Consumers Footer ── */}
      {document.consumers && document.consumers.length > 0 && (
        <CockpitCard padding="sm" aria-label="Agent consumers">
          <div className="flex flex-row flex-wrap items-center gap-2">
            <span className="text-xs text-tertiary font-medium">Usado por:</span>
            {document.consumers.map((agent) => (
              <Badge key={agent} variant="subtle" size="sm">
                {agent}
              </Badge>
            ))}
          </div>
        </CockpitCard>
      )}
    </div>
  );
}

export default DocumentViewer;
