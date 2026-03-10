import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useExecutionLogStore } from '@/stores/executionLogStore';

describe('executionLogStore', () => {
  beforeEach(() => {
    // Reset store state between tests
    useExecutionLogStore.getState().clearLogs();
  });

  describe('initial state', () => {
    it('starts with empty logs', () => {
      const state = useExecutionLogStore.getState();
      expect(state.logs).toEqual([]);
      expect(state.isExecuting).toBe(false);
      expect(state.currentExecution.id).toBeNull();
    });
  });

  describe('startExecution', () => {
    it('sets execution state correctly', () => {
      const { startExecution } = useExecutionLogStore.getState();
      startExecution('exec-1', 'test command', ['agent-a', 'agent-b']);

      const state = useExecutionLogStore.getState();
      expect(state.isExecuting).toBe(true);
      expect(state.currentExecution.id).toBe('exec-1');
      expect(state.currentExecution.command).toBe('test command');
      expect(state.currentExecution.pipelineAgents).toEqual(['agent-a', 'agent-b']);
      expect(state.currentExecution.totalSteps).toBe(2);
      expect(state.currentExecution.startTime).toBeInstanceOf(Date);
    });

    it('adds initial pipeline log message', () => {
      const { startExecution } = useExecutionLogStore.getState();
      startExecution('exec-1', undefined, ['Agent A', 'Agent B']);

      const state = useExecutionLogStore.getState();
      expect(state.logs).toHaveLength(1);
      expect(state.logs[0].message).toContain('Agent A → Agent B');
      expect(state.logs[0].level).toBe('info');
    });

    it('handles empty pipelineAgents with default totalSteps=1', () => {
      const { startExecution } = useExecutionLogStore.getState();
      startExecution('exec-1');

      const state = useExecutionLogStore.getState();
      expect(state.currentExecution.totalSteps).toBe(1);
      expect(state.logs[0].message).toBe('Iniciando execução...');
    });

    it('resets previous logs on new execution', () => {
      const store = useExecutionLogStore.getState();
      store.startExecution('exec-1');
      store.addError('some error');
      expect(useExecutionLogStore.getState().logs.length).toBeGreaterThan(1);

      store.startExecution('exec-2');
      // Should have only the initial log from exec-2
      expect(useExecutionLogStore.getState().logs).toHaveLength(1);
    });
  });

  describe('endExecution', () => {
    it('ends execution with success', () => {
      const store = useExecutionLogStore.getState();
      store.startExecution('exec-1');
      store.endExecution(true, 'Done!');

      const state = useExecutionLogStore.getState();
      expect(state.isExecuting).toBe(false);
      expect(state.currentExecution.id).toBeNull();

      const lastLog = state.logs[state.logs.length - 1];
      expect(lastLog.level).toBe('success');
      expect(lastLog.message).toBe('Done!');
      expect(lastLog.duration).toBeGreaterThanOrEqual(0);
    });

    it('ends execution with failure', () => {
      const store = useExecutionLogStore.getState();
      store.startExecution('exec-1');
      store.endExecution(false, 'Something broke');

      const lastLog = useExecutionLogStore.getState().logs.at(-1)!;
      expect(lastLog.level).toBe('error');
      expect(lastLog.message).toBe('Something broke');
    });

    it('uses default messages when none provided', () => {
      const store = useExecutionLogStore.getState();
      store.startExecution('exec-1');
      store.endExecution(true);

      const lastLog = useExecutionLogStore.getState().logs.at(-1)!;
      expect(lastLog.message).toBe('Execução concluída com sucesso');
    });

    it('calculates duration from startTime', () => {
      vi.useFakeTimers();
      const start = Date.now();
      vi.setSystemTime(start);

      const store = useExecutionLogStore.getState();
      store.startExecution('exec-1');

      // Advance 2.5 seconds
      vi.setSystemTime(start + 2500);
      store.endExecution(true);

      const lastLog = useExecutionLogStore.getState().logs.at(-1)!;
      expect(lastLog.duration).toBeCloseTo(2.5, 1);

      vi.useRealTimers();
    });
  });

  describe('addLog', () => {
    it('generates incremental IDs', () => {
      const store = useExecutionLogStore.getState();
      store.addLog({ level: 'info', message: 'first' });
      store.addLog({ level: 'info', message: 'second' });

      const logs = useExecutionLogStore.getState().logs;
      expect(logs).toHaveLength(2);
      // IDs should be sequential
      const id1 = parseInt(logs[0].id.split('-')[1]);
      const id2 = parseInt(logs[1].id.split('-')[1]);
      expect(id2).toBe(id1 + 1);
    });

    it('adds timestamp automatically', () => {
      const store = useExecutionLogStore.getState();
      store.addLog({ level: 'warning', message: 'test' });

      const log = useExecutionLogStore.getState().logs[0];
      expect(log.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('addAgentStart', () => {
    it('updates currentStep and logs agent start', () => {
      const store = useExecutionLogStore.getState();
      store.startExecution('exec-1');
      store.addAgentStart('agent-1', 'TestAgent', 1, 3);

      const state = useExecutionLogStore.getState();
      expect(state.currentExecution.currentStep).toBe(1);
      expect(state.currentExecution.totalSteps).toBe(3);

      const lastLog = state.logs.at(-1)!;
      expect(lastLog.level).toBe('agent');
      expect(lastLog.message).toContain('TestAgent');
      expect(lastLog.agentId).toBe('agent-1');
    });
  });

  describe('addAgentComplete', () => {
    it('logs agent completion with duration', () => {
      const store = useExecutionLogStore.getState();
      store.addAgentComplete('agent-1', 'TestAgent', 1, 3, 1.5);

      const lastLog = useExecutionLogStore.getState().logs.at(-1)!;
      expect(lastLog.level).toBe('success');
      expect(lastLog.message).toContain('TestAgent');
      expect(lastLog.duration).toBe(1.5);
    });
  });

  describe('addToolUse', () => {
    it('logs successful tool use', () => {
      const store = useExecutionLogStore.getState();
      store.addToolUse('search', true, 'found 5 results');

      const lastLog = useExecutionLogStore.getState().logs.at(-1)!;
      expect(lastLog.level).toBe('tool');
      expect(lastLog.message).toContain('search');
      expect(lastLog.toolName).toBe('search');
    });

    it('logs failed tool use', () => {
      const store = useExecutionLogStore.getState();
      store.addToolUse('fetch', false, undefined, 'timeout');

      const lastLog = useExecutionLogStore.getState().logs.at(-1)!;
      expect(lastLog.level).toBe('error');
      expect(lastLog.message).toContain('fetch');
      expect(lastLog.message).toContain('timeout');
    });
  });

  describe('addError', () => {
    it('adds error log with details', () => {
      const store = useExecutionLogStore.getState();
      store.addError('Connection failed', { url: 'http://example.com' });

      const lastLog = useExecutionLogStore.getState().logs.at(-1)!;
      expect(lastLog.level).toBe('error');
      expect(lastLog.message).toBe('Connection failed');
      expect(lastLog.details).toEqual({ url: 'http://example.com' });
    });
  });

  describe('clearLogs', () => {
    it('resets all state', () => {
      const store = useExecutionLogStore.getState();
      store.startExecution('exec-1');
      store.addError('test');
      store.clearLogs();

      const state = useExecutionLogStore.getState();
      expect(state.logs).toEqual([]);
      expect(state.isExecuting).toBe(false);
      expect(state.currentExecution.id).toBeNull();
      expect(state.currentExecution.pipelineAgents).toEqual([]);
    });
  });
});
