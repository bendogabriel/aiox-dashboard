import { apiClient, StreamCallbacks } from './client';
import type {
  ExecuteRequest,
  ExecuteResponse,
  ExecutionRecord,
  ExecutionHistory,
  ExecutionStats,
  OrchestrationRequest,
  OrchestrationResult,
  LLMUsage,
  LLMHealth,
  LLMModels,
} from '../../types';

export const executeApi = {
  // Execute agent (sync)
  // POST /api/execute/agent
  executeAgent: async (request: ExecuteRequest): Promise<ExecuteResponse> => {
    return apiClient.post<ExecuteResponse>('/execute/agent', request);
  },

  // Execute agent with streaming (SSE)
  // POST /api/execute/agent/stream
  executeAgentStream: async (
    request: Omit<ExecuteRequest, 'options'>,
    callbacks: StreamCallbacks,
    signal?: AbortSignal
  ): Promise<void> => {
    return apiClient.stream('/execute/agent/stream', request, callbacks, signal);
  },

  // Orchestrate multiple agents
  // POST /api/execute/orchestrate
  orchestrate: async (request: OrchestrationRequest): Promise<OrchestrationResult> => {
    return apiClient.post<OrchestrationResult>('/execute/orchestrate', request);
  },

  // Get execution status
  // GET /api/execute/status/:executionId
  getExecutionStatus: async (executionId: string): Promise<{ execution: ExecutionRecord }> => {
    return apiClient.get<{ execution: ExecutionRecord }>(`/execute/status/${executionId}`);
  },

  // Cancel execution
  // DELETE /api/execute/status/:executionId
  cancelExecution: async (executionId: string): Promise<{ executionId: string; status: string }> => {
    return apiClient.delete<{ executionId: string; status: string }>(`/execute/status/${executionId}`);
  },

  // Get execution history
  // GET /api/execute/history
  getHistory: async (params?: {
    limit?: number;
    status?: string;
    agentId?: string;
    squadId?: string;
  }): Promise<ExecutionHistory> => {
    return apiClient.get<ExecutionHistory>('/execute/history', params);
  },

  // Get execution statistics
  // GET /api/execute/stats
  getStats: async (params?: { since?: string }): Promise<ExecutionStats> => {
    return apiClient.get<ExecutionStats>('/execute/stats', params);
  },

  // LLM Health Check
  // GET /api/execute/llm/health
  getLLMHealth: async (): Promise<LLMHealth> => {
    return apiClient.get<LLMHealth>('/execute/llm/health');
  },

  // Get token usage statistics
  // GET /api/execute/llm/usage
  getTokenUsage: async (): Promise<LLMUsage> => {
    return apiClient.get<LLMUsage>('/execute/llm/usage');
  },

  // Get available LLM models
  // GET /api/execute/llm/models
  getLLMModels: async (): Promise<LLMModels> => {
    return apiClient.get<LLMModels>('/execute/llm/models');
  },

  // Database health check
  // GET /api/execute/db/health
  getDBHealth: async (): Promise<{ connected: boolean; error?: string }> => {
    return apiClient.get<{ connected: boolean; error?: string }>('/execute/db/health');
  },

  // Track external execution
  // POST /api/execute/track
  trackExecution: async (data: {
    squadId: string;
    agentId: string;
    duration?: number;
    success?: boolean;
    source?: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ tracked: boolean; executionId: string; message: string }> => {
    return apiClient.post('/execute/track', data);
  },

  // Batch track executions
  // POST /api/execute/track/batch
  trackExecutionBatch: async (executions: Array<{
    squadId: string;
    agentId: string;
    duration?: number;
    success?: boolean;
    source?: string;
    timestamp?: string;
  }>): Promise<{ tracked: number; executionIds: string[] }> => {
    return apiClient.post('/execute/track/batch', { executions });
  },
};

// Helper function to build execute request
export function buildExecuteRequest(
  squadId: string,
  agentId: string,
  message: string,
  options?: {
    context?: Record<string, unknown>;
    command?: string;
    async?: boolean;
    timeout?: number;
  }
): ExecuteRequest {
  return {
    squadId,
    agentId,
    input: {
      message,
      context: options?.context,
      command: options?.command,
    },
    options: {
      async: options?.async,
      timeout: options?.timeout,
    },
  };
}

// Mock execution history for development
export const mockExecutionHistory: ExecutionHistory = {
  executions: [
    {
      id: 'exec-1',
      agentId: 'uncle-bob',
      squadId: 'full-stack-dev',
      status: 'completed',
      createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
      input: {
        message: 'Review this code for SOLID violations.',
      },
      result: {
        agentId: 'uncle-bob',
        agentName: 'Uncle Bob',
        message: 'I found 3 SOLID violations in your code...',
        metadata: {
          squad: 'full-stack-dev',
          tier: 1,
          provider: 'claude',
          model: 'claude-sonnet-4-6-20250929',
          usage: { inputTokens: 150, outputTokens: 450 },
          duration: 2.3,
          processedAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
        },
      },
      tokensUsed: 600,
      duration: 2.3,
    },
    {
      id: 'exec-2',
      agentId: 'jon-benson',
      squadId: 'copywriting',
      status: 'completed',
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
      input: {
        message: 'Create a VSL script for a productivity app.',
      },
      result: {
        agentId: 'jon-benson',
        agentName: 'Jon Benson',
        message: 'Here\'s your VSL script using my proven formula...',
        metadata: {
          squad: 'copywriting',
          tier: 1,
          provider: 'claude',
          model: 'claude-sonnet-4-6-20250929',
          usage: { inputTokens: 200, outputTokens: 1200 },
          duration: 4.5,
          processedAt: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
        },
      },
      tokensUsed: 1400,
      duration: 4.5,
    },
    {
      id: 'exec-3',
      agentId: 'maestro',
      squadId: 'orquestrador-global',
      status: 'completed',
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 28 * 60 * 1000).toISOString(),
      input: {
        message: 'Coordinate a product launch campaign.',
      },
      result: {
        agentId: 'maestro',
        agentName: 'Maestro',
        message: 'I\'ve coordinated with 3 squads for your launch...',
        metadata: {
          squad: 'orquestrador-global',
          tier: 0,
          provider: 'claude',
          model: 'claude-sonnet-4-6-20250929',
          usage: { inputTokens: 300, outputTokens: 800 },
          duration: 8.2,
          processedAt: new Date(Date.now() - 28 * 60 * 1000).toISOString(),
        },
      },
      tokensUsed: 1100,
      duration: 8.2,
    },
  ],
  total: 3,
};
