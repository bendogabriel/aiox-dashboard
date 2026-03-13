---
name: "QA Sweep"
version: "1.0.0"
type: "qa-sweep"
squad_id: "full-stack-dev"
agent_id: "qa-chief"

editable_scope:
  - "src/**/*.ts"
  - "src/**/*.tsx"
  - "src/**/*.test.*"

readonly_scope:
  - "package.json"
  - "vite.config.ts"
  - "tsconfig.json"

metric:
  command: "npx tsc --noEmit 2>&1 | grep -c 'error TS' || echo 0"
  extract: "last_number"
  direction: "minimize"
  baseline: null

budget:
  iteration_timeout_ms: 300000
  max_iterations: 30
  max_total_hours: 6
  max_tokens: 300000
  max_cost_usd: 8.00

convergence:
  stale_iterations: 5
  min_delta_percent: 0
  target_value: 0

git:
  branch_prefix: "overnight"
  commit_on_keep: true
  squash_on_complete: true
  auto_pr: true

schedule: "0 2 * * 1-5"
enabled: true
---

# QA Sweep — Type Error Eliminator

## Objetivo

Eliminar todos os erros de tipo TypeScript do codebase, um por vez.

## Estratégia

1. Execute `npx tsc --noEmit` para listar erros atuais
2. Identifique o erro MAIS SIMPLES de corrigir
3. Corrija apenas AQUELE erro (uma mudança atomica)
4. Verifique que a correcao não introduz novos erros

## Prioridade de Correcao

1. **Missing types** — adicionar tipo onde esta faltando
2. **Incorrect types** — corrigir tipo errado
3. **Unused variables** — remover variaveis não usadas
4. **Implicit any** — adicionar tipos explicitos
5. **Null checks** — adicionar null guards onde necessário

## Regras

- APENAS um erro por iteracao
- NUNCA use `@ts-ignore` ou `@ts-nocheck`
- NUNCA use `as any` para esconder erros
- Prefira correcoes que melhoram a type safety real
- Consulte o Experiment History para não repetir tentativas

## Formato

```
Hypothesis: Fix TS error in [file]: [error description]
```
