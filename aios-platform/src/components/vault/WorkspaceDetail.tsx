import { useState, useMemo } from 'react';
import {
  Database,
  FileText,
  GitFork,
  Crown,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { GlassCard, GlassButton, Badge, StatusDot, ProgressBar } from '../ui';
import type { StatusType } from '../ui/StatusDot';
import type {
  VaultWorkspace,
  VaultTab,
  DataCategory,
  DataItem,
  TemplateGroup,
  TaxonomySection,
  TaxonomyNode,
  CSuitePersona,
} from '../../types/vault';
import { useVaultStore } from '../../stores/vaultStore';
import { cn } from '../../lib/utils';

// ── Props ──

interface WorkspaceDetailProps {
  workspace: VaultWorkspace;
  activeTab?: VaultTab;
  onTabChange?: (tab: VaultTab) => void;
  onSelectDocument: (documentId: string) => void;
  searchQuery?: string;
}

// ── Constants ──

const CATEGORY_COLORS: Record<string, { border: string; text: string; bg: string }> = {
  purple: { border: 'border-l-purple-400', text: 'text-purple-400', bg: 'bg-purple-500/10' },
  green: { border: 'border-l-green-400', text: 'text-green-400', bg: 'bg-green-500/10' },
  yellow: { border: 'border-l-yellow-400', text: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  orange: { border: 'border-l-orange-400', text: 'text-orange-400', bg: 'bg-orange-500/10' },
  emerald: { border: 'border-l-emerald-400', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  blue: { border: 'border-l-blue-400', text: 'text-blue-400', bg: 'bg-blue-500/10' },
};

const STATUS_DOT_MAP: Record<string, StatusType> = {
  complete: 'success',
  partial: 'waiting',
  empty: 'error',
};

const TABS: { id: VaultTab; label: string; icon: React.ElementType }[] = [
  { id: 'dados', label: 'Dados', icon: Database },
  { id: 'templates', label: 'Templates', icon: FileText },
  { id: 'taxonomias', label: 'Taxonomias', icon: GitFork },
  { id: 'csuite', label: 'C-Suite', icon: Crown },
];

const TEMPLATE_FILTER_CHIPS = ['Todos', 'AI', 'Analytics', 'Branding', 'Ops', 'Tech', 'Executive'];

const ITEM_STATUS_MAP: Record<string, 'success' | 'warning' | 'error'> = {
  validated: 'success',
  draft: 'warning',
  outdated: 'error',
};

const MAX_VISIBLE_ITEMS = 5;

// ── Sub-components ──

function DataCategoryCard({
  category,
  onSelectDocument,
}: {
  category: DataCategory;
  onSelectDocument: (documentId: string) => void;
}) {
  const colors = CATEGORY_COLORS[category.color] ?? CATEGORY_COLORS.blue;
  const visibleItems = category.items.slice(0, MAX_VISIBLE_ITEMS);

  return (
    <GlassCard
      variant="subtle"
      padding="none"
      className={cn('border-l-4', colors.border)}
      aria-label={`${category.name} category`}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={cn('text-lg', colors.text)}>{category.icon}</span>
            <span className="text-sm font-medium text-primary">{category.name}</span>
          </div>
          <StatusDot
            status={STATUS_DOT_MAP[category.status] ?? 'error'}
            size="sm"
          />
        </div>

        {/* Items */}
        <div className="space-y-1.5">
          {visibleItems.map((item) => (
            <DataItemRow
              key={item.id}
              item={item}
              onSelect={onSelectDocument}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="mt-3 pt-3 border-t border-white/5">
          <span className="text-xs text-tertiary">{category.items.length} items</span>
        </div>
      </div>
    </GlassCard>
  );
}

function DataItemRow({
  item,
  onSelect,
}: {
  item: DataItem;
  onSelect: (documentId: string) => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        'w-full flex items-center justify-between px-2 py-1.5 rounded-md text-left',
        'hover:bg-white/5 transition-colors',
        item.documentId && 'cursor-pointer',
        !item.documentId && 'cursor-default opacity-60'
      )}
      onClick={() => {
        if (item.documentId) {
          onSelect(item.documentId);
        }
      }}
      disabled={!item.documentId}
    >
      <span className="text-xs text-secondary truncate mr-2">{item.name}</span>
      <Badge
        variant="status"
        status={ITEM_STATUS_MAP[item.status]}
        size="sm"
      >
        {item.status}
      </Badge>
    </button>
  );
}

function TemplateGroupCard({ group }: { group: TemplateGroup }) {
  return (
    <GlassCard variant="subtle" padding="md" aria-label={`${group.name} templates`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{group.icon}</span>
        <span className="text-sm font-medium text-primary">{group.area}</span>
      </div>

      <div className="space-y-1 mb-3">
        {group.templates.map((tmpl) => (
          <div key={tmpl.id} className="flex items-center gap-2">
            <span
              className={cn(
                'w-1.5 h-1.5 rounded-full',
                tmpl.status === 'filled' && 'bg-green-400',
                tmpl.status === 'partial' && 'bg-yellow-400',
                tmpl.status === 'empty' && 'bg-white/20'
              )}
            />
            <span className="text-xs text-secondary truncate">{tmpl.name}</span>
          </div>
        ))}
      </div>

      <ProgressBar
        value={group.completionPercent}
        size="sm"
        variant={group.completionPercent === 100 ? 'success' : 'default'}
        className="mb-2"
      />

      <span className="text-[10px] text-tertiary">{group.templates.length} templates</span>
    </GlassCard>
  );
}

function TaxonomyTree({
  sections,
  selectedNodeId,
  onSelectNode,
}: {
  sections: TaxonomySection[];
  selectedNodeId: string | null;
  onSelectNode: (node: TaxonomyNode) => void;
}) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    () => new Set(sections.map((s) => s.id))
  );
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderNode = (node: TaxonomyNode, depth: number): React.ReactNode => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = node.id === selectedNodeId;

    return (
      <div key={node.id}>
        <button
          type="button"
          className={cn(
            'w-full flex items-center gap-1.5 px-2 py-1 rounded text-left text-xs transition-colors',
            isSelected ? 'bg-white/10 text-primary' : 'text-secondary hover:bg-white/5',
          )}
          style={{ paddingLeft: `${8 + depth * 12}px` }}
          onClick={() => {
            onSelectNode(node);
            if (hasChildren) toggleNode(node.id);
          }}
        >
          {hasChildren ? (
            isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />
          ) : (
            <span className="w-3" />
          )}
          <span className="truncate">{node.name}</span>
        </button>
        {hasChildren && isExpanded && (
          <div>
            {node.children!.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-1">
      {sections.map((section) => {
        const isExpanded = expandedSections.has(section.id);
        return (
          <div key={section.id}>
            <button
              type="button"
              className="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-primary hover:bg-white/5 rounded transition-colors"
              onClick={() => toggleSection(section.id)}
            >
              {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              <span>{section.icon}</span>
              <span>{section.name}</span>
            </button>
            {isExpanded && (
              <div className="ml-1">
                {section.nodes.map((node) => renderNode(node, 0))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function TaxonomyNodeDetail({ node }: { node: TaxonomyNode | null }) {
  if (!node) {
    return (
      <div className="flex items-center justify-center h-full text-tertiary text-sm">
        Select a taxonomy node to view details
      </div>
    );
  }

  const typeColors: Record<string, string> = {
    namespace: 'bg-purple-500/15 text-purple-400',
    entity: 'bg-blue-500/15 text-blue-400',
    term: 'bg-green-500/15 text-green-400',
    workflow: 'bg-orange-500/15 text-orange-400',
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <h4 className="text-sm font-medium text-primary mb-2">{node.name}</h4>
        <Badge
          variant="default"
          size="sm"
          className={typeColors[node.type] ?? ''}
        >
          {node.type}
        </Badge>
      </div>

      {node.description && (
        <p className="text-xs text-secondary leading-relaxed">{node.description}</p>
      )}

      <div className="text-xs text-tertiary">
        Used in <span className="text-secondary font-medium">{node.usedInDocuments}</span> docs
      </div>

      {node.children && node.children.length > 0 && (
        <div>
          <span className="text-xs text-tertiary block mb-2">Children</span>
          <div className="flex flex-wrap gap-1.5">
            {node.children.map((child) => (
              <Badge key={child.id} variant="subtle" size="sm">
                {child.name}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CSuitePersonaCard({ persona }: { persona: CSuitePersona }) {
  return (
    <GlassCard
      variant="subtle"
      padding="md"
      className={cn(
        'border-l-4',
        persona.isActive
          ? 'border-l-[#D1FF00]'
          : 'border-l-transparent'
      )}
      aria-label={`${persona.name} - ${persona.role}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{persona.icon}</span>
          <div>
            <div className="text-sm font-medium text-primary">{persona.name}</div>
            <div className="text-[10px] text-tertiary">{persona.role}</div>
          </div>
        </div>
        <StatusDot
          status={persona.isActive ? 'success' : 'offline'}
          size="sm"
          label={persona.isActive ? 'Active' : 'Inactive'}
        />
      </div>

      <div className="text-[10px] text-tertiary mb-2">{persona.area}</div>

      {persona.dependencies.length > 0 && (
        <div>
          <span className="text-[10px] text-tertiary block mb-1">Dependencies</span>
          <div className="flex flex-wrap gap-1">
            {persona.dependencies.map((dep) => (
              <Badge key={dep} variant="subtle" size="sm">
                {dep}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </GlassCard>
  );
}

// ── Main Component ──

export default function WorkspaceDetail({
  workspace,
  activeTab: activeTabProp,
  onTabChange: onTabChangeProp,
  onSelectDocument,
  searchQuery: _searchQuery,
}: WorkspaceDetailProps) {
  // Use store as default, props as override
  const storeTab = useVaultStore((s) => s.activeTab);
  const storeSetTab = useVaultStore((s) => s.setActiveTab);

  const activeTab = activeTabProp ?? storeTab;
  const onTabChange = onTabChangeProp ?? storeSetTab;

  // Template filter state
  const [templateFilter, setTemplateFilter] = useState('Todos');

  // Taxonomy selected node
  const [selectedTaxonomyNode, setSelectedTaxonomyNode] = useState<TaxonomyNode | null>(null);

  // Filtered template groups
  const filteredTemplateGroups = useMemo(() => {
    if (templateFilter === 'Todos') return workspace.templateGroups;
    return workspace.templateGroups.filter(
      (g) => g.area.toLowerCase() === templateFilter.toLowerCase()
    );
  }, [workspace.templateGroups, templateFilter]);

  // Stats
  const totalDocs = workspace.categories.reduce((sum, cat) => sum + cat.items.length, 0);
  const totalTemplates = workspace.templateGroups.reduce(
    (sum, g) => sum + g.templates.length,
    0
  );

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{workspace.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-primary">{workspace.name}</h2>
              <Badge
                variant="status"
                status={
                  workspace.status === 'active'
                    ? 'success'
                    : workspace.status === 'setup'
                      ? 'warning'
                      : 'offline'
                }
                size="sm"
              >
                {workspace.status}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-tertiary mt-0.5">
              <span>{totalDocs} docs</span>
              <span className="text-white/10">|</span>
              <span>{totalTemplates} templates</span>
              <span className="text-white/10">|</span>
              <span>Updated {formatDate(workspace.lastUpdated)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div className="flex items-center gap-1 p-1 glass rounded-xl" role="tablist">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all',
                isActive
                  ? 'bg-white/10 text-primary shadow-sm'
                  : 'text-tertiary hover:text-secondary hover:bg-white/5'
              )}
              onClick={() => onTabChange(tab.id)}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Tab Content ── */}
      <div id={`tabpanel-${activeTab}`} role="tabpanel">
        {activeTab === 'dados' && (
          <TabDados
            categories={workspace.categories}
            onSelectDocument={onSelectDocument}
          />
        )}
        {activeTab === 'templates' && (
          <TabTemplates
            groups={filteredTemplateGroups}
            allGroups={workspace.templateGroups}
            filter={templateFilter}
            onFilterChange={setTemplateFilter}
          />
        )}
        {activeTab === 'taxonomias' && (
          <TabTaxonomias
            sections={workspace.taxonomySections}
            selectedNode={selectedTaxonomyNode}
            onSelectNode={setSelectedTaxonomyNode}
          />
        )}
        {activeTab === 'csuite' && (
          <TabCSuite personas={workspace.csuitePersonas} />
        )}
      </div>
    </div>
  );
}

// ── Tab: Dados ──

function TabDados({
  categories,
  onSelectDocument,
}: {
  categories: DataCategory[];
  onSelectDocument: (documentId: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {categories.map((cat) => (
        <DataCategoryCard
          key={cat.id}
          category={cat}
          onSelectDocument={onSelectDocument}
        />
      ))}
    </div>
  );
}

// ── Tab: Templates ──

function TabTemplates({
  groups,
  allGroups: _allGroups,
  filter,
  onFilterChange,
}: {
  groups: TemplateGroup[];
  allGroups: TemplateGroup[];
  filter: string;
  onFilterChange: (chip: string) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {TEMPLATE_FILTER_CHIPS.map((chip) => {
          const isActive = filter === chip;
          return (
            <GlassButton
              key={chip}
              size="sm"
              variant={isActive ? 'primary' : 'ghost'}
              onClick={() => onFilterChange(chip)}
              className="text-xs"
            >
              {chip}
            </GlassButton>
          );
        })}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((group) => (
          <TemplateGroupCard key={group.id} group={group} />
        ))}
      </div>

      {groups.length === 0 && (
        <div className="text-center py-8 text-sm text-tertiary">
          No templates found for "{filter}"
        </div>
      )}
    </div>
  );
}

// ── Tab: Taxonomias ──

function TabTaxonomias({
  sections,
  selectedNode,
  onSelectNode,
}: {
  sections: TaxonomySection[];
  selectedNode: TaxonomyNode | null;
  onSelectNode: (node: TaxonomyNode) => void;
}) {
  return (
    <div className="flex gap-4 min-h-[400px]">
      {/* Left: Tree (30%) */}
      <GlassCard
        variant="subtle"
        padding="sm"
        className="w-[30%] overflow-y-auto glass-scrollbar flex-shrink-0"
      >
        <TaxonomyTree
          sections={sections}
          selectedNodeId={selectedNode?.id ?? null}
          onSelectNode={onSelectNode}
        />
      </GlassCard>

      {/* Right: Detail (70%) */}
      <GlassCard variant="subtle" padding="none" className="flex-1 overflow-y-auto glass-scrollbar">
        <TaxonomyNodeDetail node={selectedNode} />
      </GlassCard>
    </div>
  );
}

// ── Tab: C-Suite ──

function TabCSuite({ personas }: { personas: CSuitePersona[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {personas.map((persona) => (
        <CSuitePersonaCard key={persona.id} persona={persona} />
      ))}
    </div>
  );
}
