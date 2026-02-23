import { useState } from 'react';
import { Terminal, LayoutGrid, List, Plus } from 'lucide-react';
import { GlassCard, GlassButton, Badge, ProgressBar, SectionLabel } from '../ui';
import { TerminalCard } from './TerminalCard';
import type { TerminalSession } from './TerminalCard';
import { cn } from '../../lib/utils';

const mockSessions: TerminalSession[] = [
  {
    id: '1',
    agent: 'AIOS Dev',
    status: 'working',
    dir: '/src/components',
    story: 'AIOS-42',
    output: [
      '$ npm run build',
      '> tsc -b && vite build',
      'Building for production...',
      '✓ 847 modules transformed',
      '✓ built in 3.2s',
    ],
  },
  {
    id: '2',
    agent: 'AIOS QA',
    status: 'working',
    dir: '/tests',
    story: 'AIOS-38',
    output: [
      '$ npm run test',
      '> vitest run',
      'Running tests...',
      'PASS src/hooks/__tests__/useChat.test.ts',
      'Tests: 12 passed, 12 total',
    ],
  },
  {
    id: '3',
    agent: 'AIOS Architect',
    status: 'idle',
    dir: '/docs',
    story: '',
    output: ['$ echo "Ready"', 'Ready', '$'],
  },
  {
    id: '4',
    agent: 'AIOS DevOps',
    status: 'working',
    dir: '/',
    story: 'AIOS-50',
    output: [
      '$ git push origin main',
      'Enumerating objects: 42',
      'Counting objects: 100%',
      'Writing objects: 100%',
      'remote: Resolving deltas: 100%',
    ],
  },
  {
    id: '5',
    agent: 'AIOS Analyst',
    status: 'idle',
    dir: '/data',
    story: '',
    output: [
      '$ node analyze.js',
      'Analysis complete',
      'Report saved to /tmp/report.md',
      '$',
    ],
  },
  {
    id: '6',
    agent: 'AIOS PM',
    status: 'idle',
    dir: '/',
    story: '',
    output: ['$'],
  },
];

const MAX_SESSIONS = 12;

export default function TerminalsView() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const sessionCount = mockSessions.length;
  const capacityPercent = Math.round((sessionCount / MAX_SESSIONS) * 100);

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Terminal className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-bold text-primary">Terminals</h1>
          <Badge variant="default" size="sm">
            {sessionCount} sessions
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* Grid/List toggle */}
          <div className="flex items-center glass rounded-xl overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'grid'
                  ? 'bg-white/10 text-primary'
                  : 'text-tertiary hover:text-secondary',
              )}
              aria-label="Grid view"
              aria-pressed={viewMode === 'grid'}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'list'
                  ? 'bg-white/10 text-primary'
                  : 'text-tertiary hover:text-secondary',
              )}
              aria-label="List view"
              aria-pressed={viewMode === 'list'}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <GlassButton
            size="sm"
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
          >
            New Terminal
          </GlassButton>
        </div>
      </div>

      {/* Terminal sessions */}
      <SectionLabel count={sessionCount}>Active Sessions</SectionLabel>

      <div
        className={cn(
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'
            : 'flex flex-col gap-3',
        )}
      >
        {mockSessions.map((session) => (
          <TerminalCard
            key={session.id}
            session={session}
            listMode={viewMode === 'list'}
          />
        ))}
      </div>

      {/* Footer */}
      <GlassCard padding="sm" variant="subtle" className="flex-shrink-0 mt-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs text-tertiary">
              <span className="h-2 w-2 rounded-full bg-yellow-500/60" />
              Demo Mode
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-tertiary">
              {sessionCount}/{MAX_SESSIONS} sessions
            </span>
            <ProgressBar
              value={capacityPercent}
              size="sm"
              variant={capacityPercent > 80 ? 'warning' : 'default'}
              className="w-24"
            />
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
