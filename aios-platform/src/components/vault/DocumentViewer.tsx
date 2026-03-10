import { useState } from 'react';
import { Pencil, Eye, Save, X } from 'lucide-react';
import { GlassCard, GlassButton, GlassTextarea, Badge } from '../ui';
import { cn } from '../../lib/utils';
import type { VaultDocument } from '../../types/vault';

// ── Type badge color map ──

const typeBadgeColors: Record<VaultDocument['type'], string> = {
  offerbook: 'bg-green-500/15 text-green-400',
  brand: 'bg-orange-500/15 text-orange-400',
  narrative: 'bg-purple-500/15 text-purple-400',
  strategy: 'bg-blue-500/15 text-blue-400',
  diagnostic: 'bg-yellow-500/15 text-yellow-400',
  proof: 'bg-emerald-500/15 text-emerald-400',
  template: 'bg-cyan-500/15 text-cyan-400',
  generic: 'bg-gray-500/15 text-gray-400',
};

// ── Status badge mapping ──

const statusBadgeMap: Record<VaultDocument['status'], { label: string; status: 'success' | 'warning' | 'error' }> = {
  validated: { label: 'Validated', status: 'success' },
  draft: { label: 'Draft', status: 'warning' },
  outdated: { label: 'Outdated', status: 'error' },
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
      <GlassCard padding="sm" aria-label="Document metadata">
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
      </GlassCard>

      {/* ── Content Area ── */}
      <GlassCard aria-label="Document content">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-primary">{document.name}</h2>
          {isEditing ? (
            <GlassButton
              variant="ghost"
              size="sm"
              leftIcon={<Eye className="w-4 h-4" />}
              onClick={() => setIsEditing(false)}
              aria-label="Switch to preview mode"
            >
              Preview
            </GlassButton>
          ) : (
            <GlassButton
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
            </GlassButton>
          )}
        </div>

        {/* Content */}
        {isEditing ? (
          <div className="flex flex-col gap-3">
            <GlassTextarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
              aria-label="Document content editor"
            />
            <div className="flex items-center gap-2 justify-end">
              <GlassButton
                variant="ghost"
                size="sm"
                leftIcon={<X className="w-4 h-4" />}
                onClick={handleCancel}
                aria-label="Cancel editing"
              >
                Cancel
              </GlassButton>
              <GlassButton
                variant="primary"
                size="sm"
                leftIcon={<Save className="w-4 h-4" />}
                onClick={handleSave}
                aria-label="Save document"
              >
                Save
              </GlassButton>
            </div>
          </div>
        ) : (
          <div className="prose-vault">{renderMarkdown(document.content)}</div>
        )}
      </GlassCard>

      {/* ── Agent Consumers Footer ── */}
      {document.consumers.length > 0 && (
        <GlassCard padding="sm" aria-label="Agent consumers">
          <div className="flex flex-row flex-wrap items-center gap-2">
            <span className="text-xs text-tertiary font-medium">Usado por:</span>
            {document.consumers.map((agent) => (
              <Badge key={agent} variant="subtle" size="sm">
                {agent}
              </Badge>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}

export default DocumentViewer;
