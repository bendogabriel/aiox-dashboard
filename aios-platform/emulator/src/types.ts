// ── Emulator Type Definitions ──

export interface AgentSpec {
  id: string;
  name: string;
  role: string;
  description: string;
  tier: 'orchestrator' | 0 | 1 | 2;
  icon?: string;
}

export interface TaskSpec {
  id: string;
  name: string;
  description: string;
  agents?: string[];
}

export interface WorkflowSpec {
  id: string;
  name: string;
  description: string;
  phases: WorkflowPhase[];
}

export interface WorkflowPhase {
  id: string;
  name: string;
  tasks?: string[];
}

export interface SquadSpec {
  id: string;
  name: string;
  displayName: string;
  description: string;
  domain: string;
  icon?: string;
  version?: string;
  agents: AgentSpec[];
  tasks?: TaskSpec[];
  workflows?: WorkflowSpec[];
}

export interface AiosCoreSpec {
  constitution?: boolean;
  coreAgents?: AgentSpec[];
  workflows?: WorkflowSpec[];
  tasks?: TaskSpec[];
}

export interface ProjectFiles {
  /** Extra files to write: path (relative to project root) → content */
  [relativePath: string]: string;
}

export interface Expectations {
  hasAiosCore: boolean;
  squadCount: number;
  agentCount: number;
  workflowCount: number;
  taskCount: number;
  /** Should engine start without crashing? */
  engineStarts: boolean;
  /** Expected warnings in engine logs */
  expectedWarnings?: string[];
  /** Expected errors (for edge-case archetypes) */
  expectedErrors?: string[];
}

export interface ProjectSpec {
  name: string;
  archetype: string;
  description: string;
  aiosCore?: AiosCoreSpec;
  squads: SquadSpec[];
  extraFiles?: ProjectFiles;
  expectations: Expectations;
}

export interface GenerateResult {
  projectPath: string;
  filesCreated: number;
  dirsCreated: number;
  archetype: string;
  duration: number;
}

export interface ArchetypeModule {
  spec: ProjectSpec;
}

export interface TestResult {
  archetype: string;
  passed: boolean;
  endpoints: EndpointResult[];
  timing: TimingMetrics;
  errors: string[];
}

export interface EndpointResult {
  path: string;
  status: number;
  expected: Record<string, unknown>;
  actual: Record<string, unknown>;
  passed: boolean;
  responseTime: number;
}

export interface TimingMetrics {
  engineStartup: number;
  totalTestTime: number;
  endpointAvg: number;
  endpointMax: number;
}

export interface RunnerOptions {
  port?: number;
  timeout?: number;
  projectPath: string;
  enginePath?: string;
}

export interface EngineProcess {
  proc: ReturnType<typeof Bun.spawn>;
  port: number;
  kill: () => void;
  baseUrl: string;
}
