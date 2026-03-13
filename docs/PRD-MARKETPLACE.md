# PRD — AIOS Agent Marketplace

**Versao:** 1.0
**Data:** 2026-03-10
**Autor:** @pm (Morgan) + @architect (Aria)
**Status:** Draft
**Epic Ref:** EPIC-MARKETPLACE

---

## 1. Visao Geral

### 1.1 Problema

O AIOS possui 50+ squads, 13 agentes core e um dashboard completo de orquestracao — mas opera como sistema fechado. Nao ha como:

- **Descobrir e contratar** agentes externos especializados para tarefas ou trabalho continuo
- **Monetizar agentes** criados por desenvolvedores/empresas vendendo-os a outros usuarios
- **Escalar a rede de agentes** alem dos agentes core pre-definidos
- **Avaliar qualidade** de agentes de terceiros antes de contrata-los
- **Gerenciar transacoes** entre compradores e vendedores de agentes

O mercado de AI agent marketplaces esta projetado em **$52.62B ate 2030** (46.3% CAGR), e nenhuma plataforma domina ainda — o que cria uma janela de oportunidade real.

### 1.2 Objetivo

Construir um **Marketplace de Agentes de duas vias** integrado ao dashboard AIOS Platform que:

1. **Lado Comprador:** Permita descobrir, avaliar e contratar agentes do marketplace para executar tasks ou trabalhar por hora/mes
2. **Lado Vendedor:** Permita submeter agentes para aprovacao, publicar listings e receber pagamentos por vendas/contratacoes
3. **Plataforma:** Gerencie aprovacao, qualidade, disputas e capture comissao sobre transacoes

### 1.3 Principio Fundamental: Agente e Cidadao de Primeira Classe

Um agente contratado do marketplace se torna **indistinguivel** de um agente nativo do ecossistema AIOS. Ele usa os mesmos types (`Agent`, `AgentSummary`, `ExecuteRequest`), executa no mesmo engine, aparece no mesmo dashboard. O marketplace e o canal de aquisicao — nao um sistema paralelo.

### 1.4 Stack Tecnologica

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Frontend | React 19 + TypeScript + Zustand | Mesmo stack do dashboard, zero overhead |
| Backend | Supabase (PostgreSQL + Auth + Storage + RLS) | Ja usado para `orchestration_tasks`, zero infra extra |
| Pagamentos | Stripe Connect | Standard para marketplaces, split automatico buyer→platform→seller |
| Busca | Supabase Full Text Search | Suficiente para v1, migra para Meilisearch se necessario |
| Storage | Supabase Storage | Avatars, covers, agent bundles |
| Execucao | Engine AIOS existente | Agentes do marketplace rodam no mesmo engine |
| Cache | React Query (TanStack) | Pattern ja estabelecido no codebase |
| UI | Cockpit AIOX theme + Glass components | Consistente com o design system existente |

---

## 2. Questionamentos Criticos (Pre-Decisoes)

### Q1: Marketplace integrado no dashboard ou plataforma separada?

**Decisao: Integrado.**
- O dashboard ja tem 30+ views com lazy loading e pattern de viewMap estabelecido.
- Integrar ao dashboard permite que agentes contratados aparecam naturalmente no ecossistema (AgentsMonitor, Chat, Orchestration).
- Plataforma separada exigiria duplicar auth, theme, types e criaria experiencia fragmentada.
- Tradeoff: aumenta o tamanho do SPA, mas com code splitting o impacto no bundle e minimo.

### Q2: Supabase vs backend customizado para o marketplace?

**Decisao: Supabase.**
- Ja esta configurado e funcionando para `orchestration_tasks` (ref: `frloupauwahdmzfzrepx`).
- PostgreSQL oferece Full Text Search, JSONB, RLS, triggers — suficiente para marketplace v1.
- Auth integrado (magic link, social, email/password).
- Storage para arquivos (agent bundles, avatars, covers).
- Evita construir e manter API REST customizada para CRUD basico.
- Se escalar: pode adicionar Edge Functions para logica complexa sem migrar dados.

### Q3: Stripe Connect vs sistema de creditos proprio?

**Decisao: Stripe Connect para pagamentos reais, creditos internos como opcao de pricing.**
- Stripe Connect e o padrao para marketplaces (Fiverr, Upwork, Airbnb usam).
- Split payment automatico: buyer paga → plataforma retira comissao → seller recebe.
- Compliance financeiro (KYC, anti-fraude) delegado ao Stripe.
- Creditos internos sao um modelo de pricing (como tokens), nao substituem o gateway de pagamento.
- Tradeoff: custos de processamento (~2.9% + R$1.49 por transacao), mas elimina responsabilidade financeira.

### Q4: Agentes executam no infra do buyer ou da plataforma?

**Decisao: No infra do buyer (via Engine AIOS local).**
- O Engine AIOS ja roda local (PRD-AGENT-EXECUTION-ENGINE).
- Agente do marketplace e um config bundle (persona + commands + capabilities) que o Engine instancia.
- Sem custo de infra para a plataforma. Sem preocupacao com latencia de cloud.
- O buyer ja tem Claude Max — execucao usa a cota inclusa.
- Tradeoff: a plataforma nao controla qualidade de execucao em runtime. Mitiga via reviews + sandbox pre-aprovacao.

### Q5: Como garantir qualidade de agentes submetidos?

**Decisao: Pipeline de 3 camadas (automatico + manual + comunidade).**
- **Tier 1 — Automatico (24-48h):** Validacao de schema, metadata, prompt injection scan, sandbox test com prompts padrao.
- **Tier 2 — Manual (2-7 dias):** Reviewer humano verifica qualidade de output, persona consistency, documentation.
- **Tier 3 — Comunidade (continuo):** Reviews, ratings e reports de usuarios pos-compra.
- Inspirado em Apple App Store (automated + human review) + Fiverr (ongoing community moderation).
- Score de aprovacao: >= 7/10 no checklist de 10 pontos.

### Q6: Modelo de comissao?

**Decisao: 15% base, regressivo por tier do seller.**
- New seller: 15% comissao.
- Verified seller: 15% (mesmo, mas com badge de confianca).
- Pro seller: 12% (25+ vendas, 4.5+ rating).
- Enterprise seller: 10% (100+ vendas, contrato formal).
- Comissao aplicada sobre o valor total da transacao.
- Justificativa: Fiverr cobra 20% fixo, Upwork cobra 5-8% do buyer. 15% regressivo incentiva sellers a crescer na plataforma.

### Q7: Categorias do marketplace = SquadTypes existentes?

**Decisao: Sim, com extensao.**
- As 11 SquadTypes existentes (`development`, `design`, `marketing`, etc.) mapeiam naturalmente para categorias de marketplace.
- Adicionar subcategorias via tags (ex: `development` > tags: `react`, `python`, `devops`).
- Manter pattern existente de `getSquadType()` e theme mapping — agentes do marketplace herdam a mesma estetica visual.
- Novas categorias futuras (ex: `finance`, `legal`, `healthcare`) adicionam-se ao SquadType.

### Q8: Free tier — permitir agentes gratuitos?

**Decisao: Sim.**
- Agentes gratuitos resolvem o "chicken-and-egg problem" — atraem buyers que depois pagam por premium.
- Sellers usam free tier como showcase/portfolio.
- Nao ha custo de infra para a plataforma (execucao e local no buyer).
- Agentes free ainda passam por aprovacao (qualidade minima).
- Limite: seller pode ter ate 3 listings free simultaneos.

### Q9: Escrow ou pagamento direto?

**Decisao: Escrow com hold de 5 dias.**
- Pesquisa mostra que escrow reduz disputas em ~72% (Lock Trust case study).
- Fluxo: Buyer paga → Stripe retém → Task concluída → 5 dias hold → Seller recebe.
- Para assinaturas mensais: escrow nao se aplica, pagamento recorrente normal via Stripe.
- Se disputa aberta durante hold: fundos congelados ate resolucao.

### Q10: Suporte a multi-agent compositions (agente que chama outro agente)?

**Decisao: Sim, mas v2.**
- v1 foca em agentes individuais (single listing = single agent).
- v2 permitira "agent packs" (bundles de agentes que colaboram) e agent-to-agent orchestration.
- Compativel com MCP e A2A protocols para composicao futura.
- O OrchestrationRequest existente ja suporta DAG multi-agente — a extensao e natural.

---

## 3. Arquitetura

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                            AIOS PLATFORM SPA                                  │
│                                                                               │
│  ┌─────────────┐  ┌──────────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Dashboard   │  │   Marketplace    │  │ Agent Studio  │  │ Review Queue │  │
│  │  (existing)  │  │   Browse/Hire    │  │ Submit/Sell   │  │ (admin)      │  │
│  └──────┬───────┘  └───────┬──────────┘  └──────┬────────┘  └──────┬───────┘  │
│         │                  │                     │                  │          │
│  ┌──────▼──────────────────▼─────────────────────▼──────────────────▼───────┐  │
│  │                      ZUSTAND STORES + REACT QUERY                        │  │
│  │  marketplaceStore | marketplaceSellerStore | marketplaceOrderStore        │  │
│  └──────────────────────────────┬───────────────────────────────────────────┘  │
│                                 │                                              │
│  ┌──────────────────────────────▼───────────────────────────────────────────┐  │
│  │                   SERVICE LAYER (src/services/)                           │  │
│  │  supabase/marketplace.ts — listings, orders, reviews, submissions        │  │
│  │  api/marketplace.ts — engine-side operations (execution, sandbox test)    │  │
│  └──────────────────────────────┬───────────────────────────────────────────┘  │
└─────────────────────────────────┼────────────────────────────────────────────┘
                                  │
┌─────────────────────────────────▼────────────────────────────────────────────┐
│                         SUPABASE BACKEND                                      │
│                                                                               │
│  ┌────────────────┐  ┌────────────────────┐  ┌──────────────────────────┐    │
│  │  PostgreSQL     │  │  Auth              │  │  Storage                 │    │
│  │                 │  │                    │  │                          │    │
│  │  seller_profiles│  │  magic link        │  │  avatars/               │    │
│  │  listings       │  │  social (Google,   │  │  covers/                │    │
│  │  submissions    │  │   GitHub)          │  │  agent-bundles/         │    │
│  │  orders         │  │  email/password    │  │  screenshots/           │    │
│  │  reviews        │  │                    │  │                          │    │
│  │  transactions   │  │  RLS policies      │  │                          │    │
│  │  disputes       │  │  per-user access   │  │                          │    │
│  └────────┬────────┘  └────────────────────┘  └──────────────────────────┘    │
│           │                                                                   │
│  ┌────────▼────────────────────────────────────────────────────────────────┐  │
│  │  Edge Functions (v2)                                                    │  │
│  │  - Approval automation    - Webhook handlers    - Analytics rollup      │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────────┘
                                  │
┌─────────────────────────────────▼────────────────────────────────────────────┐
│                       STRIPE CONNECT                                          │
│                                                                               │
│  Buyer Payment ──▶ Platform Fee (15%) ──▶ Seller Payout                      │
│  Escrow (5-day hold) ──▶ Auto-release or Dispute freeze                      │
│  Subscriptions ──▶ Recurring billing ──▶ Auto-split                          │
└───────────────────────────────────────────────────────────────────────────────┘
                                  │
┌─────────────────────────────────▼────────────────────────────────────────────┐
│                    AIOS ENGINE (existing)                                      │
│                                                                               │
│  Agent do marketplace instanciado como agente nativo:                         │
│  marketplace listing.agent_config ──▶ Agent type ──▶ ExecuteRequest           │
│  Executa no engine local do buyer com mesma infra dos agentes core            │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Modelo de Dados (Supabase PostgreSQL)

### 4.1 seller_profiles

```sql
CREATE TABLE seller_profiles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name      TEXT NOT NULL,
  slug              TEXT UNIQUE NOT NULL,
  avatar_url        TEXT,
  bio               TEXT,
  company           TEXT,
  website           TEXT,
  github_url        TEXT,
  verification      TEXT NOT NULL DEFAULT 'unverified'
                    CHECK (verification IN ('unverified','verified','pro','enterprise')),
  rating_avg        DECIMAL(3,2) DEFAULT 0,
  review_count      INTEGER DEFAULT 0,
  total_sales       INTEGER DEFAULT 0,
  total_revenue     DECIMAL(12,2) DEFAULT 0,
  stripe_account_id TEXT,
  stripe_onboarded  BOOLEAN DEFAULT false,
  commission_rate   DECIMAL(4,2) DEFAULT 15.00,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX idx_seller_profiles_user ON seller_profiles(user_id);
CREATE INDEX idx_seller_profiles_slug ON seller_profiles(slug);
CREATE INDEX idx_seller_profiles_verification ON seller_profiles(verification);
```

### 4.2 marketplace_listings

```sql
CREATE TABLE marketplace_listings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id         UUID NOT NULL REFERENCES seller_profiles(id) ON DELETE CASCADE,
  slug              TEXT UNIQUE NOT NULL,
  -- Identity
  name              TEXT NOT NULL,
  tagline           TEXT NOT NULL,
  description       TEXT NOT NULL,
  category          TEXT NOT NULL,
  tags              TEXT[] DEFAULT '{}',
  icon              TEXT,
  cover_image_url   TEXT,
  screenshots       TEXT[] DEFAULT '{}',
  -- Agent Configuration (the product)
  agent_config      JSONB NOT NULL,
  agent_tier        SMALLINT NOT NULL DEFAULT 2
                    CHECK (agent_tier IN (0, 1, 2)),
  squad_type        TEXT NOT NULL DEFAULT 'default',
  capabilities      TEXT[] DEFAULT '{}',
  supported_models  TEXT[] DEFAULT '{"claude-sonnet-4-6"}',
  required_tools    TEXT[] DEFAULT '{}',
  required_mcps     TEXT[] DEFAULT '{}',
  -- Pricing
  pricing_model     TEXT NOT NULL DEFAULT 'per_task'
                    CHECK (pricing_model IN ('free','per_task','hourly','monthly','credits')),
  price_amount      DECIMAL(10,2) DEFAULT 0,
  price_currency    TEXT DEFAULT 'BRL',
  credits_per_use   INTEGER,
  -- SLA
  sla_response_ms   INTEGER,
  sla_uptime_pct    DECIMAL(5,2),
  sla_max_tokens    INTEGER,
  -- Stats (denormalized for performance)
  downloads         INTEGER DEFAULT 0,
  active_hires      INTEGER DEFAULT 0,
  rating_avg        DECIMAL(3,2) DEFAULT 0,
  rating_count      INTEGER DEFAULT 0,
  -- Status
  status            TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','pending_review','in_review','approved','rejected','suspended','archived')),
  rejection_reason  TEXT,
  featured          BOOLEAN DEFAULT false,
  featured_at       TIMESTAMPTZ,
  -- Versioning
  version           TEXT NOT NULL DEFAULT '1.0.0',
  changelog         TEXT,
  -- Timestamps
  published_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_listings_seller ON marketplace_listings(seller_id);
CREATE INDEX idx_listings_status ON marketplace_listings(status);
CREATE INDEX idx_listings_category ON marketplace_listings(category);
CREATE INDEX idx_listings_pricing ON marketplace_listings(pricing_model);
CREATE INDEX idx_listings_featured ON marketplace_listings(featured) WHERE featured = true;
CREATE INDEX idx_listings_rating ON marketplace_listings(rating_avg DESC);
CREATE INDEX idx_listings_slug ON marketplace_listings(slug);
CREATE INDEX idx_listings_fts ON marketplace_listings
  USING GIN (to_tsvector('portuguese', name || ' ' || tagline || ' ' || description));
```

### 4.3 marketplace_submissions

```sql
CREATE TABLE marketplace_submissions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id        UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  seller_id         UUID NOT NULL REFERENCES seller_profiles(id),
  -- Submission
  version           TEXT NOT NULL,
  changelog         TEXT,
  agent_bundle      JSONB NOT NULL,
  -- Automated Review (Tier 1)
  auto_test_status  TEXT DEFAULT 'pending'
                    CHECK (auto_test_status IN ('pending','running','passed','failed')),
  auto_test_results JSONB,
  auto_test_score   DECIMAL(4,2),
  -- Manual Review (Tier 2)
  reviewer_id       UUID REFERENCES auth.users(id),
  review_status     TEXT NOT NULL DEFAULT 'pending'
                    CHECK (review_status IN ('pending','in_review','approved','rejected','needs_changes')),
  review_notes      TEXT,
  review_checklist  JSONB DEFAULT '{
    "schema_valid": null,
    "metadata_complete": null,
    "persona_defined": null,
    "commands_documented": null,
    "capabilities_realistic": null,
    "pricing_coherent": null,
    "sandbox_passed": null,
    "security_clean": null,
    "output_quality": null,
    "documentation_adequate": null
  }'::jsonb,
  review_score      DECIMAL(4,2),
  -- Timestamps
  submitted_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at       TIMESTAMPTZ
);

CREATE INDEX idx_submissions_listing ON marketplace_submissions(listing_id);
CREATE INDEX idx_submissions_status ON marketplace_submissions(review_status);
CREATE INDEX idx_submissions_seller ON marketplace_submissions(seller_id);
```

### 4.4 marketplace_orders

```sql
CREATE TABLE marketplace_orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id            UUID NOT NULL REFERENCES auth.users(id),
  listing_id          UUID NOT NULL REFERENCES marketplace_listings(id),
  seller_id           UUID NOT NULL REFERENCES seller_profiles(id),
  -- Order Type
  order_type          TEXT NOT NULL
                      CHECK (order_type IN ('task','hourly','subscription','credits')),
  status              TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','active','in_progress','completed','cancelled','disputed','refunded')),
  -- Task-based
  task_description    TEXT,
  task_deliverables   JSONB,
  -- Hourly-based
  hours_contracted    DECIMAL(6,2),
  hours_used          DECIMAL(6,2) DEFAULT 0,
  hourly_rate         DECIMAL(10,2),
  -- Subscription
  subscription_period TEXT CHECK (subscription_period IN ('monthly','quarterly','yearly')),
  subscription_start  TIMESTAMPTZ,
  subscription_end    TIMESTAMPTZ,
  auto_renew          BOOLEAN DEFAULT true,
  -- Credits
  credits_purchased   INTEGER,
  credits_remaining   INTEGER,
  -- Financials
  subtotal            DECIMAL(12,2) NOT NULL,
  platform_fee        DECIMAL(12,2) NOT NULL,
  seller_payout       DECIMAL(12,2) NOT NULL,
  currency            TEXT DEFAULT 'BRL',
  -- Escrow
  escrow_status       TEXT DEFAULT 'none'
                      CHECK (escrow_status IN ('none','held','released','frozen','refunded')),
  escrow_release_at   TIMESTAMPTZ,
  -- Stripe
  stripe_payment_id   TEXT,
  stripe_subscription_id TEXT,
  -- Agent Instance (once hired, the agent config snapshot)
  agent_instance_id   TEXT,
  agent_config_snapshot JSONB,
  -- Timestamps
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at          TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_buyer ON marketplace_orders(buyer_id);
CREATE INDEX idx_orders_seller ON marketplace_orders(seller_id);
CREATE INDEX idx_orders_listing ON marketplace_orders(listing_id);
CREATE INDEX idx_orders_status ON marketplace_orders(status);
CREATE INDEX idx_orders_escrow ON marketplace_orders(escrow_status) WHERE escrow_status = 'held';
```

### 4.5 marketplace_reviews

```sql
CREATE TABLE marketplace_reviews (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            UUID NOT NULL REFERENCES marketplace_orders(id),
  listing_id          UUID NOT NULL REFERENCES marketplace_listings(id),
  reviewer_id         UUID NOT NULL REFERENCES auth.users(id),
  -- Ratings (1-5)
  rating_overall      SMALLINT NOT NULL CHECK (rating_overall BETWEEN 1 AND 5),
  rating_quality      SMALLINT CHECK (rating_quality BETWEEN 1 AND 5),
  rating_speed        SMALLINT CHECK (rating_speed BETWEEN 1 AND 5),
  rating_value        SMALLINT CHECK (rating_value BETWEEN 1 AND 5),
  rating_accuracy     SMALLINT CHECK (rating_accuracy BETWEEN 1 AND 5),
  -- Content
  title               TEXT,
  body                TEXT,
  -- Seller Response
  seller_response     TEXT,
  seller_responded_at TIMESTAMPTZ,
  -- Moderation
  is_verified_purchase BOOLEAN DEFAULT true,
  is_flagged           BOOLEAN DEFAULT false,
  flag_reason          TEXT,
  -- Timestamps
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(order_id, reviewer_id)
);

CREATE INDEX idx_reviews_listing ON marketplace_reviews(listing_id);
CREATE INDEX idx_reviews_reviewer ON marketplace_reviews(reviewer_id);
CREATE INDEX idx_reviews_rating ON marketplace_reviews(rating_overall);
```

### 4.6 marketplace_transactions

```sql
CREATE TABLE marketplace_transactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID NOT NULL REFERENCES marketplace_orders(id),
  type              TEXT NOT NULL
                    CHECK (type IN ('payment','refund','payout','platform_fee','escrow_hold','escrow_release')),
  amount            DECIMAL(12,2) NOT NULL,
  currency          TEXT DEFAULT 'BRL',
  stripe_id         TEXT,
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','processing','completed','failed','cancelled')),
  description       TEXT,
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at      TIMESTAMPTZ
);

CREATE INDEX idx_transactions_order ON marketplace_transactions(order_id);
CREATE INDEX idx_transactions_type ON marketplace_transactions(type);
CREATE INDEX idx_transactions_status ON marketplace_transactions(status);
```

### 4.7 marketplace_disputes

```sql
CREATE TABLE marketplace_disputes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID NOT NULL REFERENCES marketplace_orders(id),
  opened_by         UUID NOT NULL REFERENCES auth.users(id),
  -- Dispute
  reason            TEXT NOT NULL
                    CHECK (reason IN ('non_delivery','poor_quality','not_as_described','billing_error','other')),
  description       TEXT NOT NULL,
  evidence          JSONB DEFAULT '[]',
  -- Resolution
  status            TEXT NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open','seller_response','mediation','resolved','escalated')),
  resolution        TEXT,
  resolved_amount   DECIMAL(12,2),
  resolved_by       UUID REFERENCES auth.users(id),
  -- Timestamps
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  seller_responded_at TIMESTAMPTZ,
  resolved_at       TIMESTAMPTZ
);

CREATE INDEX idx_disputes_order ON marketplace_disputes(order_id);
CREATE INDEX idx_disputes_status ON marketplace_disputes(status);
```

### 4.8 RLS Policies

```sql
-- seller_profiles: users can read all, update own
ALTER TABLE seller_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view seller profiles" ON seller_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON seller_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON seller_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- listings: anyone can read approved, sellers manage own
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view approved listings" ON marketplace_listings
  FOR SELECT USING (status = 'approved' OR seller_id IN (SELECT id FROM seller_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Sellers manage own listings" ON marketplace_listings
  FOR ALL USING (seller_id IN (SELECT id FROM seller_profiles WHERE user_id = auth.uid()));

-- orders: buyer and seller can see their orders
ALTER TABLE marketplace_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own orders" ON marketplace_orders
  FOR SELECT USING (buyer_id = auth.uid() OR seller_id IN (SELECT id FROM seller_profiles WHERE user_id = auth.uid()));

-- reviews: anyone can read, only verified buyers write
ALTER TABLE marketplace_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view reviews" ON marketplace_reviews FOR SELECT USING (true);
CREATE POLICY "Buyers can write reviews" ON marketplace_reviews
  FOR INSERT WITH CHECK (reviewer_id = auth.uid());
```

---

## 5. Endpoints e Service Layer

Como o marketplace usa Supabase diretamente (client-side), a maioria das operacoes sao queries diretas. As operacoes que requerem logica server-side usam Supabase Edge Functions.

### 5.1 Supabase Direct (via supabase/marketplace.ts)

```
-- Listings
SELECT  listings WHERE status='approved', filters, FTS          Browse/search
SELECT  listings WHERE id=:id                                    Listing detail
INSERT  listings                                                  Create draft
UPDATE  listings SET status='pending_review'                     Submit for review
SELECT  listings WHERE seller_id=:me                             My listings (seller)

-- Orders
INSERT  orders                                                    Hire agent
SELECT  orders WHERE buyer_id=:me                                My purchases
SELECT  orders WHERE seller_id=:me                               My sales (seller)
UPDATE  orders SET status=:status                                Update order status

-- Reviews
INSERT  reviews                                                   Submit review
SELECT  reviews WHERE listing_id=:id                             Listing reviews
UPDATE  reviews SET seller_response=:text                        Seller respond

-- Seller
INSERT  seller_profiles                                           Create seller profile
UPDATE  seller_profiles                                           Update profile
SELECT  seller_profiles WHERE slug=:slug                         Public seller page

-- Submissions
INSERT  submissions                                               Submit agent for review
SELECT  submissions WHERE review_status='pending'                Review queue (admin)
UPDATE  submissions SET review_status=:status                    Review decision (admin)
```

### 5.2 Supabase Edge Functions (server-side logic)

```
POST   /functions/v1/marketplace-checkout          Stripe checkout session creation
POST   /functions/v1/marketplace-webhook           Stripe webhook handler
POST   /functions/v1/marketplace-payout            Trigger seller payout
POST   /functions/v1/marketplace-auto-review       Automated submission testing (Tier 1)
POST   /functions/v1/marketplace-stats-rollup      Nightly stats aggregation
```

### 5.3 Engine API (agent execution)

```
POST   /execute/marketplace-agent                  Execute hired marketplace agent
GET    /marketplace/agent/:instanceId/status       Agent instance status
POST   /marketplace/agent/:instanceId/sandbox      Sandbox test (pre-approval)
```

---

## 6. Fluxos de Execucao Detalhados

### 6.1 Fluxo Comprador: Descoberta e Contratacao

```
1. BROWSE
   Buyer abre view 'marketplace' no dashboard
   MarketplaceBrowse carrega listings aprovados via supabase query
   Filtros: categoria, pricing, rating, tags, busca textual

2. DISCOVER
   Grid de AgentCards com: nome, tagline, rating, preco, seller badge
   FeaturedAgents no topo (listings com featured=true)
   CategoryNav na lateral com contagem por categoria

3. EVALUATE
   Click no card → ListingDetail
   - Header: nome, seller, rating, downloads, versao
   - Capabilities: lista de capacidades do agente
   - Reviews: rating breakdown + comentarios recentes
   - Pricing: opcoes de contratacao (task, hourly, monthly)
   - Related: agentes similares na mesma categoria

4. HIRE
   Buyer seleciona modelo de pricing → HireAgent modal
   - Per Task: descreve a task, ve preco, confirma
   - Hourly: define horas, ve rate, confirma
   - Monthly: seleciona plano, ve preco mensal, confirma
   → Checkout via Stripe (Edge Function cria session)
   → Pagamento confirmado → Order criada com status 'active'
   → Escrow: fundos retidos por 5 dias

5. INSTANTIATE
   Order 'active' → agent_config_snapshot salvo no order
   Engine AIOS instancia o agente como Agent nativo:
   - Aparece no AgentsMonitor
   - Disponivel no Chat
   - Pode ser usado em Orchestrations
   - Usa mesmos types: Agent, ExecuteRequest, ExecuteResult

6. USE
   Buyer interage com o agente contratado normalmente
   Para hourly: timer roda, hours_used incrementa
   Para task: buyer marca como concluida quando satisfeito
   Para monthly: uso ilimitado ate subscription_end

7. COMPLETE
   Task concluida ou horas usadas → Order status 'completed'
   Escrow release: 5 dias apos conclusao → seller payout automatico
   Buyer pode submeter review (rating + comentario)
   Listing stats atualizados (downloads, rating_avg, rating_count)
```

### 6.2 Fluxo Vendedor: Submissao e Publicacao

```
1. ONBOARD
   Seller acessa view 'marketplace-seller' → SellerProfile
   - Cria perfil: nome, bio, avatar, links
   - Configura Stripe Connect (onboarding do Stripe)
   - Aceita termos de uso e comissao

2. CREATE LISTING
   Seller clica "Novo Agente" → SubmitWizard (5 steps)

   Step 1 — Basic Info:
   - Nome, tagline, descricao (markdown)
   - Categoria (SquadType), tags
   - Icon, cover image, screenshots

   Step 2 — Agent Config:
   - Persona (role, style, identity, background)
   - Core principles
   - Commands (name, action, description)
   - Capabilities
   - Voice DNA (optional)
   - Anti-patterns (optional)

   Step 3 — Pricing:
   - Modelo: free, per_task, hourly, monthly, credits
   - Preco e moeda
   - SLA (response time, uptime, max tokens) — optional

   Step 4 — Testing:
   - Preview do agente (sandbox local)
   - Testa com prompts exemplo
   - Ve output do agente em tempo real

   Step 5 — Review:
   - Resumo completo do listing
   - Checklist pre-submissao
   - Botao "Submeter para Aprovacao"

3. SUBMIT
   Listing status: 'draft' → 'pending_review'
   Submission record criado com agent_bundle completo
   Seller notificado que o review comecou

4. TIER 1 — AUTO REVIEW (24-48h)
   Edge Function marketplace-auto-review executa:
   - Schema validation (agent_config JSON valido?)
   - Metadata completeness (campos obrigatorios preenchidos?)
   - Prompt injection scan (persona tenta escapar sandbox?)
   - Sandbox test: executa agente com 5 prompts padrao, avalia output
   - Score automatico (0-5)
   Se falha: auto_test_status='failed', seller notificado com detalhes
   Se passa: auto_test_status='passed', encaminha para Tier 2

5. TIER 2 — MANUAL REVIEW (2-7 dias)
   Reviewer humano acessa 'marketplace-review' → ReviewQueue
   - Review checklist de 10 pontos
   - Testa agente manualmente
   - Avalia qualidade de output, persona consistency
   - Score manual (0-10)
   Se >= 7: review_status='approved'
   Se < 7: review_status='rejected' ou 'needs_changes' com notas

6. PUBLISH
   Listing status: 'pending_review' → 'approved'
   published_at = now()
   Listing aparece no browse publico
   Seller notificado do sucesso

7. ITERATE
   Seller pode:
   - Atualizar preco (imediato)
   - Atualizar descricao/tags (imediato)
   - Submeter nova versao do agente (re-review)
   - Ver analytics: views, hires, revenue, rating breakdown
   - Responder reviews
```

### 6.3 Fluxo de Disputa

```
1. OPEN
   Buyer abre disputa no OrderDetail → DisputeForm
   Seleciona razao, descreve problema, anexa evidencias
   Dispute status: 'open'
   Escrow congelado (escrow_status='frozen')

2. SELLER RESPONSE (3 dias)
   Seller notificado, pode responder com contra-argumentos
   Dispute status: 'seller_response'

3. MEDIATION (7 dias)
   Se nao resolvido entre partes:
   Dispute status: 'mediation'
   Admin reviewer avalia evidencias de ambos os lados
   Decisao: refund total, refund parcial, ou rejeicao da disputa

4. RESOLUTION
   Dispute status: 'resolved'
   Se refund: escrow → buyer, order status 'refunded'
   Se rejeitado: escrow → seller, order status 'completed'
   Ambas partes notificadas
```

---

## 7. Frontend: Views e Componentes

### 7.1 Novas Views (ViewType)

```typescript
// Adicionar ao ViewType em types/index.ts
| 'marketplace'            // Browse: catalogo com busca e filtros
| 'marketplace-listing'    // Detail: pagina do agente com reviews e pricing
| 'marketplace-purchases'  // Buyer: pedidos ativos e historico
| 'marketplace-seller'     // Seller: dashboard, listings, analytics, payouts
| 'marketplace-submit'     // Seller: wizard de submissao de agente
| 'marketplace-review'     // Admin: fila de aprovacao
```

### 7.2 Estrutura de Componentes

```
src/components/marketplace/
├── browse/
│   ├── MarketplaceBrowse.tsx           -- Pagina principal, grid + filtros
│   ├── MarketplaceGrid.tsx             -- Grid responsivo de AgentCards
│   ├── MarketplaceFilters.tsx          -- Sidebar: categoria, pricing, rating, tags
│   ├── MarketplaceSearch.tsx           -- Barra de busca com FTS
│   ├── CategoryNav.tsx                 -- Navegacao por categorias (SquadType)
│   └── FeaturedAgents.tsx              -- Carousel de agentes em destaque
├── listing/
│   ├── ListingDetail.tsx               -- Pagina completa do agente
│   ├── ListingHeader.tsx               -- Nome, seller, rating, stats
│   ├── ListingPricing.tsx              -- Opcoes de preco e CTA "Contratar"
│   ├── ListingCapabilities.tsx         -- Lista de capabilities + tools
│   ├── ListingReviews.tsx              -- Reviews com rating breakdown
│   ├── ListingScreenshots.tsx          -- Galeria de screenshots
│   └── ListingRelated.tsx              -- Agentes similares
├── seller/
│   ├── SellerDashboard.tsx             -- Overview: revenue, sales, listings
│   ├── SellerListings.tsx              -- CRUD de listings
│   ├── SellerAnalytics.tsx             -- Graficos: views, conversao, receita
│   ├── SellerPayouts.tsx               -- Historico de pagamentos Stripe
│   ├── SellerProfile.tsx               -- Editar perfil publico
│   └── SellerOnboarding.tsx            -- Setup Stripe Connect
├── submit/
│   ├── SubmitWizard.tsx                -- Wizard 5 steps
│   ├── StepBasicInfo.tsx               -- Step 1: nome, descricao, categoria
│   ├── StepAgentConfig.tsx             -- Step 2: persona, commands, capabilities
│   ├── StepPricing.tsx                 -- Step 3: modelo de pricing, preco
│   ├── StepTesting.tsx                 -- Step 4: sandbox preview
│   └── StepReview.tsx                  -- Step 5: revisao final
├── orders/
│   ├── MyPurchases.tsx                 -- Lista de compras do buyer
│   ├── OrderDetail.tsx                 -- Detalhe com status tracking
│   ├── HireAgentModal.tsx              -- Modal de contratacao
│   └── DisputeForm.tsx                 -- Formulario de disputa
├── review-queue/
│   ├── ReviewQueue.tsx                 -- Lista de submissions pendentes (admin)
│   ├── ReviewCard.tsx                  -- Card de submission com checklist
│   └── ReviewChecklist.tsx             -- 10-point checklist interativo
├── shared/
│   ├── AgentCard.tsx                   -- Card de agente para grid
│   ├── PriceBadge.tsx                  -- Badge de preco formatado
│   ├── RatingStars.tsx                 -- Componente de estrelas interativo
│   ├── RatingBreakdown.tsx             -- Distribuicao de ratings (bar chart)
│   ├── SellerBadge.tsx                 -- Badge: Verified, Pro, Enterprise
│   ├── CategoryBadge.tsx               -- Badge de categoria com cor do SquadType
│   ├── ListingStatusBadge.tsx          -- Badge de status: draft, approved, etc.
│   └── EmptyMarketplace.tsx            -- Estado vazio com CTA
└── index.ts                            -- Re-exports
```

### 7.3 Stores

```
src/stores/
├── marketplaceStore.ts                 -- Browse state: filtros, busca, paginacao, listings cache
├── marketplaceSellerStore.ts           -- Seller: perfil, listings, analytics
├── marketplaceOrderStore.ts            -- Orders: compras, sales, tracking
└── marketplaceSubmissionStore.ts       -- Submit wizard: steps, validation, draft
```

### 7.4 Hooks

```
src/hooks/
├── useMarketplace.ts                   -- Browse: listings query com filtros, FTS
├── useMarketplaceListing.ts            -- Detail: single listing com reviews
├── useMarketplaceSeller.ts             -- Seller: perfil, listings, analytics
├── useMarketplaceOrders.ts             -- Orders: compras e vendas
├── useMarketplaceReviews.ts            -- Reviews: CRUD
├── useMarketplaceSubmit.ts             -- Submit: wizard state e submissao
└── useMarketplaceCheckout.ts           -- Checkout: Stripe session, payment status
```

### 7.5 Services

```
src/services/
├── supabase/
│   └── marketplace.ts                  -- Todas as queries Supabase diretas
└── api/
    └── marketplace.ts                  -- Engine API calls (execution, sandbox)
```

---

## 8. Fases de Desenvolvimento

### Fase 1 — Foundation (Semanas 1-2)

**Escopo:** Schema Supabase, types TypeScript, stores base, service layer, componentes shared
**Entrega:** Infraestrutura completa para build das features
**Stories:** 1.1 a 1.6

**Detalhes:**
- Migrations Supabase (7 tabelas + RLS + indexes + FTS)
- Types TypeScript para todo o marketplace
- Stores Zustand (marketplaceStore, sellerStore, orderStore, submissionStore)
- Service layer (supabase/marketplace.ts)
- Componentes shared (AgentCard, RatingStars, PriceBadge, SellerBadge, CategoryBadge)
- Registro no ViewType, viewMap e sidebar

### Fase 2 — Browse & Discovery (Semanas 3-4)

**Escopo:** Catalogo publico com busca, filtros e discovery
**Entrega:** Buyers podem navegar, buscar e descobrir agentes
**Stories:** 2.1 a 2.4

**Detalhes:**
- MarketplaceBrowse page (grid + filtros + busca FTS)
- CategoryNav com contagem por SquadType
- FeaturedAgents carousel
- Paginacao e sorting (rating, preco, downloads, recente)

### Fase 3 — Listing Detail & Hire (Semanas 5-6)

**Escopo:** Pagina de detalhe do agente e fluxo de contratacao
**Entrega:** Buyers podem avaliar e contratar agentes
**Stories:** 3.1 a 3.5

**Detalhes:**
- ListingDetail page completa (header, capabilities, reviews, pricing, related)
- HireAgentModal com opcoes de pricing
- Checkout via Stripe (Edge Function)
- MyPurchases page com order tracking
- OrderDetail com status timeline
- Agent instantiation no Engine AIOS

### Fase 4 — Seller Side (Semanas 7-8)

**Escopo:** Dashboard do vendedor e wizard de submissao
**Entrega:** Sellers podem criar perfil, submeter agentes e gerenciar listings
**Stories:** 4.1 a 4.6

**Detalhes:**
- SellerOnboarding (perfil + Stripe Connect)
- SubmitWizard (5 steps)
- SellerDashboard (overview, listings, analytics basica)
- SellerListings (CRUD, status tracking)

### Fase 5 — Review Pipeline & Trust (Semanas 9-10)

**Escopo:** Pipeline de aprovacao, reviews, disputas e reputacao
**Entrega:** Sistema de confianca completo
**Stories:** 5.1 a 5.6

**Detalhes:**
- ReviewQueue (admin) com checklist de 10 pontos
- Auto-review Edge Function (Tier 1)
- Review system (ratings, comments, seller response)
- Dispute flow (open, respond, mediate, resolve)
- Seller levels e badges (verified, pro, enterprise)
- Escrow management (hold, release, freeze)

### Fase 6 — Payments & Analytics (Semanas 11-12)

**Escopo:** Stripe Connect completo, payouts, analytics
**Entrega:** Fluxo financeiro end-to-end e analytics
**Stories:** 6.1 a 6.4

**Detalhes:**
- Stripe Connect onboarding completo
- Payment processing (checkout, subscription, credits)
- Seller payouts automaticos
- Marketplace analytics (para admin e sellers)
- Transaction history e reports

---

## 9. Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
|-------|---------|---------------|-----------|
| Chicken-and-egg: sem sellers, sem buyers | Alto | Alta | Agentes free para bootstrap, seed com agentes AIOS core, outreach direto |
| Agentes maliciosos passam review | Alto | Media | Pipeline 3 camadas (auto+manual+comunidade), sandbox obrigatorio, report system |
| Stripe Connect compliance em BR | Medio | Media | Stripe ja opera no Brasil, usar Stripe Express para simplificar onboarding |
| Supabase RLS insuficiente para marketplace | Medio | Baixa | Policies granulares por tabela, Edge Functions para logica complexa |
| Conflito de agente marketplace vs. core | Medio | Media | Namespace separado, agent_instance_id unico, visual badge "Marketplace" |
| Disputas sem resolucao automatica | Baixo | Media | Escrow + 3 stages + timeout automatico (15 dias → refund ao buyer) |
| Performance da busca FTS em escala | Baixo | Baixa | Supabase FTS suficiente ate ~10K listings, migra para Meilisearch se necessario |

---

## 10. Metricas de Sucesso

| Metrica | Target (6 meses) |
|---------|-------------------|
| Listings aprovados no marketplace | > 50 |
| Sellers ativos (1+ venda/mes) | > 20 |
| Buyers ativos (1+ compra/mes) | > 100 |
| Taxa de conversao (view → hire) | > 5% |
| Rating medio dos agentes | > 4.0 |
| Tempo medio de review (submission → decision) | < 5 dias |
| Taxa de disputas sobre total de orders | < 3% |
| Revenue mensal da plataforma (comissoes) | > R$ 5.000 |
| NPS de buyers | > 40 |
| NPS de sellers | > 35 |

---

## 11. Fora de Escopo (v1)

- Multi-agent packs / bundles (v2)
- Agent-to-agent orchestration no marketplace (v2)
- White-label marketplace para terceiros (v3)
- Marketplace API publica (v2)
- Auction/bidding model para contratacao (v2)
- Mobile app dedicado (v2)
- Integracao com MCP registry padrao (v2)
- AI-powered agent recommendation engine (v2)
- Seller premium plans (featured placement pago) (v2)
- Multi-currency alem de BRL (v2)
- Custom SLA enforcement automatico (v2)
