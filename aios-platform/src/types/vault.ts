// ── Vault SSOT Types — Phase 1 ──

// ── Workspace ──

export interface WorkspaceSettings {
  aiModel: string;
  freshnessThresholdDays: number;
  autoClassify: boolean;
  contextPackageMaxTokens: number;
}

export interface VaultWorkspace {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  status: 'active' | 'setup' | 'inactive';
  settings: WorkspaceSettings;
  spacesCount: number;
  sourcesCount: number;
  documentsCount: number;
  templatesCount: number;
  totalTokens: number;
  healthPercent: number;
  lastUpdated: string;
  createdAt: string;
  // Legacy embedded data (kept for backward compat with existing UI)
  categories: DataCategory[];
  templateGroups: TemplateGroup[];
  taxonomySections: TaxonomySection[];
  csuitePersonas: CSuitePersona[];
}

// ── Space ──

export interface VaultSpace {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  status: 'active' | 'archived';
  documentsCount: number;
  totalTokens: number;
  healthPercent: number;
  createdAt: string;
  updatedAt: string;
}

// ── Source ──

export type SourceType = 'manual' | 'google_drive' | 'notion' | 'claude_memory' | 'api' | 'file_upload';
export type SourceStatus = 'connected' | 'disconnected' | 'syncing' | 'error';

export interface DataSource {
  id: string;
  workspaceId: string;
  name: string;
  type: SourceType;
  status: SourceStatus;
  config: Record<string, unknown>;
  lastSyncAt: string | null;
  documentsCount: number;
  createdAt: string;
  updatedAt: string;
}

// ── Document ──

export type DocumentStatus = 'raw' | 'draft' | 'validated' | 'stale' | 'archived';
export type DocumentType = 'offerbook' | 'brand' | 'narrative' | 'strategy' | 'diagnostic' | 'proof' | 'template' | 'generic' | 'sop' | 'reference' | 'raw';

export interface DocumentQuality {
  completeness: number;    // 0-100
  freshness: number;       // 0-100
  consistency: number;     // 0-100
}

export interface VaultDocument {
  id: string;
  workspaceId: string;
  spaceId: string | null;
  sourceId: string | null;
  name: string;
  type: DocumentType;
  content: string;
  contentHash: string;
  summary: string;
  language: string;
  status: DocumentStatus;
  tokenCount: number;
  tags: string[];
  sourceMetadata: Record<string, unknown>;
  quality: DocumentQuality;
  validatedAt: string | null;
  lastUpdated: string;
  createdAt: string;
  // Legacy fields (backward compat)
  source: string;
  taxonomy: string;
  consumers: string[];
  categoryId: string;
}

// ── Data Categories ──

export type DataCategoryId = 'company' | 'products' | 'campaigns' | 'brand' | 'tech' | 'operations' | 'market' | 'finance' | 'legal' | 'people';

export interface DataCategory {
  id: DataCategoryId;
  name: string;
  icon: string;
  color: string;
  items: DataItem[];
  status: 'complete' | 'partial' | 'empty';
}

export interface DataItem {
  id: string;
  name: string;
  type: string;
  status: 'validated' | 'draft' | 'outdated';
  tokenCount: number;
  lastUpdated: string;
  documentId: string;
}

export interface CampaignItem extends DataItem {
  briefStatus: 'done' | 'in-progress' | 'pending';
  operationStatus: 'running' | 'paused' | 'done';
  operationNotes?: string;
}

// ── Templates ──

export interface TemplateGroup {
  id: string;
  name: string;
  icon: string;
  area: string;
  templates: TemplateItem[];
  completionPercent: number;
}

export interface TemplateItem {
  id: string;
  name: string;
  status: 'filled' | 'empty' | 'partial';
  lastUpdated?: string;
}

// ── Taxonomy ──

export interface TaxonomyNode {
  id: string;
  name: string;
  type: 'namespace' | 'entity' | 'term' | 'workflow';
  children?: TaxonomyNode[];
  usedInDocuments: number;
  description?: string;
}

export interface TaxonomySection {
  id: string;
  name: string;
  icon: string;
  nodes: TaxonomyNode[];
}

// ── C-Suite ──

export interface CSuitePersona {
  id: string;
  name: string;
  role: string;
  icon: string;
  area: string;
  dependencies: string[];
  isActive: boolean;
}

// ── Sync ──

export interface SyncJob {
  id: string;
  sourceId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  documentsProcessed: number;
  documentsTotal: number;
  startedAt: string | null;
  completedAt: string | null;
  error: string | null;
  createdAt: string;
}

export interface FieldMapping {
  id: string;
  sourceId: string;
  sourceField: string;
  targetField: string;
  transform: string | null;
}

// ── Context Package ──

export interface ContextPackage {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  description: string;
  documentIds: string[];
  totalTokens: number;
  maxTokens: number;
  createdAt: string;
  updatedAt: string;
}

// ── Activity Feed ──

export type VaultActivityType =
  | 'taxonomy_updated'
  | 'template_created'
  | 'document_ingested'
  | 'workspace_created'
  | 'document_validated'
  | 'csuite_activated'
  | 'space_created'
  | 'source_connected'
  | 'document_uploaded'
  | 'sync_completed';

export interface VaultActivity {
  id: string;
  type: VaultActivityType;
  description: string;
  timestamp: string;
  workspaceId: string;
}

// ── Store State ──

export type VaultTab = 'overview' | 'spaces' | 'sources' | 'documents' | 'taxonomy' | 'packages' | 'templates';

export interface VaultState {
  workspaces: VaultWorkspace[];
  documents: VaultDocument[];
  spaces: VaultSpace[];
  sources: DataSource[];
  activities: VaultActivity[];
  selectedWorkspaceId: string | null;
  selectedDocumentId: string | null;
  selectedSpaceId: string | null;
  activeTab: VaultTab;
  level: 1 | 2 | 3;
  // Actions
  selectWorkspace: (id: string) => void;
  selectDocument: (id: string) => void;
  selectSpace: (id: string | null) => void;
  setActiveTab: (tab: VaultTab) => void;
  goBack: () => void;
  updateDocument: (id: string, content: string) => void;
  createDocument: (data: Partial<VaultDocument>) => Promise<void>;
  uploadDocuments: (files: File[], workspaceId: string) => Promise<void>;
  pasteContent: (data: { content: string; name: string; workspaceId: string; spaceId?: string; category?: string }) => Promise<void>;
}
