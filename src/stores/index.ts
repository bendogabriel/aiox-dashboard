// AIOS Dashboard Stores - Index
// Each feature has its own store file

export { useUIStore } from './ui-store';
export type { SettingsSection } from './uiStore';
export { useProjectsStore } from './projects-store';
export { registerStoryStatusListener, useStoryStore } from './story-store';
export { registerAgentStatusListener, useAgentStore } from './agent-store';
export { useSettingsStore } from './settings-store';
export type { Theme, DashboardSettings } from './settings-store';
export { useBobStore, useBobPipeline, useBobCurrentAgent, useBobTerminals, useBobSurfaceDecisions, useBobErrors, useBobActive, useBobInactive } from './bob-store';
export type { BobPipeline, BobCurrentAgent, BobTerminal, BobSurfaceDecision, BobError, BobElapsed, BobEducational } from './bob-store';
export { useSquadStore } from './squad-store';

// Migrated from aios-platform
export { useChatStore } from './chatStore';
export { useExecutionLogStore } from './executionLogStore';
export type { LogLevel, ExecutionLogEntry, ExecutionLogState } from './executionLogStore';
export { useCategoryStore } from './categoryStore';
export type { CategoryConfig } from './categoryStore';
export { useRoadmapStore } from './roadmapStore';
export type { RoadmapFeature } from './roadmapStore';
export { useSearchStore } from './searchStore';
export { useToastStore, useToast } from './toastStore';
export type { ToastType, Toast } from './toastStore';
