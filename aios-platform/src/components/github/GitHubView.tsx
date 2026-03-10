import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw,
  GitCommit,
  GitPullRequest,
  CircleDot,
  GitBranch,
  User,
  Radio,
  Monitor,
} from 'lucide-react';
import { GlassCard, GlassButton, Badge, EmptyState, SectionLabel } from '../ui';
import { ICON_SIZES } from '../../lib/icons';
import { formatRelativeTime, cn } from '../../lib/utils';
import { useGitHubData } from '../../hooks/useGitHubData';
import type { GitCommit as CommitType, GitHubPR as PRType, GitHubIssue as IssueType } from '../../hooks/useGitHubData';

type TabType = 'commits' | 'pulls' | 'issues';

export default function GitHubView() {
  const { data, loading, error, refetch } = useGitHubData();
  const [activeTab, setActiveTab] = useState<TabType>('commits');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isDemo = data.source === 'demo';
  const isLive = data.source === 'live';
  const isGitOnly = data.source === 'git-only';

  const repoName = data.repoInfo
    ? `${data.repoInfo.owner.login}/${data.repoInfo.name}`
    : isDemo
      ? 'Demo Repository'
      : 'Local Git Repository';

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const tabs: { id: TabType; label: string; icon: typeof GitCommit; count?: number }[] = [
    { id: 'commits', label: 'Commits', icon: GitCommit, count: data.commits.length },
    { id: 'pulls', label: 'Pull Requests', icon: GitPullRequest, count: data.pullRequests.length },
    { id: 'issues', label: 'Issues', icon: CircleDot, count: data.issues.length },
  ];

  // Initial loading state (first fetch)
  if (loading && data.source === 'demo' && !error) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <GlassCard padding="lg" className="text-center max-w-md">
          <RefreshCw size={40} className="text-secondary mx-auto mb-4 animate-spin" />
          <h2 className="text-lg font-semibold text-primary mb-2">Checking GitHub...</h2>
          <p className="text-secondary text-sm">Fetching commits, PRs, and issues</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-primary">GitHub</h1>
            <SourceBadge source={data.source} />
          </div>
          <p className="text-secondary text-sm mt-0.5">
            {repoName}
            {!isDemo && data.updatedAt && (
              <span className="text-tertiary ml-2">
                &middot; updated {formatRelativeTime(data.updatedAt)}
              </span>
            )}
          </p>
          {error && !isDemo && (
            <p className="text-xs text-red-400 mt-1">{error}</p>
          )}
        </div>
        <GlassButton
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          leftIcon={
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
          }
        >
          Refresh
        </GlassButton>
      </div>

      {/* Git-only notice */}
      {isGitOnly && (
        <div className="glass-subtle rounded-xl p-3 mb-4 flex items-center gap-2 text-xs text-tertiary flex-shrink-0">
          <Monitor size={14} className="text-yellow-400 flex-shrink-0" />
          <span>
            Showing local git commits only. Install and authenticate{' '}
            <code className="text-primary font-mono">gh</code> CLI for PRs and issues.
          </span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 glass-subtle rounded-xl mb-4 flex-shrink-0 overflow-x-auto" role="tablist" aria-label="GitHub tabs">
        {tabs.map((tab) => {
          const disabled = !isLive && !isDemo && tab.id !== 'commits';
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              tabIndex={activeTab === tab.id ? 0 : -1}
              onClick={() => !disabled && setActiveTab(tab.id)}
              disabled={disabled}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                disabled
                  ? 'text-tertiary/50 cursor-not-allowed'
                  : activeTab === tab.id
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
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto glass-scrollbar" tabIndex={0} role="region" aria-label="GitHub content">
        <AnimatePresence mode="wait">
          {activeTab === 'commits' && (
            <CommitsTab
              key="commits"
              commits={data.commits}
              loading={loading && isRefreshing}
            />
          )}
          {activeTab === 'pulls' && (
            <PullsTab
              key="pulls"
              pulls={data.pullRequests}
              loading={loading && isRefreshing}
            />
          )}
          {activeTab === 'issues' && (
            <IssuesTab
              key="issues"
              issues={data.issues}
              loading={loading && isRefreshing}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Source Badge ─────────────────────────────────────────────
function SourceBadge({ source }: { source: string }) {
  switch (source) {
    case 'live':
      return (
        <Badge variant="status" status="success" size="sm">
          <Radio size={10} className="mr-1 animate-pulse" />
          Live
        </Badge>
      );
    case 'git-only':
      return (
        <Badge variant="status" status="warning" size="sm">
          Git Only
        </Badge>
      );
    case 'partial':
      return (
        <Badge variant="status" status="warning" size="sm">
          Partial
        </Badge>
      );
    case 'demo':
    default:
      return (
        <Badge variant="status" status="warning" size="sm">
          Demo
        </Badge>
      );
  }
}

// ─── Commits Tab ─────────────────────────────────────────────
function CommitsTab({
  commits,
  loading,
}: {
  commits: CommitType[];
  loading: boolean;
}) {
  if (loading) return <TabLoader />;
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
      className="pb-6"
    >
      <GlassCard padding="md">
        <SectionLabel count={commits.length}>Commits</SectionLabel>
        <div className="space-y-1">
          {commits.map((commit, index) => (
            <motion.div
              key={`${commit.sha}-${index}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.02 }}
              onClick={() => commit.url !== '#' && window.open(commit.url, '_blank')}
              className={cn(
                'flex items-start justify-between gap-3 glass-subtle rounded-xl p-3 transition-colors',
                commit.url !== '#' ? 'hover:bg-white/10 cursor-pointer' : ''
              )}
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <GitCommit size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-tertiary">{commit.sha}</span>
                    <span className="text-sm font-medium text-primary truncate">
                      {commit.message}
                    </span>
                    {commit.refs?.length > 0 &&
                      commit.refs.map((ref) => <RefBadge key={ref} refName={ref} />)}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-tertiary">
                    <span className="flex items-center gap-1">
                      <User size={11} />
                      {commit.author}
                    </span>
                  </div>
                </div>
              </div>
              <span className="text-xs text-tertiary flex-shrink-0 whitespace-nowrap">
                {formatRelativeTime(commit.date)}
              </span>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </motion.div>
  );
}

// ─── Pull Requests Tab ───────────────────────────────────────
function PullsTab({
  pulls,
  loading,
}: {
  pulls: PRType[];
  loading: boolean;
}) {
  if (loading) return <TabLoader />;
  if (pulls.length === 0) {
    return (
      <EmptyState
        icon={<GitPullRequest size={32} />}
        title="No pull requests"
        description="There are no PRs in this repository."
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="pb-6"
    >
      <GlassCard padding="md">
        <SectionLabel count={pulls.length}>Pull Requests</SectionLabel>
        <div className="space-y-1">
          {pulls.map((pr, index) => (
            <motion.div
              key={pr.number}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.02 }}
              onClick={() => pr.url !== '#' && window.open(pr.url, '_blank')}
              className={cn(
                'flex items-start justify-between gap-3 glass-subtle rounded-xl p-3 transition-colors',
                pr.url !== '#' ? 'hover:bg-white/10 cursor-pointer' : ''
              )}
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <GitPullRequest size={16} className="text-green-400 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-tertiary font-mono">#{pr.number}</span>
                    <span className="text-sm font-medium text-primary truncate">{pr.title}</span>
                    <PrStateBadge state={pr.state} />
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-tertiary">
                    <span className="flex items-center gap-1">
                      <User size={11} />
                      {pr.author.login}
                    </span>
                    <span className="flex items-center gap-1">
                      <GitBranch size={10} />
                      <span className="font-mono">{pr.headRefName}</span>
                    </span>
                  </div>
                </div>
              </div>
              <span className="text-xs text-tertiary flex-shrink-0 whitespace-nowrap">
                {formatRelativeTime(pr.createdAt)}
              </span>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </motion.div>
  );
}

// ─── Issues Tab ──────────────────────────────────────────────
function IssuesTab({
  issues,
  loading,
}: {
  issues: IssueType[];
  loading: boolean;
}) {
  if (loading) return <TabLoader />;
  if (issues.length === 0) {
    return (
      <EmptyState
        icon={<CircleDot size={32} />}
        title="No issues"
        description="There are no issues in this repository."
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="pb-6"
    >
      <GlassCard padding="md">
        <SectionLabel count={issues.length}>Issues</SectionLabel>
        <div className="space-y-1">
          {issues.map((issue, index) => (
            <motion.div
              key={issue.number}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.02 }}
              onClick={() => issue.url !== '#' && window.open(issue.url, '_blank')}
              className={cn(
                'flex items-start justify-between gap-3 glass-subtle rounded-xl p-3 transition-colors',
                issue.url !== '#' ? 'hover:bg-white/10 cursor-pointer' : ''
              )}
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
                          backgroundColor: `#${label.color}20`,
                          color: `#${label.color}`,
                        }}
                      >
                        {label.name}
                      </span>
                    ))}
                    <span className="text-xs text-tertiary flex items-center gap-1">
                      <User size={11} />
                      {issue.author.login}
                    </span>
                  </div>
                </div>
              </div>
              <span className="text-xs text-tertiary flex-shrink-0 whitespace-nowrap">
                {formatRelativeTime(issue.createdAt)}
              </span>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </motion.div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────
function RefBadge({ refName }: { refName: string }) {
  const isHead = refName.startsWith('HEAD');
  const isTag = refName.startsWith('tag: ');
  const isOrigin = refName.startsWith('origin/');

  let displayName = refName;
  if (isHead) {
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
