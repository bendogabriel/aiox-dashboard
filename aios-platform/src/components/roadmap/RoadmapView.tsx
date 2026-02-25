import { motion } from 'framer-motion';
import {
  Map,
  Plus,
  Circle,
  CheckCircle,
  Loader,
} from 'lucide-react';
import { GlassCard, GlassButton, Badge, SectionLabel } from '../ui';
import { useRoadmapStore, type RoadmapFeature } from '../../stores/roadmapStore';
import { cn } from '../../lib/utils';

// --- Priority Config ---

const priorityConfig = {
  must: { label: 'Must Have', borderColor: 'border-l-red-500', textColor: 'text-red-400' },
  should: { label: 'Should Have', borderColor: 'border-l-yellow-500', textColor: 'text-yellow-400' },
  could: { label: 'Could Have', borderColor: 'border-l-blue-500', textColor: 'text-blue-400' },
  wont: { label: "Won't Have", borderColor: 'border-l-gray-500', textColor: 'text-gray-400' },
} as const;

const impactColors = {
  high: 'success',
  medium: 'warning',
  low: 'offline',
} as const;

const effortColors = {
  high: 'error',
  medium: 'warning',
  low: 'success',
} as const;

const statusIcons = {
  planned: Circle,
  in_progress: Loader,
  done: CheckCircle,
} as const;

const statusLabels = {
  planned: 'Planned',
  in_progress: 'In Progress',
  done: 'Done',
} as const;

const filterOptions = ['all', 'must', 'should', 'could', 'wont'] as const;

// --- Feature Card ---

function RoadmapCard({ feature }: { feature: RoadmapFeature }) {
  const StatusIcon = statusIcons[feature.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-subtle rounded-xl p-3 space-y-2"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium text-primary leading-tight">{feature.title}</h3>
        <StatusIcon
          size={14}
          className={cn(
            feature.status === 'done' ? 'text-green-400' :
            feature.status === 'in_progress' ? 'text-blue-400 animate-spin' :
            'text-tertiary',
          )}
        />
      </div>
      <p className="text-xs text-secondary leading-relaxed">{feature.description}</p>
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="status" status={impactColors[feature.impact]} size="sm">
          Impact: {feature.impact}
        </Badge>
        <Badge variant="status" status={effortColors[feature.effort]} size="sm">
          Effort: {feature.effort}
        </Badge>
        <Badge variant="default" size="sm">
          {statusLabels[feature.status]}
        </Badge>
      </div>
      {feature.tags.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {feature.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] text-tertiary bg-white/5 rounded px-1.5 py-0.5"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// --- Priority Section ---

function PrioritySection({ priority, features }: { priority: keyof typeof priorityConfig; features: RoadmapFeature[] }) {
  const config = priorityConfig[priority];

  return (
    <GlassCard padding="md" className={cn('border-l-4', config.borderColor)}>
      <SectionLabel count={features.length}>
        <span className={config.textColor}>{config.label}</span>
      </SectionLabel>
      <div className="space-y-3">
        {features.length === 0 ? (
          <p className="text-xs text-tertiary text-center py-4">No features</p>
        ) : (
          features.map((f) => <RoadmapCard key={f.id} feature={f} />)
        )}
      </div>
    </GlassCard>
  );
}

// --- Main Component ---

export default function RoadmapView() {
  const { features, filter, setFilter } = useRoadmapStore();

  const filtered = filter === 'all' ? features : features.filter((f) => f.priority === filter);

  const grouped = {
    must: filtered.filter((f) => f.priority === 'must'),
    should: filtered.filter((f) => f.priority === 'should'),
    could: filtered.filter((f) => f.priority === 'could'),
    wont: filtered.filter((f) => f.priority === 'wont'),
  };

  return (
    <div className="h-full overflow-y-auto glass-scrollbar p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Map size={22} className="text-indigo-400" />
          <h1 className="text-xl font-semibold text-primary">Product Roadmap</h1>
          <Badge variant="count" size="sm">{features.length}</Badge>
        </div>
        <GlassButton size="sm" leftIcon={<Plus size={14} />}>
          Add Feature
        </GlassButton>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 flex-wrap">
        {filterOptions.map((opt) => (
          <GlassButton
            key={opt}
            size="sm"
            variant={filter === opt ? 'primary' : 'ghost'}
            onClick={() => setFilter(opt)}
          >
            {opt === 'all' ? 'All' : priorityConfig[opt].label}
          </GlassButton>
        ))}
      </div>

      {/* Priority Grid */}
      {filter === 'all' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PrioritySection priority="must" features={grouped.must} />
          <PrioritySection priority="should" features={grouped.should} />
          <PrioritySection priority="could" features={grouped.could} />
          <PrioritySection priority="wont" features={grouped.wont} />
        </div>
      ) : (
        <PrioritySection priority={filter as keyof typeof priorityConfig} features={filtered} />
      )}
    </div>
  );
}
