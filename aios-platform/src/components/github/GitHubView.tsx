import { useState } from 'react';
import {
  Github,
  ExternalLink,
  RefreshCw,
  GitPullRequest,
  CircleDot,
  AlertTriangle,
  GitBranch,
} from 'lucide-react';
import { GlassCard, GlassButton, Badge, SectionLabel } from '../ui';

// --- Mock Data ---

const mockPRs = [
  { number: 142, title: 'feat: add Kanban board with DnD', draft: false, author: 'aios-dev', branch: 'feat/kanban-board', date: '2h ago' },
  { number: 141, title: 'fix: SSE reconnection logic', draft: false, author: 'aios-dev', branch: 'fix/sse-reconnect', date: '5h ago' },
  { number: 140, title: 'refactor: extract view routing', draft: true, author: 'aios-architect', branch: 'refactor/view-routing', date: '1d ago' },
  { number: 139, title: 'docs: update API documentation', draft: false, author: 'aios-pm', branch: 'docs/api-update', date: '2d ago' },
  { number: 138, title: 'feat: add agent monitoring view', draft: false, author: 'aios-dev', branch: 'feat/agent-monitor', date: '3d ago' },
];

const mockIssues = [
  { number: 87, title: 'Dashboard performance degradation', labels: [{ name: 'bug', color: '#ef4444' }, { name: 'P1', color: '#f97316' }], author: 'aios-qa', date: '1d ago' },
  { number: 86, title: 'Add dark mode support for charts', labels: [{ name: 'enhancement', color: '#3b82f6' }], author: 'aios-pm', date: '2d ago' },
  { number: 85, title: 'MCP connection timeout handling', labels: [{ name: 'bug', color: '#ef4444' }, { name: 'mcp', color: '#a855f7' }], author: 'aios-dev', date: '3d ago' },
  { number: 84, title: 'Implement keyboard navigation for Kanban', labels: [{ name: 'a11y', color: '#22c55e' }, { name: 'enhancement', color: '#3b82f6' }], author: 'aios-po', date: '5d ago' },
];

// --- Component ---

export default function GitHubView() {
  const [isConnected] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  if (!isConnected) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <GlassCard padding="lg" className="text-center max-w-md">
          <AlertTriangle size={40} className="text-yellow-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-primary mb-2">GitHub Not Connected</h2>
          <p className="text-sm text-secondary mb-4">
            Run <code className="glass-subtle px-2 py-0.5 rounded text-xs font-mono">gh auth login</code> in your terminal to connect.
          </p>
          <GlassButton variant="primary" onClick={handleRefresh}>
            Retry
          </GlassButton>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto glass-scrollbar p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Github size={22} className="text-primary" />
          <h1 className="text-xl font-semibold text-primary">GitHub</h1>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-tertiary hover:text-secondary transition-colors"
            aria-label="Open GitHub"
          >
            <ExternalLink size={14} />
          </a>
        </div>
        <GlassButton
          size="sm"
          leftIcon={<RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />}
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          Refresh
        </GlassButton>
      </div>

      {/* Pull Requests */}
      <GlassCard padding="md">
        <SectionLabel count={mockPRs.length}>Pull Requests</SectionLabel>
        <div className="space-y-2">
          {mockPRs.map((pr) => (
            <div
              key={pr.number}
              className="flex items-start justify-between gap-3 glass-subtle rounded-xl p-3"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <GitPullRequest size={16} className="text-green-400 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-tertiary font-mono">#{pr.number}</span>
                    <span className="text-sm font-medium text-primary truncate">{pr.title}</span>
                    {pr.draft && (
                      <Badge variant="default" size="sm">Draft</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-secondary">{pr.author}</span>
                    <div className="flex items-center gap-1">
                      <GitBranch size={10} className="text-tertiary" />
                      <span className="text-[10px] text-tertiary font-mono">{pr.branch}</span>
                    </div>
                  </div>
                </div>
              </div>
              <span className="text-xs text-tertiary flex-shrink-0">{pr.date}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Issues */}
      <GlassCard padding="md">
        <SectionLabel count={mockIssues.length}>Issues</SectionLabel>
        <div className="space-y-2">
          {mockIssues.map((issue) => (
            <div
              key={issue.number}
              className="flex items-start justify-between gap-3 glass-subtle rounded-xl p-3"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <CircleDot size={16} className="text-green-400 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-tertiary font-mono">#{issue.number}</span>
                    <span className="text-sm font-medium text-primary truncate">{issue.title}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {issue.labels.slice(0, 3).map((label) => (
                      <span
                        key={label.name}
                        className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: `${label.color}20`,
                          color: label.color,
                        }}
                      >
                        {label.name}
                      </span>
                    ))}
                    <span className="text-xs text-secondary">{issue.author}</span>
                  </div>
                </div>
              </div>
              <span className="text-xs text-tertiary flex-shrink-0">{issue.date}</span>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
