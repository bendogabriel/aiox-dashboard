-- ============================================================
-- Seed data for empty tables
-- (orchestration_tasks already has 31 real records — skipped)
-- ============================================================

-- ============================================================
-- 1. roadmap_features — product roadmap items
-- ============================================================
INSERT INTO roadmap_features (id, title, description, priority, impact, effort, tags, status, quarter, squad)
VALUES
  ('rf-001', 'Multi-tenant workspace isolation',
   'Implementar isolamento completo de dados entre workspaces usando RLS policies e schema separation.',
   'must', 'high', 'high',
   '["security", "architecture", "multi-tenant"]'::jsonb,
   'in_progress', 'Q1', 'engineering'),

  ('rf-002', 'Real-time collaboration',
   'Adicionar presença de usuários e edição colaborativa em tempo real usando Supabase Realtime.',
   'should', 'high', 'medium',
   '["collaboration", "realtime", "ux"]'::jsonb,
   'planned', 'Q2', 'development'),

  ('rf-003', 'AI Agent Marketplace',
   'Marketplace para compartilhar e instalar agent templates, workflows e squad configurations.',
   'should', 'high', 'high',
   '["marketplace", "community", "agents"]'::jsonb,
   'in_progress', 'Q1', 'development'),

  ('rf-004', 'Advanced analytics dashboard',
   'Dashboard com métricas detalhadas de uso de tokens, performance de agentes e ROI das automações.',
   'should', 'medium', 'medium',
   '["analytics", "dashboard", "metrics"]'::jsonb,
   'planned', 'Q2', 'analytics'),

  ('rf-005', 'Mobile-responsive PWA optimization',
   'Otimizar layout e interações para dispositivos móveis. Melhorar score do Lighthouse PWA.',
   'could', 'medium', 'low',
   '["mobile", "pwa", "responsive"]'::jsonb,
   'planned', 'Q3', 'design'),

  ('rf-006', 'Webhook & API gateway',
   'Gateway de webhooks com rate limiting, auth, retry logic e dashboard de monitoramento.',
   'must', 'high', 'medium',
   '["api", "webhooks", "integration"]'::jsonb,
   'in_progress', 'Q1', 'engineering'),

  ('rf-007', 'Document vault AI search',
   'Busca semântica nos documentos do vault usando embeddings e vector search.',
   'should', 'medium', 'medium',
   '["vault", "search", "ai", "embeddings"]'::jsonb,
   'planned', 'Q2', 'development'),

  ('rf-008', 'Custom workflow builder',
   'Interface drag-and-drop para criar workflows personalizados com nodes visuais.',
   'could', 'high', 'high',
   '["workflow", "builder", "visual", "drag-drop"]'::jsonb,
   'planned', 'Q3', 'development'),

  ('rf-009', 'Team roles & permissions',
   'Sistema de roles (admin, editor, viewer) com permissões granulares por recurso.',
   'must', 'high', 'medium',
   '["auth", "permissions", "roles", "security"]'::jsonb,
   'done', 'Q1', 'engineering'),

  ('rf-010', 'Internationalization (i18n)',
   'Suporte a múltiplos idiomas começando por PT-BR e EN-US.',
   'could', 'low', 'medium',
   '["i18n", "localization"]'::jsonb,
   'planned', 'Q4', NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. vault_workspaces — knowledge base workspaces
-- ============================================================
INSERT INTO vault_workspaces (id, name, icon, status, documents_count, templates_count, health_percent, categories, template_groups, taxonomy_sections, csuite_personas)
VALUES
  ('ws-sales', 'Sales Intelligence', 'briefcase', 'active', 12, 5, 85,
   '[{"id":"cat-offers","name":"Ofertas","count":4},{"id":"cat-competitors","name":"Concorrentes","count":3},{"id":"cat-cases","name":"Cases de Sucesso","count":5}]'::jsonb,
   '[{"id":"tg-pitch","name":"Pitch Decks","templates":["Pitch Inicial","Follow-up","Demo Request"]},{"id":"tg-proposal","name":"Propostas","templates":["Proposta Comercial","SOW"]}]'::jsonb,
   '[{"id":"ts-discovery","name":"Discovery","items":["Qualificação","BANT","Pain Points"]},{"id":"ts-closing","name":"Fechamento","items":["Negociação","Contrato","Onboarding"]}]'::jsonb,
   '[{"id":"ceo","name":"CEO","focus":"ROI e visão estratégica"},{"id":"cto","name":"CTO","focus":"Arquitetura e integração técnica"},{"id":"cfo","name":"CFO","focus":"TCO e payback period"}]'::jsonb),

  ('ws-product', 'Product Knowledge', 'package', 'active', 8, 3, 72,
   '[{"id":"cat-prd","name":"PRDs","count":3},{"id":"cat-specs","name":"Specs Técnicos","count":2},{"id":"cat-research","name":"Research","count":3}]'::jsonb,
   '[{"id":"tg-prd","name":"Product Docs","templates":["PRD Template","User Story","Spec"]}]'::jsonb,
   '[{"id":"ts-planning","name":"Planejamento","items":["Roadmap","Priorização","Sizing"]}]'::jsonb,
   '[{"id":"pm","name":"Product Manager","focus":"Features e roadmap"},{"id":"designer","name":"UX Designer","focus":"Usabilidade e fluxos"}]'::jsonb),

  ('ws-engineering', 'Engineering Hub', 'code', 'active', 15, 4, 90,
   '[{"id":"cat-arch","name":"Arquitetura","count":5},{"id":"cat-guides","name":"Guias","count":6},{"id":"cat-runbooks","name":"Runbooks","count":4}]'::jsonb,
   '[{"id":"tg-adr","name":"ADRs","templates":["ADR Template","RFC Template"]},{"id":"tg-ops","name":"Ops","templates":["Runbook","Incident Report"]}]'::jsonb,
   '[{"id":"ts-backend","name":"Backend","items":["APIs","Database","Auth"]},{"id":"ts-frontend","name":"Frontend","items":["Components","State","Routing"]},{"id":"ts-infra","name":"Infra","items":["CI/CD","Docker","Monitoring"]}]'::jsonb,
   '[{"id":"tech-lead","name":"Tech Lead","focus":"Decisões técnicas e trade-offs"},{"id":"sre","name":"SRE","focus":"Reliability e observabilidade"}]'::jsonb),

  ('ws-onboarding', 'Onboarding & Training', 'graduation-cap', 'setup', 3, 2, 40,
   '[{"id":"cat-guides","name":"Guias de Início","count":2},{"id":"cat-videos","name":"Video Tutorials","count":1}]'::jsonb,
   '[{"id":"tg-welcome","name":"Welcome Kit","templates":["Welcome Guide","Setup Checklist"]}]'::jsonb,
   '[{"id":"ts-basics","name":"Basics","items":["Introdução","Primeiros Passos"]}]'::jsonb,
   '[]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. vault_documents — documents in each workspace
-- ============================================================
INSERT INTO vault_documents (id, name, type, content, status, token_count, source, taxonomy, consumers, category_id, workspace_id)
VALUES
  -- Sales workspace docs
  ('doc-s01', 'AIOX Platform - Offerbook Principal', 'offerbook',
   'O AIOX é uma plataforma de orquestração de agentes de IA que automatiza workflows complexos de desenvolvimento. Nosso diferencial: squads especializados que trabalham em conjunto, reduzindo o tempo de entrega em até 60%.',
   'validated', 2400, 'Manual', 'Sales > Ofertas', '["@sm","@pm"]'::jsonb, 'cat-offers', 'ws-sales'),

  ('doc-s02', 'Competitor Analysis - Cursor vs AIOX', 'strategy',
   'Análise comparativa: Cursor foca em code completion individual. AIOX orquestra múltiplos agentes especializados em squad formation. Vantagem AIOX: workflows end-to-end com QA integrado.',
   'validated', 1800, 'Research', 'Sales > Concorrentes', '["@analyst","@pm"]'::jsonb, 'cat-competitors', 'ws-sales'),

  ('doc-s03', 'Case Study - TechCorp Migration', 'proof',
   'TechCorp migrou de desenvolvimento manual para AIOX em 3 semanas. Resultados: 45% redução no tempo de entrega, 30% menos bugs em produção, ROI positivo em 2 meses.',
   'validated', 1200, 'Manual', 'Sales > Cases', '["@sm","@analyst"]'::jsonb, 'cat-cases', 'ws-sales'),

  ('doc-s04', 'Pricing Strategy Q1 2026', 'strategy',
   'Modelo freemium com 3 tiers: Free (1 squad, 5 agents), Pro ($49/mo, unlimited squads), Enterprise (custom). Upsell triggers: token usage > 80%, squad count > 3.',
   'draft', 950, 'Manual', 'Sales > Ofertas', '["@pm","@analyst"]'::jsonb, 'cat-offers', 'ws-sales'),

  -- Product workspace docs
  ('doc-p01', 'PRD - Marketplace v1.0', 'narrative',
   'Product Requirements: Marketplace para templates de agentes e workflows. Funcionalidades: browse, search, install, rate, publish. MVP scope: browse + install + basic search.',
   'validated', 3200, 'Manual', 'Product > PRDs', '["@dev","@architect"]'::jsonb, 'cat-prd', 'ws-product'),

  ('doc-p02', 'User Research - Developer Personas', 'diagnostic',
   'Pesquisa com 25 devs: 60% preferem CLI, 40% GUI. Pain points: setup complexity (72%), agent configuration (65%), debugging workflows (58%). Top request: visual workflow builder.',
   'validated', 2800, 'Research', 'Product > Research', '["@ux-design-expert","@pm"]'::jsonb, 'cat-research', 'ws-product'),

  -- Engineering workspace docs
  ('doc-e01', 'ADR-001: Zustand over Redux', 'strategy',
   'Decisão: Zustand para state management. Razões: bundle size (2KB vs 42KB), API mais simples, compatível com React 19, sem boilerplate. Trade-off: menos middleware ecosystem.',
   'validated', 1500, 'Manual', 'Engineering > Arquitetura', '["@dev","@architect"]'::jsonb, 'cat-arch', 'ws-engineering'),

  ('doc-e02', 'ADR-002: Supabase for Persistence', 'strategy',
   'Decisão: Supabase como backend principal. Razões: PostgreSQL nativo, RLS para multi-tenant, Realtime built-in, Auth provider. Fallback: localStorage quando offline.',
   'validated', 1800, 'Manual', 'Engineering > Arquitetura', '["@dev","@architect","@data-engineer"]'::jsonb, 'cat-arch', 'ws-engineering'),

  ('doc-e03', 'Runbook - Deployment Procedure', 'template',
   '1. Run tests (npm test). 2. Build (npm run build). 3. Verify bundle size. 4. Deploy to staging. 5. Smoke test. 6. Deploy to production. 7. Monitor for 30 min.',
   'validated', 800, 'Manual', 'Engineering > Runbooks', '["@devops"]'::jsonb, 'cat-runbooks', 'ws-engineering'),

  ('doc-e04', 'Guide - Engine Architecture', 'narrative',
   'Engine (port 4002): Bun + Hono. Routes: /health, /jobs, /execute, /stream, /cron, /memory, /registry. Claude CLI integration via Bun.spawn. SSE for real-time updates.',
   'validated', 2200, 'Manual', 'Engineering > Guias', '["@dev","@architect"]'::jsonb, 'cat-guides', 'ws-engineering'),

  ('doc-e05', 'Guide - Frontend Architecture', 'narrative',
   'Stack: Vite 7 + React 19 + TypeScript. State: Zustand stores. Styling: Tailwind + AIOX theme (CSS vars). API: engineApi client (engine.ts). Design: Liquid Glass + Cockpit components.',
   'draft', 1900, 'Manual', 'Engineering > Guias', '["@dev","@ux-design-expert"]'::jsonb, 'cat-guides', 'ws-engineering')
ON CONFLICT (id) DO NOTHING;
