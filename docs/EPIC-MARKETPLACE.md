# EPIC: Agent Marketplace — Sistema de Marketplace de Duas Vias para Agentes IA

**PRD Ref:** PRD-MARKETPLACE
**Status:** Draft
**Criado por:** @pm (Morgan)

---

## Contexto

O AIOS Platform opera como sistema fechado com agentes pre-definidos. Este epic transforma o dashboard em uma plataforma aberta onde agentes podem ser comprados, vendidos e contratados — criando um ecossistema de duas vias (buyer/seller) integrado ao engine de execucao existente.

O marketplace e projetado para ser indistinguivel do ecossistema nativo: agentes contratados usam os mesmos types, executam no mesmo engine e aparecem no mesmo dashboard.

---

## Estrutura do Marketplace

```
src/
├── components/marketplace/
│   ├── browse/              # Catalogo e discovery
│   ├── listing/             # Pagina de detalhe
│   ├── seller/              # Dashboard do vendedor
│   ├── submit/              # Wizard de submissao
│   ├── orders/              # Compras e pedidos
│   ├── review-queue/        # Fila de aprovacao (admin)
│   └── shared/              # Componentes reutilizaveis
├── hooks/
│   ├── useMarketplace.ts
│   ├── useMarketplaceListing.ts
│   ├── useMarketplaceSeller.ts
│   ├── useMarketplaceOrders.ts
│   ├── useMarketplaceReviews.ts
│   ├── useMarketplaceSubmit.ts
│   └── useMarketplaceCheckout.ts
├── stores/
│   ├── marketplaceStore.ts
│   ├── marketplaceSellerStore.ts
│   ├── marketplaceOrderStore.ts
│   └── marketplaceSubmissionStore.ts
├── services/
│   ├── supabase/marketplace.ts
│   └── api/marketplace.ts
└── types/
    └── marketplace.ts
```

---

# FASE 1 — Foundation

**Objetivo:** Criar toda a infraestrutura necessaria (schema, types, stores, services, componentes base) para que as fases seguintes possam ser construidas rapidamente.
**Agente executor:** @dev (Dex) + @data-engineer (Dara) para schema
**Sprint:** 1-2

---

## Story 1.1 — Supabase Migrations: Schema do Marketplace

**Status:** Draft

**As a** platform developer,
**I want** all marketplace database tables created in Supabase with proper indexes and RLS,
**so that** the data layer is ready for all marketplace features.

### Acceptance Criteria

- [ ] AC 1.1.1: Tabela `seller_profiles` criada com todos os campos do PRD (id, user_id, display_name, slug, verification, rating_avg, stripe_account_id, etc.)
- [ ] AC 1.1.2: Tabela `marketplace_listings` criada com FTS index no campo composto (name + tagline + description) usando `to_tsvector('portuguese', ...)`
- [ ] AC 1.1.3: Tabela `marketplace_submissions` criada com review_checklist JSONB default (10 campos null)
- [ ] AC 1.1.4: Tabela `marketplace_orders` criada com suporte a 4 order types (task, hourly, subscription, credits) e escrow
- [ ] AC 1.1.5: Tabela `marketplace_reviews` criada com constraint UNIQUE(order_id, reviewer_id) e 5 dimensoes de rating
- [ ] AC 1.1.6: Tabela `marketplace_transactions` criada com 6 tipos de transacao
- [ ] AC 1.1.7: Tabela `marketplace_disputes` criada com 5 razoes e 5 status
- [ ] AC 1.1.8: RLS policies criadas conforme PRD secao 4.8 (seller read all/update own, listings read approved/manage own, orders per-user, reviews read all/write verified)
- [ ] AC 1.1.9: Todos os indexes do PRD criados (status, seller, category, rating, slug, FTS)
- [ ] AC 1.1.10: Migration roda sem erros via `supabase db push`

### Tasks

- [ ] Criar arquivo de migration em `supabase/migrations/`
- [ ] Definir todas as 7 tabelas com constraints CHECK
- [ ] Criar indexes para queries frequentes
- [ ] Implementar RLS policies
- [ ] Testar migration localmente
- [ ] Push para Supabase remoto

### Dev Notes

- Usar `gen_random_uuid()` para PKs (padrao Supabase)
- FTS index usa `'portuguese'` para stemming em PT-BR
- JSONB para agent_config, review_checklist, evidence, metadata
- Escrow fields na tabela orders (nao tabela separada)
- Referencia: PRD-MARKETPLACE secao 4

---

## Story 1.2 — TypeScript Types para Marketplace

**Status:** Draft

**As a** frontend developer,
**I want** complete TypeScript type definitions for all marketplace entities,
**so that** all components and services are fully typed.

### Acceptance Criteria

- [ ] AC 1.2.1: Arquivo `src/types/marketplace.ts` criado com todos os types
- [ ] AC 1.2.2: Types definidos: `SellerProfile`, `SellerVerification`, `MarketplaceListing`, `ListingStatus`, `PricingModel`
- [ ] AC 1.2.3: Types definidos: `MarketplaceSubmission`, `SubmissionStatus`, `ReviewChecklist`
- [ ] AC 1.2.4: Types definidos: `MarketplaceOrder`, `OrderType`, `OrderStatus`, `EscrowStatus`
- [ ] AC 1.2.5: Types definidos: `MarketplaceReview`, `MarketplaceTransaction`, `TransactionType`
- [ ] AC 1.2.6: Types definidos: `MarketplaceDispute`, `DisputeReason`, `DisputeStatus`
- [ ] AC 1.2.7: Types de filtro: `MarketplaceFilters`, `MarketplaceSortBy`, `MarketplaceCategory`
- [ ] AC 1.2.8: Types de UI: `SubmitWizardStep`, `SellerDashboardTab`, `MarketplaceViewState`
- [ ] AC 1.2.9: Re-export de `src/types/marketplace.ts` no `src/types/index.ts`
- [ ] AC 1.2.10: Types sao compativeis com os types existentes (Agent, AgentSummary, SquadType, AgentPersona, AgentCommand)

### Tasks

- [ ] Criar `src/types/marketplace.ts`
- [ ] Definir enums/union types para status, pricing, categories
- [ ] Definir interfaces que estendem ou referenciam types existentes
- [ ] Definir types para API responses (paginated, etc.)
- [ ] Adicionar re-exports no index.ts

### Dev Notes

- `MarketplaceListing.agent_config` deve ser tipado como `Partial<Agent>` (persona, commands, capabilities)
- `MarketplaceCategory` mapeia para `SquadType` existente
- `MarketplaceOrder.agent_config_snapshot` e um freeze do agent_config no momento da compra
- Manter consistencia com naming conventions do codebase (PascalCase para interfaces, camelCase para props)

---

## Story 1.3 — Service Layer: Supabase Marketplace Client

**Status:** Draft

**As a** frontend developer,
**I want** a complete service layer for all marketplace Supabase operations,
**so that** components can fetch and mutate data with typed functions.

### Acceptance Criteria

- [ ] AC 1.3.1: Arquivo `src/services/supabase/marketplace.ts` criado
- [ ] AC 1.3.2: Funcoes de listings: `getListings(filters)`, `getListingBySlug(slug)`, `getListingById(id)`, `createListing(data)`, `updateListing(id, data)`, `submitForReview(id)`
- [ ] AC 1.3.3: Funcoes de seller: `getSellerProfile(userId)`, `getSellerBySlug(slug)`, `createSellerProfile(data)`, `updateSellerProfile(id, data)`
- [ ] AC 1.3.4: Funcoes de orders: `createOrder(data)`, `getMyPurchases(userId)`, `getMySales(sellerId)`, `getOrderById(id)`, `updateOrderStatus(id, status)`
- [ ] AC 1.3.5: Funcoes de reviews: `getReviewsForListing(listingId)`, `createReview(data)`, `respondToReview(reviewId, response)`
- [ ] AC 1.3.6: Funcoes de submissions: `createSubmission(data)`, `getSubmissionQueue()`, `updateSubmissionReview(id, data)`
- [ ] AC 1.3.7: Funcoes de disputes: `createDispute(data)`, `getDisputeByOrder(orderId)`, `updateDisputeStatus(id, data)`
- [ ] AC 1.3.8: Funcao de busca FTS: `searchListings(query, filters)` usando `textSearch()`
- [ ] AC 1.3.9: Todas as funcoes retornam tipos corretos (marketplace.ts)
- [ ] AC 1.3.10: Graceful fallback quando Supabase nao esta configurado (retorna dados vazios, nao crashes)

### Tasks

- [ ] Criar service file
- [ ] Implementar cada grupo de funcoes (listings, seller, orders, reviews, submissions, disputes)
- [ ] Adicionar FTS search com filtros combinados
- [ ] Adicionar error handling consistente com o pattern de `src/services/supabase/tasks.ts`
- [ ] Testar com Supabase local

### Dev Notes

- Seguir pattern de `src/services/supabase/tasks.ts` para error handling e graceful degradation
- `getListings` deve suportar: paginacao (offset/limit), sort, filtros por categoria/pricing/rating/tags, FTS
- `searchListings` usa `textSearch('fts', query, { type: 'websearch' })` do Supabase JS client
- Client Supabase importado de `src/lib/supabase.ts` (ja existe)

---

## Story 1.4 — Zustand Stores para Marketplace

**Status:** Draft

**As a** frontend developer,
**I want** Zustand stores managing marketplace state,
**so that** all marketplace UI has reactive, persistent state management.

### Acceptance Criteria

- [ ] AC 1.4.1: `marketplaceStore.ts` criado com: filters, sorting, pagination, search query, selected category, listings cache
- [ ] AC 1.4.2: `marketplaceSellerStore.ts` criado com: seller profile, my listings, analytics data, active tab
- [ ] AC 1.4.3: `marketplaceOrderStore.ts` criado com: my purchases, my sales, selected order, order filters
- [ ] AC 1.4.4: `marketplaceSubmissionStore.ts` criado com: wizard step, draft data per step, validation state, submission status
- [ ] AC 1.4.5: Todos os stores usam `persist` middleware com `safePersistStorage` (pattern existente)
- [ ] AC 1.4.6: Store names seguem convencao: `aios-marketplace`, `aios-marketplace-seller`, etc.
- [ ] AC 1.4.7: Actions sao tipadas e documentadas com JSDoc
- [ ] AC 1.4.8: Reset functions existem para limpar state (ex: `resetFilters()`, `resetWizard()`)

### Tasks

- [ ] Criar 4 store files em `src/stores/`
- [ ] Definir state + actions para cada store
- [ ] Adicionar persist middleware
- [ ] Adicionar reset functions
- [ ] Testar rehydration do localStorage

### Dev Notes

- Seguir pattern de `src/stores/uiStore.ts` e `src/stores/storyStore.ts`
- `marketplaceSubmissionStore` precisa de um wizard state machine: { currentStep: 1-5, stepData: {}, stepValid: {} }
- `marketplaceStore` deve ter `selectedListingId` para navegacao entre browse e detail
- Nao duplicar dados do Supabase nos stores — stores guardam UI state (filtros, selecao), React Query guarda data cache

---

## Story 1.5 — Componentes Shared do Marketplace

**Status:** Draft

**As a** UI developer,
**I want** reusable shared components for the marketplace,
**so that** all marketplace views have consistent UI primitives.

### Acceptance Criteria

- [ ] AC 1.5.1: `AgentCard.tsx` criado — card com: icon, nome, tagline, seller name, rating stars, preco, categoria badge, downloads count
- [ ] AC 1.5.2: `RatingStars.tsx` criado — componente de estrelas que aceita `value` (0-5, decimais), `size`, `interactive` (para form de review), `count` (numero de reviews)
- [ ] AC 1.5.3: `PriceBadge.tsx` criado — badge formatado: "R$ 15/task", "R$ 50/hora", "R$ 199/mes", "Gratis", "5 creditos"
- [ ] AC 1.5.4: `SellerBadge.tsx` criado — badge com icone e label por verification level (Unverified: gray, Verified: blue, Pro: lime, Enterprise: gold)
- [ ] AC 1.5.5: `CategoryBadge.tsx` criado — badge com cor do SquadType (usa `getSquadTheme()` de `src/lib/theme.ts`)
- [ ] AC 1.5.6: `RatingBreakdown.tsx` criado — bar chart horizontal: 5 estrelas, 4, 3, 2, 1 com contagem e percentual
- [ ] AC 1.5.7: `ListingStatusBadge.tsx` criado — badges para: draft (gray), pending_review (yellow), approved (green), rejected (red), suspended (orange)
- [ ] AC 1.5.8: `EmptyMarketplace.tsx` criado — estado vazio com ilustracao e CTA contextual
- [ ] AC 1.5.9: Todos os componentes seguem AIOX theme (brutalist, border-radius: 0, font-mono, uppercase labels)
- [ ] AC 1.5.10: Todos os componentes sao keyboard accessible e tem aria-labels

### Tasks

- [ ] Criar `src/components/marketplace/shared/` directory
- [ ] Implementar cada componente com props tipadas
- [ ] Usar Cockpit components (CockpitBadge, CockpitButton) quando apropriado
- [ ] Usar `cn()` para conditional classes
- [ ] Testar a11y (contrast, keyboard nav, screen reader)
- [ ] Criar index.ts com re-exports

### Dev Notes

- `AgentCard` e o componente mais usado — sera renderizado 20-50x por pagina. Deve ser otimizado (React.memo, virtual scroll)
- `RatingStars` usa icones Lucide `Star` e `StarHalf`
- Cores do `SellerBadge` seguem brandbook: Verified=`--bb-blue`, Pro=`--bb-lime`, Enterprise=gold (#FFD700)
- `CategoryBadge` usa `getSquadTheme(category).badge` para cores consistentes com o restante do dashboard

---

## Story 1.6 — Registro no ViewType, viewMap e Sidebar

**Status:** Draft

**As a** user,
**I want** marketplace views accessible from the sidebar navigation,
**so that** I can navigate to all marketplace features from the main menu.

### Acceptance Criteria

- [ ] AC 1.6.1: `ViewType` em `types/index.ts` atualizado com 6 novos tipos: `marketplace`, `marketplace-listing`, `marketplace-purchases`, `marketplace-seller`, `marketplace-submit`, `marketplace-review`
- [ ] AC 1.6.2: `viewMap` em `App.tsx` atualizado com lazy imports para todos os 6 componentes
- [ ] AC 1.6.3: `viewLoaderMessages` em `App.tsx` atualizado com mensagens em portugues
- [ ] AC 1.6.4: Sidebar atualizado com secao "Marketplace" contendo: Browse (Store icon), My Purchases (ShoppingCart), Sell (Upload), Review Queue (ClipboardCheck, admin only)
- [ ] AC 1.6.5: `useUrlSync` suporta deep links para todas as marketplace views (ex: `?view=marketplace&category=development`)
- [ ] AC 1.6.6: Command Palette (Cmd+K) inclui marketplace views na busca
- [ ] AC 1.6.7: Componentes placeholder criados para cada view (retornam div com nome da view, para evitar import errors)

### Tasks

- [ ] Atualizar `src/types/index.ts` com novos ViewTypes
- [ ] Criar componentes placeholder em `src/components/marketplace/`
- [ ] Atualizar `src/App.tsx` com lazy imports e viewMap entries
- [ ] Atualizar sidebar component para incluir secao Marketplace
- [ ] Atualizar `useUrlSync` para suportar marketplace params
- [ ] Atualizar Command Palette entries

### Dev Notes

- Sidebar: usar icon `Store` (Lucide) para a secao marketplace
- Secao marketplace no sidebar deve ficar entre "Agents" e "Settings"
- Componentes placeholder: cada um e um `div` com o nome da view centralizado — serao substituidos nas fases seguintes
- Admin-only: `marketplace-review` so aparece se `isAdmin` flag (por enquanto, sempre visivel, autenticacao e v2)

---

# FASE 2 — Browse & Discovery

**Objetivo:** Criar a experiencia de descoberta e navegacao do catalogo de agentes.
**Agente executor:** @dev (Dex)
**Sprint:** 3-4

---

## Story 2.1 — MarketplaceBrowse: Pagina Principal do Catalogo

**Status:** Draft

**As a** buyer,
**I want** a marketplace browse page with agent grid and filters,
**so that** I can discover and explore available agents.

### Acceptance Criteria

- [ ] AC 2.1.1: MarketplaceBrowse renderiza grid de AgentCards com listings aprovados
- [ ] AC 2.1.2: Grid responsivo: 3 colunas desktop, 2 tablet, 1 mobile
- [ ] AC 2.1.3: Sorting funciona: "Mais Populares" (downloads), "Melhor Avaliados" (rating), "Mais Recentes" (published_at), "Menor Preco", "Maior Preco"
- [ ] AC 2.1.4: Paginacao com "Load More" (nao paginacao numerada) — carrega 12 por vez
- [ ] AC 2.1.5: Loading state mostra skeleton cards durante fetch
- [ ] AC 2.1.6: Empty state com EmptyMarketplace quando nenhum resultado
- [ ] AC 2.1.7: Counter mostra total de resultados: "42 agentes encontrados"
- [ ] AC 2.1.8: React Query usado para data fetching com staleTime de 5min
- [ ] AC 2.1.9: Click em AgentCard navega para `marketplace-listing` com listing id

### Tasks

- [ ] Criar `MarketplaceBrowse.tsx` com layout grid + sidebar
- [ ] Criar `MarketplaceGrid.tsx` com virtual scroll para performance
- [ ] Implementar hook `useMarketplace.ts` com React Query
- [ ] Conectar sorting e paginacao ao store
- [ ] Implementar loading skeletons
- [ ] Testar responsividade

### Dev Notes

- Virtual scroll: usar `@tanstack/react-virtual` (ja instalado) se listings > 50
- Grid gap: usar `gap-4` (16px) consistente com dashboard cards
- AgentCard height fixo para grid alignment (evitar cards de tamanhos diferentes)

---

## Story 2.2 — MarketplaceFilters: Sidebar de Filtros

**Status:** Draft

**As a** buyer,
**I want** filters to narrow down marketplace results,
**so that** I can find agents matching my specific needs.

### Acceptance Criteria

- [ ] AC 2.2.1: Sidebar de filtros com: Categoria, Modelo de Pricing, Rating Minimo, Tags, Seller Level
- [ ] AC 2.2.2: Filtro de Categoria mostra lista de SquadTypes com contagem de listings cada
- [ ] AC 2.2.3: Filtro de Pricing: checkboxes (Free, Per Task, Hourly, Monthly, Credits)
- [ ] AC 2.2.4: Filtro de Rating: slider ou botoes (4+, 3+, qualquer)
- [ ] AC 2.2.5: Filtro de Tags: input com autocomplete das tags mais usadas
- [ ] AC 2.2.6: Filtro de Seller Level: checkboxes (Verified, Pro, Enterprise)
- [ ] AC 2.2.7: Botao "Limpar Filtros" reseta todos os filtros
- [ ] AC 2.2.8: Filtros persistem no URL (deep link) e no marketplaceStore
- [ ] AC 2.2.9: Filtros atualizam o grid em real-time (debounce de 300ms)
- [ ] AC 2.2.10: Em mobile, filtros ficam em um drawer slide-in com botao "Filtros"

### Tasks

- [ ] Criar `MarketplaceFilters.tsx` com secoees colapsaveis
- [ ] Implementar cada tipo de filtro
- [ ] Conectar filtros ao marketplaceStore e URL sync
- [ ] Implementar debounce na aplicacao de filtros
- [ ] Criar versao mobile (drawer)

### Dev Notes

- Contagem por categoria: query separada com `group by category` no Supabase
- Tags autocomplete: busca tags distintas com `select distinct unnest(tags)` no Supabase
- Debounce: 300ms para evitar queries excessivas enquanto usuario ajusta filtros

---

## Story 2.3 — MarketplaceSearch: Busca Full-Text

**Status:** Draft

**As a** buyer,
**I want** to search agents by text,
**so that** I can find agents by name, description, or capabilities.

### Acceptance Criteria

- [ ] AC 2.3.1: Barra de busca proeminente no topo do MarketplaceBrowse
- [ ] AC 2.3.2: Busca usa FTS do Supabase (index GIN com to_tsvector 'portuguese')
- [ ] AC 2.3.3: Resultados atualizam em real-time com debounce de 500ms
- [ ] AC 2.3.4: Busca combina com filtros ativos (AND logic)
- [ ] AC 2.3.5: Sugestoes de busca aparecem apos 2 caracteres (top 5 nomes de listings)
- [ ] AC 2.3.6: Tecla Escape limpa a busca
- [ ] AC 2.3.7: Historico de busca salvo no localStorage (ultimas 5 buscas)
- [ ] AC 2.3.8: Query de busca persiste no URL (`?q=react+developer`)

### Tasks

- [ ] Criar `MarketplaceSearch.tsx`
- [ ] Implementar FTS query no service layer
- [ ] Adicionar debounce e sugestoes
- [ ] Conectar ao URL sync
- [ ] Salvar historico no localStorage

### Dev Notes

- FTS query: `supabase.from('marketplace_listings').textSearch('fts', query, { type: 'websearch', config: 'portuguese' })`
- Sugestoes: query separada `select name from marketplace_listings where name ilike '%query%' limit 5`

---

## Story 2.4 — FeaturedAgents e CategoryNav

**Status:** Draft

**As a** buyer,
**I want** featured agents and category navigation,
**so that** I can quickly discover top agents and browse by category.

### Acceptance Criteria

- [ ] AC 2.4.1: FeaturedAgents renderiza ate 6 agentes com `featured=true` em cards maiores no topo
- [ ] AC 2.4.2: Cards featured mostram cover_image como background, nome, tagline, seller, rating
- [ ] AC 2.4.3: CategoryNav mostra todas as categorias (SquadTypes) como botoes/pills horizontais
- [ ] AC 2.4.4: Cada categoria mostra icon do SquadType e contagem de listings
- [ ] AC 2.4.5: Click em categoria filtra o grid (equivalente a setar filtro de categoria)
- [ ] AC 2.4.6: Categoria ativa destacada visualmente (cor do SquadType como background)
- [ ] AC 2.4.7: "Todos" como primeira opcao (sem filtro de categoria)
- [ ] AC 2.4.8: CategoryNav faz scroll horizontal em mobile (overflow-x-auto)

### Tasks

- [ ] Criar `FeaturedAgents.tsx` com layout de cards grandes
- [ ] Criar `CategoryNav.tsx` com pills horizontais
- [ ] Query de featured: `where featured=true order by featured_at desc limit 6`
- [ ] Query de contagem: `select category, count(*) from listings where status='approved' group by category`
- [ ] Implementar scroll horizontal mobile

### Dev Notes

- Featured cards: height 200px, cover_image com overlay gradient para legibilidade do texto
- CategoryNav icons: mapear SquadType para Lucide icon (Code, Palette, Megaphone, etc.)
- Se nenhum featured: seçao nao renderiza (graceful hide)

---

# FASE 3 — Listing Detail & Hire

**Objetivo:** Pagina de detalhe do agente e fluxo completo de contratacao.
**Agente executor:** @dev (Dex)
**Sprint:** 5-6

---

## Story 3.1 — ListingDetail: Pagina Completa do Agente

**Status:** Draft

**As a** buyer,
**I want** a detailed agent listing page,
**so that** I can evaluate an agent before hiring.

### Acceptance Criteria

- [ ] AC 3.1.1: ListingDetail carrega dados completos do listing por ID ou slug
- [ ] AC 3.1.2: Header mostra: icon, nome, tagline, seller (com avatar e badge), version, downloads, rating
- [ ] AC 3.1.3: Descricao renderizada como Markdown (usa react-markdown ja instalado)
- [ ] AC 3.1.4: Secao Capabilities mostra lista de capabilities com icons
- [ ] AC 3.1.5: Secao Screenshots mostra galeria de imagens (click para expandir)
- [ ] AC 3.1.6: Secao Reviews mostra RatingBreakdown + lista de reviews recentes (5 mais recentes, load more)
- [ ] AC 3.1.7: Sidebar fixa mostra pricing card com CTA "Contratar" (sticky on scroll)
- [ ] AC 3.1.8: Secao "Agentes Similares" mostra 4 listings da mesma categoria
- [ ] AC 3.1.9: Breadcrumb: Marketplace > {Categoria} > {Nome do Agente}
- [ ] AC 3.1.10: SEO-friendly URL: `?view=marketplace-listing&slug=code-reviewer-pro`

### Tasks

- [ ] Criar `ListingDetail.tsx` com layout de 2 colunas (main + sidebar)
- [ ] Criar sub-componentes: ListingHeader, ListingCapabilities, ListingScreenshots, ListingReviews, ListingRelated
- [ ] Implementar `useMarketplaceListing.ts` hook
- [ ] Criar `ListingPricing.tsx` (sidebar card)
- [ ] Implementar markdown rendering
- [ ] Implementar gallery lightbox

### Dev Notes

- Layout: main content (70%) + pricing sidebar (30%) — sidebar sticky com `position: sticky; top: 80px`
- Markdown: usar `react-markdown` com `remark-gfm` e `rehype-raw` (ja instalados)
- Agentes similares: query `where category = listing.category and id != listing.id order by rating_avg desc limit 4`

---

## Story 3.2 — HireAgentModal: Fluxo de Contratacao

**Status:** Draft

**As a** buyer,
**I want** to hire an agent through a clear checkout flow,
**so that** I can start using the agent for my tasks.

### Acceptance Criteria

- [ ] AC 3.2.1: Modal abre ao clicar "Contratar" na ListingPricing
- [ ] AC 3.2.2: Per Task: campo para descrever a task + resumo de preco + botao "Pagar e Contratar"
- [ ] AC 3.2.3: Hourly: seletor de horas (1-40) + rate calculado + botao "Pagar e Contratar"
- [ ] AC 3.2.4: Monthly: selecao de periodo (mensal/trimestral/anual) + preco com desconto anual + botao "Assinar"
- [ ] AC 3.2.5: Credits: seletor de pacote (10/50/100 creditos) + preco + botao "Comprar Creditos"
- [ ] AC 3.2.6: Free: botao direto "Instalar Agente" sem pagamento
- [ ] AC 3.2.7: Resumo de pedido mostra: subtotal, comissao (transparente), total
- [ ] AC 3.2.8: Botao de pagamento redireciona para Stripe Checkout (ou ativa agente se free)
- [ ] AC 3.2.9: Apos pagamento confirmado: order criada, agente instanciado, redirect para MyPurchases
- [ ] AC 3.2.10: Loading state durante processamento de pagamento

### Tasks

- [ ] Criar `HireAgentModal.tsx` com tabs por pricing model
- [ ] Implementar formulario por tipo de contratacao
- [ ] Criar `useMarketplaceCheckout.ts` hook
- [ ] Implementar integracao Stripe Checkout (via Edge Function)
- [ ] Criar callback handler pos-pagamento
- [ ] Criar flow de agente free (sem pagamento)

### Dev Notes

- Stripe Checkout: nao implementar form de cartao customizado — usar Stripe Checkout hosted page
- Edge Function `marketplace-checkout`: recebe listing_id + order_type + params, cria Stripe Session, retorna URL
- Callback: URL de retorno com `?checkout=success&order_id=xxx` → handler atualiza order e instancia agente
- Free agents: criar order com subtotal=0 e status='active' diretamente

---

## Story 3.3 — MyPurchases: Painel de Compras do Buyer

**Status:** Draft

**As a** buyer,
**I want** a purchases dashboard showing all my hired agents,
**so that** I can manage my active agents and track order status.

### Acceptance Criteria

- [ ] AC 3.3.1: Lista de orders com tabs: "Ativos", "Concluidos", "Todos"
- [ ] AC 3.3.2: Cada order card mostra: agent icon/name, seller, order type, status, valor, data
- [ ] AC 3.3.3: Orders ativas mostram: progresso (task), horas usadas (hourly), dias restantes (subscription)
- [ ] AC 3.3.4: Click em order card abre OrderDetail
- [ ] AC 3.3.5: Botao "Usar Agente" em orders ativas abre o chat com o agente contratado
- [ ] AC 3.3.6: Filtros: por tipo de order, por status, por data
- [ ] AC 3.3.7: Empty state: "Voce ainda nao contratou nenhum agente. Explore o marketplace!"
- [ ] AC 3.3.8: Paginacao com load more

### Tasks

- [ ] Criar `MyPurchases.tsx` com tabs e lista
- [ ] Criar `OrderDetail.tsx` com timeline de status
- [ ] Implementar `useMarketplaceOrders.ts`
- [ ] Conectar "Usar Agente" ao chat system existente
- [ ] Implementar filtros e paginacao

### Dev Notes

- "Usar Agente": instancia o agente no chatStore (createSession com agentId = agent_instance_id)
- Timeline de status: pending → active → in_progress → completed (com timestamps)
- Para subscription: mostrar "Renova em {data}" ou "Expira em {data}"

---

## Story 3.4 — Agent Instantiation: Agente do Marketplace como Agente Nativo

**Status:** Draft

**As a** buyer,
**I want** hired marketplace agents to work like native AIOS agents,
**so that** I can use them in chat, orchestrations, and monitoring seamlessly.

### Acceptance Criteria

- [ ] AC 3.4.1: Quando order fica 'active', agent_config_snapshot e convertido em Agent type nativo
- [ ] AC 3.4.2: Agente instanciado aparece no AgentsMonitor com badge "Marketplace"
- [ ] AC 3.4.3: Agente disponivel no chat (pode ser selecionado como qualquer outro agente)
- [ ] AC 3.4.4: Agente pode ser usado em OrchestrationRequest (executar em workflows)
- [ ] AC 3.4.5: Agent ID gerado com prefixo `mkt-` para distinguir de agentes core
- [ ] AC 3.4.6: Status do agente reflete status da order (active=online, completed=offline, disputed=busy)
- [ ] AC 3.4.7: Quando order expira/cancela, agente e removido do ecossistema local
- [ ] AC 3.4.8: Metadata do agente inclui: marketplace_listing_id, order_id, seller_id

### Tasks

- [ ] Criar funcao `instantiateMarketplaceAgent(order)` em `src/lib/marketplace.ts`
- [ ] Mapear agent_config_snapshot para Agent interface
- [ ] Registrar agente no sistema de agentes local (hook/store)
- [ ] Adicionar badge "Marketplace" no AgentsMonitor
- [ ] Implementar lifecycle: activate on order active, deactivate on expire/cancel
- [ ] Testar uso em chat e orchestration

### Dev Notes

- agent_config_snapshot ja contem: persona, commands, capabilities, tier, squad_type
- Conversao: snapshot → Agent = spread snapshot + { id: `mkt-${orderId}`, status: 'online', squadType: snapshot.squad_type }
- Badge "Marketplace" no AgentsMonitor: condicional `if (agent.id.startsWith('mkt-'))` → CockpitBadge variant="blue"

---

## Story 3.5 — Dispute Flow

**Status:** Draft

**As a** buyer,
**I want** to open a dispute if an agent doesn't meet expectations,
**so that** I can get a resolution or refund.

### Acceptance Criteria

- [ ] AC 3.5.1: Botao "Abrir Disputa" disponivel em OrderDetail para orders ativas e concluidas (dentro de 15 dias)
- [ ] AC 3.5.2: DisputeForm com: selecao de razao, descricao obrigatoria, upload de evidencias
- [ ] AC 3.5.3: Disputa criada congela escrow (escrow_status='frozen')
- [ ] AC 3.5.4: Status timeline da disputa: Open → Seller Response → Mediation → Resolved
- [ ] AC 3.5.5: Seller pode responder com contra-argumentos (prazo de 3 dias)
- [ ] AC 3.5.6: Se seller nao responde em 3 dias: auto-resolve em favor do buyer (refund)
- [ ] AC 3.5.7: Admin pode mediar e resolver com refund total, parcial ou rejeicao
- [ ] AC 3.5.8: Resolucao atualiza escrow (release ou refund) e order status

### Tasks

- [ ] Criar `DisputeForm.tsx`
- [ ] Implementar dispute lifecycle no service layer
- [ ] Adicionar dispute status no OrderDetail
- [ ] Implementar auto-resolve por timeout (Edge Function com pg_cron)
- [ ] Testar fluxo completo

### Dev Notes

- Upload de evidencias: Supabase Storage bucket `dispute-evidence/`
- Auto-resolve: pg_cron job que roda diariamente e resolve disputas sem resposta apos 3 dias
- Razoes tipadas: 'non_delivery' | 'poor_quality' | 'not_as_described' | 'billing_error' | 'other'

---

# FASE 4 — Seller Side

**Objetivo:** Dashboard do vendedor, wizard de submissao e gestao de listings.
**Agente executor:** @dev (Dex)
**Sprint:** 7-8

---

## Story 4.1 — SellerOnboarding: Criacao de Perfil e Stripe Connect

**Status:** Draft

**As a** agent creator,
**I want** to create a seller profile and connect my Stripe account,
**so that** I can start selling agents on the marketplace.

### Acceptance Criteria

- [ ] AC 4.1.1: Formulario de perfil: display_name, slug (auto-generated from name), bio, avatar upload, company, website, github_url
- [ ] AC 4.1.2: Avatar upload para Supabase Storage bucket `seller-avatars/`
- [ ] AC 4.1.3: Slug unico validado em tempo real (debounce check de uniqueness)
- [ ] AC 4.1.4: Botao "Conectar Stripe" inicia Stripe Connect onboarding (Express mode)
- [ ] AC 4.1.5: Callback do Stripe atualiza `stripe_account_id` e `stripe_onboarded=true`
- [ ] AC 4.1.6: Perfil publico acessivel em `?view=marketplace-seller&slug={slug}`
- [ ] AC 4.1.7: Seller pode editar perfil a qualquer momento
- [ ] AC 4.1.8: Sem Stripe conectado: seller pode criar listings mas nao pode publicar paid ones

### Tasks

- [ ] Criar `SellerOnboarding.tsx` (multi-step: profile → stripe → done)
- [ ] Criar `SellerProfile.tsx` (view/edit mode)
- [ ] Implementar upload de avatar
- [ ] Integrar Stripe Connect Express via Edge Function
- [ ] Implementar slug validation
- [ ] Criar perfil publico view

### Dev Notes

- Stripe Connect Express: seller nao precisa construir dashboard proprio, Stripe fornece hosted dashboard
- Edge Function `marketplace-stripe-connect`: cria Account Link e retorna URL de onboarding
- Avatar: resize para 256x256 antes de upload (sharp no client ou Supabase transform)

---

## Story 4.2 — SubmitWizard: Submissao de Agente (Steps 1-3)

**Status:** Draft

**As a** seller,
**I want** a guided wizard to create an agent listing,
**so that** I can submit my agent for review with all required information.

### Acceptance Criteria

- [ ] AC 4.2.1: Wizard com progress bar mostrando 5 steps e step atual
- [ ] AC 4.2.2: Step 1 (Basic Info): nome, tagline, descricao (markdown editor), categoria (dropdown de SquadTypes), tags (multi-select), icon (Lucide picker), cover image upload, screenshots upload
- [ ] AC 4.2.3: Step 2 (Agent Config): persona fields (role, style, identity, background, focus), core principles (list editor), commands (table: name, action, description), capabilities (tag input)
- [ ] AC 4.2.4: Step 3 (Pricing): modelo (radio: free/per_task/hourly/monthly/credits), preco (input numerico), moeda (dropdown), credits_per_use (se credits), SLA fields (optional: response_ms, uptime_pct, max_tokens)
- [ ] AC 4.2.5: Validacao por step: nao avanca se campos obrigatorios estao vazios
- [ ] AC 4.2.6: Draft auto-save: dados salvos no marketplaceSubmissionStore a cada 5 segundos
- [ ] AC 4.2.7: Navegacao: "Anterior" e "Proximo" buttons, click no step na progress bar
- [ ] AC 4.2.8: Dados persistem entre sessoes (localStorage via Zustand persist)

### Tasks

- [ ] Criar `SubmitWizard.tsx` com step navigation
- [ ] Criar `StepBasicInfo.tsx`
- [ ] Criar `StepAgentConfig.tsx`
- [ ] Criar `StepPricing.tsx`
- [ ] Implementar validacao por step
- [ ] Implementar auto-save
- [ ] Implementar file uploads (cover, screenshots)

### Dev Notes

- Markdown editor: usar textarea com preview toggle (nao precisa de lib extra, react-markdown faz preview)
- Lucide icon picker: grid de icons mais populares (Code, Palette, Megaphone, etc.) com busca
- File uploads: Supabase Storage buckets `listing-covers/` e `listing-screenshots/`
- Commands editor: tabela editavel com add/remove row (similar ao kanban task list)

---

## Story 4.3 — SubmitWizard: Testing e Review (Steps 4-5)

**Status:** Draft

**As a** seller,
**I want** to test my agent before submitting and review all information,
**so that** I can ensure quality before entering the review queue.

### Acceptance Criteria

- [ ] AC 4.3.1: Step 4 (Testing): sandbox preview do agente — seller pode enviar mensagens de teste e ver respostas
- [ ] AC 4.3.2: Sandbox usa o agent_config do wizard para instanciar um agente temporario
- [ ] AC 4.3.3: 5 prompts sugeridos para teste aparecem como botoes quick-action
- [ ] AC 4.3.4: Resultado do teste mostra: resposta do agente, tempo de resposta, tokens usados
- [ ] AC 4.3.5: Step 5 (Review): resumo completo de todos os dados em read-only
- [ ] AC 4.3.6: Checklist pre-submissao (8 items) que seller marca manualmente
- [ ] AC 4.3.7: Botao "Submeter para Aprovacao" so ativa quando checklist completo
- [ ] AC 4.3.8: Submissao cria listing (status='pending_review') + submission record
- [ ] AC 4.3.9: Seller recebe confirmacao com estimativa de tempo de review (2-7 dias)
- [ ] AC 4.3.10: Apos submissao, wizard reseta e seller ve listing no SellerListings

### Tasks

- [ ] Criar `StepTesting.tsx` com sandbox chat
- [ ] Criar `StepReview.tsx` com resumo e checklist
- [ ] Implementar sandbox execution via Engine API
- [ ] Implementar submissao completa (listing + submission)
- [ ] Adicionar confirmacao e redirect

### Dev Notes

- Sandbox: usa endpoint `POST /marketplace/agent/sandbox` no Engine — executa agente temporario com timeout de 30s
- Prompts sugeridos: "Explique o que voce faz", "Resolva este problema: ...", "Quais sao suas limitacoes?", "Liste seus comandos", "Execute [comando principal]"
- Pre-submissao checklist: descricao clara, persona definida, pelo menos 1 comando, pricing definido, testei com 3+ prompts, screenshots adicionados, tags relevantes, li os termos de uso

---

## Story 4.4 — SellerDashboard: Visao Geral e Listings

**Status:** Draft

**As a** seller,
**I want** a dashboard showing my listings, sales, and performance,
**so that** I can manage my marketplace presence.

### Acceptance Criteria

- [ ] AC 4.4.1: Dashboard com tabs: Overview, Listings, Analytics, Payouts
- [ ] AC 4.4.2: Overview mostra KPIs: total revenue, vendas este mes, rating medio, listings ativos
- [ ] AC 4.4.3: Listings tab mostra todos os listings do seller com status badges
- [ ] AC 4.4.4: Cada listing mostra: nome, status, preco, rating, vendas, revenue
- [ ] AC 4.4.5: Acoes por listing: Editar, Ver, Suspender/Ativar, Submeter Nova Versao
- [ ] AC 4.4.6: Botao "Novo Agente" abre o SubmitWizard
- [ ] AC 4.4.7: Filtro por status (draft, pending, approved, rejected)
- [ ] AC 4.4.8: Quick action: responder reviews pendentes

### Tasks

- [ ] Criar `SellerDashboard.tsx` com tabs
- [ ] Criar `SellerListings.tsx` com lista e acoes
- [ ] Implementar KPIs com queries agregadas
- [ ] Conectar acoes (edit, suspend, new version)
- [ ] Implementar `useMarketplaceSeller.ts` hook

### Dev Notes

- KPIs: usar CockpitKpiCard components (ja existem)
- Revenue: sum(seller_payout) from transactions where seller_id = me and status = 'completed'
- Analytics e Payouts tabs serao implementados na Fase 6

---

## Story 4.5 — SellerAnalytics: Graficos e Metricas

**Status:** Draft

**As a** seller,
**I want** analytics showing views, conversions, and revenue trends,
**so that** I can optimize my listings.

### Acceptance Criteria

- [ ] AC 4.5.1: Grafico de linha: revenue por dia (ultimos 30 dias)
- [ ] AC 4.5.2: Grafico de barras: vendas por listing
- [ ] AC 4.5.3: Metricas de conversao: views → hires (por listing)
- [ ] AC 4.5.4: Rating trend: evolucao do rating medio ao longo do tempo
- [ ] AC 4.5.5: Top listings por revenue
- [ ] AC 4.5.6: Periodo selecionavel: 7d, 30d, 90d, all time

### Tasks

- [ ] Criar `SellerAnalytics.tsx`
- [ ] Implementar queries de aggregacao
- [ ] Criar graficos (reusar pattern de DashboardWorkspace se existir)
- [ ] Conectar seletor de periodo

### Dev Notes

- Se nao houver lib de charts no projeto: CSS-only bar charts ou adicionar recharts (lightweight)
- Downloads count: incrementado via Supabase trigger ou RPC function on listing view

---

## Story 4.6 — Review Queue: Fila de Aprovacao (Admin)

**Status:** Draft

**As a** marketplace admin,
**I want** a review queue to evaluate submitted agents,
**so that** I can approve or reject listings with a structured checklist.

### Acceptance Criteria

- [ ] AC 4.6.1: Lista de submissions com review_status='pending' ou 'in_review'
- [ ] AC 4.6.2: Cada card mostra: listing name, seller, version, submitted_at, auto_test_score
- [ ] AC 4.6.3: Click abre ReviewChecklist com 10 pontos interativos
- [ ] AC 4.6.4: Reviewer pode: testar agente no sandbox, ver agent_config completo, ver seller profile
- [ ] AC 4.6.5: Cada ponto do checklist: checkbox (pass/fail) + campo de notas
- [ ] AC 4.6.6: Score calculado automaticamente (pontos passados / 10)
- [ ] AC 4.6.7: Decisao: "Aprovar" (>= 7), "Rejeitar" (< 7 com razao), "Precisa Alteracoes" (feedback especifico)
- [ ] AC 4.6.8: Decisao atualiza submission + listing status + notifica seller
- [ ] AC 4.6.9: Historico de reviews anteriores do mesmo listing visivel

### Tasks

- [ ] Criar `ReviewQueue.tsx`
- [ ] Criar `ReviewCard.tsx`
- [ ] Criar `ReviewChecklist.tsx` com 10 items interativos
- [ ] Implementar sandbox test dentro do review
- [ ] Implementar decisao e notificacao
- [ ] Implementar historico de reviews

### Dev Notes

- 10 pontos do checklist (do PRD): schema_valid, metadata_complete, persona_defined, commands_documented, capabilities_realistic, pricing_coherent, sandbox_passed, security_clean, output_quality, documentation_adequate
- Sandbox no review: usa mesmo endpoint que StepTesting mas com context de reviewer
- Notificacao ao seller: por enquanto, status update visivel no SellerDashboard (push notifications sao v2)

---

# FASE 5 — Review Pipeline & Trust

**Objetivo:** Sistema de confianca com auto-review, user reviews, disputas e reputacao.
**Agente executor:** @dev (Dex) + @devops (Gage) para Edge Functions
**Sprint:** 9-10

---

## Story 5.1 — Auto-Review: Tier 1 Automatizado

**Status:** Draft

**As a** platform,
**I want** automated testing of submitted agents,
**so that** obvious quality issues are caught before manual review.

### Acceptance Criteria

- [ ] AC 5.1.1: Edge Function `marketplace-auto-review` criada
- [ ] AC 5.1.2: Valida schema do agent_config (campos obrigatorios, tipos corretos)
- [ ] AC 5.1.3: Valida metadata completeness (nome, descricao, categoria, pricing)
- [ ] AC 5.1.4: Scan de prompt injection na persona (padroes conhecidos de jailbreak)
- [ ] AC 5.1.5: Sandbox test: executa agente com 5 prompts padrao e avalia output (resposta coerente, sem erros, dentro do scope)
- [ ] AC 5.1.6: Score automatico (0-5) baseado nos resultados
- [ ] AC 5.1.7: Se score >= 3: encaminha para review manual (auto_test_status='passed')
- [ ] AC 5.1.8: Se score < 3: rejeita com feedback detalhado (auto_test_status='failed')
- [ ] AC 5.1.9: Resultados salvos em auto_test_results JSONB
- [ ] AC 5.1.10: Trigger automatico quando submission e criada

### Tasks

- [ ] Criar Edge Function em `supabase/functions/marketplace-auto-review/`
- [ ] Implementar schema validation
- [ ] Implementar prompt injection detection
- [ ] Implementar sandbox test execution
- [ ] Implementar scoring algorithm
- [ ] Configurar trigger via Supabase webhook ou pg_notify

### Dev Notes

- Prompt injection patterns: "ignore previous instructions", "you are now", "system prompt override", etc.
- Sandbox test: pode chamar Engine API ou executar inline com Anthropic API diretamente
- 5 prompts padrao: definir no Edge Function config (nao hardcoded)

---

## Story 5.2 — User Reviews: Rating e Comentarios

**Status:** Draft

**As a** buyer,
**I want** to review agents I've hired,
**so that** other buyers can benefit from my experience.

### Acceptance Criteria

- [ ] AC 5.2.1: Botao "Avaliar" aparece em orders com status 'completed' (sem review existente)
- [ ] AC 5.2.2: Review form: 5 estrelas interativas (overall), 4 dimensoes opcionais (quality, speed, value, accuracy), titulo, corpo texto
- [ ] AC 5.2.3: Reviews sao verified purchases (badge "Compra Verificada")
- [ ] AC 5.2.4: Seller pode responder cada review (uma resposta por review)
- [ ] AC 5.2.5: Reviews aparecem no ListingDetail com RatingBreakdown
- [ ] AC 5.2.6: Listing rating_avg e rating_count atualizados automaticamente (trigger ou RPC)
- [ ] AC 5.2.7: Buyer pode editar review nas primeiras 24h
- [ ] AC 5.2.8: Flag system: qualquer usuario pode reportar review abusiva

### Tasks

- [ ] Criar review form component
- [ ] Implementar CRUD de reviews no service layer
- [ ] Criar trigger/RPC para atualizar rating_avg no listing
- [ ] Implementar seller response flow
- [ ] Implementar flag/report system
- [ ] Integrar reviews no ListingDetail

### Dev Notes

- Rating aggregation: usar Supabase RPC function `update_listing_rating(listing_id)` que calcula AVG e COUNT
- Trigger: `AFTER INSERT OR UPDATE ON marketplace_reviews` → chama RPC

---

## Story 5.3 — Seller Levels e Badges

**Status:** Draft

**As a** seller,
**I want** to earn reputation badges based on my performance,
**so that** buyers trust my listings more.

### Acceptance Criteria

- [ ] AC 5.3.1: 4 niveis: Unverified, Verified, Pro, Enterprise
- [ ] AC 5.3.2: Verified: ID verificado (manual) + 5+ vendas completadas
- [ ] AC 5.3.3: Pro: 25+ vendas, 4.5+ rating avg, 90%+ orders completadas sem disputa
- [ ] AC 5.3.4: Enterprise: 100+ vendas + contrato formal + SLA compliance
- [ ] AC 5.3.5: Comissao reduz por nivel: Unverified/Verified=15%, Pro=12%, Enterprise=10%
- [ ] AC 5.3.6: Badge exibido no SellerBadge, listing cards e listing detail
- [ ] AC 5.3.7: Grace period: 30 dias antes de downgrade se metricas caem
- [ ] AC 5.3.8: Calculo de nivel roda semanalmente (pg_cron ou Edge Function)

### Tasks

- [ ] Implementar logica de calculo de nivel
- [ ] Criar Edge Function ou pg_cron para update semanal
- [ ] Atualizar commission_rate baseado no nivel
- [ ] Implementar grace period logic
- [ ] Exibir badges consistentemente em toda a UI

### Dev Notes

- Calculo: query orders + reviews + disputes por seller → determina nivel
- Grace period: campo `level_grace_until TIMESTAMPTZ` no seller_profiles
- Para v1: enterprise e manual (admin seta), unverified/verified/pro sao automaticos

---

## Story 5.4 — Escrow Management

**Status:** Draft

**As a** platform,
**I want** automated escrow handling for all paid orders,
**so that** buyers and sellers are protected.

### Acceptance Criteria

- [ ] AC 5.4.1: Todo pagamento cria transaction tipo 'escrow_hold'
- [ ] AC 5.4.2: Hold de 5 dias apos order 'completed'
- [ ] AC 5.4.3: Auto-release apos 5 dias sem disputa → 'escrow_release' transaction + seller payout
- [ ] AC 5.4.4: Disputa aberta durante hold → escrow_status='frozen' ate resolucao
- [ ] AC 5.4.5: Refund: escrow → buyer, transaction tipo 'refund'
- [ ] AC 5.4.6: Seller payout: Stripe Transfer para seller's Connect account
- [ ] AC 5.4.7: Dashboard mostra escrow status em cada order
- [ ] AC 5.4.8: Edge Function com pg_cron para auto-release diario

### Tasks

- [ ] Implementar escrow state machine
- [ ] Criar Edge Function para auto-release
- [ ] Implementar Stripe Transfer para payouts
- [ ] Criar transaction records para cada operacao
- [ ] Mostrar escrow status na UI

### Dev Notes

- Escrow state machine: none → held → released | frozen → released | refunded
- Auto-release query: `WHERE escrow_status='held' AND escrow_release_at <= now()`
- Stripe Transfer: `stripe.transfers.create({ amount, destination: seller.stripe_account_id })`

---

## Story 5.5 — Marketplace Notifications

**Status:** Draft

**As a** marketplace user (buyer or seller),
**I want** to receive notifications for important events,
**so that** I stay informed about orders, reviews, and submissions.

### Acceptance Criteria

- [ ] AC 5.5.1: Toast notifications no dashboard para eventos em tempo real
- [ ] AC 5.5.2: Eventos notificados (buyer): order status change, dispute update, escrow release
- [ ] AC 5.5.3: Eventos notificados (seller): new order, review received, submission status change, payout completed, dispute opened
- [ ] AC 5.5.4: Notification center (badge no sidebar com count de unread)
- [ ] AC 5.5.5: Notifications persistem no localStorage (ultimas 50)
- [ ] AC 5.5.6: Click na notification navega para a view relevante

### Tasks

- [ ] Extender toastStore para marketplace events
- [ ] Criar notification center component
- [ ] Implementar notification badge no sidebar
- [ ] Conectar eventos do Supabase Realtime (subscriptions)
- [ ] Implementar persistence e navigation

### Dev Notes

- Supabase Realtime: `supabase.channel('marketplace').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'marketplace_orders' }, handler)`
- Toast: usar toastStore existente (`src/stores/toastStore.ts`)
- Email notifications sao v2 (requerem email service)

---

## Story 5.6 — Marketplace Seed Data

**Status:** Draft

**As a** developer,
**I want** seed data with sample listings, sellers, and reviews,
**so that** the marketplace looks populated during development and demo.

### Acceptance Criteria

- [ ] AC 5.6.1: Script de seed cria 3 seller profiles (diferentes niveis)
- [ ] AC 5.6.2: 12+ listings cobrindo todas as categorias (SquadTypes)
- [ ] AC 5.6.3: Pelo menos 2 listings free, 4 per_task, 3 hourly, 2 monthly, 1 credits
- [ ] AC 5.6.4: 30+ reviews distribuidas entre listings (rating realista, nao tudo 5 estrelas)
- [ ] AC 5.6.5: 3 featured listings
- [ ] AC 5.6.6: Cada listing tem agent_config realista (persona, commands, capabilities)
- [ ] AC 5.6.7: Script idempotente (pode rodar multiplas vezes sem duplicar)
- [ ] AC 5.6.8: Seed inclui screenshots e covers usando placeholder images

### Tasks

- [ ] Criar `scripts/seed-marketplace.ts`
- [ ] Definir seller profiles de exemplo
- [ ] Definir listings com agent_configs realistas
- [ ] Gerar reviews com distribuicao realista de ratings
- [ ] Implementar idempotencia (upsert ou delete+insert)
- [ ] Documentar como rodar o seed

### Dev Notes

- agent_configs de exemplo: basear nos agentes AIOS core (dev, qa, architect, pm) mas com nomes e personas diferentes
- Ratings: distribuicao normal centrada em 4.2 (realista para marketplace)
- Categorias: garantir pelo menos 1 listing por SquadType
- Placeholder images: usar `https://placehold.co/` ou SVG inline

---

# FASE 6 — Payments & Analytics

**Objetivo:** Fluxo financeiro completo com Stripe e analytics para admin e sellers.
**Agente executor:** @dev (Dex) + @devops (Gage) para deploy
**Sprint:** 11-12

---

## Story 6.1 — Stripe Connect: Pagamentos End-to-End

**Status:** Draft

**As a** platform,
**I want** complete payment processing via Stripe Connect,
**so that** buyers can pay and sellers receive payouts automatically.

### Acceptance Criteria

- [ ] AC 6.1.1: Edge Function `marketplace-checkout` cria Stripe Checkout Session com line items
- [ ] AC 6.1.2: Edge Function `marketplace-webhook` processa eventos Stripe (checkout.session.completed, invoice.paid, charge.refunded)
- [ ] AC 6.1.3: Para tasks/hourly: pagamento unico via Checkout
- [ ] AC 6.1.4: Para monthly: Stripe Subscription com billing automatico
- [ ] AC 6.1.5: Application fee (comissao) configurada no Checkout (`application_fee_amount` ou `application_fee_percent`)
- [ ] AC 6.1.6: Payout automatico via Stripe Connect (seller recebe no connected account)
- [ ] AC 6.1.7: Refunds processados via Stripe Refund API
- [ ] AC 6.1.8: Transaction records criados para cada evento financeiro
- [ ] AC 6.1.9: Webhook signature verification para seguranca
- [ ] AC 6.1.10: Retry logic para webhooks falhados

### Tasks

- [ ] Criar Edge Function `marketplace-checkout`
- [ ] Criar Edge Function `marketplace-webhook`
- [ ] Implementar Stripe Connect application fee
- [ ] Implementar subscription handling
- [ ] Implementar refund flow
- [ ] Criar transaction records
- [ ] Configurar webhook endpoint no Stripe Dashboard
- [ ] Testar com Stripe Test Mode

### Dev Notes

- Stripe Connect mode: Express (simplifica onboarding do seller)
- Application fee: `payment_intent_data.application_fee_amount` no Checkout Session
- Webhook events essenciais: `checkout.session.completed`, `invoice.paid`, `charge.refunded`, `customer.subscription.deleted`
- Seguranca: `stripe.webhooks.constructEvent(body, sig, secret)`

---

## Story 6.2 — Seller Payouts Dashboard

**Status:** Draft

**As a** seller,
**I want** a payouts dashboard showing my earnings and transfer history,
**so that** I can track my income from the marketplace.

### Acceptance Criteria

- [ ] AC 6.2.1: Tab "Payouts" no SellerDashboard
- [ ] AC 6.2.2: KPIs: saldo disponivel, total recebido, pendente (em escrow), proximos payouts
- [ ] AC 6.2.3: Lista de transacoes: data, tipo, valor, status, order reference
- [ ] AC 6.2.4: Filtro por periodo e tipo de transacao
- [ ] AC 6.2.5: Link para Stripe Express Dashboard (hosted) para detalhes bancarios
- [ ] AC 6.2.6: Grafico de earnings por mes (ultimos 6 meses)

### Tasks

- [ ] Criar `SellerPayouts.tsx`
- [ ] Implementar queries de transacoes por seller
- [ ] Criar KPI cards
- [ ] Implementar grafico de earnings
- [ ] Integrar link para Stripe Express Dashboard

### Dev Notes

- Saldo disponivel: sum(transactions where type='payout' and status='completed') - sum(refunds)
- Stripe Express Dashboard URL: `stripe.accounts.createLoginLink(seller.stripe_account_id)`

---

## Story 6.3 — Marketplace Analytics (Admin)

**Status:** Draft

**As a** platform admin,
**I want** marketplace-wide analytics,
**so that** I can monitor marketplace health and growth.

### Acceptance Criteria

- [ ] AC 6.3.1: Dashboard admin com KPIs: GMV total, comissoes, listings ativos, sellers ativos, buyers ativos
- [ ] AC 6.3.2: Graficos: GMV por dia/semana/mes, novos listings por semana, novos sellers por semana
- [ ] AC 6.3.3: Top 10 listings por revenue
- [ ] AC 6.3.4: Top 10 sellers por revenue
- [ ] AC 6.3.5: Taxa de conversao global (views → hires)
- [ ] AC 6.3.6: Taxa de disputas
- [ ] AC 6.3.7: Distribution de ratings
- [ ] AC 6.3.8: Review queue status (pendentes, tempo medio de review)

### Tasks

- [ ] Criar componente admin analytics (dentro de marketplace-review ou view separada)
- [ ] Implementar queries agregadas
- [ ] Criar graficos
- [ ] Adicionar periodo selecionavel

### Dev Notes

- Admin view: pode ser tab adicional no `marketplace-review` ou nova view `marketplace-admin`
- GMV: sum(subtotal) from orders where status in ('completed', 'active')
- Se performance de queries for issue: criar materialized view ou stats rollup table com Edge Function noturna

---

## Story 6.4 — Polish: Onboarding, Empty States e Tutoriais

**Status:** Draft

**As a** new user,
**I want** clear onboarding and contextual help,
**so that** I understand how to use the marketplace as buyer or seller.

### Acceptance Criteria

- [ ] AC 6.4.1: First-visit banner no MarketplaceBrowse: "Bem-vindo ao Marketplace! Explore agentes ou venda os seus."
- [ ] AC 6.4.2: Empty states informativos em todas as listas vazias
- [ ] AC 6.4.3: Tooltips em features nao-obvias (escrow, seller levels, SLA)
- [ ] AC 6.4.4: "Como funciona" section no MarketplaceBrowse (3 steps: Browse → Hire → Use)
- [ ] AC 6.4.5: Seller onboarding checklist (profile, stripe, first listing)
- [ ] AC 6.4.6: Animacoes suaves (Framer Motion) em transicoes de view
- [ ] AC 6.4.7: Performance: Lighthouse score > 80 para marketplace views
- [ ] AC 6.4.8: Responsividade testada em mobile, tablet e desktop

### Tasks

- [ ] Criar banner e onboarding components
- [ ] Revisar todos os empty states
- [ ] Adicionar tooltips
- [ ] Criar "Como funciona" section
- [ ] Performance audit e otimizacao
- [ ] Teste de responsividade
- [ ] Teste de acessibilidade (a11y audit)

### Dev Notes

- Banner: usar `localStorage.getItem('marketplace-onboarded')` para mostrar so na primeira visita
- Performance: garantir que MarketplaceGrid usa virtual scroll para > 20 items
- a11y: todos os componentes de marketplace devem passar no axe-core audit

---

## Resumo de Stories por Fase

| Fase | Stories | Foco |
|------|---------|------|
| **1. Foundation** | 1.1 - 1.6 | Schema, types, stores, services, shared components, routing |
| **2. Browse & Discovery** | 2.1 - 2.4 | Catalogo, filtros, busca FTS, featured, categorias |
| **3. Listing Detail & Hire** | 3.1 - 3.5 | Pagina de detalhe, contratacao, compras, instanciacao, disputas |
| **4. Seller Side** | 4.1 - 4.6 | Onboarding, wizard, dashboard, analytics, review queue |
| **5. Trust & Review** | 5.1 - 5.6 | Auto-review, user reviews, seller levels, escrow, notifications, seed |
| **6. Payments & Analytics** | 6.1 - 6.4 | Stripe Connect, payouts, admin analytics, polish |

**Total: 27 stories across 6 phases**
