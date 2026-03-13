import { useMemo } from 'react';
import { useAgent } from './useAgents';
import {
  useRegistryTasks,
  useRegistryWorkflows,
  useRegistryCommands,
  useRegistryResources,
  useCronJobs,
  useEnginePool,
  useEngineJobs,
} from './useEngine';
import type { Agent } from '../types';
import type { AgentTechSheet } from '../types/agent-tech-sheet';

export function useAgentTechSheet(squadId: string | null, agentId: string | null) {
  const { data: agent, isLoading: agentLoading } = useAgent(squadId, agentId);
  const { data: tasksData } = useRegistryTasks(squadId || undefined);
  const { data: workflowsData } = useRegistryWorkflows(squadId || undefined);
  const { data: commandsData } = useRegistryCommands(squadId || undefined);
  const { data: resourcesData } = useRegistryResources(squadId || undefined);
  const { data: cronsData } = useCronJobs();
  const { data: poolData } = useEnginePool();
  const { data: jobsData } = useEngineJobs({ limit: 20 });

  const techSheet = useMemo<(Agent & AgentTechSheet) | undefined>(() => {
    if (!agent) return undefined;

    // Filter tasks assigned to this agent
    const assignedTasks = tasksData?.tasks
      ?.filter(t => !agentId || t.agent === agentId || t.squadId === squadId)
      ?.map(t => ({ id: t.id, name: t.name, command: t.command, agent: t.agent, purpose: t.purpose }))
      ?? [];

    // Workflows for this squad
    const assignedWorkflows = workflowsData?.workflows
      ?.map(w => ({ id: w.id, name: w.name, description: w.description, phases: w.phases }))
      ?? [];

    // Commands for this agent
    const assignedCommands = commandsData?.commands
      ?.filter(c => !agentId || c.agentId === agentId)
      ?.map(c => ({ id: c.id, name: c.name, command: c.command, purpose: c.purpose }))
      ?? [];

    // Resources for this squad
    const assignedResources = resourcesData?.resources
      ?.map(r => ({ id: r.id, name: r.name, type: r.type, description: r.description }))
      ?? [];

    // Crons for this agent
    const scheduledCrons = cronsData?.crons
      ?.filter(c => c.agent_id === agentId && c.squad_id === squadId)
      ?.map(c => ({
        id: c.id,
        schedule: c.schedule,
        description: c.description || c.name,
        enabled: c.enabled,
        lastRunAt: c.last_run_at,
        nextRunAt: c.next_run_at,
      }))
      ?? [];

    // Find current slot in pool
    const currentSlot = poolData?.slots?.find(
      s => s.status === 'running' && s.agentId === agentId && s.squadId === squadId
    ) ?? null;
    const slot = currentSlot ? { id: currentSlot.id, jobId: currentSlot.jobId!, startedAt: currentSlot.startedAt! } : null;

    // Recent jobs for this agent
    const recentJobs = jobsData?.jobs
      ?.filter(j => j.agent_id === agentId && j.squad_id === squadId)
      ?.slice(0, 10)
      ?.map(j => ({
        id: j.id,
        status: j.status,
        triggerType: j.trigger_type,
        createdAt: j.created_at,
        startedAt: j.started_at,
        completedAt: j.completed_at,
        errorMessage: j.error_message,
      }))
      ?? [];

    // Compute execution stats from jobs
    const allAgentJobs = jobsData?.jobs?.filter(j => j.agent_id === agentId && j.squad_id === squadId) ?? [];
    const completedJobs = allAgentJobs.filter(j => j.status === 'done' || j.status === 'completed');
    const failedJobs = allAgentJobs.filter(j => j.status === 'failed');
    const totalExec = completedJobs.length + failedJobs.length;
    const successRate = totalExec > 0 ? (completedJobs.length / totalExec) * 100 : 0;

    // Compute avg duration from completed jobs
    const durations = completedJobs
      .filter(j => j.started_at && j.completed_at)
      .map(j => new Date(j.completed_at!).getTime() - new Date(j.started_at!).getTime());
    const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

    const lastActiveJob = allAgentJobs[0];
    const lastActive = lastActiveJob?.completed_at || lastActiveJob?.started_at || lastActiveJob?.created_at;

    const executionStats = {
      totalExecutions: allAgentJobs.length,
      successRate,
      avgDuration,
      lastActive,
    };

    return {
      ...agent,
      assignedTasks,
      assignedWorkflows,
      assignedCommands,
      assignedResources,
      scheduledCrons,
      currentSlot: slot,
      recentJobs,
      executionStats,
    };
  }, [agent, tasksData, workflowsData, commandsData, resourcesData, cronsData, poolData, jobsData, agentId, squadId]);

  return {
    data: techSheet,
    isLoading: agentLoading,
    agent,
  };
}
