import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  ChevronDown,
  ChevronRight,
  Shield,
  Bot,
  Settings,
  Server,
  FileText,
  File,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { GlassCard, Badge, StatusDot } from '../ui';
import { useSystemContext } from '../../hooks/useSystemContext';
import { cn } from '../../lib/utils';

// --- Collapsible Section ---

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  count: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function CollapsibleSection({ title, icon, count, defaultOpen = true, children }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <GlassCard padding="none" className="overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-secondary">{icon}</span>
          <span className="text-sm font-semibold text-primary">{title}</span>
          <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-white/10 text-[10px] font-medium text-tertiary">
            {count}
          </span>
        </div>
        {isOpen ? (
          <ChevronDown size={16} className="text-tertiary" />
        ) : (
          <ChevronRight size={16} className="text-tertiary" />
        )}
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}

// --- Loading Skeleton ---

function SectionSkeleton() {
  return (
    <GlassCard padding="none" className="overflow-hidden">
      <div className="p-4 flex items-center gap-2.5">
        <div className="w-4 h-4 rounded bg-white/10 animate-pulse" />
        <div className="w-24 h-4 rounded bg-white/10 animate-pulse" />
        <div className="w-5 h-5 rounded-full bg-white/10 animate-pulse" />
      </div>
      <div className="px-4 pb-4 space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 rounded-lg bg-white/5 animate-pulse" />
        ))}
      </div>
    </GlassCard>
  );
}

// --- Main Component ---

export default function ContextView() {
  const { data, isLoading, isError, error } = useSystemContext();

  const rules = data?.rules ?? [];
  const agents = data?.agents ?? [];
  const configs = data?.configs ?? [];
  const mcpServers = data?.mcpServers ?? [];
  const recentFiles = data?.recentFiles ?? [];

  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto glass-scrollbar p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Brain size={22} className="text-purple-400" />
          <h1 className="text-xl font-semibold text-primary">Context</h1>
          <Loader2 size={16} className="text-tertiary animate-spin" />
        </div>
        <SectionSkeleton />
        <SectionSkeleton />
        <SectionSkeleton />
        <SectionSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="h-full overflow-y-auto glass-scrollbar p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Brain size={22} className="text-purple-400" />
          <h1 className="text-xl font-semibold text-primary">Context</h1>
        </div>
        <GlassCard padding="md">
          <div className="flex items-center gap-3 text-red-400">
            <AlertTriangle size={18} />
            <div>
              <p className="text-sm font-medium">Failed to load context</p>
              <p className="text-xs text-tertiary mt-1">
                {error instanceof Error ? error.message : 'Unknown error'}
              </p>
            </div>
          </div>
        </GlassCard>
      </div>
    );
  }

  const isEmpty = rules.length === 0 && agents.length === 0 && configs.length === 0
    && mcpServers.length === 0 && recentFiles.length === 0;

  return (
    <div className="h-full overflow-y-auto glass-scrollbar p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Brain size={22} className="text-purple-400" />
        <h1 className="text-xl font-semibold text-primary">Context</h1>
        <Badge variant="default" size="sm">aios-platform</Badge>
      </div>

      {isEmpty && (
        <GlassCard padding="md">
          <div className="text-center py-8 text-tertiary">
            <Brain size={32} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">No context data available</p>
            <p className="text-xs mt-1">Ensure .claude/rules/, .aios-core/agents/, and log files exist</p>
          </div>
        </GlassCard>
      )}

      {/* Active Rules */}
      {rules.length > 0 && (
        <CollapsibleSection title="Active Rules" icon={<Shield size={16} />} count={rules.length}>
          {rules.map((rule) => (
            <div key={rule.name} className="flex items-center justify-between glass-subtle rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <Shield size={12} className="text-tertiary" />
                <span className="text-sm text-primary">{rule.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="status"
                  status={rule.type === 'mandatory' ? 'error' : 'warning'}
                  size="sm"
                >
                  {rule.type}
                </Badge>
                <span className="text-[10px] text-tertiary hidden sm:inline">{rule.path}</span>
              </div>
            </div>
          ))}
        </CollapsibleSection>
      )}

      {/* Agent Definitions */}
      {agents.length > 0 && (
        <CollapsibleSection title="Agent Definitions" icon={<Bot size={16} />} count={agents.length}>
          {agents.map((agent) => (
            <div key={agent.id ?? agent.name} className="flex items-center justify-between glass-subtle rounded-lg px-3 py-2">
              <div className="flex items-center gap-2.5">
                <div className={cn(
                  'w-6 h-6 rounded-md flex items-center justify-center',
                  agent.model === 'opus' ? 'bg-purple-500/20' : agent.model === 'haiku' ? 'bg-green-500/20' : 'bg-blue-500/20',
                )}>
                  <Bot size={12} className={cn(
                    agent.model === 'opus' ? 'text-purple-400' : agent.model === 'haiku' ? 'text-green-400' : 'text-blue-400',
                  )} />
                </div>
                <div>
                  <span className="text-sm font-medium text-primary">{agent.name}</span>
                  <span className="text-xs text-secondary ml-2">{agent.role}</span>
                </div>
              </div>
              <Badge variant="default" size="sm">{agent.model}</Badge>
            </div>
          ))}
        </CollapsibleSection>
      )}

      {/* Config Files */}
      {configs.length > 0 && (
        <CollapsibleSection title="Config Files" icon={<Settings size={16} />} count={configs.length}>
          {configs.map((file) => (
            <div key={file.path} className="flex items-center justify-between glass-subtle rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <File size={12} className="text-tertiary" />
                <span className="text-xs text-primary font-mono">{file.path}</span>
              </div>
              <span className="text-[10px] text-tertiary">{file.modified}</span>
            </div>
          ))}
        </CollapsibleSection>
      )}

      {/* MCP Servers */}
      {mcpServers.length > 0 && (
        <CollapsibleSection title="MCP Servers" icon={<Server size={16} />} count={mcpServers.length}>
          {mcpServers.map((server) => (
            <div key={server.name} className="flex items-center justify-between glass-subtle rounded-lg px-3 py-2">
              <div className="flex items-center gap-2.5">
                <StatusDot
                  status={server.status === 'success' ? 'success' : server.status === 'error' ? 'error' : 'offline'}
                  size="sm"
                />
                <span className="text-sm text-primary">{server.name}</span>
              </div>
              <Badge variant="default" size="sm">{server.tools} tools</Badge>
            </div>
          ))}
        </CollapsibleSection>
      )}

      {/* Recent Files */}
      {recentFiles.length > 0 && (
        <CollapsibleSection title="Recent Files" icon={<FileText size={16} />} count={recentFiles.length} defaultOpen={false}>
          {recentFiles.map((file) => (
            <div key={file.path} className="flex items-center justify-between glass-subtle rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <FileText size={12} className="text-tertiary" />
                <span className="text-xs text-primary font-mono truncate max-w-[300px]">{file.path}</span>
              </div>
              <span className="text-[10px] text-tertiary flex-shrink-0">{file.time}</span>
            </div>
          ))}
        </CollapsibleSection>
      )}
    </div>
  );
}
