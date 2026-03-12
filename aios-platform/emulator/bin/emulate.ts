#!/usr/bin/env bun
// ── AIOS Project Emulator CLI ──

import { resolve, join } from 'path';
import { rm } from 'fs/promises';
import { generate, OUTPUT_DIR } from '../src/generator';
import { validate } from '../src/validator';
import { startEngine, fetchEndpoint } from '../src/runner';
import { formatTestResult, formatSummary, computeTimingMetrics } from '../src/reporter';
import { archetypes, getArchetype, listArchetypes } from '../src/archetypes/index';
import type { TestResult, EndpointResult } from '../src/types';

const args = process.argv.slice(2);
const command = args[0];

function printUsage(): void {
  console.log(`
AIOS Project Emulator

Usage:
  bun emulator/bin/emulate.ts <command> [options]

Commands:
  list                      List available archetypes
  generate <name|--all>     Generate project(s) to output/
  serve <name>              Generate + start engine
  test <name|--all>         Generate + test against engine
  validate <path>           Validate existing project structure
  clean                     Remove all generated output

Examples:
  bun emulator/bin/emulate.ts list
  bun emulator/bin/emulate.ts generate minimal
  bun emulator/bin/emulate.ts generate --all
  bun emulator/bin/emulate.ts serve standard
  bun emulator/bin/emulate.ts test minimal
  bun emulator/bin/emulate.ts test --all
  bun emulator/bin/emulate.ts validate ./my-project
  bun emulator/bin/emulate.ts clean
`);
}

// ── Commands ──

async function cmdList(): Promise<void> {
  const items = listArchetypes();
  console.log('\nAvailable Archetypes:\n');
  console.log('  Name                   Squads  Agents  Description');
  console.log('  ─────────────────────  ──────  ──────  ───────────────────────────────');
  for (const item of items) {
    const name = item.name.padEnd(23);
    const squads = String(item.squads).padEnd(8);
    const agents = String(item.agents).padEnd(8);
    console.log(`  ${name}${squads}${agents}${item.description.slice(0, 50)}`);
  }
  console.log(`\n  Total: ${items.length} archetypes\n`);
}

async function cmdGenerate(target: string): Promise<void> {
  if (target === '--all') {
    const specs = listArchetypes();
    console.log(`\nGenerating ${specs.length} projects...\n`);
    for (const item of specs) {
      const spec = getArchetype(item.name)!;
      const result = await generate(spec);
      console.log(`  ✓ ${spec.archetype} → ${result.filesCreated} files (${result.duration.toFixed(0)}ms)`);
    }
    console.log('\nDone.\n');
  } else {
    const spec = getArchetype(target);
    if (!spec) {
      console.error(`Unknown archetype: ${target}\nRun "list" to see available archetypes.`);
      process.exit(1);
    }
    const result = await generate(spec);
    console.log(`\n✓ Generated ${spec.archetype}`);
    console.log(`  Path: ${result.projectPath}`);
    console.log(`  Files: ${result.filesCreated}, Dirs: ${result.dirsCreated}`);
    console.log(`  Time: ${result.duration.toFixed(0)}ms\n`);
  }
}

async function cmdServe(target: string): Promise<void> {
  const spec = getArchetype(target);
  if (!spec) {
    console.error(`Unknown archetype: ${target}`);
    process.exit(1);
  }

  console.log(`\nGenerating ${spec.archetype}...`);
  const result = await generate(spec);
  console.log(`✓ Generated: ${result.projectPath}`);

  console.log(`Starting engine on port 4099...`);
  try {
    const engine = await startEngine({ projectPath: result.projectPath });
    console.log(`\n✓ Engine running at ${engine.baseUrl}`);
    console.log(`  Project: ${result.projectPath}`);
    console.log(`  Press Ctrl+C to stop.\n`);

    // Keep alive
    process.on('SIGINT', () => {
      console.log('\nStopping engine...');
      engine.kill();
      process.exit(0);
    });

    // Wait forever
    await new Promise(() => {});
  } catch (err) {
    console.error(`\n✗ Failed to start engine: ${err}`);
    process.exit(1);
  }
}

async function runTestForArchetype(name: string): Promise<TestResult> {
  const spec = getArchetype(name)!;
  const errors: string[] = [];
  const endpoints: EndpointResult[] = [];
  let engineStartup = 0;

  const testStart = performance.now();

  // Generate
  const genResult = await generate(spec);

  // Start engine
  let engine;
  const engineStart = performance.now();
  try {
    engine = await startEngine({ projectPath: genResult.projectPath });
    engineStartup = performance.now() - engineStart;
  } catch (err) {
    if (spec.expectations.engineStarts) {
      errors.push(`Engine failed to start: ${err}`);
    }
    return {
      archetype: spec.archetype,
      passed: !spec.expectations.engineStarts,
      endpoints: [],
      timing: computeTimingMetrics(performance.now() - engineStart, [], performance.now() - testStart),
      errors,
    };
  }

  try {
    // Test /health
    const health = await fetchEndpoint(engine.baseUrl, '/health');
    endpoints.push({
      path: '/health',
      status: health.status,
      expected: { status: 200 },
      actual: { status: health.status },
      passed: health.status === 200,
      responseTime: health.responseTime,
    });

    // Test /squads
    const squads = await fetchEndpoint(engine.baseUrl, '/squads');
    const squadsBody = squads.body as Record<string, unknown>;
    const squadCount = Array.isArray(squadsBody?.squads) ? (squadsBody.squads as unknown[]).length : -1;
    endpoints.push({
      path: '/squads',
      status: squads.status,
      expected: { count: spec.expectations.squadCount },
      actual: { count: squadCount },
      passed: squads.status === 200 && squadCount >= 0,
      responseTime: squads.responseTime,
    });

    // Test /agents
    const agents = await fetchEndpoint(engine.baseUrl, '/agents');
    const agentsBody = agents.body as Record<string, unknown>;
    const agentCount = Array.isArray(agentsBody?.agents) ? (agentsBody.agents as unknown[]).length : -1;
    endpoints.push({
      path: '/agents',
      status: agents.status,
      expected: { count: spec.expectations.agentCount },
      actual: { count: agentCount },
      passed: agents.status === 200 && agentCount >= 0,
      responseTime: agents.responseTime,
    });

    // Test /agents/status
    const agentStatus = await fetchEndpoint(engine.baseUrl, '/agents/status');
    endpoints.push({
      path: '/agents/status',
      status: agentStatus.status,
      expected: { status: 200 },
      actual: { status: agentStatus.status },
      passed: agentStatus.status === 200,
      responseTime: agentStatus.responseTime,
    });

    // Test /workflows
    const workflows = await fetchEndpoint(engine.baseUrl, '/execute/workflows');
    endpoints.push({
      path: '/execute/workflows',
      status: workflows.status,
      expected: { status: 200 },
      actual: { status: workflows.status },
      passed: workflows.status === 200,
      responseTime: workflows.responseTime,
    });
  } catch (err) {
    errors.push(`Endpoint test error: ${err}`);
  } finally {
    engine.kill();
  }

  const failedEndpoints = endpoints.filter(e => !e.passed);
  if (failedEndpoints.length > 0) {
    for (const ep of failedEndpoints) {
      errors.push(`${ep.path}: expected ${JSON.stringify(ep.expected)}, got ${JSON.stringify(ep.actual)}`);
    }
  }

  return {
    archetype: spec.archetype,
    passed: errors.length === 0,
    endpoints,
    timing: computeTimingMetrics(engineStartup, endpoints, performance.now() - testStart),
    errors,
  };
}

async function cmdTest(target: string): Promise<void> {
  if (target === '--all') {
    const specs = listArchetypes();
    console.log(`\nTesting ${specs.length} archetypes...\n`);

    const results: TestResult[] = [];
    for (const item of specs) {
      try {
        const result = await runTestForArchetype(item.name);
        results.push(result);
        console.log(formatTestResult(result));
      } catch (err) {
        console.error(`  ✗ ${item.name}: ${err}`);
        results.push({
          archetype: item.archetype,
          passed: false,
          endpoints: [],
          timing: { engineStartup: 0, totalTestTime: 0, endpointAvg: 0, endpointMax: 0 },
          errors: [String(err)],
        });
      }
    }

    console.log(formatSummary(results));
    const failed = results.filter(r => !r.passed).length;
    process.exit(failed > 0 ? 1 : 0);
  } else {
    const spec = getArchetype(target);
    if (!spec) {
      console.error(`Unknown archetype: ${target}`);
      process.exit(1);
    }

    console.log(`\nTesting ${spec.archetype}...`);
    const result = await runTestForArchetype(target);
    console.log(formatTestResult(result));
    process.exit(result.passed ? 0 : 1);
  }
}

async function cmdValidate(path: string): Promise<void> {
  const projectPath = resolve(path);
  console.log(`\nValidating: ${projectPath}\n`);

  const result = await validate(projectPath);

  console.log(`  AIOS Core: ${result.hasAiosCore ? '✓' : '✗'}`);
  console.log(`  Squads:    ${result.hasSquads ? '✓' : '✗'}`);
  console.log(`  Summary:   ${result.summary.squadCount} squads, ${result.summary.agentCount} agents, ${result.summary.workflowCount} workflows, ${result.summary.taskCount} tasks`);

  if (result.issues.length > 0) {
    console.log('\n  Issues:');
    for (const issue of result.issues) {
      const icon = issue.level === 'error' ? '✗' : issue.level === 'warning' ? '⚠' : 'ℹ';
      console.log(`    ${icon} [${issue.level}] ${issue.path}: ${issue.message}`);
    }
  }

  console.log(`\n  Valid: ${result.valid ? '✓ Yes' : '✗ No'}\n`);
  process.exit(result.valid ? 0 : 1);
}

async function cmdClean(): Promise<void> {
  const items = await Array.fromAsync(new Bun.Glob('*').scan({ cwd: OUTPUT_DIR, onlyFiles: false }));
  const dirs = items.filter(i => i !== '.gitkeep');

  if (dirs.length === 0) {
    console.log('\nNothing to clean.\n');
    return;
  }

  for (const dir of dirs) {
    await rm(join(OUTPUT_DIR, dir), { recursive: true, force: true });
  }
  console.log(`\n✓ Cleaned ${dirs.length} generated project(s).\n`);
}

// ── Main ──

async function main(): Promise<void> {
  switch (command) {
    case 'list':
      await cmdList();
      break;
    case 'generate':
      if (!args[1]) { console.error('Usage: generate <name|--all>'); process.exit(1); }
      await cmdGenerate(args[1]);
      break;
    case 'serve':
      if (!args[1]) { console.error('Usage: serve <name>'); process.exit(1); }
      await cmdServe(args[1]);
      break;
    case 'test':
      if (!args[1]) { console.error('Usage: test <name|--all>'); process.exit(1); }
      await cmdTest(args[1]);
      break;
    case 'validate':
      if (!args[1]) { console.error('Usage: validate <path>'); process.exit(1); }
      await cmdValidate(args[1]);
      break;
    case 'clean':
      await cmdClean();
      break;
    default:
      printUsage();
      process.exit(command ? 1 : 0);
  }
}

main().catch(err => {
  console.error(`Fatal error: ${err}`);
  process.exit(1);
});
