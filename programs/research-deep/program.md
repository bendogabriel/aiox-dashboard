---
name: "Deep Research"
version: "1.0.0"
type: "research"
squad_id: "analytics"
agent_id: "analyst"

editable_scope:
  - ".aios/overnight/research-deep/output/**/*"

readonly_scope:
  - "docs/**/*.md"
  - "docs/prd/**/*"
  - "docs/architecture/**/*"
  - "src/lib/domain-taxonomy.ts"
  - "src/types/**/*.ts"
  - "package.json"
  - ".aios-core/**/*"

metric:
  command: "wc -w .aios/overnight/research-deep/output/report.md 2>/dev/null | awk '{print $1}'"
  extract: "last_number"
  direction: "maximize"
  baseline: null

budget:
  iteration_timeout_ms: 600000
  max_iterations: 30
  max_total_hours: 8
  max_tokens: 600000
  max_cost_usd: 15.00

convergence:
  stale_iterations: 4
  min_delta_percent: 1.0
  target_value: null

git:
  branch_prefix: "overnight"
  commit_on_keep: false
  squash_on_complete: false
  auto_pr: false

schedule: null
enabled: true
---

# Deep Research

## Objetivo

Conduzir pesquisa aprofundada sobre um topico especificado, compilando descobertas em um relatorio unico e abrangente em `.aios/overnight/research-deep/output/report.md`. O relatorio cresce iterativamente — cada iteracao adiciona uma secao nova ou aprofunda uma existente.

## Estrategia

1. **Busca inicial** — Identifique fontes primarias: codebase existente, PRDs, documentacao de arquitetura, e padroes do framework AIOS
2. **Compilacao de achados** — Extraia fatos, metricas, padroes e anti-patterns relevantes ao topico
3. **Referencia cruzada** — Valide cada achado contra pelo menos duas fontes distintas; marque achados nao confirmados como "[UNVERIFIED]"
4. **Sintese** — Organize achados em narrativa coerente com conclusoes acionaveis e recomendacoes priorizadas
5. **Expansao iterativa** — A cada iteracao, adicione uma nova secao ou enriqueca uma existente com mais profundidade, dados ou exemplos

## Estrutura do Relatorio

O arquivo `report.md` deve seguir esta estrutura progressiva:

```markdown
---
title: "Deep Research: [Topic]"
date: "YYYY-MM-DD"
status: "in-progress|complete"
iterations: N
total_sources: N
---

# [Topic] — Deep Research Report

## Executive Summary
[Atualizado a cada iteracao com as conclusoes mais recentes]

## 1. Contexto e Motivacao
[Por que esta pesquisa e relevante]

## 2. Metodologia
[Fontes consultadas, criterios de validacao]

## 3. Achados Principais
### 3.1 [Subtopico A]
### 3.2 [Subtopico B]
### 3.N [Subtopico N]

## 4. Analise Comparativa
[Quando aplicavel — comparacao entre abordagens, ferramentas, padroes]

## 5. Riscos e Limitacoes
[O que nao foi coberto, vieses identificados, gaps de dados]

## 6. Recomendacoes
[Lista priorizada de acoes sugeridas com justificativa]

## 7. Fontes e Referencias
[Lista numerada de todas as fontes consultadas]

## Appendix
[Dados brutos, tabelas, diagramas de suporte]
```

## Regras

- NUNCA invente dados ou estatisticas — use apenas informacao verificavel no codebase ou fontes acessiveis
- NUNCA produza analise superficial — cada secao deve ter profundidade suficiente para ser acionavel
- Marque claramente qualquer informacao nao verificada com "[UNVERIFIED]"
- Cada iteracao deve adicionar no minimo 200 palavras ao relatorio
- Atualize o Executive Summary a cada iteracao para refletir o estado atual
- Atualize o frontmatter `iterations` e `total_sources` a cada iteracao
- Mantenha a numeracao de fontes consistente ao longo do relatorio
- Se o topico for muito amplo, proponha recorte e documente os subtopicos descartados em "Riscos e Limitacoes"
- Consulte o Experiment History para evitar retrabalho em secoes ja completas

## Anti-patterns (evitar)

- Nao copie texto de fontes sem parafrasear e atribuir
- Nao repita a mesma informacao em secoes diferentes
- Nao use jargao sem definicao na primeira ocorrencia
- Nao deixe secoes com apenas headers vazios — preencha ou marque como "[PENDING]"
- Nao ignore contradicoes entre fontes — documente e analise

## Formato da Resposta

Comece SEMPRE com:
```
Hypothesis: Research [subtopic] to expand section [N] with [type of content]
```

Depois edite o `report.md` com o conteudo novo ou expandido.
