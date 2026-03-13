// ── Vault Types ──

// Workspace
export interface VaultWorkspace {
  id: string;
  name: string;
  icon: string;
  status: 'active' | 'setup' | 'inactive';
  documentsCount: number;
  templatesCount: number;
  healthPercent: number;
  lastUpdated: string;
  categories: DataCategory[];
  templateGroups: TemplateGroup[];
  taxonomySections: TaxonomySection[];
  csuitePersonas: CSuitePersona[];
}

// Data Categories (Company, Products, Campaigns, Brand, Tech, Operations)
export type DataCategoryId = 'company' | 'products' | 'campaigns' | 'brand' | 'tech' | 'operations';

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

// Templates
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

// Taxonomies
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

// C-Suite Cerebral
export interface CSuitePersona {
  id: string;
  name: string;
  role: string;
  icon: string;
  area: string;
  dependencies: string[];
  isActive: boolean;
}

// Documents
export interface VaultDocument {
  id: string;
  name: string;
  type: 'offerbook' | 'brand' | 'narrative' | 'strategy' | 'diagnostic' | 'proof' | 'template' | 'generic';
  content: string;
  status: 'validated' | 'draft' | 'outdated';
  tokenCount: number;
  source: string;
  taxonomy: string;
  consumers: string[];
  lastUpdated: string;
  categoryId: string;
  workspaceId: string;
}

// Activity Feed
export type VaultActivityType = 'taxonomy_updated' | 'template_created' | 'document_ingested' | 'workspace_created' | 'document_validated' | 'csuite_activated';

export interface VaultActivity {
  id: string;
  type: VaultActivityType;
  description: string;
  timestamp: string;
  workspaceId: string;
}

// Store State
export type VaultTab = 'dados' | 'templates' | 'taxonomias' | 'csuite';

export interface VaultState {
  workspaces: VaultWorkspace[];
  documents: VaultDocument[];
  activities: VaultActivity[];
  selectedWorkspaceId: string | null;
  selectedDocumentId: string | null;
  activeTab: VaultTab;
  level: 1 | 2 | 3;
  // Actions
  selectWorkspace: (id: string) => void;
  selectDocument: (id: string) => void;
  setActiveTab: (tab: VaultTab) => void;
  goBack: () => void;
  updateDocument: (id: string, content: string) => void;
}
