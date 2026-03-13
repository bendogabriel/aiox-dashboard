---
name: "Bundle Size Optimizer"
version: "1.0.0"
type: "code-optimize"
squad_id: "full-stack-dev"
agent_id: "dev-chief"

editable_scope:
  - "src/components/**/*.tsx"
  - "src/components/**/*.ts"
  - "src/lib/**/*.ts"
  - "src/hooks/**/*.ts"
  - "src/stores/**/*.ts"

readonly_scope:
  - "src/**/*.test.*"
  - "src/**/*.spec.*"
  - "package.json"
  - "package-lock.json"
  - "vite.config.ts"
  - "tsconfig.json"
  - "tailwind.config.*"

metric:
  command: "npx vite build 2>&1 | tail -20"
  extract: "regex"
  pattern: "Total size:\\s+([\\d.]+)\\s+kB"
  direction: "minimize"
  baseline: null

budget:
  iteration_timeout_ms: 300000
  max_iterations: 50
  max_total_hours: 8
  max_tokens: 500000
  max_cost_usd: 10.00

convergence:
  stale_iterations: 5
  min_delta_percent: 0.1
  target_value: null

git:
  branch_prefix: "overnight"
  commit_on_keep: true
  squash_on_complete: true
  auto_pr: false

schedule: "0 1 * * 1-5"
enabled: true
---

# Bundle Size Optimizer

## Objetivo

Reduzir o bundle size do dashboard AIOS iterativamente, mantendo funcionalidade e testes passando.

## Estratégia

1. Análise o bundle atual com `npx vite build`
2. Identifique o maior contributor para o tamanho
3. Aplique UMA otimizacao por iteracao (apenas uma mudança atomica)
4. Garanta que o codigo continua compilando sem erros
5. Se o bundle diminuiu, a mudança será mantida. Se aumentou, será revertida automaticamente.

## Técnicas Priorizadas (em ordem de impacto)

1. **Remove unused imports** — imports que não são usados no arquivo
2. **Tree-shake barrel exports** — substituir `import { X } from './index'` por import direto do arquivo
3. **Lazy-load heavy components** — usar `React.lazy()` para componentes pesados não vistos na carga inicial
4. **Code-split routes** — garantir que cada view usa `lazy()` no App.tsx
5. **Extract shared constants** — mover constantes duplicadas para arquivo compartilhado
6. **Remove dead code** — funções, componentes ou variaveis exportadas mas nunca importadas

## Regras Inviolaveis

- NUNCA remova funcionalidade visível ao usuario
- NUNCA quebre a compilacao TypeScript (`npx tsc --noEmit` deve passar)
- APENAS uma mudança por iteracao (atomicidade)
- NUNCA modifique testes, configuracoes de build, ou package.json
- Consulte o Experiment History para evitar repetir tentativas já feitas
- Se uma estratégia já foi tentada 3+ vezes sem melhoria, mude de estratégia

## Anti-patterns (evitar)

- Não comprima codigo manualmente (minification e responsabilidade do bundler)
- Não remova type imports (TypeScript os elimina automaticamente no build)
- Não mova codigo entre arquivos sem motivo claro de redução
- Não adicione novas dependencias
- Não crie abstractions desnecessarias "para reduzir codigo"

## Formato da Resposta

Comece SEMPRE com:
```
Hypothesis: [descricao clara do que voce vai mudar e por que]
```

Depois implemente a mudança.
