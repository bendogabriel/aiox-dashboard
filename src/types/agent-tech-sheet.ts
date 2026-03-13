// Agent Tech Sheet types — extends base Agent with full YAML fields + engine data
import type { AgentTier } from './index';

export interface AgentMetadata {
  version?: string;
  tier?: string | number;
  created?: string;
  updated?: string;
  changelog?: string[];
  influenceSource?: string;
}

export interface AgentPersonaProfile {
  archetype?: string;
  zodiac?: string;
  communication?: {
    tone?: string;
    emojiFrequency?: string;
    vocabulary?: string[];
    greetingLevels?: {
      minimal?: string;
      named?: string;
      archetypal?: string;
    };
    signatureClosing?: string;
  };
}

export interface AgentDelegation {
  to: string;
  when?: string;
  retain?: string;
}

export interface AgentBoundaries {
  primaryScope?: string[];
  delegations?: AgentDelegation[];
  exclusiveAuthority?: string[];
}

export interface AgentGitRestrictions {
  allowedOperations?: string[];
  blockedOperations?: string[];
  redirectMessage?: string;
}

export interface AgentDependencies {
  tasks?: string[];
  templates?: string[];
  checklists?: string[];
  tools?: string[];
  scripts?: string[];
  data?: string[];
}

export interface AgentAutoClaudeExecution {
  canCreatePlan?: boolean;
  canCreateContext?: boolean;
  canExecute?: boolean;
  canVerify?: boolean;
}

export interface AgentAutoClaude {
  version?: string;
  execution?: AgentAutoClaudeExecution;
  recovery?: {
    canTrack?: boolean;
    canRollback?: boolean;
    maxAttempts?: number;
    stuckDetection?: boolean;
  };
  memory?: {
    canCaptureInsights?: boolean;
    canExtractPatterns?: boolean;
    canDocumentGotchas?: boolean;
  };
}

export interface AgentCodeRabbit {
  enabled?: boolean;
  selfHealing?: {
    enabled?: boolean;
    maxIterations?: number;
    timeout?: number;
  };
  severityHandling?: Record<string, string>;
}

export interface AgentRoutingMatrix {
  inScope?: string[];
  outOfScope?: string[];
}

export interface AgentExecutionStats {
  totalExecutions?: number;
  successRate?: number;
  avgDuration?: number;
  lastActive?: string;
}

export interface AgentTechSheet {
  // Base agent fields (id, name, squad, tier, etc. come from Agent)
  metadata?: AgentMetadata;
  personaProfile?: AgentPersonaProfile;
  boundaries?: AgentBoundaries;
  gitRestrictions?: AgentGitRestrictions;
  dependencies?: AgentDependencies;
  autoClaude?: AgentAutoClaude;
  codeRabbit?: AgentCodeRabbit;
  routingMatrix?: AgentRoutingMatrix;
  executionStats?: AgentExecutionStats;
  // Engine-sourced data
  assignedTasks?: Array<{ id: string; name: string; command?: string; agent?: string; purpose?: string }>;
  assignedWorkflows?: Array<{ id: string; name: string; description?: string; phases?: number }>;
  assignedCommands?: Array<{ id: string; name: string; command: string; purpose?: string }>;
  assignedResources?: Array<{ id: string; name: string; type: string; description?: string }>;
  scheduledCrons?: Array<{ id: string; schedule: string; description?: string; enabled: boolean; lastRunAt?: string; nextRunAt?: string }>;
  currentSlot?: { id: number; jobId: string; startedAt: number } | null;
  recentJobs?: Array<{ id: string; status: string; triggerType: string; createdAt: string; startedAt?: string; completedAt?: string; errorMessage?: string }>;
}
