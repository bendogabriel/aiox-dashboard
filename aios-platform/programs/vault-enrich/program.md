---
name: "Vault Enricher"
version: "1.0.0"
type: "vault-enrich"
squad_id: "operations"
agent_id: "analyst"

editable_scope:
  - ".aios/overnight/vault-enrich/output/**/*"
  - ".aios/vault/**/*.md"
  - ".aios/vault/**/*.yaml"
  - ".aios/vault/**/*.json"

readonly_scope:
  - "src/lib/domain-taxonomy.ts"
  - "src/types/**/*.ts"
  - "docs/**/*.md"
  - ".aios-core/templates/**/*"
  - ".aios-core/agents/**/*"
  - "package.json"

metric:
  command: "curl -s http://localhost:5174/api/vault/health 2>/dev/null | grep -oE '[0-9]+' | tail -1 || echo 0"
  extract: "last_number"
  direction: "maximize"
  baseline: null

budget:
  iteration_timeout_ms: 300000
  max_iterations: 25
  max_total_hours: 4
  max_tokens: 200000
  max_cost_usd: 5.00

convergence:
  stale_iterations: 5
  min_delta_percent: 0.5
  target_value: 100

git:
  branch_prefix: "overnight"
  commit_on_keep: false
  squash_on_complete: false
  auto_pr: false

schedule: "0 5 * * 3"
enabled: true
---

# Vault Enricher

## Objetivo

Melhorar a saude do vault do AIOS incrementalmente, identificando e preenchendo gaps nos dados do vault. O vault contem knowledge base, taxonomias, definicoes de agentes e metadados que alimentam o sistema de orquestracao. Cada iteracao deve aumentar o percentual de saude reportado pela API.

## Estrategia

1. **Diagnostico** — Consulte a API de saude do vault (`/api/vault/health`) para identificar o score atual e areas com gaps
2. **Identificacao de gaps** — Analise os arquivos do vault comparando contra a taxonomia de dominios (`domain-taxonomy.ts`) e definicoes de agentes em `.aios-core/agents/`
3. **Geracao de conteudo** — Crie ou enriqueca entradas do vault com dados estruturados: descricoes, metadados, relacoes e exemplos
4. **Validacao contra taxonomia** — Verifique que cada entrada gerada esta alinhada com os dominios, squads e tipos definidos na taxonomia
5. **Verificacao de saude** — Apos cada mudanca, re-consulte a API para confirmar melhoria no score

## Tipos de Enriquecimento Priorizados (em ordem de impacto)

1. **Entradas ausentes** — Criar entradas do vault para agentes, squads ou dominios que existem na taxonomia mas nao no vault
2. **Metadados incompletos** — Adicionar campos faltantes (descricao, tags, relacoes, exemplos) em entradas existentes
3. **Relacoes entre entradas** — Mapear dependencias e relacoes entre entradas do vault (agent -> squad, squad -> domain)
4. **Exemplos praticos** — Adicionar exemplos de uso, comandos e workflows relevantes a cada entrada
5. **Consistencia de formato** — Padronizar formato de entradas existentes para seguir o schema esperado

## Schema de Entrada do Vault

Cada entrada markdown deve seguir:

```yaml
---
id: "unique-kebab-case-id"
type: "agent|squad|domain|workflow|concept"
name: "Nome Legivel"
domain: "domain-id"
squad: "squad-id"
tags: ["tag1", "tag2"]
status: "complete|partial|stub"
related:
  - "other-entry-id"
---
```

Cada entrada JSON/YAML deve conter no minimo: `id`, `type`, `name`, `description`, `tags`.

## Regras

- NUNCA remova ou sobrescreva dados existentes no vault — apenas adicione ou enriqueca
- NUNCA crie entradas duplicadas — verifique por `id` antes de criar
- NUNCA invente taxonomias ou dominios que nao existem em `domain-taxonomy.ts`
- Cada iteracao deve focar em UMA entrada ou UM tipo de enriquecimento (atomicidade)
- Mantenha consistencia de formato entre todas as entradas
- Se a API de saude nao estiver disponivel, use a contagem de arquivos com `status: complete` como metrica alternativa
- Consulte o Experiment History para evitar retrabalho em entradas ja enriquecidas

## Fallback de Metrica

Se a API nao responder, use esta metrica alternativa:
```bash
grep -rl 'status: "complete"' .aios/vault/ 2>/dev/null | wc -l
```

## Formato da Resposta

Comece SEMPRE com:
```
Hypothesis: Enrich vault [entry type] for [id/name] by adding [missing data]
```

Depois implemente a mudanca no vault.
