import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Search, Shield } from 'lucide-react';
import { GlassCard, GlassButton, GlassInput } from '../ui';
import { useVaultStore } from '../../stores/vaultStore';
import { cn } from '../../lib/utils';
import VaultOverview from './VaultOverview';
import WorkspaceDetail from './WorkspaceDetail';
import DocumentViewer from './DocumentViewer';

const variants = {
  enter: { opacity: 0, x: 20 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export default function VaultView() {
  const [searchQuery, setSearchQuery] = useState('');

  const {
    level,
    workspaces,
    documents,
    selectedWorkspaceId,
    selectedDocumentId,
    goBack,
    selectWorkspace,
    selectDocument,
  } = useVaultStore();

  const selectedWorkspace = workspaces.find((w) => w.id === selectedWorkspaceId);
  const selectedDocument = documents.find((d) => d.id === selectedDocumentId);

  // Resolve category name for level 3 breadcrumb
  const documentCategory = (() => {
    if (!selectedDocument || !selectedWorkspace) return '';
    const cat = selectedWorkspace.categories.find((c) => c.id === selectedDocument.categoryId);
    return cat?.name ?? selectedWorkspace.name;
  })();

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-6 pb-0 space-y-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2">
          {level === 1 && (
            <div className="flex items-center gap-3">
              <Shield size={22} className="text-cyan-400" />
              <h1 className="text-xl font-semibold text-primary">Vault</h1>
            </div>
          )}

          {level === 2 && selectedWorkspace && (
            <>
              <GlassButton
                size="sm"
                variant="ghost"
                onClick={goBack}
                leftIcon={<ChevronLeft size={14} />}
              >
                Vault
              </GlassButton>
              <span className="text-tertiary text-sm">/</span>
              <span className="text-sm text-primary font-medium">
                {selectedWorkspace.name}
              </span>
            </>
          )}

          {level === 3 && selectedDocument && (
            <>
              <GlassButton
                size="sm"
                variant="ghost"
                onClick={goBack}
                leftIcon={<ChevronLeft size={14} />}
              >
                {documentCategory}
              </GlassButton>
              <span className="text-tertiary text-sm">/</span>
              <span className="text-sm text-primary font-medium">
                {selectedDocument.name}
              </span>
            </>
          )}
        </div>

        {/* Search */}
        <GlassInput
          placeholder="Search vault..."
          leftIcon={<Search size={16} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Content with AnimatePresence */}
      <div className="flex-1 overflow-y-auto glass-scrollbar">
        <AnimatePresence mode="wait">
          {level === 1 && (
            <motion.div
              key="vault-overview"
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="p-6"
            >
              <VaultOverview
                searchQuery={searchQuery}
                onSelectWorkspace={selectWorkspace}
              />
            </motion.div>
          )}

          {level === 2 && selectedWorkspace && (
            <motion.div
              key={`workspace-${selectedWorkspace.id}`}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="p-6"
            >
              <WorkspaceDetail
                workspace={selectedWorkspace}
                searchQuery={searchQuery}
                onSelectDocument={selectDocument}
              />
            </motion.div>
          )}

          {level === 3 && selectedDocument && (
            <motion.div
              key={`document-${selectedDocument.id}`}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="p-6"
            >
              <DocumentViewer document={selectedDocument} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
