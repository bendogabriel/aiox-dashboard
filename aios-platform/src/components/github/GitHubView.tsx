import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  RefreshCw,
  GitCommit,
  GitPullRequest,
  CircleDot,
  ExternalLink,
  GitBranch,
  User,
} from 'lucide-react';
import { GlassCard, GlassButton, Badge, EmptyState } from '../ui';
import { ICON_SIZES } from '../../lib/icons';
import { formatRelativeTime, cn } from '../../lib/utils';

const MONITOR_URL = import.meta.env.VITE_MONITOR_URL || 'http://localhost:4001';
const REPO = 'SynkraAI/aios-dashboard';

type TabType = 'commits' | 'pulls' | 'issues';

interface Commit {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
  refs: string[];
}

interface PullRequest {
  number: number;
  title: string;
  state: string;
  author: { login: string };
  createdAt: string;
  headRefName: string;
  url: string;
}

interface Issue {
  number: number;
  title: string;
  state: string;
  author: { login: string };
  createdAt: string;
  labels: Array<{ name: string; color: string }>;
  url: string;
}

export default function GitHubView() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('commits');

  const [commits, setCommits] = useState<Commit[]>([]);
  const [pulls, setPulls] = useState<PullRequest[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);

  const [loading, setLoading] = useState({ commits: false, pulls: false, issues: false });
  const [errors, setErrors] = useState({ commits: '', pulls: '', issues: '' });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkGitHubStatus = useCallback(async () => {
    try {
      const res = await fetch(`${MONITOR_URL}/github/status`);
      if (res.ok) {
        const data = await res.json();
        setIsConnected(data.connected);
        setUsername(data.username || null);
        return data.connected;
      }
      setIsConnected(false);
      return false;
    } catch {
      setIsConnected(false);
      return false;
    }
  }, []);

  const fetchTab = useCallback(async (tab: TabType) => {
    setLoading((prev) => ({ ...prev, [tab]: true }));
    setErrors((prev) => ({ ...prev, [tab]: '' }));
    try {
      const res = await fetch(`${MONITOR_URL}/github/${tab}`);
      if (!res.ok) throw new Error(`Failed to fetch ${tab}`);
      const data = await res.json();
      if (tab === 'commits') setCommits(data);
      else if (tab === 'pulls') setPulls(data);
      else setIssues(data);
    } catch (e) {
      setErrors((prev) => ({
        ...prev,
        [tab]: e instanceof Error ? e.message : 'Unknown error',
      }));
    } finally {
      setLoading((prev) => ({ ...prev, [tab]: false }));
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    const connected = await checkGitHubStatus();
    if (connected) {
      await Promise.all([fetchTab('commits'), fetchTab('pulls'), fetchTab('issues')]);
    }
    setIsRefreshing(false);
  }, [checkGitHubStatus, fetchTab]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Loading state
  if (isConnected === null) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <GlassCard padding="lg" className="text-center max-w-md">
          <RefreshCw size={40} className="text-secondary mx-auto mb-4 animate-spin" />
          <h2 className="text-lg font-semibold text-primary mb-2">Checking GitHub...</h2>
        </GlassCard>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <GlassCard padding="lg" className="text-center max-w-md">
          <AlertTriangle size={40} className="text-yellow-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-primary mb-2">GitHub Not Connected</h2>
          <p className="text-sm text-secondary mb-4">
            Run{' '}
            <code className="glass-subtle px-2 py-0.5 rounded text-xs font-mono">
              gh auth login
            </code>{' '}
            in your terminal to connect.
          </p>
          <GlassButton variant="primary" onClick={refreshAll} disabled={isRefreshing}>
            {isRefreshing ? (
              <>
                <RefreshCw size={14} className="animate-spin mr-2" />
                Checking...
              </>
            ) : (
              'Retry'
            )}
          </GlassButton>
        </GlassCard>
      </div>
    );
  }

  const tabs: { id: TabType; label: string; icon: typeof GitCommit; count?: number }[] = [
    { id: 'commits', label: 'Commits', icon: GitCommit, count: commits.length },
    { id: 'pulls', label: 'Pull Requests', icon: GitPullRequest, count: pulls.length },
    { id: 'issues', label: 'Issues', icon: CircleDot, count: issues.length },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-primary">GitHub</h1>
          <p className="text-secondary text-sm mt-0.5">
            {REPO}
            {username && (
              <span className="text-tertiary ml-2">
                &middot; {username}
              </span>
            )}
          </p>
        </div>
        <GlassButton
          variant="ghost"
          size="sm"
          onClick={refreshAll}
          disabled={isRefreshing}
          leftIcon={
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
          }
        >
          Refresh
        </GlassButton>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 glass-subtle rounded-xl mb-4 flex-shrink-0 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
              activeTab === tab.id
                ? 'glass text-primary shadow-sm'
                : 'text-secondary hover:text-primary'
            )}
          >
            <tab.icon size={ICON_SIZES.md} />
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <Badge variant="count" size="sm">
                {tab.count}
              </Badge>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto glass-scrollbar">
        <AnimatePresence mode="wait">
          {activeTab === 'commits' && (
            <CommitsTab
              key="commits"
              commits={commits}
              loading={loading.commits}
              error={errors.commits}
              onRetry={() => fetchTab('commits')}
            />
          )}
          {activeTab === 'pulls' && (
            <PullsTab
              key="pulls"
              pulls={pulls}
              loading={loading.pulls}
              error={errors.pulls}
              onRetry={() => fetchTab('pulls')}
            />
          )}
          {activeTab === 'issues' && (
            <IssuesTab
              key="issues"
              issues={issues}
              loading={loading.issues}
              error={errors.issues}
              onRetry={() => fetchTab('issues')}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Commits Tab
function CommitsTab({
  commits,
  loading,
  error,
  onRetry,
}: {
  commits: Commit[];
  loading: boolean;
  error: string;
  onRetry: () => void;
}) {
  if (loading) return <TabLoader />;
  if (error) return <TabError message={error} onRetry={onRetry} />;
  if (commits.length === 0) {
    return (
      <EmptyState
        icon={<GitCommit size={32} />}
        title="No commits found"
        description="No recent commits in the repository."
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-3 pb-6"
    >
      {commits.map((commit, index) => (
        <motion.div
          key={commit.sha}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.03 }}
        >
          <GlassCard
            variant="subtle"
            className="hover:bg-white/10 transition-colors cursor-pointer"
            onClick={() => window.open(commit.url, '_blank')}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-primary font-medium truncate">{commit.message}</p>
                  {commit.refs?.length > 0 && commit.refs.map((ref) => (
                    <RefBadge key={ref} refName={ref} />
                  ))}
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-tertiary">
                  <span className="font-mono glass-subtle px-2 py-0.5 rounded text-secondary">
                    {commit.sha}
                  </span>
                  <span className="flex items-center gap-1">
                    <User size={12} />
                    {commit.author}
                  </span>
                  <span>{formatRelativeTime(commit.date)}</span>
                </div>
              </div>
              <ExternalLink size={14} className="text-tertiary flex-shrink-0 mt-1" />
            </div>
          </GlassCard>
        </motion.div>
      ))}
    </motion.div>
  );
}

// Pull Requests Tab
function PullsTab({
  pulls,
  loading,
  error,
  onRetry,
}: {
  pulls: PullRequest[];
  loading: boolean;
  error: string;
  onRetry: () => void;
}) {
  if (loading) return <TabLoader />;
  if (error) return <TabError message={error} onRetry={onRetry} />;
  if (pulls.length === 0) {
    return (
      <EmptyState
        icon={<GitPullRequest size={32} />}
        title="No open pull requests"
        description="There are no open PRs in this repository."
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-3 pb-6"
    >
      {pulls.map((pr, index) => (
        <motion.div
          key={pr.number}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.03 }}
        >
          <GlassCard
            variant="subtle"
            className="hover:bg-white/10 transition-colors cursor-pointer"
            onClick={() => window.open(pr.url, '_blank')}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-tertiary font-mono text-sm">#{pr.number}</span>
                  <PrStateBadge state={pr.state} />
                </div>
                <p className="text-primary font-medium truncate">{pr.title}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-tertiary">
                  <span className="flex items-center gap-1">
                    <GitBranch size={12} />
                    <span className="font-mono glass-subtle px-2 py-0.5 rounded text-secondary">
                      {pr.headRefName}
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <User size={12} />
                    {pr.author.login}
                  </span>
                  <span>{formatRelativeTime(pr.createdAt)}</span>
                </div>
              </div>
              <ExternalLink size={14} className="text-tertiary flex-shrink-0 mt-1" />
            </div>
          </GlassCard>
        </motion.div>
      ))}
    </motion.div>
  );
}

// Issues Tab
function IssuesTab({
  issues,
  loading,
  error,
  onRetry,
}: {
  issues: Issue[];
  loading: boolean;
  error: string;
  onRetry: () => void;
}) {
  if (loading) return <TabLoader />;
  if (error) return <TabError message={error} onRetry={onRetry} />;
  if (issues.length === 0) {
    return (
      <EmptyState
        icon={<CircleDot size={32} />}
        title="No open issues"
        description="There are no open issues in this repository."
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-3 pb-6"
    >
      {issues.map((issue, index) => (
        <motion.div
          key={issue.number}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.03 }}
        >
          <GlassCard
            variant="subtle"
            className="hover:bg-white/10 transition-colors cursor-pointer"
            onClick={() => window.open(issue.url, '_blank')}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-tertiary font-mono text-sm">#{issue.number}</span>
                  <IssueStateBadge state={issue.state} />
                </div>
                <p className="text-primary font-medium truncate">{issue.title}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-tertiary flex-wrap">
                  <span className="flex items-center gap-1">
                    <User size={12} />
                    {issue.author.login}
                  </span>
                  <span>{formatRelativeTime(issue.createdAt)}</span>
                  {issue.labels.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {issue.labels.map((label) => (
                        <span
                          key={label.name}
                          className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                          style={{
                            backgroundColor: `#${label.color}22`,
                            color: `#${label.color}`,
                            border: `1px solid #${label.color}44`,
                          }}
                        >
                          {label.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <ExternalLink size={14} className="text-tertiary flex-shrink-0 mt-1" />
            </div>
          </GlassCard>
        </motion.div>
      ))}
    </motion.div>
  );
}

// Helpers
function RefBadge({ refName }: { refName: string }) {
  const isHead = refName.startsWith('HEAD');
  const isTag = refName.startsWith('tag: ');
  const isOrigin = refName.startsWith('origin/');

  // Clean up display name
  let displayName = refName;
  if (isHead) {
    // "HEAD -> feat/branch" → show "feat/branch"
    const match = refName.match(/HEAD -> (.+)/);
    displayName = match ? match[1] : 'HEAD';
  }
  if (isTag) displayName = refName.replace('tag: ', '');

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0',
        isTag
          ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
          : isHead
            ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
            : isOrigin
              ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
              : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
      )}
    >
      <GitBranch size={10} />
      {displayName}
    </span>
  );
}

function PrStateBadge({ state }: { state: string }) {
  const s = state.toLowerCase();
  if (s === 'open') return <Badge variant="status" status="success" size="sm">Open</Badge>;
  if (s === 'merged') return <Badge variant="status" status="online" size="sm">Merged</Badge>;
  return <Badge variant="status" status="offline" size="sm">Closed</Badge>;
}

function IssueStateBadge({ state }: { state: string }) {
  const s = state.toLowerCase();
  if (s === 'open') return <Badge variant="status" status="success" size="sm">Open</Badge>;
  return <Badge variant="status" status="offline" size="sm">Closed</Badge>;
}

function TabLoader() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex items-center justify-center py-16"
    >
      <RefreshCw size={24} className="text-secondary animate-spin" />
    </motion.div>
  );
}

function TabError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <EmptyState
        type="error"
        title="Failed to load"
        description={message}
        action={{ label: 'Retry', onClick: onRetry, variant: 'primary' }}
      />
    </motion.div>
  );
}
