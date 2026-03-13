# Plano de Implementação — Pesquisa de Mercado Completa

**Autor:** Dex, Full-Stack Developer | **Data:** 2026-03-12
**Base:** Análise do Architect (Aria) | **Complexidade:** 14/25 (STANDARD)

---

## Resumo Executivo

| Deliverable | Fase | Dependência | Output |
|-------------|------|-------------|--------|
| Análise de Concorrentes | 1 | Nenhuma | `docs/market-research/01-competitive-analysis.md` |
| Identificação de Gaps | 2 | Fase 1 | `docs/market-research/02-gap-analysis.md` |
| Definição de Personas | 3 | Fases 1+2 | `docs/market-research/03-personas.md` |
| Proposta de Posicionamento | 4 | Fases 1+2+3 | `docs/market-research/04-positioning.md` |
| Relatório Consolidado | 5 | Todas | `docs/market-research/00-executive-summary.md` |

---

## Estrutura de Arquivos

### Arquivos a Criar

```
docs/market-research/
├── 00-executive-summary.md          ← Relatório consolidado (escrito por último)
├── 01-competitive-analysis.md       ← Mapeamento de concorrentes
├── 02-gap-analysis.md               ← Feature matrix + gaps identificados
├── 03-personas.md                   ← 3-5 personas com JTBD
├── 04-positioning.md                ← Value proposition + messaging
├── appendices/
│   ├── A-data-sources.md            ← Fontes utilizadas na pesquisa
│   ├── B-feature-matrix.md          ← Tabela comparativa detalhada
│   └── C-competitor-profiles.md     ← Perfis expandidos de concorrentes
└── assets/
    ├── positioning-map.md           ← Mapa de posicionamento (texto/ASCII)
    └── market-landscape.md          ← Visão geral do landscape
```

### Arquivos Existentes para Referência

| Arquivo | Uso |
|---------|-----|
| `docs/PRD-DASHBOARD-REWRITE.md` | Entender feature set atual do AIOS |
| `docs/PRD-AGENT-EXECUTION-ENGINE.md` | Capacidades técnicas do engine |
| `docs/PRD-MARKETPLACE.md` | Modelo de marketplace planejado |
| `docs/EPIC-OVERNIGHT-PROGRAMS.md` | Diferencial de programas autônomos |
| `.aios-core/product/templates/market-research-tmpl.yaml` | Template de referência |

---

## Tecnologias e Ferramentas

| Ferramenta | Uso |
|------------|-----|
| Perplexity (MCP) | Pesquisa de dados de mercado, pricing, features de concorrentes |
| Tavily (MCP) | Crawl de documentações públicas, changelogs, blogs de concorrentes |
| Web Search/Fetch | Dados complementares, press releases, funding rounds |
| Markdown | Formato de todos os deliverables |
| Mermaid diagrams | Diagramas de positioning map e market landscape (inline em MD) |

---

## Fase 1 — Análise de Concorrentes

**Output:** `docs/market-research/01-competitive-analysis.md`

### 1.1 Identificação de Players

**Concorrentes Diretos** (AI-orchestrated development platforms):
- Cursor (Anysphere)
- Windsurf (Codeium)
- Devin (Cognition)
- Replit Agent
- GitHub Copilot Workspace
- Bolt.new / StackBlitz
- v0 by Vercel

**Concorrentes Indiretos** (AI coding assistants / IDEs):
- GitHub Copilot (standalone)
- Amazon CodeWhisperer / Q Developer
- Tabnine
- Cody (Sourcegraph)
- Continue.dev
- Aider

**Adjacentes** (plataformas de orquestração AI):
- CrewAI
- AutoGen (Microsoft)
- LangGraph
- Semantic Kernel

### 1.2 Pesquisa por Concorrente

Para cada player, coletar via Perplexity/Tavily:

| Dimensão | Dados a Coletar |
|----------|----------------|
| **Overview** | Fundação, funding, team size, valuation |
| **Produto** | Core features, modelo de pricing, stack técnica |
| **Target** | Segmento alvo, empresa/indie/enterprise |
| **GTM** | Canais de aquisição, modelo freemium/paid |
| **Diferenciação** | USP declarada, posicionamento de marketing |
| **Traction** | Users estimados, revenue (se público), crescimento |
| **Limitações** | Reclamações comuns, gaps conhecidos, reviews negativos |

### 1.3 Estrutura do Documento

```markdown
# Análise Competitiva — AIOS Platform

## Market Structure
- Número de players, concentração, intensidade competitiva
- Estágio do ciclo de adoção (Technology Adoption Lifecycle)

## Porter's Five Forces
- Supplier Power (LLM providers: OpenAI, Anthropic, Google)
- Buyer Power (developers, enterprises)
- Competitive Rivalry
- Threat of New Entry
- Threat of Substitutes

## Perfil de Concorrentes
### [Player Name]
- **Overview:** ...
- **Core Features:** ...
- **Pricing:** ...
- **Target Segment:** ...
- **Strengths:** ...
- **Weaknesses:** ...
- **Market Share Estimate:** ...

## Feature Matrix (resumo — completa em Appendix B)
| Feature | AIOS | Cursor | Windsurf | Devin | ... |
```

### Testes/Validação

- [ ] Mínimo 7 concorrentes diretos perfilados
- [ ] Mínimo 4 concorrentes indiretos perfilados
- [ ] Porter's Five Forces com evidências concretas
- [ ] Feature matrix com ≥15 dimensões comparadas
- [ ] Todas as fontes listadas em `appendices/A-data-sources.md`
- [ ] Dados verificados em pelo menos 2 fontes independentes

---

## Fase 2 — Identificação de Gaps

**Output:** `docs/market-research/02-gap-analysis.md`
**Dependência:** Fase 1 completa

### 2.1 Feature Matrix Detalhada

Construir em `appendices/B-feature-matrix.md` com categorias:

| Categoria | Dimensões |
|-----------|-----------|
| **Orquestração** | Multi-agent, squad system, delegation protocol, workflow engine |
| **Código** | Code gen, code review, refactoring, debugging, testing |
| **Integração** | Git, CI/CD, cloud deploy, DBs, APIs externas |
| **Colaboração** | Real-time, multiplayer, handoff, context sharing |
| **Autonomia** | Overnight programs, cron jobs, autonomous execution |
| **Marketplace** | Plugins, templates, agent marketplace |
| **Enterprise** | SSO, RBAC, audit log, compliance, on-prem |
| **UX** | IDE integration, web UI, CLI, voice mode |
| **AI Model** | Multi-model, model switching, fine-tuning, local models |
| **Observability** | Execution logs, cost tracking, performance metrics |

### 2.2 Análise de Gaps

```markdown
# Gap Analysis — Oportunidades de Mercado

## Gaps Não Atendidos (ninguém faz)
### Gap 1: [Nome]
- **Descrição:** O que falta no mercado
- **Evidência:** Por que sabemos que falta (dados da Fase 1)
- **Tamanho da oportunidade:** Impacto potencial
- **AIOS fit:** Como AIOS pode preencher

## Gaps Parcialmente Atendidos (poucos fazem, mal)
### Gap N: [Nome]
- ...

## Diferenciadores AIOS Existentes
- Multi-agent squads com personas especializadas
- Overnight autonomous programs
- Agent marketplace (two-sided)
- Story-driven development workflow
- Constitutional AI governance (authority matrix)

## Mapa de Posicionamento
(Mermaid quadrant chart: Autonomia vs. Especialização)
```

### Testes/Validação

- [ ] Feature matrix com ≥10 categorias × ≥7 concorrentes
- [ ] Mínimo 5 gaps identificados com evidência
- [ ] Cada gap tem score de oportunidade (1-5: tamanho × viabilidade)
- [ ] Diferenciadores AIOS mapeados contra gaps
- [ ] Mapa de posicionamento visual (quadrant chart)

---

## Fase 3 — Definição de Personas

**Output:** `docs/market-research/03-personas.md`
**Dependência:** Fases 1+2 completas

### 3.1 Personas Primárias (3-5)

Para cada persona, documentar:

```markdown
## Persona: [Nome Fictício] — [Título]

### Demographics
- **Role:** Senior Developer / Tech Lead / CTO / Solo Founder / ...
- **Company size:** Startup (1-10) / Scale-up (10-50) / Enterprise (50+)
- **Experience:** Junior / Mid / Senior / Staff+
- **AI adoption:** Early adopter / Pragmatist / Late majority

### Jobs-to-be-Done
#### Functional Jobs
1. [What they need to accomplish]

#### Emotional Jobs
1. [How they want to feel]

#### Social Jobs
1. [How they want to be perceived]

### Pain Points
1. [Current frustration with existing tools]
2. ...

### Decision Drivers
- **Must-have:** [Non-negotiable features]
- **Nice-to-have:** [Differentiators that tip the scale]
- **Deal-breaker:** [What makes them reject a tool]

### Current Stack
- IDE: [e.g., VS Code, JetBrains]
- AI tools: [e.g., Copilot, ChatGPT]
- Workflow: [e.g., Jira, Linear, manual]

### Customer Journey
1. **Awareness:** Como descobre novas ferramentas
2. **Consideration:** Critérios de avaliação
3. **Purchase:** Gatilhos de decisão
4. **Onboarding:** Expectativas iniciais
5. **Retention:** O que os mantém usando
6. **Advocacy:** O que os faz recomendar
```

### 3.2 Personas Sugeridas (validar com pesquisa)

| # | Persona | Segmento | Prioridade |
|---|---------|----------|------------|
| 1 | **Solo Tech Founder** | Startup 1-5 pessoas, precisa de alavancagem máxima | P0 |
| 2 | **Tech Lead** | Scale-up 10-50, gerencia squad + precisa de consistência | P0 |
| 3 | **Enterprise Architect** | Enterprise 100+, foco em governance + compliance | P1 |
| 4 | **AI-First Developer** | Freelancer/indie, early adopter, power user | P1 |
| 5 | **Non-Technical Founder** | Startup, quer build sem saber code | P2 |

### Testes/Validação

- [ ] 3-5 personas documentadas com todos os campos
- [ ] Cada persona tem ≥3 JTBD (functional, emotional, social)
- [ ] Pain points validados contra dados de Fase 1 (reviews, reclamações)
- [ ] Customer journey mapeado para cada persona
- [ ] Personas cobrem ≥80% do SAM estimado
- [ ] Nenhuma persona inventada — todas baseadas em evidência de mercado

---

## Fase 4 — Proposta de Posicionamento

**Output:** `docs/market-research/04-positioning.md`
**Dependência:** Fases 1+2+3 completas

### 4.1 Value Proposition Canvas

```markdown
# Value Proposition Canvas — AIOS Platform

## Customer Profile (per persona)
### Jobs
- [From persona JTBD]

### Pains
- [From persona pain points]

### Gains
- [From persona decision drivers]

## Value Map
### Products & Services
- Multi-agent orchestration platform
- Agent marketplace
- Overnight autonomous programs
- Story-driven development

### Pain Relievers
- [How AIOS solves each pain]

### Gain Creators
- [How AIOS enables each gain]

## Fit Assessment
- [Problem-Solution Fit score per persona]
```

### 4.2 Positioning Statement

```
Para [target persona],
que precisa [primary JTBD],
AIOS é a [category]
que [key differentiator],
diferente de [primary competitor],
porque [reason to believe].
```

### 4.3 Messaging Framework

```markdown
## Messaging Hierarchy

### Brand Promise
[One sentence — what AIOS fundamentally promises]

### Value Pillars (3-4)
#### Pillar 1: [Name]
- **Headline:** [7-10 words]
- **Subhead:** [15-20 words]
- **Proof Points:** [3 bullets with evidence]
- **Persona fit:** [Which personas this resonates with]

### Messaging by Persona
| Persona | Primary Message | Secondary Message | CTA |
|---------|----------------|-------------------|-----|

### Competitive Messaging
| vs. Competitor | Our Advantage | Their Advantage | Talking Point |
|---------------|---------------|-----------------|---------------|
```

### 4.4 GTM Implications

```markdown
## Go-to-Market Recommendations

### Segment Prioritization
1. [Primary segment + rationale]
2. [Secondary segment + rationale]

### Channel Strategy
- **Primary:** [e.g., developer communities, Twitter/X, YouTube]
- **Secondary:** [e.g., enterprise sales, partnerships]

### Pricing Implications
- [Based on willingness-to-pay per persona + competitive pricing]

### Partnership Opportunities
- [Based on gap analysis + ecosystem mapping]
```

### Testes/Validação

- [ ] Value Proposition Canvas para cada persona P0
- [ ] Positioning statement segue formato "Para X que Y, AIOS é Z"
- [ ] Messaging framework com ≥3 value pillars
- [ ] Cada pillar tem ≥3 proof points verificáveis
- [ ] Competitive messaging para top 3 concorrentes
- [ ] GTM recommendations baseadas em dados (não opinião)

---

## Fase 5 — Consolidação

**Output:** `docs/market-research/00-executive-summary.md`
**Dependência:** Fases 1-4 completas

### Estrutura

```markdown
# Pesquisa de Mercado — AIOS Platform
## Executive Summary

### Landscape
[2-3 parágrafos: estado do mercado, players, tendências]

### Oportunidade
[2-3 parágrafos: gaps identificados, tamanho, timing]

### Target
[1-2 parágrafos: personas prioritárias, TAM/SAM/SOM]

### Posicionamento Recomendado
[Positioning statement + value pillars resumidos]

### Próximos Passos
1. [Ação 1 — responsável — prazo]
2. [Ação 2]
3. [Ação 3]

### Riscos e Mitigações
| Risco | Probabilidade | Impacto | Mitigação |
```

### Testes/Validação

- [ ] Executive summary ≤2 páginas
- [ ] Todas as afirmações rastreáveis a dados das Fases 1-4
- [ ] TAM/SAM/SOM estimados (top-down + bottom-up)
- [ ] Próximos passos acionáveis com responsáveis
- [ ] Revisão cruzada: nenhuma afirmação sem evidência

---

## Ordem de Execução

```
Fase 1 — Análise de Concorrentes
  ├── 1.1 Identificar players (diretos + indiretos + adjacentes)
  ├── 1.2 Pesquisar cada player (Perplexity + Tavily + Web)
  └── 1.3 Redigir 01-competitive-analysis.md + appendices

Fase 2 — Identificação de Gaps (depende da Fase 1)
  ├── 2.1 Construir feature matrix detalhada
  ├── 2.2 Identificar gaps + scoring
  └── 2.3 Redigir 02-gap-analysis.md + positioning map

Fase 3 — Definição de Personas (depende das Fases 1+2)
  ├── 3.1 Definir 3-5 personas com JTBD
  ├── 3.2 Validar contra dados de mercado
  └── 3.3 Redigir 03-personas.md

Fase 4 — Proposta de Posicionamento (depende das Fases 1+2+3)
  ├── 4.1 Value Proposition Canvas
  ├── 4.2 Positioning statement
  ├── 4.3 Messaging framework
  └── 4.4 Redigir 04-positioning.md

Fase 5 — Consolidação (depende de todas)
  └── 5.1 Redigir 00-executive-summary.md
```

---

## Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|:------------:|:-------:|-----------|
| Dados de concorrentes desatualizados | Alta | Médio | Timestamp em cada dado; marcar "as of YYYY-MM" |
| Viés de confirmação | Média | Alto | Incluir seção "O que concorrentes fazem melhor" |
| Mercado muda durante pesquisa | Alta | Baixo | Estrutura modular — atualizar seção afetada |
| Persona fictícia sem base em dados | Média | Alto | Cada atributo deve citar fonte da Fase 1 |
| Scope creep (análise infinita) | Média | Médio | Limitar a 7 concorrentes diretos, 4 indiretos |

---

## Critérios de Aceitação

- [ ] 4 documentos principais + executive summary redigidos
- [ ] Feature matrix com ≥10 categorias × ≥7 concorrentes
- [ ] 3-5 personas com JTBD, pain points e customer journey
- [ ] Positioning statement validado contra gaps e personas
- [ ] Messaging framework com ≥3 value pillars e proof points
- [ ] Todas as fontes documentadas em `appendices/A-data-sources.md`
- [ ] Executive summary ≤2 páginas, 100% rastreável
- [ ] Nenhuma afirmação inventada — tudo baseado em dados coletados

---

*Plano gerado por Dex (@dev) com base na análise de Aria (@architect) — 2026-03-12*
*Template ref: `.aios-core/product/templates/market-research-tmpl.yaml`*
