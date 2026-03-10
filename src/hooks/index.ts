// AIOS Dashboard Hooks - Index

export { useAiosStatus } from './use-aios-status';
export { useAgents, useAgentById, usePlatformAgents, useAgentCommands, useAgentSearch } from './use-agents';
export type { AgentWithUI } from './use-agents';
export { useStories } from './use-stories';
export { useRealtimeStatus } from './use-realtime-status';
export { useSquads, useSquadDetail, useSquadSectionItems, useSquadItemContent, useSquadAgentDetail } from './use-squads';
export type { AgentTask, AgentDetailData, SectionItem, ItemContent } from './use-squads';

// Migrated from aios-platform
export { useWorkflows, useWorkflow, useWorkflowExecutions, useWorkflowExecution, useCreateWorkflow, useUpdateWorkflow, useDeleteWorkflow, useActivateWorkflow, usePauseWorkflow, useExecuteWorkflow, useCancelExecution, useExecuteWorkflowStream, useSmartOrchestration } from './use-workflows';
export type { LiveExecutionStep, LiveExecutionState, OrchestrationPlanStep, OrchestrationState } from './use-workflows';
export { useChat } from './use-chat';
export { useAnalyticsOverview, useRealtimeMetrics, useCostSummary, useAgentAnalytics, useCommandAnalytics, useMCPStatus, useMCPStats, useSystemHealth, useSystemMetrics } from './use-dashboard';
export type { MCPTool, MCPResource, MCPServer } from './use-dashboard';
export { useExecuteAgent, useExecutionHistory, useExecutionStats, useTokenUsage, useLLMHealth } from './use-execute';
export { useFavoritesStore, useFavorites } from './use-favorites';
export { useAgentPerformance, useAgentActivity } from './use-analytics';
export { useFormValidation, useFieldValidation } from './use-form-validation';
export type { ValidationRule, FieldValidation, FieldState, FormState } from './use-form-validation';
export { useOptimisticUpdate, useOptimisticList, usePendingState, useDebouncedMutation, useCacheInvalidation, createQueryKey } from './use-optimistic';
export { useGlobalKeyboardShortcuts } from './use-global-keyboard-shortcuts';
export { useFocusTrap, useAnnounce, useListNavigation, useFocusReturn, useReducedMotion, useHighContrast, useId, useSkipLinks } from './use-a11y';
