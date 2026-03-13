---
name: "Content Generator"
version: "1.0.0"
type: "content-generate"
squad_id: "content"
agent_id: "copywriter"

editable_scope:
  - ".aios/overnight/content-generate/output/**/*.md"

readonly_scope:
  - "docs/**/*.md"
  - "src/lib/domain-taxonomy.ts"
  - ".aios-core/templates/**/*"
  - "package.json"

metric:
  command: "find .aios/overnight/content-generate/output -name \"*.md\" 2>/dev/null | wc -l"
  extract: "last_number"
  direction: "maximize"
  baseline: null

budget:
  iteration_timeout_ms: 300000
  max_iterations: 40
  max_total_hours: 6
  max_tokens: 400000
  max_cost_usd: 8.00

convergence:
  stale_iterations: 5
  min_delta_percent: 0
  target_value: null

git:
  branch_prefix: "overnight"
  commit_on_keep: false
  squash_on_complete: false
  auto_pr: false

schedule: "0 4 * * 1"
enabled: true
---

# Content Generator

## Objetivo

Gerar conteudo estruturado em markdown para o AIOS Platform, cobrindo documentacao tecnica, guias de uso, artigos de blog e material educacional. Cada iteracao produz um arquivo markdown completo no diretorio de output.

## Estrategia

1. **Pesquisa de topico** — Analise o codebase, PRDs e documentacao existente para identificar gaps de conteudo ou topicos relevantes
2. **Planejamento** — Defina outline com titulo, secoes e publico-alvo antes de escrever
3. **Geracao** — Produza o markdown completo com frontmatter, headings estruturados e exemplos praticos
4. **Validacao de qualidade** — Verifique que o conteudo tem minimo 500 palavras, estrutura coerente e nenhum placeholder generico
5. **Salve o arquivo** — Grave em `.aios/overnight/content-generate/output/` com nome descritivo em kebab-case

## Tipos de Conteudo Priorizados (em ordem)

1. **Guias de usuario** — Como usar features do AIOS Platform (agents, workflows, orchestration)
2. **Documentacao tecnica** — Arquitetura, APIs, integracao com Supabase, stores Zustand
3. **Tutoriais** — Passo-a-passo para tarefas comuns (criar story, executar workflow, configurar squad)
4. **Artigos conceituais** — Explicacao de conceitos do AIOS (agent personas, story-driven development, overnight programs)
5. **Changelogs e release notes** — Resumos de mudancas recentes baseados no git log

## Regras

- NUNCA produza conteudo generico ou superficial — cada arquivo deve ter valor pratico
- NUNCA repita conteudo ja existente em `docs/` — verifique antes de escrever
- NUNCA use placeholder text como "Lorem ipsum" ou "TODO: add content"
- Cada arquivo deve ter frontmatter YAML com: title, date, category, tags
- Use linguagem clara e direta, com exemplos de codigo quando relevante
- Mantenha consistencia de tom: tecnico mas acessivel
- Consulte o Experiment History para evitar gerar topicos ja cobertos
- Se um topico ja foi gerado, escolha um novo ou aprofunde um subtopico diferente

## Formato de Frontmatter

Cada arquivo gerado deve comecar com:

```yaml
---
title: "Titulo do Conteudo"
date: "YYYY-MM-DD"
category: "guide|tutorial|reference|concept|changelog"
tags: ["tag1", "tag2"]
word_count: N
---
```

## Formato da Resposta

Comece SEMPRE com:
```
Hypothesis: Generate [type] about [topic] targeting [audience]
```

Depois crie o arquivo markdown completo.
