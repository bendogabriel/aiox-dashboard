# EPIC: Overnight Programs — Agentes Autonomos Executando Tarefas Noturnas

**PRD Ref:** Conceito baseado em [karpathy/autoresearch](https://github.com/karpathy/autoresearch)
**Status:** In Progress (FASE 1-5 implemented)
**Criado por:** @architect (Aria) + @pm (Morgan)

---

## Contexto

O [autoresearch](https://github.com/karpathy/autoresearch) do Karpathy demonstrou que agentes AI podem executar loops autonomos de pesquisa overnight — modificando codigo, avaliando resultados, mantendo melhorias e revertendo falhas — tudo sem intervencao humana.

O AIOS Engine ja possui 80% da infraestrutura necessaria:
- **Cron Scheduler** (`engine/src/core/cron-scheduler.ts`) — agendamento com persistencia
- **Job Queue** (`engine/src/core/job-queue.ts`) — fila com prioridade e retry
- **Process Pool** (`engine/src/core/process-pool.ts`) — pool de processos CLI
- **Workflow Engine** (`engine/src/core/workflow-engine.ts`) — state machine multi-agent
- **Auto-Experiment Task** (`.aios-core/development/tasks/auto-experiment-loop.md`) — loop experimental desenhado mas nao implementado

O que falta para generalizar o autoresearch em "Overnight Programs":
1. **Program Runner** — orquestrador do loop autonomo (o "main loop" do autoresearch)
2. **Git Checkpoint Manager** — branch, commit especulativo, revert automatico
3. **Metric Evaluation Framework** — avaliacao generica (nao apenas val_bpb)
4. **Decision Journal** — log estruturado de experimentos (ledger.jsonl)
5. **Convergence Engine** — condicoes de parada inteligentes
6. **Program Templates** — programas pre-definidos para diferentes tipos de tarefa
7. **Dashboard UI** — visualizacao e controle dos programas overnight
8. **Budget Controls** — limites de tokens, tempo e custo

### Filosofia Central (do autoresearch)

> Humanos escrevem `program.md` (instrucoes em Markdown).
> Agentes executam o loop autonomo.
> O programa e o artefato principal — nao o codigo.

Essa inversao transforma o fluxo: ao inves de humanos editarem codigo, humanos **programam agentes** que editam codigo (ou fazem research, QA, content, analytics, etc).

### Analogia autoresearch → AIOS

| autoresearch | AIOS Overnight Programs |
|---|---|
| `program.md` | `programs/{name}/program.md` |
| `train.py` (unico arquivo editavel) | `editable_scope` (glob pattern configuravel) |
| 5 min de treino | `iteration_budget` (tempo/tokens configuravel) |
| `val_bpb` (metrica unica) | `metric_command` + `metric_extract` (qualquer metrica) |
| Keep/Discard por metrica | Keep/Discard + criterios compostos |
| ~100 iteracoes overnight | `max_iterations` configuravel |
| Branch monotonic | Branch com savepoints e rollback automatico |
| Experiment log (manual) | Decision Journal (JSONL estruturado, queryable) |

---

## Visao do Sistema

```
                    ┌─────────────────────────────────┐
                    │         program.md               │
                    │  (humano escreve instrucoes)      │
                    └──────────────┬──────────────────┘
                                   │
                    ┌──────────────▼──────────────────┐
                    │      Program Runner              │
                    │  (orquestra o loop autonomo)      │
                    └──────────────┬──────────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                     │
    ┌─────────▼─────────┐ ┌───────▼────────┐ ┌─────────▼─────────┐
    │  Git Checkpoint    │ │  Agent Exec    │ │  Metric Eval      │
    │  Manager           │ │  (process pool)│ │  Framework        │
    │                    │ │                │ │                    │
    │  - branch create   │ │  - spawn CLI   │ │  - run command     │
    │  - speculative     │ │  - context     │ │  - extract scalar  │
    │    commit          │ │    injection   │ │  - compare baseline│
    │  - revert/keep     │ │  - timeout     │ │  - composite score │
    └─────────┬─────────┘ └───────┬────────┘ └─────────┬─────────┘
              │                    │                     │
              └────────────────────┼─────────────────────┘
                                   │
                    ┌──────────────▼──────────────────┐
                    │      Decision Engine             │
                    │                                  │
                    │  metric improved? → KEEP (commit)│
                    │  metric regressed? → DISCARD     │
                    │  converged? → STOP               │
                    │  budget exceeded? → STOP          │
                    └──────────────┬──────────────────┘
                                   │
                    ┌──────────────▼──────────────────┐
                    │      Decision Journal            │
                    │  (ledger.jsonl append-only)       │
                    │                                  │
                    │  - hypothesis, commit, delta     │
                    │  - pattern analysis              │
                    │  - near-miss detection           │
                    └──────────────┬──────────────────┘
                                   │
                    ┌──────────────▼──────────────────┐
                    │      Dashboard UI                │
                    │  (real-time monitoring)           │
                    │                                  │
                    │  - program list + status         │
                    │  - iteration timeline            │
                    │  - metric chart (sparkline)      │
                    │  - experiment detail drawer      │
                    └──────────────────────────────────┘
```

---

## Estrutura de Arquivos

```
engine/
├── src/
│   ├── core/
│   │   ├── program-runner.ts          # [NEW] Loop autonomo principal
│   │   ├── git-checkpoint.ts          # [NEW] Branch, commit, revert
│   │   ├── metric-evaluator.ts        # [NEW] Avaliacao de metricas
│   │   ├── decision-journal.ts        # [NEW] Ledger JSONL
│   │   ├── convergence-engine.ts      # [NEW] Condicoes de parada
│   │   └── budget-controller.ts       # [NEW] Limites token/tempo/custo
│   ├── routes/
│   │   └── programs.ts                # [NEW] REST API para programs
│   └── types.ts                       # [MOD] Tipos para programs
├── migrations/
│   └── 006_programs.sql               # [NEW] Tabelas programs + experiments
└── engine.config.yaml                 # [MOD] Secao programs

programs/                              # [NEW] Diretorio de program definitions
├── code-optimize/
│   └── program.md                     # Template: otimizacao de codigo
├── qa-sweep/
│   └── program.md                     # Template: QA scan completo
├── content-generate/
│   └── program.md                     # Template: geracao de conteudo
├── research-deep/
│   └── program.md                     # Template: pesquisa aprofundada
├── vault-enrich/
│   └── program.md                     # Template: enriquecimento do vault
└── security-audit/
    └── program.md                     # Template: auditoria de seguranca

src/
├── components/
│   └── overnight/                     # [NEW] Dashboard UI
│       ├── OvernightView.tsx          # Container principal (3 niveis)
│       ├── ProgramList.tsx            # Lista de programs com status
│       ├── ProgramDetail.tsx          # Detalhes + timeline de iteracoes
│       ├── ExperimentCard.tsx         # Card de experimento individual
│       ├── MetricChart.tsx            # Sparkline de evolucao de metrica
│       ├── ProgramCreator.tsx         # Wizard para criar program
│       └── DecisionJournalViewer.tsx  # Visualizador do ledger
├── hooks/
│   ├── useOvernightPrograms.ts        # [NEW] React Query + SSE
│   └── useExperimentStream.ts         # [NEW] Stream de experimentos
├── stores/
│   └── overnightStore.ts              # [NEW] Zustand store
└── types/
    └── overnight.ts                   # [NEW] Tipos TypeScript
```

---

## Program Definition Schema

O `program.md` e o artefato central — equivalente ao `program.md` do autoresearch, mas generalizado para qualquer tipo de tarefa.

```markdown
---
# program.md frontmatter
name: "Bundle Size Optimizer"
version: "1.0.0"
type: "code-optimize"           # code-optimize | qa-sweep | content-generate | research | vault-enrich | custom
squad_id: "engineering"
agent_id: "dev"

# Scope constraints (autoresearch: "agent only touches train.py")
editable_scope:
  - "src/components/**/*.tsx"
  - "src/lib/**/*.ts"
readonly_scope:
  - "src/**/*.test.*"
  - "package.json"
  - "vite.config.ts"

# Metric (autoresearch: val_bpb)
metric:
  command: "npm run build 2>&1 | tail -5"
  extract: "regex"               # regex | json_path | last_number | custom
  pattern: "Total size: ([\\d.]+) kB"
  direction: "minimize"          # minimize | maximize
  baseline: null                 # auto-detected on first run

# Budget (autoresearch: 5 min per iteration)
budget:
  iteration_timeout_ms: 300000   # 5 min per iteration
  max_iterations: 50
  max_total_hours: 8             # overnight window
  max_tokens: 500000             # total token budget
  max_cost_usd: 10.00            # cost ceiling

# Convergence
convergence:
  stale_iterations: 5            # stop after N iterations without improvement
  min_delta_percent: 0.1         # minimum improvement to count as "better"
  target_value: null             # optional absolute target

# Git
git:
  branch_prefix: "overnight"     # overnight/{program_name}/{timestamp}
  commit_on_keep: true
  squash_on_complete: true       # squash all keeps into single commit
  auto_pr: false                 # create PR when program completes

# Schedule (optional — can also be triggered manually)
schedule: "0 1 * * 1-5"         # weekdays at 1 AM
enabled: true
---

# Bundle Size Optimizer

## Objetivo

Reduzir o bundle size do dashboard AIOS iterativamente, mantendo funcionalidade e testes passando.

## Estrategia

1. Analise o bundle atual com `npm run build`
2. Identifique o maior contributor
3. Aplique UMA otimizacao por iteracao (tree-shaking, code-split, lazy load, etc.)
4. Garanta que `npm test` passa
5. Se o bundle diminuiu, mantenha. Se aumentou ou testes falharam, reverta.

## Regras

- NUNCA remova funcionalidade
- NUNCA quebre testes existentes
- APENAS uma mudanca por iteracao (atomicidade)
- Consulte o Decision Journal para evitar repetir tentativas
- Priorize: unused imports > barrel exports > dynamic imports > code splitting

## Anti-patterns (evitar)

- Nao comprima codigo manualmente (minification e do bundler)
- Nao remova type imports (TypeScript os elimina no build)
- Nao mova codigo entre arquivos sem motivo claro
```

---

# FASE 1 — Core Engine: Program Runner + Git + Metrics

**Objetivo:** Implementar o loop autonomo central — o "coracao" do overnight programs.
**Agente executor:** @dev (Dex) + @architect (Aria) para design review
**Sprint:** 12-13

---

## Story 8.1 — Program Runner Core

**Status:** Draft

**As a** platform operator,
**I want** an autonomous program runner that executes iterative agent loops,
**so that** agents can run experiments overnight without human intervention.

### Acceptance Criteria

- [ ] AC 8.1.1: `ProgramRunner` class implements the 5-phase loop: Setup → Hypothesize → Implement → Measure → Decide
- [ ] AC 8.1.2: Runner parses `program.md` frontmatter (YAML) + body (Markdown) into typed `ProgramDefinition`
- [ ] AC 8.1.3: Each iteration spawns agent via existing `ProcessPool` with injected context (program body + decision journal summary + last N experiments)
- [ ] AC 8.1.4: Runner respects `budget.iteration_timeout_ms` — kills agent if exceeds timeout
- [ ] AC 8.1.5: Runner emits WebSocket events: `program:started`, `program:iteration:started`, `program:iteration:completed`, `program:completed`, `program:failed`
- [ ] AC 8.1.6: Runner state persisted in SQLite `programs` table (survives engine restart)
- [ ] AC 8.1.7: Runner can be paused/resumed/cancelled via API
- [ ] AC 8.1.8: On engine restart, active programs resume from last completed iteration

### Tasks

- [ ] Create `ProgramDefinition` TypeScript types from schema
  - [ ] Frontmatter parser (YAML with zod validation)
  - [ ] Body extractor (Markdown sections)
- [ ] Implement `ProgramRunner` class (`engine/src/core/program-runner.ts`)
  - [ ] Phase 0: Setup — parse program, create experiment branch, establish baseline metric
  - [ ] Phase 1: Hypothesize — inject context (program + journal + history) into agent prompt
  - [ ] Phase 2: Implement — spawn agent via ProcessPool, capture output
  - [ ] Phase 3: Measure — delegate to MetricEvaluator (Story 8.3)
  - [ ] Phase 4: Decide — compare metric, KEEP or DISCARD
  - [ ] Phase 5: Convergence check — delegate to ConvergenceEngine (Story 8.5)
  - [ ] Loop back to Phase 1 or terminate
- [ ] Create migration `006_programs.sql`
  - [ ] `programs` table: id, name, definition_path, status (idle/running/paused/completed/failed), current_iteration, best_metric, baseline_metric, branch_name, started_at, completed_at, config_json
  - [ ] `experiments` table: id, program_id, iteration, hypothesis, commit_sha, metric_before, metric_after, delta, delta_pct, status (keep/discard/error), files_modified, duration_ms, agent_tokens_used, error_message, created_at
- [ ] Create REST routes (`engine/src/routes/programs.ts`)
  - [ ] `POST /programs/start` — start a program
  - [ ] `GET /programs` — list all programs
  - [ ] `GET /programs/:id` — get program detail + experiments
  - [ ] `POST /programs/:id/pause` — pause running program
  - [ ] `POST /programs/:id/resume` — resume paused program
  - [ ] `POST /programs/:id/cancel` — cancel program
  - [ ] `GET /programs/:id/experiments` — list experiments for program
  - [ ] `GET /programs/:id/journal` — get decision journal
- [ ] WebSocket events integration
- [ ] Unit tests for ProgramRunner phases

### Dev Notes

- O ProgramRunner e uma **composicao** dos subsistemas existentes: ProcessPool (spawn), JobQueue (enqueueing), WorkflowEngine (state machine pattern). Nao reinventar — compor.
- O context injection no Phase 1 deve seguir o padrao do `context-builder.ts`: persona + program body + journal summary (last 5 experiments) + current baseline.
- Budget token: somar `agent_tokens_used` de cada experiment e comparar com `budget.max_tokens`.
- [Source: engine/src/core/process-pool.ts, engine/src/core/workflow-engine.ts]

---

## Story 8.2 — Git Checkpoint Manager

**Status:** Draft

**As a** program runner,
**I want** automatic git branch management with speculative commits and reverts,
**so that** improvements are preserved and failures are cleanly rolled back.

### Acceptance Criteria

- [ ] AC 8.2.1: `GitCheckpoint` creates experiment branch: `overnight/{program_name}/{YYYYMMDD-HHmm}`
- [ ] AC 8.2.2: Before each iteration, creates speculative commit (savepoint) with message `experiment({iteration}): {hypothesis_short}`
- [ ] AC 8.2.3: On KEEP decision, branch tip advances (commit stays)
- [ ] AC 8.2.4: On DISCARD decision, `git reset --hard HEAD~1` reverts to previous state
- [ ] AC 8.2.5: On program completion with `squash_on_complete: true`, squashes all KEEP commits into single commit
- [ ] AC 8.2.6: On program completion with `auto_pr: true`, creates PR via `gh pr create`
- [ ] AC 8.2.7: `readonly_scope` files are monitored — if agent modifies them, iteration is auto-DISCARDed with `contract_violation` error
- [ ] AC 8.2.8: Monotonic branch guarantee — branch tip NEVER contains a regression vs baseline

### Tasks

- [ ] Implement `GitCheckpoint` class (`engine/src/core/git-checkpoint.ts`)
  - [ ] `createBranch(programName)` — create and checkout experiment branch
  - [ ] `speculativeCommit(iteration, hypothesis)` — stage editable_scope + commit
  - [ ] `revert()` — `git reset --hard HEAD~1`
  - [ ] `keep()` — noop (commit already exists)
  - [ ] `squashAll(message)` — interactive rebase squash
  - [ ] `createPR(title, body)` — delegate to `gh pr create`
  - [ ] `validateScope(editableGlobs, readonlyGlobs)` — check `git diff --name-only` against scope rules
  - [ ] `getModifiedFiles()` — return list of changed files
  - [ ] `cleanup(branchName)` — delete experiment branch on cancel
- [ ] Scope validation integration with ProgramRunner
- [ ] Unit tests for each operation
- [ ] Integration test: full keep/discard/squash cycle

### Dev Notes

- Usar `Bun.spawn(["git", ...])` para operacoes git (mesmo padrao do workspace-manager.ts).
- O `readonly_scope` check roda ANTES do speculative commit. Se violado, nao commita — marca como error direto.
- Squash usa `git rebase -i` com auto-squash. Alternativa mais simples: `git reset --soft {first_commit}` + `git commit`.
- [Source: engine/src/core/workspace-manager.ts, .aios-core/development/tasks/auto-experiment-loop.md]

---

## Story 8.3 — Metric Evaluation Framework

**Status:** Draft

**As a** program runner,
**I want** a flexible metric evaluation system that works with any measurable output,
**so that** overnight programs can optimize for bundle size, test coverage, performance, content quality, or any custom metric.

### Acceptance Criteria

- [ ] AC 8.3.1: `MetricEvaluator` executes `metric.command` in isolated subprocess with output captured to file (prevents context window flooding)
- [ ] AC 8.3.2: Supports 4 extraction modes: `regex` (pattern match), `json_path` (jq-style), `last_number` (last numeric value in output), `custom` (user script)
- [ ] AC 8.3.3: Extracts scalar numeric value from command output
- [ ] AC 8.3.4: Compares against baseline using `metric.direction` (minimize or maximize)
- [ ] AC 8.3.5: Supports composite metrics: weighted average of multiple metric commands
- [ ] AC 8.3.6: Auto-detects baseline on first iteration (runs metric before any changes)
- [ ] AC 8.3.7: Metric execution respects separate timeout (30s default) — independent of iteration timeout
- [ ] AC 8.3.8: If metric command fails (exit != 0), iteration is auto-DISCARDed

### Tasks

- [ ] Implement `MetricEvaluator` class (`engine/src/core/metric-evaluator.ts`)
  - [ ] `evaluateBaseline(config)` — run metric command, extract initial value
  - [ ] `evaluate(config)` — run metric command, extract current value
  - [ ] `compare(current, baseline, direction)` — return delta + delta_pct + improved boolean
  - [ ] `extractValue(output, mode, pattern)` — extraction dispatcher
  - [ ] `extractRegex(output, pattern)` — regex extraction
  - [ ] `extractJsonPath(output, path)` — JSON path extraction
  - [ ] `extractLastNumber(output)` — last numeric value
  - [ ] `extractCustom(output, script)` — user-provided extractor script
- [ ] Composite metric support
  - [ ] Array of metric configs with weights
  - [ ] Weighted average calculation
  - [ ] All-must-pass option (all metrics must improve)
- [ ] Output isolation: capture to temp file, read last N lines
- [ ] Metric timeout (independent of iteration timeout)
- [ ] Unit tests for each extraction mode
- [ ] Integration test with real commands (npm run build, npm test, etc.)

### Dev Notes

- **Output isolation e critico.** O autoresearch usa `tail -N` para extrair resultado. Nos fazemos o mesmo: `Bun.spawn()` com `stdout` redirecionado para arquivo, depois `Bun.file().text()` para ler.
- Composite metrics permitem: `bundle_size * 0.6 + test_pass_rate * 0.4` — otimizar multiplos objetivos simultaneamente.
- Metricas built-in uteis: `npm run build` (bundle size), `npx vitest --reporter=json` (test coverage), `npx tsc --noEmit 2>&1 | wc -l` (type errors), `npx eslint . --format=json | jq '.length'` (lint errors).
- [Source: .aios-core/development/tasks/auto-experiment-loop.md#measure-phase]

---

# FASE 2 — Intelligence: Decision Journal + Convergence

**Objetivo:** Tornar o loop inteligente — aprender com tentativas passadas e saber quando parar.
**Agente executor:** @dev (Dex)
**Sprint:** 13-14

---

## Story 8.4 — Decision Journal (Experiment Ledger)

**Status:** Draft

**As a** program runner,
**I want** a structured, queryable experiment log,
**so that** agents can learn from past attempts, avoid repeats, and find promising combinations.

### Acceptance Criteria

- [ ] AC 8.4.1: Decision Journal persists as JSONL file at `.aios/overnight/{program_name}/ledger.jsonl` (append-only, survives git resets)
- [ ] AC 8.4.2: Each experiment entry contains: iteration, timestamp, hypothesis, commit_sha, metric_before, metric_after, delta, delta_pct, status (keep/discard/error), files_modified, duration_ms, tokens_used, error_message
- [ ] AC 8.4.3: Journal provides query methods: `getAll()`, `getByStatus(status)`, `getLast(n)`, `getBest()`, `getNearMisses(threshold)`, `getPatterns()`
- [ ] AC 8.4.4: `getNearMisses()` returns experiments that almost improved (delta within threshold)
- [ ] AC 8.4.5: `getPatterns()` analyzes which file types, change categories, and strategies had highest success rate
- [ ] AC 8.4.6: Journal generates `summary()` text (injected into agent context each iteration) with: total experiments, keep/discard ratio, best metric achieved, top strategies, files most modified, near-misses to explore
- [ ] AC 8.4.7: Journal is mirrored to SQLite `experiments` table (for dashboard queries) while JSONL remains source of truth
- [ ] AC 8.4.8: Journal survives git operations (stored in `.aios/` which is git-ignored)

### Tasks

- [ ] Implement `DecisionJournal` class (`engine/src/core/decision-journal.ts`)
  - [ ] `append(entry: ExperimentEntry)` — append to JSONL
  - [ ] `getAll()` — parse full journal
  - [ ] `getLast(n)` — last N entries
  - [ ] `getByStatus(status)` — filter by keep/discard/error
  - [ ] `getBest()` — entry with best metric
  - [ ] `getNearMisses(thresholdPct)` — discarded but within threshold of improvement
  - [ ] `getPatterns()` — strategy success analysis
  - [ ] `summary()` — generate human-readable summary for agent context
  - [ ] `mirrorToSQLite(entry)` — write to experiments table
- [ ] JSONL file management (create dir, handle concurrent writes)
- [ ] Pattern analysis algorithm (group by file type, change category, strategy)
- [ ] Summary generation (template-based, concise for context injection)
- [ ] Unit tests

### Dev Notes

- O JSONL e append-only por design (como write-ahead log). Nunca editar entradas existentes.
- O `summary()` deve ser **conciso** (< 500 tokens) para nao inflar o context window do agente. Formato sugerido:
  ```
  ## Experiment Journal (iterations 1-47)
  Best: 198.3 kB (iteration 23, lazy-load Dashboard)
  Baseline: 234.5 kB | Current: 201.1 kB | Improvement: -14.3%
  Keep rate: 12/47 (25.5%)
  Top strategies: lazy-load (5 keeps), tree-shake (3 keeps), remove-unused (2 keeps)
  Near-misses: barrel-export-split (iteration 31, -0.08%), icon-subset (iteration 38, +0.12%)
  Avoid: already tried css-modules (3x, no improvement), manual-chunk (2x, regression)
  ```
- [Source: .aios-core/development/scripts/experiment-ledger.js]

---

## Story 8.5 — Convergence Engine + Budget Controller

**Status:** Draft

**As a** platform operator,
**I want** intelligent stop conditions and budget enforcement,
**so that** programs don't waste resources on diminishing returns or exceed cost limits.

### Acceptance Criteria

- [ ] AC 8.5.1: `ConvergenceEngine` checks 5 stop conditions after each iteration:
  1. `max_iterations` reached
  2. `stale_iterations` — N consecutive iterations without improvement
  3. `target_value` — absolute metric target achieved
  4. `max_total_hours` — wall-clock time exceeded
  5. `max_cost_usd` — estimated cost exceeded (based on token usage)
- [ ] AC 8.5.2: `BudgetController` tracks cumulative token usage, wall-clock time, and estimated cost per program
- [ ] AC 8.5.3: BudgetController emits warning at 80% of any budget limit
- [ ] AC 8.5.4: When any stop condition triggers, program transitions to `completed` (if improved) or `exhausted` (if no improvement)
- [ ] AC 8.5.5: Convergence reason is recorded in program record: `convergence_reason` field
- [ ] AC 8.5.6: `max_tokens` budget is enforced — program stops before spawning agent if remaining budget < estimated iteration cost
- [ ] AC 8.5.7: Cost estimation uses configurable token pricing (default: Claude Sonnet rates)

### Tasks

- [ ] Implement `ConvergenceEngine` class (`engine/src/core/convergence-engine.ts`)
  - [ ] `check(program, journal)` — evaluate all 5 conditions, return `{ shouldStop, reason }`
  - [ ] `isStale(journal, threshold)` — check consecutive non-improving iterations
  - [ ] `isTargetReached(current, target, direction)` — absolute target check
- [ ] Implement `BudgetController` class (`engine/src/core/budget-controller.ts`)
  - [ ] `track(programId, tokens, durationMs)` — accumulate usage
  - [ ] `estimate(programId)` — calculate estimated cost
  - [ ] `canAffordIteration(programId)` — check if budget allows another iteration
  - [ ] `getUsage(programId)` — return usage summary
  - [ ] `emitWarning(programId, metric, percent)` — WebSocket warning at 80%
- [ ] Token pricing config (cost per 1K input/output tokens)
- [ ] Integration with ProgramRunner loop
- [ ] Unit tests for each stop condition
- [ ] Budget warning WebSocket events

### Dev Notes

- Token pricing defaults: Sonnet input=$3/MTok, output=$15/MTok. Configurable no `engine.config.yaml`.
- `stale_iterations` default = 5 (do autoresearch). Para tarefas de research/content pode ser maior (10-15).
- Estimativa de custo por iteracao: media movel das ultimas 5 iteracoes.
- [Source: .aios-core/development/tasks/auto-experiment-loop.md#convergence-phase]

---

# FASE 3 — Templates: Programs Pre-Definidos

**Objetivo:** Criar programas prontos para uso que cobrem os casos mais comuns de tarefas overnight.
**Agente executor:** @dev (Dex) + @architect (Aria)
**Sprint:** 14-15

---

## Story 8.6 — Built-in Program Templates

**Status:** Draft

**As a** platform user,
**I want** ready-to-use program templates for common overnight tasks,
**so that** I can start running overnight programs without writing programs from scratch.

### Acceptance Criteria

- [ ] AC 8.6.1: 6 built-in program templates available in `programs/` directory:
  1. **code-optimize** — bundle size, performance, dead code removal
  2. **qa-sweep** — find and fix bugs, improve test coverage
  3. **content-generate** — generate vault documents, marketing copy, documentation
  4. **research-deep** — deep research on topic, compile findings
  5. **vault-enrich** — enrich vault workspace with new data, validate existing
  6. **security-audit** — find vulnerabilities, apply fixes
- [ ] AC 8.6.2: Each template has complete `program.md` with frontmatter + body
- [ ] AC 8.6.3: Templates are parametrizable — user copies and customizes scope, metric, budget
- [ ] AC 8.6.4: Each template includes strategy section, anti-patterns, and example metric commands
- [ ] AC 8.6.5: `GET /programs/templates` API endpoint lists available templates
- [ ] AC 8.6.6: `POST /programs/from-template` creates new program from template with user overrides

### Tasks

- [ ] Create `programs/code-optimize/program.md`
  - [ ] Metric: `npm run build` bundle size
  - [ ] Strategy: tree-shaking, lazy-load, code-split, unused removal
  - [ ] Scope: `src/**/*.{ts,tsx}` editable, tests readonly
- [ ] Create `programs/qa-sweep/program.md`
  - [ ] Metric: composite (test pass rate * 0.5 + type error count * 0.3 + lint error count * 0.2)
  - [ ] Strategy: fix failing tests, add missing tests, fix type errors
  - [ ] Scope: `src/**/*.{ts,tsx}` + `src/**/*.test.*` editable
- [ ] Create `programs/content-generate/program.md`
  - [ ] Metric: document count + token count (maximize)
  - [ ] Strategy: research topic, generate markdown, validate quality
  - [ ] Non-git program (outputs to vault, not codebase)
- [ ] Create `programs/research-deep/program.md`
  - [ ] Metric: findings count + source diversity (maximize)
  - [ ] Strategy: web search, compile, cross-reference, synthesize
  - [ ] Non-git program (outputs to research folder)
- [ ] Create `programs/vault-enrich/program.md`
  - [ ] Metric: vault health percent (maximize)
  - [ ] Strategy: identify gaps, generate content, validate taxonomy
  - [ ] Integration with VaultStore
- [ ] Create `programs/security-audit/program.md`
  - [ ] Metric: vulnerability count (minimize)
  - [ ] Strategy: npm audit, code scan, dependency check, fix
  - [ ] Scope: `package.json` + `src/**/*.ts` editable
- [ ] Template API endpoints
- [ ] Template parametrization logic

### Dev Notes

- Programas `content-generate` e `research-deep` nao usam git checkpoint (nao ha codebase para commitar). O ProgramRunner deve suportar modo `git: false` — iteracoes salvam output em arquivo ao inves de git commit.
- O `vault-enrich` precisa integrar com `supabaseVaultService` para ler/escrever documentos.
- Templates sao **pontos de partida** — o usuario DEVE customizar para seu contexto.

---

## Story 8.7 — Multi-Agent Program Pipelines

**Status:** Draft

**As a** platform operator,
**I want** programs that orchestrate multiple agents in sequence within each iteration,
**so that** complex tasks like "dev implements + qa validates" can run autonomously.

### Acceptance Criteria

- [ ] AC 8.7.1: Program frontmatter supports `pipeline` mode with ordered agent steps
- [ ] AC 8.7.2: Pipeline definition: array of `{ agent_id, squad_id, role, timeout_ms }` steps
- [ ] AC 8.7.3: Each pipeline step receives output of previous step as additional context
- [ ] AC 8.7.4: Pipeline fails fast — if any step fails, iteration is DISCARDed
- [ ] AC 8.7.5: Pipeline supports gate steps — agent returns GO/NO-GO verdict that determines continuation
- [ ] AC 8.7.6: Metric evaluation runs after last pipeline step
- [ ] AC 8.7.7: Decision Journal records which pipeline step contributed to keep/discard

### Tasks

- [ ] Extend `ProgramDefinition` types with pipeline mode
  - [ ] `mode: "single" | "pipeline"` in frontmatter
  - [ ] `pipeline: [{ agent_id, squad_id, role, timeout_ms, gate? }]`
- [ ] Implement pipeline execution in ProgramRunner
  - [ ] Sequential step execution
  - [ ] Context chaining (output → next input)
  - [ ] Gate step evaluation (GO/NO-GO parsing)
  - [ ] Fail-fast on step failure
- [ ] Pipeline-aware Decision Journal entries
- [ ] Example pipeline template: `dev-qa-loop`
  ```yaml
  pipeline:
    - { agent_id: "dev", squad_id: "engineering", role: "implementer", timeout_ms: 180000 }
    - { agent_id: "qa", squad_id: "engineering", role: "reviewer", gate: true, timeout_ms: 120000 }
  ```
- [ ] Unit tests for pipeline execution

### Dev Notes

- Pipeline mode e uma evolucao natural. O autoresearch usa um unico agente, mas tasks complexas precisam de dev + qa, ou researcher + writer + editor.
- Reusar o padrao do `workflow-engine.ts` para sequenciamento de steps.
- Gate steps: o agente QA retorna "APPROVE" ou "REJECT" — parsear do stdout.
- [Source: engine/src/core/workflow-engine.ts]

---

# FASE 4 — Dashboard: Visualizacao e Controle

**Objetivo:** Interface visual para criar, monitorar e analisar programas overnight.
**Agente executor:** @dev (Dex)
**Sprint:** 15-16

---

## Story 8.8 — Overnight Programs View (Dashboard UI)

**Status:** Draft

**As a** dashboard user,
**I want** a visual interface to manage overnight programs,
**so that** I can start, monitor, and analyze programs without using the API directly.

### Acceptance Criteria

- [ ] AC 8.8.1: New sidebar item "Overnight" with Moon icon, positioned after Vault
- [ ] AC 8.8.2: 3-level navigation: Program List (L1) → Program Detail (L2) → Experiment Detail (L3)
- [ ] AC 8.8.3: Program List shows: name, type badge, status (idle/running/paused/completed/failed), current iteration, best metric, progress bar (iteration/max), last run time
- [ ] AC 8.8.4: Program Detail shows: metadata card, metric evolution chart (sparkline), iteration timeline (vertical), decision journal summary, pause/resume/cancel controls
- [ ] AC 8.8.5: Experiment Detail shows: hypothesis, files modified, metric before/after with delta, commit SHA link, duration, status badge (keep/discard/error), agent output excerpt
- [ ] AC 8.8.6: "New Program" button opens wizard (from template or custom)
- [ ] AC 8.8.7: Real-time updates via WebSocket — iteration progress animates live
- [ ] AC 8.8.8: Active programs show pulsing indicator in sidebar (same pattern as Bob)

### Tasks

- [ ] Add "Overnight" to sidebar navigation (Sidebar.tsx)
  - [ ] Moon icon from lucide-react
  - [ ] Shortcut key 'O'
  - [ ] Pulsing dot when program is running
- [ ] Register in App.tsx viewMap + loader messages
- [ ] Create `OvernightView.tsx` — container with 3-level navigation + breadcrumbs
- [ ] Create `ProgramList.tsx` — grid of program cards with status
- [ ] Create `ProgramDetail.tsx` — header + metric chart + timeline + controls
- [ ] Create `ExperimentCard.tsx` — individual experiment in timeline
- [ ] Create `MetricChart.tsx` — sparkline showing metric evolution over iterations
- [ ] Create `ProgramCreator.tsx` — wizard to create from template or custom
- [ ] Create `DecisionJournalViewer.tsx` — formatted journal view
- [ ] Create `useOvernightPrograms.ts` hook (React Query + WebSocket)
- [ ] Create `useExperimentStream.ts` hook (SSE for live iteration)
- [ ] Create `overnightStore.ts` (Zustand)
- [ ] Create `src/types/overnight.ts` (TypeScript types)

### Dev Notes

- Seguir exatamente o padrao do VaultView (3-level navigation, AnimatePresence, breadcrumbs, GlassCard).
- MetricChart: usar um sparkline simples com `<svg>` (mesmo padrao do HealthSparkline.tsx no dashboard).
- Timeline vertical: cada ExperimentCard mostra o numero da iteracao, hypothesis truncada, delta badge (verde para keep, vermelho para discard).
- [Source: src/components/vault/VaultView.tsx, src/components/dashboard/HealthSparkline.tsx]

---

## Story 8.9 — Experiment Analytics + History

**Status:** Draft

**As a** platform user,
**I want** analytics about overnight program execution history,
**so that** I can understand patterns, optimize programs, and track ROI.

### Acceptance Criteria

- [ ] AC 8.9.1: Program Detail includes analytics section: success rate (%), average delta per keep, total improvement, tokens consumed, estimated cost, runtime hours
- [ ] AC 8.9.2: Strategy effectiveness chart: bar chart showing keep rate per strategy category
- [ ] AC 8.9.3: File impact heatmap: which files were most frequently modified (keep vs discard)
- [ ] AC 8.9.4: Cumulative improvement chart: line chart showing metric evolution from baseline to current best
- [ ] AC 8.9.5: Program history list: past completed programs with summary stats
- [ ] AC 8.9.6: Export experiment data as CSV or JSON
- [ ] AC 8.9.7: Compare two programs side-by-side (A/B comparison)

### Tasks

- [ ] Analytics section in ProgramDetail
  - [ ] KPI cards: success rate, total improvement, cost, runtime
  - [ ] Strategy effectiveness bar chart
  - [ ] File impact visualization
  - [ ] Cumulative improvement line chart
- [ ] Program history view
- [ ] Export functionality (CSV/JSON)
- [ ] Program comparison drawer
- [ ] API endpoints for analytics queries
  - [ ] `GET /programs/:id/analytics` — aggregated stats
  - [ ] `GET /programs/:id/experiments/export` — CSV/JSON export
  - [ ] `GET /programs/compare?ids=a,b` — comparison data

### Dev Notes

- Charts: usar `<svg>` simples com GlassCard container — sem biblioteca de charts externa.
- File heatmap: grid onde cada celula e um arquivo, cor indica frequencia de modificacao, borda indica keep vs discard ratio.
- [Source: src/components/dashboard/HealthSparkline.tsx para padrao de chart SVG]

---

# FASE 5 — Production Hardening

**Objetivo:** Tornar o sistema robusto para execucao prolongada sem supervisao.
**Agente executor:** @dev (Dex) + @devops (Gage) para infra
**Sprint:** 16-17

---

## Story 8.10 — Alert System + Error Recovery

**Status:** Draft

**As a** platform operator,
**I want** alerts when programs encounter issues and automatic recovery from common failures,
**so that** overnight execution is resilient without requiring human monitoring.

### Acceptance Criteria

- [ ] AC 8.10.1: Alert system emits notifications for: program started, program completed, program failed, budget warning (80%), stale detection (no improvement for N iterations), consecutive errors (3+ errors in a row)
- [ ] AC 8.10.2: Alerts delivered via: WebSocket (dashboard), log file, optional webhook (Slack/Discord/email)
- [ ] AC 8.10.3: Graduated error recovery (from autoresearch):
  - TRIVIAL (syntax error, import error): auto-fix 1 attempt, re-run
  - MODERATE (test failure, logic error): 2 attempts with understanding, then abandon iteration
  - FUNDAMENTAL (dependency conflict, architecture issue): abandon immediately, log, continue to next hypothesis
- [ ] AC 8.10.4: Consecutive error circuit breaker: after 5 consecutive errors, pause program and alert
- [ ] AC 8.10.5: Engine crash recovery: on restart, detect in-progress programs and resume from last completed iteration
- [ ] AC 8.10.6: Disk space guard: check available space before starting iteration, pause if < 1GB
- [ ] AC 8.10.7: Process orphan cleanup: detect and kill orphaned agent processes on startup

### Tasks

- [ ] Alert dispatcher (`engine/src/core/alert-dispatcher.ts`)
  - [ ] WebSocket alerts
  - [ ] Log file alerts
  - [ ] Webhook integration (configurable URL + payload template)
- [ ] Error classifier for graduated recovery
- [ ] Circuit breaker logic (consecutive error tracking)
- [ ] Engine restart recovery (scan programs table for running status)
- [ ] Disk space guard
- [ ] Process orphan cleanup on startup
- [ ] Alert configuration in engine.config.yaml
- [ ] Unit tests for recovery scenarios

### Dev Notes

- Error classification: parsear o `error_message` do agent. Patterns conhecidos:
  - TRIVIAL: `SyntaxError`, `Cannot find module`, `unexpected token`
  - MODERATE: `Test failed`, `AssertionError`, `Type error`
  - FUNDAMENTAL: `ENOSPC`, `out of memory`, `SIGKILL`
- Webhook payload compativel com Slack incoming webhooks.
- [Source: .aios-core/development/tasks/auto-experiment-loop.md#failure-triage]

---

## Story 8.11 — Cron Integration + Scheduling UI

**Status:** Draft

**As a** platform user,
**I want** to schedule programs to run automatically on a recurring basis,
**so that** optimization, QA, and research happen every night without manual triggering.

### Acceptance Criteria

- [ ] AC 8.11.1: Programs with `schedule` in frontmatter are automatically registered as cron jobs on engine startup
- [ ] AC 8.11.2: Cron trigger creates a new program run (new branch, fresh journal, baseline re-evaluated)
- [ ] AC 8.11.3: If previous run is still active when cron fires, skip (same overlap detection as existing cron system)
- [ ] AC 8.11.4: Dashboard shows schedule information: next run, last run, cron expression (human-readable)
- [ ] AC 8.11.5: Schedule can be edited from dashboard without modifying program.md file
- [ ] AC 8.11.6: Manual "Run Now" button in dashboard triggers immediate execution regardless of schedule
- [ ] AC 8.11.7: Program run history shows trigger type: `manual` vs `scheduled`

### Tasks

- [ ] Integration between ProgramRunner and CronScheduler
  - [ ] On engine boot: scan programs/ directory, register scheduled programs as crons
  - [ ] Cron callback: create new program run via ProgramRunner
  - [ ] Overlap detection: check if program already running
- [ ] Schedule UI components in ProgramDetail
  - [ ] Cron expression display (human-readable via croner)
  - [ ] Next/last run timestamps
  - [ ] Edit schedule modal
  - [ ] "Run Now" button
- [ ] Run history with trigger type
- [ ] Unit tests for cron-program integration

### Dev Notes

- Reusar integralmente o `cron-scheduler.ts` existente. O ProgramRunner se registra como callback do cron.
- Human-readable cron: `croner` tem `.nextRun()` e `.msToNext()` — usar para mostrar "Next: tomorrow at 1:00 AM".
- [Source: engine/src/core/cron-scheduler.ts]

---

# Resumo das Stories

| ID | Story | Fase | Pontos | Prioridade |
|----|-------|------|--------|------------|
| 8.1 | Program Runner Core | 1 — Core Engine | 13 | Critical |
| 8.2 | Git Checkpoint Manager | 1 — Core Engine | 8 | Critical |
| 8.3 | Metric Evaluation Framework | 1 — Core Engine | 8 | Critical |
| 8.4 | Decision Journal (Experiment Ledger) | 2 — Intelligence | 5 | High |
| 8.5 | Convergence Engine + Budget Controller | 2 — Intelligence | 5 | High |
| 8.6 | Built-in Program Templates | 3 — Templates | 5 | High |
| 8.7 | Multi-Agent Program Pipelines | 3 — Templates | 8 | Medium |
| 8.8 | Overnight Programs View (Dashboard UI) | 4 — Dashboard | 13 | High |
| 8.9 | Experiment Analytics + History | 4 — Dashboard | 8 | Medium |
| 8.10 | Alert System + Error Recovery | 5 — Hardening | 8 | High |
| 8.11 | Cron Integration + Scheduling UI | 5 — Hardening | 5 | High |

**Total: 11 stories, 86 pontos**

---

## Dependencias entre Stories

```
FASE 1 (parallelizable)
  8.1 Program Runner ──────┐
  8.2 Git Checkpoint ──────┼──→ Integration (8.1 uses 8.2 + 8.3)
  8.3 Metric Evaluator ────┘
         │
         ▼
FASE 2 (sequential after Fase 1)
  8.4 Decision Journal ────┐
  8.5 Convergence Engine ──┼──→ Integration (8.1 uses 8.4 + 8.5)
         │                 │
         ▼                 │
FASE 3 (after Fase 2)      │
  8.6 Program Templates ◄──┘
  8.7 Multi-Agent Pipelines (after 8.6)
         │
         ▼
FASE 4 (after Fase 1, parallel with Fase 2-3)
  8.8 Dashboard UI (needs 8.1 API)
  8.9 Analytics (after 8.8 + 8.4)
         │
         ▼
FASE 5 (after all)
  8.10 Alert System (after 8.1 + 8.5)
  8.11 Cron Integration (after 8.1 + cron-scheduler.ts)
```

**Caminho critico:** 8.1 → 8.4 → 8.5 → 8.6 → 8.7

**Paralelizavel:** 8.2 e 8.3 podem ser desenvolvidas em paralelo com 8.1 (interfaces definidas upfront). 8.8 pode comecar assim que 8.1 tiver API funcional.

---

## Criterios de Done do Epic

- [ ] Program Runner executa loop autonomo completo (setup → iterate → converge)
- [ ] Git checkpoint cria branch, faz commit especulativo, reverte/mantém corretamente
- [ ] Metric evaluation funciona com pelo menos 3 metricas reais (bundle size, test count, type errors)
- [ ] Decision Journal persiste e gera summaries uteis para context injection
- [ ] Convergence Engine para execucao corretamente em todos os 5 cenarios
- [ ] Pelo menos 3 program templates testados end-to-end overnight (8+ horas)
- [ ] Dashboard mostra programas, iteracoes e metricas em tempo real
- [ ] Alerts funcionam via WebSocket + pelo menos 1 webhook externo
- [ ] Cron scheduling funciona com overlap detection
- [ ] Zero memory leaks em execucao prolongada (8+ horas)
- [ ] Documentacao: operation guide atualizado com secao "Overnight Programs"
- [ ] Testes: >80% coverage nos modulos core (program-runner, git-checkpoint, metric-evaluator, decision-journal, convergence-engine)
