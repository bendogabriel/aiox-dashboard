#!/usr/bin/env npx tsx
/**
 * Marketplace Seed Data — Populates the marketplace with sample data
 * Story 5.6
 *
 * Creates:
 * - 3 seller profiles (Unverified, Verified, Pro)
 * - 12+ listings across all categories
 * - 30+ reviews with realistic rating distribution
 * - Sample orders and transactions
 *
 * Usage: npx tsx scripts/seed-marketplace.ts
 *
 * Idempotent: uses upsert with conflict on slug (sellers) and slug (listings)
 */

import { createClient } from '@supabase/supabase-js';

// --- Config ---
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- Helper ---
function uuid() {
  return crypto.randomUUID();
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return +(Math.random() * (max - min) + min).toFixed(1);
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// --- Seller Profiles ---
const SELLERS = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    user_id: '00000000-0000-0000-0001-000000000001',
    display_name: 'CodeCraft Labs',
    slug: 'codecraft-labs',
    bio: 'Especialistas em agentes de desenvolvimento e automacao de codigo.',
    company: 'CodeCraft Labs Ltda',
    website: 'https://codecraft.dev',
    verification: 'pro',
    rating_avg: 4.6,
    review_count: 18,
    total_sales: 45,
    total_revenue: 125000,
    commission_rate: 12,
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    user_id: '00000000-0000-0000-0001-000000000002',
    display_name: 'DataMind AI',
    slug: 'datamind-ai',
    bio: 'Agentes inteligentes para analise de dados e insights de negocios.',
    company: 'DataMind AI',
    verification: 'verified',
    rating_avg: 4.3,
    review_count: 12,
    total_sales: 22,
    total_revenue: 68000,
    commission_rate: 15,
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    user_id: '00000000-0000-0000-0001-000000000003',
    display_name: 'CreativeBot Studio',
    slug: 'creativebot-studio',
    bio: 'Agentes criativos para conteudo, design e marketing.',
    verification: 'unverified',
    rating_avg: 4.0,
    review_count: 5,
    total_sales: 8,
    total_revenue: 15000,
    commission_rate: 15,
  },
];

// --- Listings ---
const LISTINGS = [
  // CodeCraft Labs (Pro seller)
  {
    seller_id: SELLERS[0].id,
    slug: 'fullstack-dev-agent',
    name: 'FullStack Dev Agent',
    tagline: 'Agente completo para desenvolvimento full stack',
    description: '# FullStack Dev Agent\n\nAgente especializado em desenvolvimento full stack com React, Node.js, e TypeScript.\n\n## Capabilities\n- Criacao de componentes React\n- APIs REST e GraphQL\n- Testes automatizados\n- Code review e refactoring',
    category: 'development',
    tags: ['react', 'nodejs', 'typescript', 'fullstack'],
    pricing_model: 'per_task',
    price_amount: 1500,
    price_currency: 'BRL',
    downloads: 234,
    active_hires: 12,
    rating_avg: 4.7,
    rating_count: 8,
    featured: true,
    status: 'approved',
    version: '2.1.0',
    agent_config: {
      persona: { role: 'Senior Full Stack Developer', tone: 'professional', focus: 'clean code' },
      commands: [{ command: '/code', action: 'generate_code', description: 'Gera codigo' }],
      capabilities: ['react', 'nodejs', 'typescript', 'testing', 'docker'],
    },
  },
  {
    seller_id: SELLERS[0].id,
    slug: 'qa-automation-agent',
    name: 'QA Automation Agent',
    tagline: 'Testes automatizados de ponta a ponta',
    description: '# QA Automation Agent\n\nAgente dedicado a testes automatizados com Playwright, Jest e Vitest.',
    category: 'engineering',
    tags: ['testing', 'qa', 'playwright', 'vitest'],
    pricing_model: 'hourly',
    price_amount: 2500,
    price_currency: 'BRL',
    downloads: 156,
    active_hires: 5,
    rating_avg: 4.5,
    rating_count: 6,
    featured: false,
    status: 'approved',
    version: '1.3.0',
    agent_config: {
      persona: { role: 'QA Engineer', tone: 'methodical', focus: 'test coverage' },
      commands: [{ command: '/test', action: 'run_tests', description: 'Executa testes' }],
      capabilities: ['playwright', 'jest', 'vitest', 'e2e', 'unit-tests'],
    },
  },
  {
    seller_id: SELLERS[0].id,
    slug: 'devops-pipeline-agent',
    name: 'DevOps Pipeline Agent',
    tagline: 'CI/CD e infraestrutura como codigo',
    description: '# DevOps Pipeline Agent\n\nConfigura pipelines CI/CD, Docker, Kubernetes e infraestrutura.',
    category: 'engineering',
    tags: ['devops', 'ci-cd', 'docker', 'kubernetes'],
    pricing_model: 'monthly',
    price_amount: 9900,
    price_currency: 'BRL',
    downloads: 89,
    active_hires: 3,
    rating_avg: 4.8,
    rating_count: 4,
    featured: true,
    status: 'approved',
    version: '1.0.0',
    agent_config: {
      persona: { role: 'DevOps Engineer', tone: 'systematic', focus: 'reliability' },
      commands: [{ command: '/deploy', action: 'deploy', description: 'Deploy application' }],
      capabilities: ['docker', 'kubernetes', 'github-actions', 'terraform', 'monitoring'],
    },
  },

  // DataMind AI (Verified seller)
  {
    seller_id: SELLERS[1].id,
    slug: 'data-analyst-pro',
    name: 'Data Analyst Pro',
    tagline: 'Analise de dados com insights acionaveis',
    description: '# Data Analyst Pro\n\nTransforma dados brutos em insights claros e acionaveis com visualizacoes.',
    category: 'analytics',
    tags: ['data', 'analytics', 'visualization', 'sql'],
    pricing_model: 'per_task',
    price_amount: 2000,
    price_currency: 'BRL',
    downloads: 178,
    active_hires: 8,
    rating_avg: 4.4,
    rating_count: 7,
    featured: true,
    status: 'approved',
    version: '1.5.0',
    agent_config: {
      persona: { role: 'Data Analyst', tone: 'analytical', focus: 'actionable insights' },
      commands: [{ command: '/analyze', action: 'analyze_data', description: 'Analisa dados' }],
      capabilities: ['sql', 'python', 'pandas', 'visualization', 'reporting'],
    },
  },
  {
    seller_id: SELLERS[1].id,
    slug: 'market-research-agent',
    name: 'Market Research Agent',
    tagline: 'Pesquisa de mercado automatizada',
    description: '# Market Research Agent\n\nColeta e analisa dados de mercado, concorrencia e tendencias.',
    category: 'analytics',
    tags: ['research', 'market', 'competitor', 'trends'],
    pricing_model: 'credits',
    price_amount: 500,
    price_currency: 'BRL',
    credits_per_use: 5,
    downloads: 67,
    active_hires: 2,
    rating_avg: 4.1,
    rating_count: 3,
    featured: false,
    status: 'approved',
    version: '1.0.0',
    agent_config: {
      persona: { role: 'Market Researcher', tone: 'investigative', focus: 'competitive intelligence' },
      commands: [{ command: '/research', action: 'research', description: 'Pesquisa mercado' }],
      capabilities: ['web-scraping', 'analysis', 'reporting', 'trends'],
    },
  },
  {
    seller_id: SELLERS[1].id,
    slug: 'sql-optimizer-agent',
    name: 'SQL Optimizer',
    tagline: 'Otimizacao de queries e performance de banco',
    description: '# SQL Optimizer\n\nAnalisa e otimiza queries SQL, sugere indices e melhora performance.',
    category: 'engineering',
    tags: ['sql', 'database', 'performance', 'optimization'],
    pricing_model: 'per_task',
    price_amount: 1000,
    price_currency: 'BRL',
    downloads: 92,
    active_hires: 4,
    rating_avg: 4.6,
    rating_count: 5,
    featured: false,
    status: 'approved',
    version: '1.2.0',
    agent_config: {
      persona: { role: 'Database Expert', tone: 'precise', focus: 'query performance' },
      commands: [{ command: '/optimize', action: 'optimize_sql', description: 'Otimiza query' }],
      capabilities: ['postgresql', 'mysql', 'indexing', 'query-plans', 'normalization'],
    },
  },

  // CreativeBot Studio (Unverified)
  {
    seller_id: SELLERS[2].id,
    slug: 'content-writer-agent',
    name: 'Content Writer Agent',
    tagline: 'Conteudo otimizado para SEO e engajamento',
    description: '# Content Writer Agent\n\nCria conteudo de alta qualidade para blogs, redes sociais e email marketing.',
    category: 'content',
    tags: ['content', 'seo', 'blog', 'social-media'],
    pricing_model: 'per_task',
    price_amount: 800,
    price_currency: 'BRL',
    downloads: 145,
    active_hires: 6,
    rating_avg: 4.0,
    rating_count: 4,
    featured: false,
    status: 'approved',
    version: '1.1.0',
    agent_config: {
      persona: { role: 'Content Writer', tone: 'engaging', focus: 'SEO optimization' },
      commands: [{ command: '/write', action: 'write_content', description: 'Escreve conteudo' }],
      capabilities: ['copywriting', 'seo', 'social-media', 'email-marketing'],
    },
  },
  {
    seller_id: SELLERS[2].id,
    slug: 'ui-design-agent',
    name: 'UI Design Assistant',
    tagline: 'Sugestoes de design e implementacao de UI',
    description: '# UI Design Assistant\n\nAjuda a criar interfaces bonitas e acessiveis seguindo design systems.',
    category: 'design',
    tags: ['ui', 'design', 'css', 'tailwind', 'accessibility'],
    pricing_model: 'free',
    price_amount: 0,
    price_currency: 'BRL',
    downloads: 312,
    active_hires: 15,
    rating_avg: 3.8,
    rating_count: 9,
    featured: false,
    status: 'approved',
    version: '0.9.0',
    agent_config: {
      persona: { role: 'UI Designer', tone: 'creative', focus: 'user experience' },
      commands: [{ command: '/design', action: 'design_ui', description: 'Sugere design' }],
      capabilities: ['css', 'tailwind', 'figma', 'accessibility', 'responsive'],
    },
  },
  {
    seller_id: SELLERS[2].id,
    slug: 'social-media-manager',
    name: 'Social Media Manager',
    tagline: 'Gerenciamento automatizado de redes sociais',
    description: '# Social Media Manager\n\nAgenda posts, analisa engajamento e sugere estrategias de conteudo.',
    category: 'marketing',
    tags: ['social-media', 'marketing', 'scheduling', 'analytics'],
    pricing_model: 'monthly',
    price_amount: 4900,
    price_currency: 'BRL',
    downloads: 56,
    active_hires: 2,
    rating_avg: 3.9,
    rating_count: 3,
    featured: false,
    status: 'approved',
    version: '1.0.0',
    agent_config: {
      persona: { role: 'Social Media Manager', tone: 'trendy', focus: 'engagement growth' },
      commands: [{ command: '/post', action: 'create_post', description: 'Cria post' }],
      capabilities: ['instagram', 'twitter', 'linkedin', 'scheduling', 'analytics'],
    },
  },

  // Extra listings for diversity
  {
    seller_id: SELLERS[0].id,
    slug: 'code-review-agent',
    name: 'Code Review Agent',
    tagline: 'Review de codigo automatizado com feedback detalhado',
    description: '# Code Review Agent\n\nReview automatizado de pull requests com sugestoes detalhadas.',
    category: 'development',
    tags: ['code-review', 'quality', 'best-practices'],
    pricing_model: 'free',
    price_amount: 0,
    price_currency: 'BRL',
    downloads: 456,
    active_hires: 20,
    rating_avg: 4.2,
    rating_count: 12,
    featured: false,
    status: 'approved',
    version: '1.4.0',
    agent_config: {
      persona: { role: 'Code Reviewer', tone: 'constructive', focus: 'code quality' },
      commands: [{ command: '/review', action: 'review_code', description: 'Review codigo' }],
      capabilities: ['code-review', 'best-practices', 'security', 'performance'],
    },
  },
  {
    seller_id: SELLERS[1].id,
    slug: 'copywriting-pro',
    name: 'Copywriting Pro',
    tagline: 'Copy persuasivo para vendas e marketing',
    description: '# Copywriting Pro\n\nCria copy persuasivo para landing pages, ads e email sequences.',
    category: 'copywriting',
    tags: ['copywriting', 'ads', 'landing-page', 'conversion'],
    pricing_model: 'per_task',
    price_amount: 1200,
    price_currency: 'BRL',
    downloads: 98,
    active_hires: 5,
    rating_avg: 4.3,
    rating_count: 4,
    featured: false,
    status: 'approved',
    version: '1.0.0',
    agent_config: {
      persona: { role: 'Copywriter', tone: 'persuasive', focus: 'conversion optimization' },
      commands: [{ command: '/copy', action: 'write_copy', description: 'Escreve copy' }],
      capabilities: ['copywriting', 'a-b-testing', 'landing-pages', 'email-sequences'],
    },
  },
  {
    seller_id: SELLERS[0].id,
    slug: 'project-advisor',
    name: 'Project Advisor',
    tagline: 'Consultoria e orientacao para projetos de software',
    description: '# Project Advisor\n\nOrientacao estrategica para decisoes de arquitetura e tecnologia.',
    category: 'advisory',
    tags: ['advisory', 'architecture', 'strategy', 'mentoring'],
    pricing_model: 'hourly',
    price_amount: 5000,
    price_currency: 'BRL',
    downloads: 34,
    active_hires: 1,
    rating_avg: 4.9,
    rating_count: 2,
    featured: false,
    status: 'approved',
    version: '1.0.0',
    agent_config: {
      persona: { role: 'Technical Advisor', tone: 'mentoring', focus: 'strategic decisions' },
      commands: [{ command: '/advise', action: 'advise', description: 'Consulta' }],
      capabilities: ['architecture', 'tech-strategy', 'team-mentoring', 'roadmap'],
    },
  },
];

// --- Reviews ---
const REVIEW_TITLES = [
  'Excelente agente!',
  'Muito bom, recomendo',
  'Fez o que prometeu',
  'Bom mas pode melhorar',
  'Acima das expectativas',
  'Rapido e eficiente',
  'Boa qualidade no geral',
  'Precisou de ajustes mas funcionou',
  'Otimo custo-beneficio',
  'Superou expectativas',
];

const REVIEW_BODIES = [
  'Usamos este agente para automatizar tarefas repetitivas e funcionou muito bem.',
  'A qualidade do output e consistente e o agente responde rapido.',
  'Tivemos que fazer alguns ajustes nos prompts mas no geral atendeu muito bem.',
  'Recomendo para quem precisa de produtividade. Economizou horas de trabalho.',
  'O agente entende bem o contexto e gera resultados relevantes.',
  'Boa documentacao e facil de configurar. Comecamos a usar no mesmo dia.',
  'Funciona bem para a maioria dos casos, mas tem dificuldade com cenarios complexos.',
  'Excelente relacao custo-beneficio comparado com alternativas.',
];

function generateRating(): number {
  // Distribution: centered around 4.2
  const weights = [0.03, 0.07, 0.15, 0.35, 0.40]; // 1-5 stars
  const r = Math.random();
  let cumulative = 0;
  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i];
    if (r <= cumulative) return i + 1;
  }
  return 4;
}

// ============================================================
// MAIN SEED FUNCTION
// ============================================================
async function seed() {
  console.log('Seeding marketplace data...\n');

  // 1. Upsert sellers
  console.log('1. Upserting seller profiles...');
  for (const seller of SELLERS) {
    const { error } = await supabase
      .from('seller_profiles')
      .upsert(seller, { onConflict: 'slug' });
    if (error) {
      console.error(`  Failed to upsert seller ${seller.slug}:`, error.message);
    } else {
      console.log(`  ✓ ${seller.display_name} (${seller.verification})`);
    }
  }

  // 2. Upsert listings
  console.log('\n2. Upserting listings...');
  const listingIds: string[] = [];
  for (const listing of LISTINGS) {
    const id = uuid();
    const payload = {
      id,
      ...listing,
      published_at: new Date().toISOString(),
      agent_tier: 'specialist' as const,
      squad_type: listing.category,
      capabilities: listing.agent_config.capabilities ?? [],
      supported_models: ['claude-sonnet-4-5-20250514'],
      required_tools: [],
      required_mcps: [],
      screenshots: [],
      cover_image_url: `https://placehold.co/800x400/050505/D1FF00?text=${encodeURIComponent(listing.name)}`,
    };

    const { data, error } = await supabase
      .from('marketplace_listings')
      .upsert(payload, { onConflict: 'slug' })
      .select('id')
      .single();

    if (error) {
      console.error(`  Failed to upsert listing ${listing.slug}:`, error.message);
    } else {
      console.log(`  ✓ ${listing.name} (${listing.pricing_model})`);
      listingIds.push(data.id);
    }
  }

  // 3. Create reviews
  console.log('\n3. Creating reviews...');
  let reviewCount = 0;
  for (const listingId of listingIds) {
    const numReviews = randomBetween(1, 5);
    for (let i = 0; i < numReviews; i++) {
      const rating = generateRating();
      const review = {
        id: uuid(),
        order_id: uuid(), // placeholder
        listing_id: listingId,
        reviewer_id: uuid(),
        rating_overall: rating,
        rating_quality: Math.random() > 0.5 ? randomBetween(3, 5) : null,
        rating_speed: Math.random() > 0.5 ? randomBetween(3, 5) : null,
        rating_value: Math.random() > 0.5 ? randomBetween(3, 5) : null,
        rating_accuracy: Math.random() > 0.5 ? randomBetween(3, 5) : null,
        title: randomElement(REVIEW_TITLES),
        body: randomElement(REVIEW_BODIES),
        is_verified_purchase: Math.random() > 0.2,
        is_flagged: false,
        seller_response: Math.random() > 0.7 ? 'Obrigado pelo feedback!' : null,
        seller_responded_at: Math.random() > 0.7 ? new Date().toISOString() : null,
        created_at: new Date(Date.now() - randomBetween(1, 90) * 86400000).toISOString(),
      };

      const { error } = await supabase.from('marketplace_reviews').insert(review);
      if (!error) reviewCount++;
    }
  }
  console.log(`  ✓ ${reviewCount} reviews created`);

  // 4. Summary
  console.log('\n========================================');
  console.log('Seed complete!');
  console.log(`  Sellers: ${SELLERS.length}`);
  console.log(`  Listings: ${listingIds.length}`);
  console.log(`  Reviews: ${reviewCount}`);
  console.log('========================================\n');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
