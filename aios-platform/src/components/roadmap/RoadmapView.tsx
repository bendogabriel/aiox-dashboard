import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Map,
  Plus,
  Circle,
  CheckCircle,
  Loader,
  X,
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
        <h2 className="text-sm font-medium text-primary leading-tight">{feature.title}</h2>
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

// --- Add Feature Form ---

const defaultForm = {
  title: '',
  description: '',
  priority: 'should' as RoadmapFeature['priority'],
  impact: 'medium' as RoadmapFeature['impact'],
  effort: 'medium' as RoadmapFeature['effort'],
  tags: '',
  status: 'planned' as RoadmapFeature['status'],
};

function AddFeatureForm({ onClose, onSubmit }: { onClose: () => void; onSubmit: (feature: RoadmapFeature) => void }) {
  const [form, setForm] = useState(defaultForm);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    onSubmit({
      id: crypto.randomUUID(),
      title: form.title.trim(),
      description: form.description.trim(),
      priority: form.priority,
      impact: form.impact,
      effort: form.effort,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      status: form.status,
    });
    onClose();
  };

  const selectClass = 'w-full glass-subtle rounded-lg px-3 py-2 text-sm text-primary bg-transparent border border-white/10 focus:border-indigo-500/50 focus:outline-none appearance-none';
  const labelClass = 'text-xs font-medium text-secondary';

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
    >
      <GlassCard padding="md" className="border border-indigo-500/20">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-primary">New Feature</h2>
            <button type="button" onClick={onClose} className="text-tertiary hover:text-primary transition-colors" aria-label="Fechar">
              <X size={16} />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className={labelClass}>Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Feature name..."
                className="w-full glass-subtle rounded-lg px-3 py-2 text-sm text-primary placeholder:text-tertiary bg-transparent border border-white/10 focus:border-indigo-500/50 focus:outline-none"
                autoFocus
              />
            </div>

            <div>
              <label className={labelClass}>Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Brief description..."
                rows={2}
                className="w-full glass-subtle rounded-lg px-3 py-2 text-sm text-primary placeholder:text-tertiary bg-transparent border border-white/10 focus:border-indigo-500/50 focus:outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>Priority</label>
                <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as RoadmapFeature['priority'] }))} className={selectClass} aria-label="Selecionar prioridade">
                  <option value="must">Must Have</option>
                  <option value="should">Should Have</option>
                  <option value="could">Could Have</option>
                  <option value="wont">Won&apos;t Have</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Impact</label>
                <select value={form.impact} onChange={(e) => setForm((f) => ({ ...f, impact: e.target.value as RoadmapFeature['impact'] }))} className={selectClass} aria-label="Selecionar impacto">
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Effort</label>
                <select value={form.effort} onChange={(e) => setForm((f) => ({ ...f, effort: e.target.value as RoadmapFeature['effort'] }))} className={selectClass} aria-label="Selecionar esforço">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>Tags (comma-separated)</label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                placeholder="ui, api, performance..."
                className="w-full glass-subtle rounded-lg px-3 py-2 text-sm text-primary placeholder:text-tertiary bg-transparent border border-white/10 focus:border-indigo-500/50 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <GlassButton type="button" size="sm" variant="ghost" onClick={onClose}>
              Cancel
            </GlassButton>
            <GlassButton type="submit" size="sm" variant="primary" disabled={!form.title.trim()}>
              Add Feature
            </GlassButton>
          </div>
        </form>
      </GlassCard>
    </motion.div>
  );
}

// --- Main Component ---

export default function RoadmapView() {
  const { features, filter, setFilter, addFeature } = useRoadmapStore();
  const [showAddForm, setShowAddForm] = useState(false);

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
        <GlassButton size="sm" leftIcon={<Plus size={14} />} onClick={() => setShowAddForm(true)}>
          Add Feature
        </GlassButton>
      </div>

      {/* Add Feature Form */}
      <AnimatePresence>
        {showAddForm && (
          <AddFeatureForm onClose={() => setShowAddForm(false)} onSubmit={addFeature} />
        )}
      </AnimatePresence>

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
