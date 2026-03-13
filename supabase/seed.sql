-- ============================================================
-- Marketplace Seed Data
-- Populates the marketplace with sample sellers, listings, and reviews
-- Story 5.6
-- ============================================================

-- 0. Create test auth users (required by seller_profiles FK)
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, raw_app_meta_data, raw_user_meta_data)
VALUES
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'codecraft@seed.local', '$2a$10$seedhashedpassword000000000000000000000000000000001', NOW(), NOW(), NOW(), '', '{"provider":"email","providers":["email"]}'::jsonb, '{"display_name":"CodeCraft Labs"}'::jsonb),
  ('00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'datamind@seed.local', '$2a$10$seedhashedpassword000000000000000000000000000000002', NOW(), NOW(), NOW(), '', '{"provider":"email","providers":["email"]}'::jsonb, '{"display_name":"DataMind AI"}'::jsonb),
  ('00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'creativebot@seed.local', '$2a$10$seedhashedpassword000000000000000000000000000000003', NOW(), NOW(), NOW(), '', '{"provider":"email","providers":["email"]}'::jsonb, '{"display_name":"CreativeBot Studio"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 0b. Create test buyer auth users (needed for orders FK)
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, raw_app_meta_data, raw_user_meta_data)
VALUES
  ('00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'buyer1@seed.local', '$2a$10$seedhashedpassword000000000000000000000000000000004', NOW(), NOW(), NOW(), '', '{"provider":"email","providers":["email"]}'::jsonb, '{"display_name":"Buyer 1"}'::jsonb),
  ('00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'buyer2@seed.local', '$2a$10$seedhashedpassword000000000000000000000000000000005', NOW(), NOW(), NOW(), '', '{"provider":"email","providers":["email"]}'::jsonb, '{"display_name":"Buyer 2"}'::jsonb),
  ('00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'buyer3@seed.local', '$2a$10$seedhashedpassword000000000000000000000000000000006', NOW(), NOW(), NOW(), '', '{"provider":"email","providers":["email"]}'::jsonb, '{"display_name":"Buyer 3"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 1. Seller Profiles
INSERT INTO seller_profiles (id, user_id, display_name, slug, bio, company, website, verification, rating_avg, review_count, total_sales, total_revenue, commission_rate)
VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000001', 'CodeCraft Labs', 'codecraft-labs',
   'Especialistas em agentes de desenvolvimento e automacao de codigo.', 'CodeCraft Labs Ltda', 'https://codecraft.dev',
   'pro', 4.6, 18, 45, 125000, 12),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0001-000000000002', 'DataMind AI', 'datamind-ai',
   'Agentes inteligentes para analise de dados e insights de negocios.', 'DataMind AI', NULL,
   'verified', 4.3, 12, 22, 68000, 15),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0001-000000000003', 'CreativeBot Studio', 'creativebot-studio',
   'Agentes criativos para conteudo, design e marketing.', NULL, NULL,
   'unverified', 4.0, 5, 8, 15000, 15)
ON CONFLICT (slug) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  verification = EXCLUDED.verification,
  rating_avg = EXCLUDED.rating_avg,
  review_count = EXCLUDED.review_count,
  total_sales = EXCLUDED.total_sales,
  total_revenue = EXCLUDED.total_revenue;

-- 2. Listings
INSERT INTO marketplace_listings (id, seller_id, slug, name, tagline, description, category, tags, pricing_model, price_amount, price_currency, downloads, active_hires, rating_avg, rating_count, featured, status, version, agent_config, agent_tier, squad_type, capabilities, supported_models, required_tools, required_mcps, screenshots, published_at)
VALUES
  -- CodeCraft Labs
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'fullstack-dev-agent',
   'FullStack Dev Agent', 'Agente completo para desenvolvimento full stack',
   '# FullStack Dev Agent\n\nAgente especializado em desenvolvimento full stack com React, Node.js, e TypeScript.',
   'development', ARRAY['react','nodejs','typescript','fullstack'], 'per_task', 1500, 'BRL',
   234, 12, 4.7, 8, true, 'approved', '2.1.0',
   '{"persona":{"role":"Senior Full Stack Developer","tone":"professional","focus":"clean code"}}'::jsonb,
   2, 'development', ARRAY['react','nodejs','typescript','testing','docker'],
   ARRAY['claude-sonnet-4-5-20250514'], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], NOW()),

  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'qa-automation-agent',
   'QA Automation Agent', 'Testes automatizados de ponta a ponta',
   '# QA Automation Agent\n\nAgente dedicado a testes automatizados com Playwright, Jest e Vitest.',
   'engineering', ARRAY['testing','qa','playwright','vitest'], 'hourly', 2500, 'BRL',
   156, 5, 4.5, 6, false, 'approved', '1.3.0',
   '{"persona":{"role":"QA Engineer","tone":"methodical","focus":"test coverage"}}'::jsonb,
   2, 'engineering', ARRAY['playwright','jest','vitest','e2e','unit-tests'],
   ARRAY['claude-sonnet-4-5-20250514'], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], NOW()),

  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'devops-pipeline-agent',
   'DevOps Pipeline Agent', 'CI/CD e infraestrutura como codigo',
   '# DevOps Pipeline Agent\n\nConfigura pipelines CI/CD, Docker, Kubernetes e infraestrutura.',
   'engineering', ARRAY['devops','ci-cd','docker','kubernetes'], 'monthly', 9900, 'BRL',
   89, 3, 4.8, 4, true, 'approved', '1.0.0',
   '{"persona":{"role":"DevOps Engineer","tone":"systematic","focus":"reliability"}}'::jsonb,
   2, 'engineering', ARRAY['docker','kubernetes','github-actions','terraform','monitoring'],
   ARRAY['claude-sonnet-4-5-20250514'], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], NOW()),

  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'code-review-agent',
   'Code Review Agent', 'Review de codigo automatizado com feedback detalhado',
   '# Code Review Agent\n\nReview automatizado de pull requests com sugestoes detalhadas.',
   'development', ARRAY['code-review','quality','best-practices'], 'free', 0, 'BRL',
   456, 20, 4.2, 12, false, 'approved', '1.4.0',
   '{"persona":{"role":"Code Reviewer","tone":"constructive","focus":"code quality"}}'::jsonb,
   2, 'development', ARRAY['code-review','best-practices','security','performance'],
   ARRAY['claude-sonnet-4-5-20250514'], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], NOW()),

  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'project-advisor',
   'Project Advisor', 'Consultoria e orientacao para projetos de software',
   '# Project Advisor\n\nOrientacao estrategica para decisoes de arquitetura e tecnologia.',
   'advisory', ARRAY['advisory','architecture','strategy','mentoring'], 'hourly', 5000, 'BRL',
   34, 1, 4.9, 2, false, 'approved', '1.0.0',
   '{"persona":{"role":"Technical Advisor","tone":"mentoring","focus":"strategic decisions"}}'::jsonb,
   2, 'advisory', ARRAY['architecture','tech-strategy','team-mentoring','roadmap'],
   ARRAY['claude-sonnet-4-5-20250514'], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], NOW()),

  -- DataMind AI
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000002', 'data-analyst-pro',
   'Data Analyst Pro', 'Analise de dados com insights acionaveis',
   '# Data Analyst Pro\n\nTransforma dados brutos em insights claros e acionaveis com visualizacoes.',
   'analytics', ARRAY['data','analytics','visualization','sql'], 'per_task', 2000, 'BRL',
   178, 8, 4.4, 7, true, 'approved', '1.5.0',
   '{"persona":{"role":"Data Analyst","tone":"analytical","focus":"actionable insights"}}'::jsonb,
   2, 'analytics', ARRAY['sql','python','pandas','visualization','reporting'],
   ARRAY['claude-sonnet-4-5-20250514'], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], NOW()),

  (gen_random_uuid(), '00000000-0000-0000-0000-000000000002', 'market-research-agent',
   'Market Research Agent', 'Pesquisa de mercado automatizada',
   '# Market Research Agent\n\nColeta e analisa dados de mercado, concorrencia e tendencias.',
   'analytics', ARRAY['research','market','competitor','trends'], 'credits', 500, 'BRL',
   67, 2, 4.1, 3, false, 'approved', '1.0.0',
   '{"persona":{"role":"Market Researcher","tone":"investigative","focus":"competitive intelligence"}}'::jsonb,
   2, 'analytics', ARRAY['web-scraping','analysis','reporting','trends'],
   ARRAY['claude-sonnet-4-5-20250514'], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], NOW()),

  (gen_random_uuid(), '00000000-0000-0000-0000-000000000002', 'sql-optimizer-agent',
   'SQL Optimizer', 'Otimizacao de queries e performance de banco',
   '# SQL Optimizer\n\nAnalisa e otimiza queries SQL, sugere indices e melhora performance.',
   'engineering', ARRAY['sql','database','performance','optimization'], 'per_task', 1000, 'BRL',
   92, 4, 4.6, 5, false, 'approved', '1.2.0',
   '{"persona":{"role":"Database Expert","tone":"precise","focus":"query performance"}}'::jsonb,
   2, 'engineering', ARRAY['postgresql','mysql','indexing','query-plans','normalization'],
   ARRAY['claude-sonnet-4-5-20250514'], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], NOW()),

  (gen_random_uuid(), '00000000-0000-0000-0000-000000000002', 'copywriting-pro',
   'Copywriting Pro', 'Copy persuasivo para vendas e marketing',
   '# Copywriting Pro\n\nCria copy persuasivo para landing pages, ads e email sequences.',
   'copywriting', ARRAY['copywriting','ads','landing-page','conversion'], 'per_task', 1200, 'BRL',
   98, 5, 4.3, 4, false, 'approved', '1.0.0',
   '{"persona":{"role":"Copywriter","tone":"persuasive","focus":"conversion optimization"}}'::jsonb,
   2, 'copywriting', ARRAY['copywriting','a-b-testing','landing-pages','email-sequences'],
   ARRAY['claude-sonnet-4-5-20250514'], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], NOW()),

  -- CreativeBot Studio
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000003', 'content-writer-agent',
   'Content Writer Agent', 'Conteudo otimizado para SEO e engajamento',
   '# Content Writer Agent\n\nCria conteudo de alta qualidade para blogs, redes sociais e email marketing.',
   'content', ARRAY['content','seo','blog','social-media'], 'per_task', 800, 'BRL',
   145, 6, 4.0, 4, false, 'approved', '1.1.0',
   '{"persona":{"role":"Content Writer","tone":"engaging","focus":"SEO optimization"}}'::jsonb,
   2, 'content', ARRAY['copywriting','seo','social-media','email-marketing'],
   ARRAY['claude-sonnet-4-5-20250514'], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], NOW()),

  (gen_random_uuid(), '00000000-0000-0000-0000-000000000003', 'ui-design-agent',
   'UI Design Assistant', 'Sugestoes de design e implementacao de UI',
   '# UI Design Assistant\n\nAjuda a criar interfaces bonitas e acessiveis seguindo design systems.',
   'design', ARRAY['ui','design','css','tailwind','accessibility'], 'free', 0, 'BRL',
   312, 15, 3.8, 9, false, 'approved', '0.9.0',
   '{"persona":{"role":"UI Designer","tone":"creative","focus":"user experience"}}'::jsonb,
   2, 'design', ARRAY['css','tailwind','figma','accessibility','responsive'],
   ARRAY['claude-sonnet-4-5-20250514'], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], NOW()),

  (gen_random_uuid(), '00000000-0000-0000-0000-000000000003', 'social-media-manager',
   'Social Media Manager', 'Gerenciamento automatizado de redes sociais',
   '# Social Media Manager\n\nAgenda posts, analisa engajamento e sugere estrategias de conteudo.',
   'marketing', ARRAY['social-media','marketing','scheduling','analytics'], 'monthly', 4900, 'BRL',
   56, 2, 3.9, 3, false, 'approved', '1.0.0',
   '{"persona":{"role":"Social Media Manager","tone":"trendy","focus":"engagement growth"}}'::jsonb,
   2, 'marketing', ARRAY['instagram','twitter','linkedin','scheduling','analytics'],
   ARRAY['claude-sonnet-4-5-20250514'], ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], NOW())
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  rating_avg = EXCLUDED.rating_avg,
  rating_count = EXCLUDED.rating_count,
  downloads = EXCLUDED.downloads,
  active_hires = EXCLUDED.active_hires,
  status = EXCLUDED.status;

-- 3. Sample orders and reviews
DO $$
DECLARE
  _listing record;
  _order_id uuid;
  _buyer_ids uuid[] := ARRAY['00000000-0000-0000-0002-000000000001'::uuid, '00000000-0000-0000-0002-000000000002'::uuid, '00000000-0000-0000-0002-000000000003'::uuid];
  _buyer_id uuid;
  _review_titles text[] := ARRAY['Excelente agente!','Muito bom, recomendo','Fez o que prometeu','Bom mas pode melhorar','Acima das expectativas','Rapido e eficiente','Boa qualidade no geral','Otimo custo-beneficio'];
  _review_bodies text[] := ARRAY['Usamos este agente para automatizar tarefas repetitivas e funcionou muito bem.','A qualidade do output e consistente e o agente responde rapido.','Tivemos que fazer alguns ajustes nos prompts mas no geral atendeu muito bem.','Recomendo para quem precisa de produtividade.','O agente entende bem o contexto e gera resultados relevantes.'];
  _i int;
  _rating int;
  _ratings int[] := ARRAY[5,5,4,5,4,4,3,5,4,4,5,3,4,5,4,2,5,4,4,5,3,5,4,5,4,3,4,5,5,4,4,5,3,4,5,4];
  _idx int := 1;
BEGIN
  FOR _listing IN SELECT id, seller_id, price_amount, price_currency FROM marketplace_listings WHERE status = 'approved' LIMIT 12
  LOOP
    FOR _i IN 1..3
    LOOP
      _order_id := gen_random_uuid();
      _buyer_id := _buyer_ids[_i];
      _rating := _ratings[_idx];
      _idx := _idx + 1;
      IF _idx > array_length(_ratings, 1) THEN _idx := 1; END IF;

      -- Insert order
      INSERT INTO marketplace_orders (id, buyer_id, listing_id, seller_id, order_type, status, subtotal, platform_fee, seller_payout, currency, escrow_status, created_at)
      VALUES (
        _order_id,
        _buyer_id,
        _listing.id,
        _listing.seller_id,
        'task',
        'completed',
        _listing.price_amount,
        (_listing.price_amount * 0.15)::int,
        (_listing.price_amount * 0.85)::int,
        _listing.price_currency,
        'released',
        NOW() - (random() * interval '90 days')
      )
      ON CONFLICT DO NOTHING;

      -- Insert review for this order
      INSERT INTO marketplace_reviews (id, order_id, listing_id, reviewer_id, rating_overall, title, body, is_verified_purchase, created_at)
      VALUES (
        gen_random_uuid(),
        _order_id,
        _listing.id,
        _buyer_id,
        _rating,
        _review_titles[1 + (floor(random() * array_length(_review_titles, 1)))::int],
        _review_bodies[1 + (floor(random() * array_length(_review_bodies, 1)))::int],
        true,
        NOW() - (random() * interval '60 days')
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;
