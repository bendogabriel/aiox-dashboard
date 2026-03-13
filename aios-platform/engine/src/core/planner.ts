/**
 * Execution plan generation using Claude CLI.
 * Falls back to heuristic planning when CLI is unavailable.
 */
import { isClaudeAvailable, spawnClaude } from '../lib/claude-cli';
import { extractTextFromAssistant } from '../lib/claude-cli';
import type { DiscoveredAgent } from './agent-discovery';

export interface PlanStep {
  id: string;
  agentId: string;
  agentName: string;
  squadId: string;
  squadName: string;
  task: string;
  dependsOn: string[];
  estimatedDuration?: string;
}

export interface ExecutionPlan {
  summary: string;
  reasoning: string;
  steps: PlanStep[];
}

function buildPlannerPrompt(demand: string, agents: DiscoveredAgent[]): string {
  const agentList = agents
    .slice(0, 30)
    .map(
      (a) =>
        `- **${a.id}** (${a.name}) [${a.model}] — squad: ${a.squad} — ${a.description.slice(0, 100)}`
    )
    .join('\n');

  return `You are Bob, the AIOS orchestrator. Analyze the demand below and create an execution plan.

## Demand
${demand}

## Available Agents
${agentList}

## Instructions
1. Analyze the demand and identify which agents are needed
2. Create sequential steps with clear dependencies
3. Each step must have a specific task for one agent
4. Be practical — use 2-4 steps for simple demands, up to 6 for complex ones
5. Return ONLY a valid JSON object (no markdown, no code blocks) in this format:

{"summary":"Brief 1-2 sentence plan summary","reasoning":"Why these agents were chosen","steps":[{"id":"step-1","agentId":"aios-architect","agentName":"AIOS Architect","squadId":"core","squadName":"Core","task":"Specific description of what the agent must do","dependsOn":[],"estimatedDuration":"~2min"}]}`;
}

function extractJSON(text: string): unknown | null {
  // Try parsing the whole text as JSON
  try {
    return JSON.parse(text);
  } catch {
    // Continue
  }

  // Try extracting from code blocks
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1]);
    } catch {
      // Continue
    }
  }

  // Try finding JSON object in text
  const jsonMatch = text.match(/\{[\s\S]*"steps"\s*:\s*\[[\s\S]*\]\s*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      // Continue
    }
  }

  return null;
}

function validatePlan(raw: unknown): ExecutionPlan | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  if (!Array.isArray(obj.steps) || obj.steps.length === 0) return null;

  const steps: PlanStep[] = [];
  for (let i = 0; i < obj.steps.length; i++) {
    const s = obj.steps[i] as Record<string, unknown>;
    steps.push({
      id: (s.id as string) || `step-${i + 1}`,
      agentId: (s.agentId as string) || 'aios-dev',
      agentName: (s.agentName as string) || 'Agent',
      squadId: (s.squadId as string) || 'core',
      squadName: (s.squadName as string) || 'Core',
      task: (s.task as string) || 'Execute task',
      dependsOn: (s.dependsOn as string[]) || (i > 0 ? [`step-${i}`] : []),
      estimatedDuration: s.estimatedDuration as string | undefined,
    });
  }

  return {
    summary: (obj.summary as string) || `Plan with ${steps.length} steps`,
    reasoning: (obj.reasoning as string) || '',
    steps,
  };
}

export function buildFallbackPlan(
  demand: string,
  agents: DiscoveredAgent[]
): ExecutionPlan {
  const lower = demand.toLowerCase();
  const steps: PlanStep[] = [];

  const findAgent = (id: string) =>
    agents.find((a) => a.id === id) || agents.find((a) => a.id.includes(id));

  if (
    lower.match(/code|feature|bug|implement|create|build|develop|fix|refactor/)
  ) {
    const architect = findAgent('architect');
    const dev = findAgent('dev');

    if (architect) {
      steps.push({
        id: 'step-1',
        agentId: architect.id,
        agentName: architect.name,
        squadId: architect.squad,
        squadName: architect.squad,
        task: `Analyze the demand and design the technical approach: "${demand}"`,
        dependsOn: [],
        estimatedDuration: '~2min',
      });
    }
    if (dev) {
      steps.push({
        id: 'step-2',
        agentId: dev.id,
        agentName: dev.name,
        squadId: dev.squad,
        squadName: dev.squad,
        task: `Implement the solution based on the architect's design: "${demand}"`,
        dependsOn: steps.length > 0 ? ['step-1'] : [],
        estimatedDuration: '~5min',
      });
    }
  } else if (lower.match(/test|qa|quality/)) {
    const qa = findAgent('qa');
    const dev = findAgent('dev');

    if (qa) {
      steps.push({
        id: 'step-1',
        agentId: qa.id,
        agentName: qa.name,
        squadId: qa.squad,
        squadName: qa.squad,
        task: `Analyze and create test strategy: "${demand}"`,
        dependsOn: [],
        estimatedDuration: '~3min',
      });
    }
    if (dev) {
      steps.push({
        id: 'step-2',
        agentId: dev.id,
        agentName: dev.name,
        squadId: dev.squad,
        squadName: dev.squad,
        task: `Implement the tests: "${demand}"`,
        dependsOn: steps.length > 0 ? ['step-1'] : [],
        estimatedDuration: '~4min',
      });
    }
  } else if (lower.match(/design|ui|css|style|component/)) {
    const architect = findAgent('architect');
    const dev = findAgent('dev');

    if (architect) {
      steps.push({
        id: 'step-1',
        agentId: architect.id,
        agentName: architect.name,
        squadId: architect.squad,
        squadName: architect.squad,
        task: `Design the UI/UX approach: "${demand}"`,
        dependsOn: [],
        estimatedDuration: '~2min',
      });
    }
    if (dev) {
      steps.push({
        id: 'step-2',
        agentId: dev.id,
        agentName: dev.name,
        squadId: dev.squad,
        squadName: dev.squad,
        task: `Implement the UI components: "${demand}"`,
        dependsOn: steps.length > 0 ? ['step-1'] : [],
        estimatedDuration: '~5min',
      });
    }
  } else if (lower.match(/plan|epic|story|spec|requirement/)) {
    const pm = findAgent('pm');
    const architect = findAgent('architect');

    if (pm) {
      steps.push({
        id: 'step-1',
        agentId: pm.id,
        agentName: pm.name,
        squadId: pm.squad,
        squadName: pm.squad,
        task: `Gather requirements and create specification: "${demand}"`,
        dependsOn: [],
        estimatedDuration: '~3min',
      });
    }
    if (architect) {
      steps.push({
        id: 'step-2',
        agentId: architect.id,
        agentName: architect.name,
        squadId: architect.squad,
        squadName: architect.squad,
        task: `Create technical implementation plan: "${demand}"`,
        dependsOn: steps.length > 0 ? ['step-1'] : [],
        estimatedDuration: '~3min',
      });
    }
  } else if (lower.match(/deploy|push|release|devops/)) {
    const dev = findAgent('dev');
    const devops = findAgent('devops');

    if (dev) {
      steps.push({
        id: 'step-1',
        agentId: dev.id,
        agentName: dev.name,
        squadId: dev.squad,
        squadName: dev.squad,
        task: `Prepare and validate for deployment: "${demand}"`,
        dependsOn: [],
        estimatedDuration: '~3min',
      });
    }
    if (devops) {
      steps.push({
        id: 'step-2',
        agentId: devops.id,
        agentName: devops.name,
        squadId: devops.squad,
        squadName: devops.squad,
        task: `Execute deployment: "${demand}"`,
        dependsOn: steps.length > 0 ? ['step-1'] : [],
        estimatedDuration: '~3min',
      });
    }
  }

  // Default fallback: architect + dev
  if (steps.length === 0) {
    const architect = findAgent('architect') || agents[0];
    const dev = findAgent('dev') || agents[1] || agents[0];

    if (architect) {
      steps.push({
        id: 'step-1',
        agentId: architect.id,
        agentName: architect.name,
        squadId: architect.squad,
        squadName: architect.squad,
        task: `Analyze the demand and design approach: "${demand}"`,
        dependsOn: [],
        estimatedDuration: '~2min',
      });
    }
    if (dev && dev.id !== architect?.id) {
      steps.push({
        id: 'step-2',
        agentId: dev.id,
        agentName: dev.name,
        squadId: dev.squad,
        squadName: dev.squad,
        task: `Execute the task: "${demand}"`,
        dependsOn: steps.length > 0 ? ['step-1'] : [],
        estimatedDuration: '~5min',
      });
    }
  }

  return {
    summary: `Execution plan for: ${demand.slice(0, 80)}`,
    reasoning: 'Plan generated via keyword heuristics (Claude CLI unavailable or planning failed)',
    steps,
  };
}

export async function generatePlan(
  demand: string,
  agents: DiscoveredAgent[]
): Promise<ExecutionPlan> {
  if (!isClaudeAvailable()) {
    console.log('[Planner] Claude CLI unavailable, using fallback plan');
    return buildFallbackPlan(demand, agents);
  }

  try {
    const prompt = buildPlannerPrompt(demand, agents);
    const claude = spawnClaude(prompt, { model: 'sonnet' });

    let fullResponse = '';

    for await (const event of claude.events()) {
      if (event.type === 'result' && event.result) {
        fullResponse = event.result;
      } else if (event.type === 'assistant' && event.message) {
        // assistant message is a JSON string — extract text content
        fullResponse = extractTextFromAssistant(event.message);
      }
    }

    if (!fullResponse) {
      console.warn('[Planner] Empty response from Claude, using fallback');
      return buildFallbackPlan(demand, agents);
    }

    const parsed = extractJSON(fullResponse);
    const plan = validatePlan(parsed);

    if (plan) {
      return plan;
    }

    console.warn('[Planner] Failed to parse plan JSON, using fallback');
    return buildFallbackPlan(demand, agents);
  } catch (err) {
    console.error('[Planner] Error generating plan:', err);
    return buildFallbackPlan(demand, agents);
  }
}

export async function replanWithFeedback(
  demand: string,
  previousPlan: ExecutionPlan,
  feedback: string,
  agents: DiscoveredAgent[]
): Promise<ExecutionPlan> {
  if (!isClaudeAvailable()) {
    return buildFallbackPlan(demand, agents);
  }

  const prompt = `You are Bob, the AIOS orchestrator. The user wants to revise the previous plan.

## Original Demand
${demand}

## Previous Plan
${JSON.stringify(previousPlan, null, 2)}

## User Feedback
${feedback}

## Available Agents
${agents
  .slice(0, 20)
  .map((a) => `- ${a.id} (${a.name}) [${a.model}] — ${a.squad}`)
  .join('\n')}

## Instructions
Create a revised plan incorporating the user's feedback. Return ONLY valid JSON:
{"summary":"...","reasoning":"...","steps":[{"id":"step-1","agentId":"...","agentName":"...","squadId":"...","squadName":"...","task":"...","dependsOn":[],"estimatedDuration":"~2min"}]}`;

  try {
    const claude = spawnClaude(prompt, { model: 'sonnet' });
    let fullResponse = '';

    for await (const event of claude.events()) {
      if (event.type === 'result' && event.result) {
        fullResponse = event.result;
      } else if (event.type === 'assistant' && event.message) {
        fullResponse = extractTextFromAssistant(event.message);
      }
    }

    const parsed = extractJSON(fullResponse);
    const plan = validatePlan(parsed);
    if (plan) return plan;

    return buildFallbackPlan(demand, agents);
  } catch {
    return buildFallbackPlan(demand, agents);
  }
}
