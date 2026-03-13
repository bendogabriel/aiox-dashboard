import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, ClipboardPaste, X, Loader2 } from 'lucide-react';
import { CockpitButton, CockpitCard } from '../ui';
import { useVaultStore } from '../../stores/vaultStore';
import { cn } from '../../lib/utils';

interface DocumentUploadProps {
  workspaceId: string;
}

const ACCEPTED_EXTENSIONS = '.pdf,.docx,.xlsx,.csv,.md,.txt,.json,.yaml,.yml';
const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'text/markdown',
  'text/plain',
  'application/json',
  'application/x-yaml',
];

export default function DocumentUpload({ workspaceId }: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const [pasteName, setPasteName] = useState('');
  const [pasteContent, setPasteContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadDocuments = useVaultStore((s) => s.uploadDocuments);
  const pasteContentAction = useVaultStore((s) => s.pasteContent);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setIsUploading(true);
    try {
      await uploadDocuments(fileArray, workspaceId);
    } finally {
      setIsUploading(false);
    }
  }, [workspaceId, uploadDocuments]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handlePaste = async () => {
    if (!pasteName.trim() || !pasteContent.trim()) return;

    setIsUploading(true);
    try {
      await pasteContentAction({
        content: pasteContent,
        name: pasteName,
        workspaceId,
      });
      setPasteName('');
      setPasteContent('');
      setShowPaste(false);
    } finally {
      setIsUploading(false);
    }
  };

  if (showPaste) {
    return (
      <CockpitCard variant="subtle" padding="md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ClipboardPaste size={16} className="text-[var(--aiox-lime)]" />
            <span className="text-sm font-medium text-primary">Paste Content</span>
          </div>
          <CockpitButton size="sm" variant="ghost" onClick={() => setShowPaste(false)}>
            <X size={14} />
          </CockpitButton>
        </div>

        <div className="space-y-3">
          <input
            type="text"
            placeholder="Document name..."
            value={pasteName}
            onChange={(e) => setPasteName(e.target.value)}
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-sm text-primary placeholder-tertiary focus:outline-none focus:border-[var(--aiox-lime)]/50"
          />
          <textarea
            placeholder="Paste your content here..."
            value={pasteContent}
            onChange={(e) => setPasteContent(e.target.value)}
            rows={8}
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-sm text-primary placeholder-tertiary focus:outline-none focus:border-[var(--aiox-lime)]/50 resize-none font-mono"
          />
          <div className="flex justify-end gap-2">
            <CockpitButton size="sm" variant="ghost" onClick={() => setShowPaste(false)}>
              Cancel
            </CockpitButton>
            <CockpitButton
              size="sm"
              variant="primary"
              onClick={handlePaste}
              disabled={!pasteName.trim() || !pasteContent.trim() || isUploading}
            >
              {isUploading ? <Loader2 size={14} className="animate-spin" /> : 'Save'}
            </CockpitButton>
          </div>
        </div>
      </CockpitCard>
    );
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer',
          isDragging
            ? 'border-[var(--aiox-lime)] bg-[var(--aiox-lime)]/5'
            : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]',
          isUploading && 'opacity-50 pointer-events-none'
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            e.target.value = '';
          }}
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 size={32} className="text-[var(--aiox-lime)] animate-spin" />
            <p className="text-sm text-secondary">Uploading & parsing...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload size={32} className="text-tertiary" />
            <p className="text-sm text-secondary">
              Drag & drop files here or <span className="text-[var(--aiox-lime)]">click to browse</span>
            </p>
            <p className="text-xs text-tertiary">
              PDF, DOCX, XLSX, CSV, MD, TXT, JSON, YAML
            </p>
          </div>
        )}
      </div>

      {/* Paste button */}
      <CockpitButton
        size="sm"
        variant="ghost"
        onClick={() => setShowPaste(true)}
        leftIcon={<ClipboardPaste size={14} />}
        className="w-full"
      >
        Paste Text
      </CockpitButton>
    </div>
  );
}
