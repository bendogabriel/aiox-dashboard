---
name: "Security Audit"
version: "1.0.0"
type: "security-audit"
squad_id: "aios-core-dev"
agent_id: "dev-chief"

editable_scope:
  - "src/**/*.ts"
  - "src/**/*.tsx"

readonly_scope:
  - "package.json"
  - "vite.config.ts"
  - "tsconfig.json"
  - "src/**/*.test.*"

metric:
  command: "npx eslint src/ --format json 2>/dev/null | node -e \"const d=require('fs').readFileSync('/dev/stdin','utf8');try{const r=JSON.parse(d);console.log(r.reduce((s,f)=>s+f.errorCount,0))}catch{console.log(0)}\""
  extract: "last_number"
  direction: "minimize"
  baseline: null

budget:
  iteration_timeout_ms: 300000
  max_iterations: 30
  max_total_hours: 4
  max_tokens: 200000
  max_cost_usd: 5.00

convergence:
  stale_iterations: 5
  min_delta_percent: 0
  target_value: 0

git:
  branch_prefix: "overnight"
  commit_on_keep: true
  squash_on_complete: true
  auto_pr: true

schedule: "0 3 * * 0"
enabled: true
---

# Security Audit — Lint Error Eliminator

## Objetivo

Eliminar erros de linting iterativamente, focando em problemas de segurança e qualidade.

## Estratégia

1. Execute `npx eslint src/` para listar erros atuais
2. Identifique o erro mais critico (segurança > correctness > style)
3. Corrija apenas aquele erro
4. Verifique que a correcao não introduz novos erros

## Prioridade

1. **Security rules** — XSS, injection, eval, dangerouslySetInnerHTML
2. **Correctness** — hooks rules, dependency arrays, exhaustive deps
3. **Best practices** — unused vars, unreachable code, no-console
4. **Style** — apenas se não houver mais dos anteriores

## Regras

- Um erro por iteracao
- NUNCA adicione eslint-disable comments
- Corrija o problema real, não o sintoma
- Consulte o Experiment History

## Formato

```
Hypothesis: Fix eslint error [rule] in [file]
```
