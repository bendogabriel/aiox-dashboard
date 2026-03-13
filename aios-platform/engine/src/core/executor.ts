/**
 * Step executor using Claude CLI.
 * Streams agent output via onChunk callback.
 * Falls back to simulated execution when CLI is unavailable.
 */
import { isClaudeAvailable, spawnClaude, extractTextFromAssistant } from '../lib/claude-cli';
import { loadAgentContent, type DiscoveredAgent } from './agent-discovery';
import type { PlanStep } from './planner';

export interface StepResult {
  stepId: string;
  response: string;
  processingTimeMs: number;
  llmMetadata?: {
    provider: string;
    model: string;
    inputTokens?: number;
    outputTokens?: number;
  };
}

function buildStepPrompt(
  step: PlanStep,
  demand: string,
  previousOutputs: StepResult[]
): string {
  // Load agent persona
  const agentContent = loadAgentContent(step.agentId);
  const persona = agentContent
    ? agentContent.slice(0, 2000) // Limit persona to avoid oversized prompts
    : `You are ${step.agentName}, a specialist agent in the ${step.squadName} squad.`;

  let prompt = `${persona}

## Task
${step.task}

## Original Demand
${demand}`;

  if (previousOutputs.length > 0) {
    prompt += '\n\n## Results from Previous Steps';
    for (const prev of previousOutputs) {
      const truncated =
        prev.response.length > 500
          ? prev.response.slice(0, 500) + '...'
          : prev.response;
      prompt += `\n\n### ${prev.stepId}\n${truncated}`;
    }
  }

  prompt += `\n\n## Instructions
Execute your assigned task. Be concise and actionable. Focus on delivering practical results.`;

  return prompt;
}

async function simulateExecution(
  step: PlanStep,
  demand: string,
  onChunk: (accumulated: string) => void
): Promise<StepResult> {
  const startTime = Date.now();

  const response = `## ${step.agentName} — Analysis

**Task:** ${step.task}

**Demand:** ${demand}

### Approach
I've analyzed the demand and here is my recommendation:

1. **Understanding**: The demand requires ${step.task.toLowerCase()}
2. **Strategy**: Using best practices for ${step.squadName} domain
3. **Execution**: Implementation follows standard patterns

### Key Points
- Analyzed the requirements thoroughly
- Identified the optimal approach
- Ready for the next step in the pipeline

### Deliverables
- Technical analysis complete
- Recommendations documented
- Ready for handoff to next agent

*[Demo mode — Claude CLI not available. Connect Claude CLI for real agent execution.]*`;

  // Simulate streaming with word-by-word chunks
  const words = response.split(' ');
  let accumulated = '';

  for (let i = 0; i < words.length; i++) {
    accumulated += (i > 0 ? ' ' : '') + words[i];
    if (i % 4 === 3 || i === words.length - 1) {
      onChunk(accumulated);
      await Bun.sleep(30);
    }
  }

  return {
    stepId: step.id,
    response,
    processingTimeMs: Date.now() - startTime,
    llmMetadata: {
      provider: 'demo',
      model: 'simulated',
    },
  };
}

export async function executeStep(
  step: PlanStep,
  demand: string,
  previousOutputs: StepResult[],
  onChunk: (accumulated: string) => void
): Promise<StepResult> {
  if (!isClaudeAvailable()) {
    return simulateExecution(step, demand, onChunk);
  }

  const startTime = Date.now();
  const prompt = buildStepPrompt(step, demand, previousOutputs);

  try {
    const claude = spawnClaude(prompt);
    let fullResponse = '';
    let assistantText = '';
    let inputTokens: number | undefined;
    let outputTokens: number | undefined;
    let model: string | undefined;
    for await (const event of claude.events()) {
      switch (event.type) {
        case 'assistant':
          if (event.message) {
            const text = extractTextFromAssistant(event.message);
            if (text) {
              assistantText = text;
              onChunk(assistantText);
            }
          }
          break;

        case 'result':
          if (event.result) {
            fullResponse = event.result;
          }
          // Extract usage from the event — may be nested
          if (event.input_tokens != null) {
            inputTokens = event.input_tokens;
          }
          if (event.output_tokens != null) {
            outputTokens = event.output_tokens;
          }
          // Try to get tokens from usage object if present
          const usage = (event as unknown as Record<string, unknown>).usage;
          if (usage && typeof usage === 'object') {
            const u = usage as Record<string, number>;
            inputTokens = inputTokens ?? u.input_tokens;
            outputTokens = outputTokens ?? u.output_tokens;
          }
          model = event.model;
          break;
      }
    }

    // Use result as final response (authoritative), fallback to assistant
    const response = fullResponse || assistantText;

    return {
      stepId: step.id,
      response,
      processingTimeMs: Date.now() - startTime,
      llmMetadata: {
        provider: 'anthropic',
        model: model || 'claude-sonnet-4-20250514',
        inputTokens,
        outputTokens,
      },
    };
  } catch (err) {
    console.error(`[Executor] Error executing step ${step.id}:`, err);
    return {
      stepId: step.id,
      response: `Error executing step: ${err instanceof Error ? err.message : String(err)}`,
      processingTimeMs: Date.now() - startTime,
    };
  }
}
