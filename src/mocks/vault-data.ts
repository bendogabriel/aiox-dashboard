import type { VaultWorkspace, VaultDocument, VaultActivity } from '../types/vault';

// ── Mock Documents ──

export const MOCK_DOCUMENTS: VaultDocument[] = [
  {
    id: 'doc-dna-founder',
    name: 'DNA do Founder',
    type: 'diagnostic',
    content: `# DNA do Founder — Alan Nicolas

## Perfil
Empreendedor serial com mais de 15 anos de experiência em tecnologia e marketing digital.
Fundador da AIOX Academy e criador do framework AIOS.

## Valores Core
- Excelência técnica acima de tudo
- Dados antes de opinião
- Velocidade com qualidade
- Comunidade como motor de crescimento

## Estilo de Liderança
- Hands-on em tecnologia
- Decisões baseadas em dados
- Iteração rápida com feedback constante
- Transparência radical com o time

## Background Técnico
- Engenharia de software
- AI/ML aplicado a negócios
- Marketing de performance
- Arquitetura de sistemas distribuídos`,
    status: 'validated',
    tokenCount: 847,
    source: 'Manual',
    taxonomy: 'context.company.founder',
    consumers: ['copywriter', 'cmo', 'ceo'],
    lastUpdated: '2026-03-08T14:00:00Z',
    categoryId: 'company',
    workspaceId: 'ws-aiox',
  },
  {
    id: 'doc-credentials',
    name: 'Credenciais da Empresa',
    type: 'generic',
    content: `# Credenciais — AIOX

## Números
- 847+ alunos certificados
- NPS 72
- 14 segmentos atendidos
- 3 anos de operação

## Reconhecimentos
- Top 10 EdTech AI Brasil 2024
- Case destaque no AWS Summit
- Parceiro oficial Anthropic

## Clientes Notáveis
- Empresas com faturamento > R$1M/ano
- Startups série A-C
- Consultorias de gestão`,
    status: 'validated',
    tokenCount: 423,
    source: 'Google Drive',
    taxonomy: 'context.company.credentials',
    consumers: ['copywriter', 'sales'],
    lastUpdated: '2026-03-05T10:00:00Z',
    categoryId: 'company',
    workspaceId: 'ws-aiox',
  },
  {
    id: 'doc-offerbook-aex',
    name: 'Offerbook — AEX Pro',
    type: 'offerbook',
    content: `# AEX Pro — Offerbook

## Proposta de Valor
O AEX Pro é a plataforma definitiva para empresários que querem escalar operações com AI. Combina framework de agentes, workspace de dados e sistema de squads em uma solução integrada.

## Público-Alvo
- Empresários com 3+ funcionários
- Faturamento > R$50k/mês
- Já tentaram usar AI mas sem estrutura
- Buscam automação de processos repetitivos

## Sinais de Adoção
- Procura por "automação com AI"
- Insatisfação com ChatGPT genérico
- Necessidade de consistência nos outputs
- Time crescendo e processos desorganizados

## Pricing
- Enterprise: Implementação customizada
- Pro: R$297/mês
- Starter: R$97/mês

## Diferenciação
- Único framework com agentes especializados por squad
- Context engineering proprietário
- Workspace de dados canônicos
- Comunidade ativa de +800 membros`,
    status: 'validated',
    tokenCount: 1247,
    source: 'ETL Agent',
    taxonomy: 'context.product.offer',
    consumers: ['copywriter', 'cmo', 'sales'],
    lastUpdated: '2026-03-09T16:30:00Z',
    categoryId: 'products',
    workspaceId: 'ws-aiox',
  },
  {
    id: 'doc-proofs-aex',
    name: 'Provas — AEX Pro',
    type: 'proof',
    content: `# Provas de Autoridade — AEX Pro

## Depoimentos Selecionados

### João M. — CEO, TechScale
"Em 3 meses, automatizamos 60% do nosso marketing de conteúdo. O ROI foi absurdo."
- Nota: 9/10
- Uso: Ads, Landing Pages, Email

### Maria S. — Founder, DigitalBoost
"O framework de squads mudou completamente como meu time opera. Cada agente sabe exatamente o que fazer."
- Nota: 10/10
- Uso: Full Stack

### Carlos R. — CMO, GrowthCo
"A qualidade das copies melhorou 300% depois que estruturamos o workspace."
- Nota: 8/10
- Uso: Copywriting, Campaigns

## Métricas Compiladas
- Satisfação média: 9.1/10
- Tempo médio para primeiro resultado: 7 dias
- Taxa de renovação: 89%`,
    status: 'validated',
    tokenCount: 634,
    source: 'Google Drive',
    taxonomy: 'context.product.proof',
    consumers: ['copywriter', 'sales'],
    lastUpdated: '2026-03-07T11:00:00Z',
    categoryId: 'products',
    workspaceId: 'ws-aiox',
  },
  {
    id: 'doc-brand-book',
    name: 'Brand Book',
    type: 'brand',
    content: `# AIOX Brand Book

## Identidade Visual
- Cor primária: Neon Lime #D1FF00
- Background: Near Black #050505
- Font display: TASA Orbiter Display
- Font body: Roboto Mono

## Tom de Voz
- Técnico mas acessível
- Direto, sem enrolação
- Confiante sem ser arrogante
- Data-driven em todas as afirmações

## Personalidade da Marca
- Inovadora: sempre na fronteira da tecnologia
- Pragmática: resultados > teoria
- Comunitária: crescemos juntos
- Transparente: compartilhamos o processo

## Palavras-chave
Sempre usar: framework, squad, agente, workspace, escala, automação
Nunca usar: fácil, simples, mágico, revolucionário, garantido`,
    status: 'validated',
    tokenCount: 521,
    source: 'Manual',
    taxonomy: 'context.brand.identity',
    consumers: ['copywriter', 'designer', 'cmo'],
    lastUpdated: '2026-03-01T09:00:00Z',
    categoryId: 'brand',
    workspaceId: 'ws-aiox',
  },
  {
    id: 'doc-msg-hierarchy',
    name: 'Hierarquia de Mensagens',
    type: 'strategy',
    content: `# Hierarquia de Mensagens — AIOX

## Nível 1: Posicionamento
"O sistema operacional de AI para empresas que escalam."

## Nível 2: Promessas
- Seus agentes trabalham 24/7 com a qualidade do seu melhor funcionário
- Dados estruturados = outputs consistentes
- De 0 a operação automatizada em 30 dias

## Nível 3: Prova
- 847 empresas já usam
- NPS 72
- Cases documentados em 14 segmentos

## Nível 4: Call to Action
- Primário: "Comece sua implementação"
- Secundário: "Agende uma demo"
- Terciário: "Conheça a comunidade"`,
    status: 'validated',
    tokenCount: 389,
    source: 'Manual',
    taxonomy: 'context.brand.messaging',
    consumers: ['copywriter', 'cmo'],
    lastUpdated: '2026-03-02T14:00:00Z',
    categoryId: 'brand',
    workspaceId: 'ws-aiox',
  },
  {
    id: 'doc-ai-strategy',
    name: 'AI Strategy',
    type: 'strategy',
    content: `# Estratégia de AI — AIOX

## Política de Modelos
- Reasoning: Claude Opus (análise complexa, decisões)
- Fast: Claude Haiku (chat, classificação)
- Creative: GPT-4o (imagens, multimodal)
- Code: Claude Sonnet (desenvolvimento)

## Framework de Avaliação
Cada modelo é avaliado em 5 dimensões:
1. Qualidade de output (1-10)
2. Velocidade de resposta (ms)
3. Custo por 1K tokens
4. Consistência cross-run (%)
5. Capacidade de seguir instruções complexas (1-10)

## Stack Atual
- Primary: Anthropic Claude (Opus + Sonnet + Haiku)
- Secondary: OpenAI GPT-4o
- Embeddings: text-embedding-3-small
- Vector DB: Supabase pgvector`,
    status: 'draft',
    tokenCount: 567,
    source: 'Manual',
    taxonomy: 'context.tech.ai',
    consumers: ['architect', 'devops'],
    lastUpdated: '2026-03-06T18:00:00Z',
    categoryId: 'tech',
    workspaceId: 'ws-aiox',
  },
  {
    id: 'doc-kpis',
    name: 'KPIs Operacionais',
    type: 'generic',
    content: `# KPIs — AIOX Operations

## Growth
- MRR: R$XXk
- Churn mensal: X%
- LTV médio: R$X.Xk
- CAC: R$XXX

## Product
- DAU: XXX
- Retenção D30: XX%
- Feature adoption: XX%
- NPS: 72

## Engineering
- Deploy frequency: daily
- Lead time: < 24h
- MTTR: < 2h
- Change failure rate: < 5%

## Marketing
- CPL médio: R$XX
- Conversion rate: X%
- ROAS: X.Xx
- Email open rate: XX%`,
    status: 'draft',
    tokenCount: 312,
    source: 'Google Drive',
    taxonomy: 'context.operations.kpis',
    consumers: ['ceo', 'cfo', 'analyst'],
    lastUpdated: '2026-03-04T08:00:00Z',
    categoryId: 'operations',
    workspaceId: 'ws-aiox',
  },
  {
    id: 'doc-campaign-ativacao',
    name: 'Campaign Brief — Ativação Q1',
    type: 'strategy',
    content: `# Campaign Brief — Ativação Q1 2025

## Objetivo
Lançar campanha de ativação para novos leads enterprise no Q1.

## Target
- C-level de empresas com 50+ funcionários
- Segmento: SaaS, EdTech, FinTech

## Canais
- LinkedIn Ads (primário)
- Email nurture sequence
- Webinar executive

## Timeline
- Semana 1-2: Creative production
- Semana 3-4: Soft launch + A/B test
- Semana 5-8: Scale winners

## Budget
- Total: R$50k
- Ads: 60% | Content: 25% | Events: 15%

## KPIs Target
- CPL < R$80
- Demos agendadas: 50
- Pipeline gerado: R$500k`,
    status: 'validated',
    tokenCount: 445,
    source: 'Manual',
    taxonomy: 'context.campaign.brief',
    consumers: ['cmo', 'copywriter', 'media-buyer'],
    lastUpdated: '2026-03-10T10:00:00Z',
    categoryId: 'campaigns',
    workspaceId: 'ws-aiox',
  },
  {
    id: 'doc-dcp',
    name: 'DCP — Diagnóstico de Competências',
    type: 'diagnostic',
    content: `# DCP — Diagnóstico de Competências e Processos

## Áreas Avaliadas
1. Marketing & Growth: 8/10
2. Produto & Tech: 9/10
3. Operações: 7/10
4. Pessoas: 6/10
5. Financeiro: 7/10

## Gaps Identificados
- Processos de onboarding pouco documentados
- Métricas financeiras com delay de 15 dias
- Falta de playbook para CS

## Recomendações
- Automatizar reports financeiros
- Criar playbook de CS com agentes
- Implementar OKRs trimestrais`,
    status: 'validated',
    tokenCount: 378,
    source: 'Manual',
    taxonomy: 'context.company.diagnostic',
    consumers: ['ceo', 'coo'],
    lastUpdated: '2026-02-28T12:00:00Z',
    categoryId: 'company',
    workspaceId: 'ws-aiox',
  },
];

// ── Mock Workspaces ──

export const MOCK_WORKSPACES: VaultWorkspace[] = [
  {
    id: 'ws-aiox',
    name: 'AIOX',
    icon: 'Landmark',
    status: 'active',
    documentsCount: 23,
    templatesCount: 18,
    healthPercent: 89,
    lastUpdated: '2026-03-10T10:00:00Z',
    categories: [
      {
        id: 'company',
        name: 'Company',
        icon: 'Landmark',
        color: 'purple',
        status: 'complete',
        items: [
          { id: 'i-dna', name: 'DNA Founder', type: 'diagnostic', status: 'validated', tokenCount: 847, lastUpdated: '2026-03-08T14:00:00Z', documentId: 'doc-dna-founder' },
          { id: 'i-cred', name: 'Credenciais', type: 'generic', status: 'validated', tokenCount: 423, lastUpdated: '2026-03-05T10:00:00Z', documentId: 'doc-credentials' },
          { id: 'i-dcp', name: 'DCP', type: 'diagnostic', status: 'validated', tokenCount: 378, lastUpdated: '2026-02-28T12:00:00Z', documentId: 'doc-dcp' },
          { id: 'i-diag', name: 'Diagnósticos', type: 'diagnostic', status: 'draft', tokenCount: 0, lastUpdated: '2026-02-20T09:00:00Z', documentId: '' },
          { id: 'i-offer-emp', name: 'Offerbook Empresa', type: 'offerbook', status: 'validated', tokenCount: 890, lastUpdated: '2026-03-01T16:00:00Z', documentId: '' },
          { id: 'i-pricing', name: 'Pricing Strategy', type: 'strategy', status: 'validated', tokenCount: 456, lastUpdated: '2026-03-03T11:00:00Z', documentId: '' },
          { id: 'i-evidence', name: 'Evidence', type: 'proof', status: 'draft', tokenCount: 234, lastUpdated: '2026-02-25T14:00:00Z', documentId: '' },
        ],
      },
      {
        id: 'products',
        name: 'Products',
        icon: 'Package',
        color: 'green',
        status: 'complete',
        items: [
          { id: 'i-offer-aex', name: 'Offerbook — AEX Pro', type: 'offerbook', status: 'validated', tokenCount: 1247, lastUpdated: '2026-03-09T16:30:00Z', documentId: 'doc-offerbook-aex' },
          { id: 'i-proofs-aex', name: 'Provas — AEX Pro', type: 'proof', status: 'validated', tokenCount: 634, lastUpdated: '2026-03-07T11:00:00Z', documentId: 'doc-proofs-aex' },
          { id: 'i-narr-aex', name: 'Narrativa — AEX Pro', type: 'narrative', status: 'validated', tokenCount: 789, lastUpdated: '2026-03-06T15:00:00Z', documentId: '' },
          { id: 'i-test-aex', name: 'Depoimentos — AEX Pro', type: 'proof', status: 'validated', tokenCount: 534, lastUpdated: '2026-03-05T13:00:00Z', documentId: '' },
          { id: 'i-onboard-aex', name: 'Onboarding — AEX Pro', type: 'generic', status: 'draft', tokenCount: 345, lastUpdated: '2026-03-02T10:00:00Z', documentId: '' },
        ],
      },
      {
        id: 'campaigns',
        name: 'Campaigns',
        icon: 'Megaphone',
        color: 'yellow',
        status: 'partial',
        items: [
          { id: 'i-camp-q1', name: 'Ativação Q1', type: 'strategy', status: 'validated', tokenCount: 445, lastUpdated: '2026-03-10T10:00:00Z', documentId: 'doc-campaign-ativacao' },
        ],
      },
      {
        id: 'brand',
        name: 'Brand',
        icon: 'Palette',
        color: 'orange',
        status: 'complete',
        items: [
          { id: 'i-brandbook', name: 'Brand Book', type: 'brand', status: 'validated', tokenCount: 521, lastUpdated: '2026-03-01T09:00:00Z', documentId: 'doc-brand-book' },
          { id: 'i-positioning', name: 'Posicionamento', type: 'strategy', status: 'validated', tokenCount: 378, lastUpdated: '2026-02-28T16:00:00Z', documentId: '' },
          { id: 'i-msg-hier', name: 'Hierarquia de Mensagens', type: 'strategy', status: 'validated', tokenCount: 389, lastUpdated: '2026-03-02T14:00:00Z', documentId: 'doc-msg-hierarchy' },
          { id: 'i-design-sys', name: 'Design System', type: 'brand', status: 'validated', tokenCount: 678, lastUpdated: '2026-03-04T12:00:00Z', documentId: '' },
        ],
      },
      {
        id: 'tech',
        name: 'Tech',
        icon: 'Laptop',
        color: 'emerald',
        status: 'partial',
        items: [
          { id: 'i-ai-strat', name: 'AI Strategy', type: 'strategy', status: 'draft', tokenCount: 567, lastUpdated: '2026-03-06T18:00:00Z', documentId: 'doc-ai-strategy' },
          { id: 'i-model-pol', name: 'Model Policy', type: 'strategy', status: 'draft', tokenCount: 345, lastUpdated: '2026-03-05T11:00:00Z', documentId: '' },
          { id: 'i-stack', name: 'Stack Map', type: 'generic', status: 'validated', tokenCount: 456, lastUpdated: '2026-03-04T09:00:00Z', documentId: '' },
          { id: 'i-integrations', name: 'Integrações', type: 'generic', status: 'draft', tokenCount: 234, lastUpdated: '2026-03-01T14:00:00Z', documentId: '' },
        ],
      },
      {
        id: 'operations',
        name: 'Operations',
        icon: 'BarChart3',
        color: 'blue',
        status: 'partial',
        items: [
          { id: 'i-kpis', name: 'KPIs Operacionais', type: 'generic', status: 'draft', tokenCount: 312, lastUpdated: '2026-03-04T08:00:00Z', documentId: 'doc-kpis' },
          { id: 'i-team', name: 'Team Structure', type: 'generic', status: 'validated', tokenCount: 456, lastUpdated: '2026-03-03T10:00:00Z', documentId: '' },
          { id: 'i-pricing-strat', name: 'Pricing Strategy', type: 'strategy', status: 'validated', tokenCount: 567, lastUpdated: '2026-03-02T15:00:00Z', documentId: '' },
          { id: 'i-evidence-ops', name: 'Evidence', type: 'proof', status: 'draft', tokenCount: 234, lastUpdated: '2026-02-27T11:00:00Z', documentId: '' },
        ],
      },
    ],
    templateGroups: [
      {
        id: 'tg-ai', name: 'AI Strategy', icon: 'Brain', area: 'AI',
        completionPercent: 75,
        templates: [
          { id: 't-model-pol', name: 'Model Policy', status: 'filled', lastUpdated: '2026-03-05T11:00:00Z' },
          { id: 't-model-eval', name: 'Model Evaluation', status: 'filled', lastUpdated: '2026-03-04T09:00:00Z' },
          { id: 't-feedback', name: 'Feedback Loop', status: 'filled', lastUpdated: '2026-03-03T14:00:00Z' },
          { id: 't-analysis', name: 'Analysis Rules', status: 'empty' },
        ],
      },
      {
        id: 'tg-analytics', name: 'Analytics', icon: 'BarChart3', area: 'Analytics',
        completionPercent: 100,
        templates: [
          { id: 't-console360', name: 'Console 360', status: 'filled', lastUpdated: '2026-03-06T10:00:00Z' },
          { id: 't-community', name: 'Community Health', status: 'filled', lastUpdated: '2026-03-05T08:00:00Z' },
          { id: 't-cohort', name: 'Cohort Analytics', status: 'filled', lastUpdated: '2026-03-04T16:00:00Z' },
          { id: 't-exec-report', name: 'Executive Report', status: 'filled', lastUpdated: '2026-03-03T12:00:00Z' },
        ],
      },
      {
        id: 'tg-branding', name: 'Branding', icon: 'Palette', area: 'Branding',
        completionPercent: 66,
        templates: [
          { id: 't-ativacao', name: 'Ativação Estratégica', status: 'filled', lastUpdated: '2026-03-02T11:00:00Z' },
          { id: 't-arq-marca', name: 'Arquitetura de Marca', status: 'filled', lastUpdated: '2026-03-01T09:00:00Z' },
          { id: 't-voice', name: 'Brand Voice', status: 'empty' },
        ],
      },
      {
        id: 'tg-ops', name: 'Operations', icon: 'Cog', area: 'Ops',
        completionPercent: 66,
        templates: [
          { id: 't-kpis-tmpl', name: 'KPI Framework', status: 'filled', lastUpdated: '2026-03-04T08:00:00Z' },
          { id: 't-team-tmpl', name: 'Team Structure', status: 'filled', lastUpdated: '2026-03-03T10:00:00Z' },
          { id: 't-pricing-tmpl', name: 'Pricing Model', status: 'empty' },
        ],
      },
      {
        id: 'tg-tech', name: 'Tech', icon: 'Laptop', area: 'Tech',
        completionPercent: 33,
        templates: [
          { id: 't-stack-tmpl', name: 'Stack Map', status: 'filled', lastUpdated: '2026-03-04T09:00:00Z' },
          { id: 't-integ-tmpl', name: 'Integration Map', status: 'empty' },
          { id: 't-infra-tmpl', name: 'Infrastructure', status: 'empty' },
        ],
      },
      {
        id: 'tg-exec', name: 'Executive', icon: 'Crown', area: 'Executive',
        completionPercent: 33,
        templates: [
          { id: 't-ceo-report', name: 'CEO Report', status: 'filled', lastUpdated: '2026-03-06T15:00:00Z' },
          { id: 't-board', name: 'Board Deck', status: 'empty' },
          { id: 't-eval', name: 'Evaluation Report', status: 'empty' },
        ],
      },
    ],
    taxonomySections: [
      {
        id: 'tax-context', name: 'Contexto', icon: 'FolderOpen',
        nodes: [
          { id: 'n-business', name: 'business', type: 'namespace', usedInDocuments: 12, children: [
            { id: 'n-b-company', name: 'company', type: 'entity', usedInDocuments: 7 },
            { id: 'n-b-founder', name: 'founder', type: 'entity', usedInDocuments: 3 },
            { id: 'n-b-team', name: 'team', type: 'entity', usedInDocuments: 2 },
          ]},
          { id: 'n-product', name: 'product', type: 'namespace', usedInDocuments: 8, children: [
            { id: 'n-p-offer', name: 'offer', type: 'entity', usedInDocuments: 3 },
            { id: 'n-p-proof', name: 'proof', type: 'entity', usedInDocuments: 2 },
            { id: 'n-p-narrative', name: 'narrative', type: 'entity', usedInDocuments: 2 },
            { id: 'n-p-onboarding', name: 'onboarding', type: 'entity', usedInDocuments: 1 },
          ]},
          { id: 'n-campaign', name: 'campaign', type: 'namespace', usedInDocuments: 3, children: [
            { id: 'n-c-brief', name: 'brief', type: 'entity', usedInDocuments: 1 },
            { id: 'n-c-ops', name: 'operations', type: 'entity', usedInDocuments: 1 },
            { id: 'n-c-assets', name: 'assets', type: 'entity', usedInDocuments: 1 },
          ]},
        ],
      },
      {
        id: 'tax-entities', name: 'Entidades', icon: 'Package',
        nodes: [
          { id: 'n-e-company', name: 'company', type: 'entity', usedInDocuments: 7, description: 'Dados corporativos: credenciais, DCP, diagnósticos' },
          { id: 'n-e-founder', name: 'founder', type: 'entity', usedInDocuments: 3, description: 'DNA, estilo, background do founder' },
          { id: 'n-e-product', name: 'product', type: 'entity', usedInDocuments: 8, description: 'Offerbook, provas, narrativa, onboarding' },
          { id: 'n-e-team', name: 'team', type: 'entity', usedInDocuments: 2, description: 'Estrutura, roles, capacidades' },
          { id: 'n-e-campaign', name: 'campaign', type: 'entity', usedInDocuments: 3, description: 'Brief, status, operações, assets' },
        ],
      },
      {
        id: 'tax-glossary', name: 'Glossário', icon: 'BookOpen',
        nodes: [
          { id: 'n-g-sap', name: 'SAP', type: 'term', usedInDocuments: 4, description: 'Strategic Action Plan — plano de ação estratégico' },
          { id: 'n-g-dcp', name: 'DCP', type: 'term', usedInDocuments: 2, description: 'Diagnóstico de Competências e Processos' },
          { id: 'n-g-nps', name: 'NPS', type: 'term', usedInDocuments: 5, description: 'Net Promoter Score — métrica de satisfação' },
          { id: 'n-g-etl', name: 'ETL', type: 'term', usedInDocuments: 3, description: 'Extract, Transform, Load — pipeline de dados' },
          { id: 'n-g-cac', name: 'CAC', type: 'term', usedInDocuments: 2, description: 'Custo de Aquisição de Cliente' },
        ],
      },
      {
        id: 'tax-workflows', name: 'Workflows', icon: 'GitMerge',
        nodes: [
          { id: 'n-w-copy', name: 'copy-create', type: 'workflow', usedInDocuments: 2, description: 'Criação de copy com context loading' },
          { id: 'n-w-brief', name: 'brief-init', type: 'workflow', usedInDocuments: 1, description: 'Inicialização de campaign brief' },
          { id: 'n-w-campaign', name: 'campaign-ops', type: 'workflow', usedInDocuments: 1, description: 'Operação de campanha ativa' },
          { id: 'n-w-onboard', name: 'onboard-setup', type: 'workflow', usedInDocuments: 1, description: 'Setup de onboarding para novo produto' },
        ],
      },
    ],
    csuitePersonas: [
      { id: 'cs-cio', name: 'CIO', role: 'Chief Intelligence Officer', icon: 'Package', area: 'Workspace Orchestration', dependencies: ['SAP', 'All Data Sources', 'Taxonomies'], isActive: true },
      { id: 'cs-ceo', name: 'CEO', role: 'Chief Executive Officer', icon: 'Crown', area: 'Reporting & Strategy', dependencies: ['KPIs', 'Analytics', 'Operations', 'Evidence'], isActive: true },
      { id: 'cs-cmo', name: 'CMO', role: 'Chief Marketing Officer', icon: 'Megaphone', area: 'Marketing & Campaigns', dependencies: ['Brand Book', 'Offerbook', 'Proofs', 'Campaigns'], isActive: false },
      { id: 'cs-cfo', name: 'CFO', role: 'Chief Financial Officer', icon: 'DollarSign', area: 'Financial Operations', dependencies: ['Pricing', 'Revenue', 'KPIs'], isActive: false },
      { id: 'cs-chro', name: 'CHRO', role: 'Chief Human Resources Officer', icon: 'Users', area: 'People & Culture', dependencies: ['Team Structure', 'Culture', 'Onboarding'], isActive: false },
    ],
  },
  {
    id: 'ws-academia',
    name: 'Academia IOX',
    icon: 'BookOpen',
    status: 'setup',
    documentsCount: 12,
    templatesCount: 8,
    healthPercent: 45,
    lastUpdated: '2026-03-08T09:00:00Z',
    categories: [
      { id: 'company', name: 'Company', icon: 'Landmark', color: 'purple', status: 'partial', items: [
        { id: 'i-acad-dna', name: 'DNA Academia', type: 'diagnostic', status: 'validated', tokenCount: 567, lastUpdated: '2026-03-07T10:00:00Z', documentId: '' },
        { id: 'i-acad-cred', name: 'Credenciais', type: 'generic', status: 'draft', tokenCount: 234, lastUpdated: '2026-03-05T14:00:00Z', documentId: '' },
      ]},
      { id: 'products', name: 'Products', icon: 'Package', color: 'green', status: 'partial', items: [
        { id: 'i-acad-fund', name: 'Fundamentos', type: 'offerbook', status: 'validated', tokenCount: 890, lastUpdated: '2026-03-06T11:00:00Z', documentId: '' },
        { id: 'i-acad-avanc', name: 'Avançado', type: 'offerbook', status: 'draft', tokenCount: 456, lastUpdated: '2026-03-04T09:00:00Z', documentId: '' },
        { id: 'i-acad-mentor', name: 'Mentoria', type: 'offerbook', status: 'draft', tokenCount: 345, lastUpdated: '2026-03-01T16:00:00Z', documentId: '' },
      ]},
      { id: 'campaigns', name: 'Campaigns', icon: 'Megaphone', color: 'yellow', status: 'empty', items: [] },
      { id: 'brand', name: 'Brand', icon: 'Palette', color: 'orange', status: 'partial', items: [
        { id: 'i-acad-brand', name: 'Brand Guidelines', type: 'brand', status: 'draft', tokenCount: 345, lastUpdated: '2026-03-03T10:00:00Z', documentId: '' },
      ]},
      { id: 'tech', name: 'Tech', icon: 'Laptop', color: 'emerald', status: 'empty', items: [] },
      { id: 'operations', name: 'Operations', icon: 'BarChart3', color: 'blue', status: 'partial', items: [
        { id: 'i-acad-kpis', name: 'KPIs', type: 'generic', status: 'draft', tokenCount: 234, lastUpdated: '2026-03-02T08:00:00Z', documentId: '' },
      ]},
    ],
    templateGroups: [
      { id: 'tg-acad-ai', name: 'AI Strategy', icon: 'Brain', area: 'AI', completionPercent: 25, templates: [
        { id: 't-acad-mp', name: 'Model Policy', status: 'filled' },
        { id: 't-acad-me', name: 'Model Evaluation', status: 'empty' },
        { id: 't-acad-fb', name: 'Feedback Loop', status: 'empty' },
        { id: 't-acad-ar', name: 'Analysis Rules', status: 'empty' },
      ]},
      { id: 'tg-acad-brand', name: 'Branding', icon: 'Palette', area: 'Branding', completionPercent: 33, templates: [
        { id: 't-acad-ativ', name: 'Ativação', status: 'filled' },
        { id: 't-acad-arq', name: 'Arquitetura', status: 'empty' },
        { id: 't-acad-voice', name: 'Brand Voice', status: 'empty' },
      ]},
    ],
    taxonomySections: [],
    csuitePersonas: [],
  },
];

// ── Mock Activities ──

export const MOCK_ACTIVITIES: VaultActivity[] = [
  { id: 'a1', type: 'document_validated', description: 'Campaign Brief "Ativação Q1" validado', timestamp: '2026-03-10T10:00:00Z', workspaceId: 'ws-aiox' },
  { id: 'a2', type: 'taxonomy_updated', description: 'Taxonomia "campaign.brief" atualizada', timestamp: '2026-03-10T09:30:00Z', workspaceId: 'ws-aiox' },
  { id: 'a3', type: 'template_created', description: 'Template "CEO Report" criado', timestamp: '2026-03-09T16:00:00Z', workspaceId: 'ws-aiox' },
  { id: 'a4', type: 'document_ingested', description: 'Offerbook AEX Pro ingestado via ETL Agent', timestamp: '2026-03-09T14:00:00Z', workspaceId: 'ws-aiox' },
  { id: 'a5', type: 'csuite_activated', description: 'CEO Cerebral ativado', timestamp: '2026-03-08T18:00:00Z', workspaceId: 'ws-aiox' },
  { id: 'a6', type: 'workspace_created', description: 'Workspace "Academia IOX" criado', timestamp: '2026-03-08T09:00:00Z', workspaceId: 'ws-academia' },
  { id: 'a7', type: 'document_ingested', description: 'Brand Book ingestado', timestamp: '2026-03-07T11:00:00Z', workspaceId: 'ws-aiox' },
  { id: 'a8', type: 'taxonomy_updated', description: 'Glossário: 5 termos adicionados', timestamp: '2026-03-06T15:00:00Z', workspaceId: 'ws-aiox' },
];
