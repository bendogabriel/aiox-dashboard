// Re-export agent tech sheet types
export type * from './agent-tech-sheet';

// Re-export marketplace types
export type * from './marketplace';

// Re-export vault types
export type * from './vault';

// Squad Types (expanded 2026-02-24 — matches CSS token palette)
export type SquadType =
  | 'copywriting'    // orange
  | 'design'         // purple
  | 'creator'        // green
  | 'orchestrator'   // cyan
  | 'content'        // red
  | 'development'    // blue
  | 'engineering'    // indigo
  | 'analytics'      // teal
  | 'marketing'      // pink
  | 'advisory'       // yellow
  | 'default';       // gray

// Map squad IDs to SquadTypes for UI styling (updated 2026-03-13)
export const squadTypeMap: Record<string, SquadType> = {
  // Marketing & Copy (orange)
  'copywriting': 'copywriting',
  // Sales & Funnels (blue)
  'media-buy': 'development',
  'funnel-creator': 'development',
  // Sales (green)
  'sales': 'creator',
  // Creative & Design (purple)
  'design-system': 'design',
  'creative-studio': 'design',
  // Engineering (indigo)
  'full-stack-dev': 'engineering',
  'aios-core-dev': 'engineering',
  'etl-ops': 'engineering',
  'skill-tester': 'engineering',
  'technical-documentation': 'engineering',
  // Content & YouTube (red)
  'content-ecosystem': 'content',
  'youtube-lives': 'content',
  'media-production': 'content',
  'video-production': 'content',
  'asmr-shorts': 'content',
  // Data & Research (teal)
  'data-analytics': 'analytics',
  'market-research': 'analytics',
  'academic-research': 'analytics',
  // Scraping & Outreach (pink)
  'deep-scraper': 'marketing',
  'seo': 'marketing',
  'traffic-squad': 'marketing',
  'agora-direct-response': 'marketing',
  'marketing-automation': 'marketing',
  // Strategy & Advisory (yellow)
  'conselho': 'advisory',
  'infoproduct-creation': 'advisory',
  'erico-rocha': 'advisory',
  'hormozi': 'advisory',
  'strategy-natalia-tanaka': 'advisory',
  // System & Orchestration (cyan)
  'project-management-clickup': 'orchestrator',
  'orquestrador-global': 'orchestrator',
  'squad-creator': 'orchestrator',
  'squad-creator-pro': 'orchestrator',
  'navigator': 'orchestrator',
  'support': 'orchestrator',
  'sop-factory': 'orchestrator',
  // Natalia Tanaka
  'communication-natalia-tanaka': 'copywriting',
  'community-natalia-tanaka': 'copywriting',
};

// Pattern-based squad type mapping (for sub-squads and new squads)
const squadTypePatterns: Array<{ pattern: RegExp; type: SquadType }> = [
  { pattern: /youtube|video|media-production|asmr/i, type: 'content' },
  { pattern: /copywriting|copy/i, type: 'copywriting' },
  { pattern: /media-buy|funnel/i, type: 'development' },
  { pattern: /design|ui|ux|creative|studio/i, type: 'design' },
  { pattern: /dev|full-stack|frontend|backend|aios-core|etl|documentation/i, type: 'engineering' },
  { pattern: /content|ecosystem/i, type: 'content' },
  { pattern: /data|analytics|research/i, type: 'analytics' },
  { pattern: /scraper|deep-|seo|traffic|marketing|agora/i, type: 'marketing' },
  { pattern: /conselho|advisor|infoproduct|hormozi|erico/i, type: 'advisory' },
  { pattern: /strategy.*tanaka/i, type: 'advisory' },
  { pattern: /natalia-tanaka/i, type: 'copywriting' },
  { pattern: /orquestrador|orchestrator|system|project-management|navigator|support|sop/i, type: 'orchestrator' },
  { pattern: /comercial|sales|vendas/i, type: 'creator' },
  { pattern: /community|comunidade/i, type: 'orchestrator' },
  { pattern: /communication|comunicacao/i, type: 'copywriting' },
];

export function getSquadType(squadId: string, domain?: string): SquadType {
  // First try exact match
  if (squadTypeMap[squadId]) {
    return squadTypeMap[squadId];
  }

  // Then try pattern matching against squadId
  for (const { pattern, type } of squadTypePatterns) {
    if (pattern.test(squadId)) {
      return type;
    }
  }

  // Then try pattern matching against domain (for new/unknown squads)
  if (domain) {
    for (const { pattern, type } of squadTypePatterns) {
      if (pattern.test(domain)) {
        return type;
      }
    }
    // Direct domain name match (e.g. domain="engineering" → SquadType "engineering")
    const domainLower = domain.toLowerCase();
    const validTypes: SquadType[] = [
      'copywriting', 'design', 'creator', 'orchestrator', 'content',
      'development', 'engineering', 'analytics', 'marketing', 'advisory',
    ];
    const directMatch = validTypes.find(t => domainLower.includes(t));
    if (directMatch) return directMatch;
  }

  return 'default';
}

export interface Squad {
  id: string;
  name: string;
  description: string;
  domain?: string;
  icon?: string;
  agentCount: number;
  // UI-only fields
  type?: SquadType;
  status?: 'active' | 'busy' | 'inactive';
  capabilities?: string[];
}

export interface SquadDetail extends Squad {
  agents: AgentSummary[];
  config?: Record<string, unknown>;
}

export interface SquadStats {
  squadId: string;
  stats: {
    totalAgents: number;
    byTier: Record<string, number>;
    quality: {
      withVoiceDna: number;
      withAntiPatterns: number;
      withIntegration: number;
    };
    commands: {
      total: number;
      byAgent: Array<{ agentId: string; count: number }>;
    };
    qualityScore: number;
  };
}

export interface EcosystemOverview {
  totalSquads: number;
  totalAgents: number;
  squads: Array<{
    id: string;
    name: string;
    icon?: string;
    domain?: string;
    agentCount: number;
    tiers: {
      orchestrators: number;
      masters: number;
      specialists: number;
    };
  }>;
}

// Agent Types
export type AgentTier = 0 | 1 | 2; // 0=Orchestrator, 1=Master, 2=Specialist

export interface AgentSummary {
  id: string;
  name: string;
  title?: string;
  icon?: string;
  tier: AgentTier;
  squad: string;
  description?: string;
  whenToUse?: string;
  commandCount?: number;
}

export interface AgentCommand {
  command: string;
  action: string;
  description?: string;
}

export interface AgentPersona {
  role?: string;
  style?: string;
  identity?: string;
  background?: string;
  focus?: string;
}

export interface Agent extends AgentSummary {
  persona?: AgentPersona;
  corePrinciples?: string[];
  commands?: AgentCommand[];
  mindSource?: {
    name?: string;
    credentials?: string[];
    frameworks?: string[];
  };
  voiceDna?: {
    sentenceStarters?: string[];
    vocabulary?: {
      alwaysUse?: string[];
      neverUse?: string[];
    };
  };
  antiPatterns?: {
    neverDo?: string[];
  };
  integration?: {
    receivesFrom?: string[];
    handoffTo?: string[];
  };
  quality?: {
    hasVoiceDna: boolean;
    hasAntiPatterns: boolean;
    hasIntegration: boolean;
  };
  // Tech Sheet fields (parsed from YAML)
  metadata?: import('./agent-tech-sheet').AgentMetadata;
  personaProfile?: import('./agent-tech-sheet').AgentPersonaProfile;
  boundaries?: import('./agent-tech-sheet').AgentBoundaries;
  gitRestrictions?: import('./agent-tech-sheet').AgentGitRestrictions;
  agentDependencies?: import('./agent-tech-sheet').AgentDependencies;
  autoClaude?: import('./agent-tech-sheet').AgentAutoClaude;
  codeRabbit?: import('./agent-tech-sheet').AgentCodeRabbit;
  routingMatrix?: import('./agent-tech-sheet').AgentRoutingMatrix;
  // UI-only fields (mapped from backend)
  squadId?: string;
  squadType?: SquadType;
  role?: string;
  status?: 'online' | 'busy' | 'offline';
  capabilities?: string[];
  model?: string;
  lastActive?: string;
  executionCount?: number;
}

// Message Types
export type MessageRole = 'user' | 'agent' | 'system';

// Attachment types for media support
export interface MessageAttachment {
  id: string;
  name: string;
  type: 'image' | 'file' | 'audio' | 'video';
  mimeType: string;
  size: number;
  url?: string; // URL for remote files or blob URLs for local files
  data?: string; // Base64 encoded data for small files
  thumbnailUrl?: string; // For images/videos
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  agentId?: string;
  agentName?: string;
  squadId?: string;
  squadType?: SquadType;
  timestamp: string;
  isStreaming?: boolean;
  // Attachments for media files
  attachments?: MessageAttachment[];
  metadata?: {
    provider?: string;
    model?: string;
    usage?: TokenUsage;
    duration?: number;
    [key: string]: unknown;
  };
}

// Chat Types
export interface ChatSession {
  id: string;
  agentId: string;
  agentName: string;
  agentSquad?: SquadType;
  squadId: string;
  squadType: SquadType;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

// Execution Types
export interface ExecuteRequest {
  squadId: string;
  agentId: string;
  input: {
    message: string;
    context?: Record<string, unknown>;
    command?: string;
  };
  options?: {
    async?: boolean;
    timeout?: number;
    stream?: boolean;
  };
}

export interface ExecuteResult {
  agentId: string;
  agentName: string;
  message: string;
  commandExecuted?: boolean;
  command?: string;
  metadata: {
    squad: string;
    tier: AgentTier;
    provider: string;
    model: string;
    usage: TokenUsage;
    duration: number;
    processedAt: string;
  };
}

export interface ExecuteResponse {
  executionId: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  result?: ExecuteResult;
  statusUrl?: string;
  error?: string;
}

export interface ExecutionRecord {
  id: string;
  agentId: string;
  squadId: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
  completedAt?: string;
  input?: {
    message?: string;
    context?: Record<string, unknown>;
  };
  result?: ExecuteResult;
  error?: {
    code: string;
    message: string;
  };
  tokensUsed?: number;
  duration?: number;
}

export interface ExecutionHistory {
  executions: ExecutionRecord[];
  total: number;
}

export interface ExecutionStats {
  total: number;
  byStatus: Record<string, number>;
  bySquad: Record<string, number>;
  byAgent: Record<string, number>;
}

// Token Usage Types
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface LLMUsage {
  claude: {
    input: number;
    output: number;
    requests: number;
  };
  openai: {
    input: number;
    output: number;
    requests: number;
  };
  total: {
    input: number;
    output: number;
    requests: number;
  };
}

export interface LLMHealth {
  claude: {
    available: boolean;
    error?: string;
  };
  openai: {
    available: boolean;
    error?: string;
  };
}

export interface LLMModels {
  claude: string[];
  openai: string[];
  default: {
    fast: string;
    default: string;
    powerful: string;
  };
}

// MCP Types
export interface MCPServer {
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  tools: MCPTool[];
  resources: MCPResource[];
  lastPing?: string;
  error?: string;
}

export interface MCPTool {
  name: string;
  description?: string;
  calls: number;
  lastUsed?: string;
  avgDuration?: number;
  successRate?: number;
}

export interface MCPResource {
  uri: string;
  name: string;
  mimeType?: string;
  accessCount: number;
}

export interface MCPStats {
  totalServers: number;
  connectedServers: number;
  totalTools: number;
  totalToolCalls: number;
  topTools: Array<{ name: string; server: string; calls: number }>;
}

// Cost Estimation Types
export interface CostEstimate {
  provider: 'claude' | 'openai';
  inputTokens: number;
  outputTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  currency: string;
}

export interface CostSummary {
  today: number;
  thisWeek: number;
  thisMonth: number;
  byProvider: {
    claude: number;
    openai: number;
  };
  bySquad: Record<string, number>;
  trend: number[]; // Daily costs for last 7 days
}

// System Metrics Types
export interface SystemMetrics {
  uptime: number; // seconds
  avgLatency: number; // ms
  requestsPerMinute: number;
  errorRate: number; // percentage
  queueSize: number;
  activeConnections: number;
}

export interface HealthStatus {
  api: { healthy: boolean; latency: number };
  database: { healthy: boolean; latency: number };
  llm: { healthy: boolean; providers: { claude: boolean; openai: boolean } };
  mcp: { healthy: boolean; connectedServers: number };
}

// Agent Activity Entry (used by AgentActivityTimeline)
export interface AgentActivityEntry {
  id: string;
  agentId: string;
  timestamp: string;
  action: string;
  status: 'success' | 'error';
  duration: number;
}

// Agent Analytics Types
export interface AgentAnalytics {
  agentId: string;
  agentName: string;
  squad: string;
  totalExecutions: number;
  successRate: number;
  avgResponseTime: number;
  avgTokens: number;
  topCommands: Array<{ command: string; count: number }>;
  lastActive: string;
}

export interface CommandAnalytics {
  command: string;
  agentId: string;
  totalCalls: number;
  successRate: number;
  avgDuration: number;
}

// Orchestration Types
export interface OrchestrationStep {
  squadId: string;
  agentId: string;
  input?: {
    message?: string;
    context?: Record<string, unknown>;
  };
  dependsOn?: string[];
}

export interface OrchestrationRequest {
  workflow: OrchestrationStep[];
  options?: {
    mode?: 'sequential' | 'parallel' | 'dag';
    stopOnError?: boolean;
  };
}

export interface OrchestrationResult {
  orchestrationId: string;
  status: 'completed' | 'failed';
  mode: string;
  results: Array<{
    stepIndex: number;
    agentId: string;
    executionId: string;
    status: string;
    result?: ExecuteResult;
  }>;
  error?: string;
}

// SSE Stream Events
export interface StreamStartEvent {
  executionId: string;
  agentId: string;
  agentName: string;
}

export interface StreamTextEvent {
  content: string;
}

export interface StreamDoneEvent {
  usage: TokenUsage;
  duration: number;
}

export interface StreamErrorEvent {
  error: string;
}

export interface StreamToolsEvent {
  step?: number;
  agentId?: string;
  toolsUsed: boolean;
  toolResults: Array<{
    tool: string;      // Tool name
    input?: unknown;   // Tool input params
    output?: unknown;  // Tool result (on success)
    success: boolean;
    error?: string;    // Error message (on failure)
  }>;
}

// API Types
export interface ApiError {
  error: string;
  message: string;
  code?: string;
  status?: number;
  details?: unknown;
}

export interface ApiListResponse<T> {
  data?: T[];
  total: number;
}

// UI Types
export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number;
}

export interface SearchFilters {
  query?: string;
  squad?: string;
  tier?: AgentTier;
  limit?: number;
}

// Store Types
export interface ChatState {
  sessions: ChatSession[];
  activeSessionId: string | null;
  isLoading: boolean;
  error: string | null;
}

export type ViewType =
  | 'chat' | 'dashboard' | 'settings' | 'orchestrator' | 'world'
  | 'kanban' | 'agents' | 'bob' | 'terminals' | 'monitor' | 'timeline'
  | 'insights' | 'context' | 'knowledge' | 'roadmap' | 'squads' | 'github' | 'qa' | 'stories'
  | 'share' | 'engine' | 'cockpit'
  | 'agent-directory' | 'task-catalog' | 'workflow-catalog' | 'authority-matrix' | 'handoff-flows'
  | 'sales-room'
  | 'integrations' | 'google-oauth-callback'
  | 'brainstorm'
  | 'vault'
  | 'overnight'
  | 'marketplace' | 'marketplace-listing' | 'marketplace-purchases' | 'marketplace-seller' | 'marketplace-submit' | 'marketplace-review' | 'marketplace-admin'
  | 'sales-dashboard' | 'traffic-dashboard' | 'creative-gallery' | 'marketing' | 'marketing-hub' | 'ds-preview';
export type SettingsSectionType = 'dashboard' | 'categories' | 'memory' | 'workflows' | 'profile' | 'api' | 'appearance' | 'notifications' | 'privacy' | 'about';

export interface UIState {
  sidebarCollapsed: boolean;
  activityPanelOpen: boolean;
  workflowViewOpen: boolean;
  agentExplorerOpen: boolean;
  mobileMenuOpen: boolean;
  commandPaletteOpen: boolean;
  theme: 'light' | 'dark' | 'system' | 'matrix' | 'glass' | 'aiox' | 'aiox-gold';
  selectedSquadId: string | null;
  selectedAgentId: string | null;
  currentView: ViewType;
  settingsSection: SettingsSectionType;
  selectedRoomId: string | null;
  worldZoom: 'map' | 'room';
  focusMode: boolean;
}
