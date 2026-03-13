import { useState, useMemo } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Eye,
  Zap,
  XCircle,
  Play,
  Pause,
  Megaphone,
  Filter,
  BarChart3,
  Download,
  RefreshCw,
  Target,
  Instagram,
  Globe,
  AlertTriangle,
  ShoppingCart,
  Users,
  MousePointer,
  DollarSign,
  Layers,
  ArrowRight,
  ChevronDown,
  Activity,
  Share2,
  Heart,
  MessageCircle,
  Bookmark,
  UserCheck,
  Percent,
  Wifi,
  WifiOff,
  Search,
} from 'lucide-react'
import {
  CockpitKpiCard,
  CockpitCard,
  CockpitTable, type CockpitTableColumn,
  CockpitTabs,
  CockpitBadge,
  CockpitButton,
  CockpitProgress,
  CockpitSelect,
  CockpitTickerStrip,
  CockpitStatusIndicator,
  CockpitAlert,
  CockpitAccordion,
  CockpitSectionDivider,
} from '../ui/cockpit'

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 1: TYPES & MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════════

type HealthSignal = 'scale' | 'observe' | 'learning' | 'kill'

interface PlatformKpi {
  platform: string
  icon: React.ReactNode
  followers: number
  reach: number
  spend: number
  roas: number
  purchases: number
  engagement_rate: number
  status: 'online' | 'offline' | 'warning'
}

interface CampaignRow {
  id: string
  name: string
  platform: 'meta' | 'google'
  objective: string
  status: 'active' | 'paused' | 'learning'
  health: HealthSignal
  spend: number
  impressions: number
  clicks: number
  ctr: number
  cpc: number
  cpm: number
  conversions: number
  cpa: number
  roas: number
  revenue: number
  daily_budget: number
  frequency: number
  purchase_value: number
}

interface OrganicPost {
  post_id: string
  date: string
  type: 'carousel' | 'reel' | 'image' | 'story' | 'video'
  reach: number
  likes: number
  comments: number
  shares: number
  saves: number
  engagement_rate: number
}

interface FunnelStage {
  label: string
  current: number
  benchmark: number
  status: 'above' | 'at' | 'below'
}

interface RecoveryBranch {
  channel: string
  type: string
  open_rate: number
  click_rate: number
  recovery_rate: number
}

interface ProductFunnel {
  product: string
  sigla: string
  stages: FunnelStage[]
  recovery_branches: RecoveryBranch[]
  revenue: number
  purchases: number
  roas: number
  cpa: number
}

interface IntegrationStatus {
  platform: string
  status: 'connected' | 'error' | 'limited'
  last_sync: string
  error_code?: string
  error_message?: string
}

interface DailyMetric {
  date: string
  spend: number
  impressions: number
  reach: number
  clicks: number
}

interface EngagementData {
  label: string
  value: number
  icon: React.ReactNode
}

interface DemographicRow {
  age_range: string
  male: number
  female: number
  total: number
}

interface OptimizationSuggestion {
  id: string
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string
  impact: string
}

// ── Ticker Items ──

const TICKER_ITEMS = [
  'Investido (30d): R$ 14.920,00',
  'ROAS Geral: 3,21x',
  'CPA Médio: R$ 42,60',
  'CTR Médio: 2,08%',
  'CPM Médio: R$ 19,80',
  'Impressões: 892K',
  'Cliques: 18.560',
  'Conversões: 350',
  'Campanhas Ativas: 9',
  'Seguidores IG: 186K',
  'Reach Orgânico: 124K',
  'Engagement: 4,2%',
]

// ── Platform KPIs ──

const PLATFORM_KPIS: PlatformKpi[] = [
  {
    platform: 'Instagram',
    icon: <Instagram size={14} />,
    followers: 186400,
    reach: 124000,
    spend: 0,
    roas: 0,
    purchases: 0,
    engagement_rate: 4.2,
    status: 'online',
  },
  {
    platform: 'Facebook',
    icon: <Users size={14} />,
    followers: 42800,
    reach: 38500,
    spend: 0,
    roas: 0,
    purchases: 0,
    engagement_rate: 1.8,
    status: 'online',
  },
  {
    platform: 'Meta Ads',
    icon: <Megaphone size={14} />,
    followers: 0,
    reach: 580000,
    spend: 11640,
    roas: 3.48,
    purchases: 268,
    engagement_rate: 0,
    status: 'online',
  },
  {
    platform: 'Google Ads',
    icon: <Globe size={14} />,
    followers: 0,
    reach: 429000,
    spend: 3280,
    roas: 2.57,
    purchases: 82,
    engagement_rate: 0,
    status: 'warning',
  },
]

// ── Campaigns (12 — 9 Meta + 3 Google) ──

const CAMPAIGNS: CampaignRow[] = [
  {
    id: 'C-001',
    name: 'MCPM 2.0 — Perpétua Frio',
    platform: 'meta',
    objective: 'Conversão',
    status: 'active',
    health: 'scale',
    spend: 3240,
    impressions: 186000,
    clicks: 4280,
    ctr: 2.3,
    cpc: 0.76,
    cpm: 17.42,
    conversions: 98,
    cpa: 33.06,
    roas: 4.52,
    revenue: 14650,
    daily_budget: 120,
    frequency: 1.8,
    purchase_value: 149.49,
  },
  {
    id: 'C-002',
    name: 'MAM — Retargeting Checkout',
    platform: 'meta',
    objective: 'Conversão',
    status: 'active',
    health: 'scale',
    spend: 1860,
    impressions: 92000,
    clicks: 2140,
    ctr: 2.33,
    cpc: 0.87,
    cpm: 20.22,
    conversions: 42,
    cpa: 44.29,
    roas: 6.69,
    revenue: 12474,
    daily_budget: 80,
    frequency: 2.4,
    purchase_value: 297.0,
  },
  {
    id: 'C-003',
    name: 'MPG — Topo de Funil',
    platform: 'meta',
    objective: 'Tráfego',
    status: 'active',
    health: 'observe',
    spend: 2100,
    impressions: 210000,
    clicks: 4900,
    ctr: 2.33,
    cpc: 0.43,
    cpm: 10.0,
    conversions: 88,
    cpa: 23.86,
    roas: 1.26,
    revenue: 2637,
    daily_budget: 70,
    frequency: 1.2,
    purchase_value: 29.97,
  },
  {
    id: 'C-004',
    name: 'GPO — Tripwire R$27',
    platform: 'meta',
    objective: 'Conversão',
    status: 'active',
    health: 'scale',
    spend: 980,
    impressions: 68000,
    clicks: 1560,
    ctr: 2.29,
    cpc: 0.63,
    cpm: 14.41,
    conversions: 52,
    cpa: 18.85,
    roas: 1.43,
    revenue: 1404,
    daily_budget: 40,
    frequency: 1.5,
    purchase_value: 27.0,
  },
  {
    id: 'C-005',
    name: 'FDS — Lookalike Compradoras',
    platform: 'meta',
    objective: 'Conversão',
    status: 'active',
    health: 'observe',
    spend: 1540,
    impressions: 118000,
    clicks: 1980,
    ctr: 1.68,
    cpc: 0.78,
    cpm: 13.05,
    conversions: 28,
    cpa: 55.0,
    roas: 1.77,
    revenue: 2716,
    daily_budget: 60,
    frequency: 1.6,
    purchase_value: 97.0,
  },
  {
    id: 'C-006',
    name: 'MCPM 2.0 — Interesse Massagem',
    platform: 'meta',
    objective: 'Conversão',
    status: 'learning',
    health: 'learning',
    spend: 860,
    impressions: 48000,
    clicks: 920,
    ctr: 1.92,
    cpc: 0.93,
    cpm: 17.92,
    conversions: 12,
    cpa: 71.67,
    roas: 2.09,
    revenue: 1797,
    daily_budget: 50,
    frequency: 1.1,
    purchase_value: 149.75,
  },
  {
    id: 'C-007',
    name: 'MAM — Stories Engajamento',
    platform: 'meta',
    objective: 'Engajamento',
    status: 'active',
    health: 'observe',
    spend: 420,
    impressions: 58000,
    clicks: 1240,
    ctr: 2.14,
    cpc: 0.34,
    cpm: 7.24,
    conversions: 8,
    cpa: 52.5,
    roas: 5.65,
    revenue: 2376,
    daily_budget: 20,
    frequency: 2.1,
    purchase_value: 297.0,
  },
  {
    id: 'C-008',
    name: 'GPO — Remarketing Visitantes',
    platform: 'meta',
    objective: 'Conversão',
    status: 'active',
    health: 'scale',
    spend: 340,
    impressions: 22000,
    clicks: 680,
    ctr: 3.09,
    cpc: 0.5,
    cpm: 15.45,
    conversions: 18,
    cpa: 18.89,
    roas: 5.12,
    revenue: 1741,
    daily_budget: 15,
    frequency: 3.2,
    purchase_value: 96.72,
  },
  {
    id: 'C-009',
    name: 'AUT — Perpétua Cold',
    platform: 'meta',
    objective: 'Conversão',
    status: 'paused',
    health: 'kill',
    spend: 300,
    impressions: 34000,
    clicks: 380,
    ctr: 1.12,
    cpc: 0.79,
    cpm: 8.82,
    conversions: 2,
    cpa: 150.0,
    roas: 0.2,
    revenue: 60,
    daily_budget: 15,
    frequency: 1.4,
    purchase_value: 30.0,
  },
  {
    id: 'C-010',
    name: 'GPO — Search Brand',
    platform: 'google',
    objective: 'Search',
    status: 'active',
    health: 'scale',
    spend: 1480,
    impressions: 32000,
    clicks: 1800,
    ctr: 5.63,
    cpc: 0.82,
    cpm: 46.25,
    conversions: 48,
    cpa: 30.83,
    roas: 3.15,
    revenue: 4662,
    daily_budget: 60,
    frequency: 1.0,
    purchase_value: 97.13,
  },
  {
    id: 'C-011',
    name: 'MPG — Display Remarketing',
    platform: 'google',
    objective: 'Display',
    status: 'active',
    health: 'kill',
    spend: 1200,
    impressions: 340000,
    clicks: 2800,
    ctr: 0.82,
    cpc: 0.43,
    cpm: 3.53,
    conversions: 8,
    cpa: 150.0,
    roas: 0.2,
    revenue: 240,
    daily_budget: 40,
    frequency: 4.2,
    purchase_value: 30.0,
  },
  {
    id: 'C-012',
    name: 'MCPM — Shopping/PMAX',
    platform: 'google',
    objective: 'PMAX',
    status: 'active',
    health: 'observe',
    spend: 600,
    impressions: 57000,
    clicks: 880,
    ctr: 1.54,
    cpc: 0.68,
    cpm: 10.53,
    conversions: 26,
    cpa: 23.08,
    roas: 6.47,
    revenue: 3882,
    daily_budget: 25,
    frequency: 1.3,
    purchase_value: 149.31,
  },
]

// ── Organic Posts ──

const ORGANIC_POSTS: OrganicPost[] = [
  { post_id: 'P-001', date: '2026-03-12', type: 'carousel', reach: 18200, likes: 842, comments: 94, shares: 156, saves: 320, engagement_rate: 7.76 },
  { post_id: 'P-002', date: '2026-03-11', type: 'reel', reach: 42800, likes: 2140, comments: 187, shares: 420, saves: 680, engagement_rate: 8.02 },
  { post_id: 'P-003', date: '2026-03-10', type: 'image', reach: 8400, likes: 380, comments: 28, shares: 42, saves: 95, engagement_rate: 6.49 },
  { post_id: 'P-004', date: '2026-03-09', type: 'carousel', reach: 14600, likes: 620, comments: 72, shares: 98, saves: 210, engagement_rate: 6.85 },
  { post_id: 'P-005', date: '2026-03-08', type: 'reel', reach: 38400, likes: 1860, comments: 142, shares: 380, saves: 540, engagement_rate: 7.61 },
  { post_id: 'P-006', date: '2026-03-07', type: 'image', reach: 6200, likes: 240, comments: 18, shares: 24, saves: 68, engagement_rate: 5.65 },
  { post_id: 'P-007', date: '2026-03-06', type: 'carousel', reach: 12800, likes: 540, comments: 56, shares: 82, saves: 180, engagement_rate: 6.7 },
  { post_id: 'P-008', date: '2026-03-05', type: 'reel', reach: 52000, likes: 2840, comments: 224, shares: 560, saves: 920, engagement_rate: 8.74 },
]

// ── Product Funnels ──

const PRODUCT_FUNNELS: ProductFunnel[] = [
  {
    product: 'Manual dos Pontos Gatilhos',
    sigla: 'MPG',
    stages: [
      { label: 'Impressões', current: 210000, benchmark: 200000, status: 'above' },
      { label: 'Cliques', current: 4900, benchmark: 5000, status: 'at' },
      { label: 'Landing Page Views', current: 3200, benchmark: 3500, status: 'below' },
      { label: 'Checkout Iniciado', current: 420, benchmark: 350, status: 'above' },
      { label: 'Compra', current: 88, benchmark: 80, status: 'above' },
    ],
    recovery_branches: [
      { channel: 'Email', type: 'Cart Abandonment', open_rate: 42, click_rate: 18, recovery_rate: 8.5 },
      { channel: 'WhatsApp', type: 'Cart Abandonment', open_rate: 78, click_rate: 32, recovery_rate: 14.2 },
    ],
    revenue: 2637,
    purchases: 88,
    roas: 1.26,
    cpa: 23.86,
  },
  {
    product: 'Guia Pós-Operatório (Tripwire)',
    sigla: 'GPO',
    stages: [
      { label: 'Impressões', current: 90000, benchmark: 80000, status: 'above' },
      { label: 'Cliques', current: 2240, benchmark: 2000, status: 'above' },
      { label: 'Landing Page Views', current: 1680, benchmark: 1400, status: 'above' },
      { label: 'Checkout Iniciado', current: 380, benchmark: 300, status: 'above' },
      { label: 'Compra', current: 70, benchmark: 60, status: 'above' },
    ],
    recovery_branches: [
      { channel: 'Email', type: 'Cart Abandonment', open_rate: 38, click_rate: 15, recovery_rate: 6.8 },
      { channel: 'WhatsApp', type: 'Pós-compra Upsell', open_rate: 82, click_rate: 28, recovery_rate: 12.0 },
    ],
    revenue: 6403,
    purchases: 70,
    roas: 3.87,
    cpa: 23.57,
  },
  {
    product: 'Guia Pós-Operatório (R$97)',
    sigla: 'GPO R$97',
    stages: [
      { label: 'Impressões', current: 32000, benchmark: 30000, status: 'above' },
      { label: 'Cliques', current: 1800, benchmark: 1500, status: 'above' },
      { label: 'Landing Page Views', current: 1200, benchmark: 1000, status: 'above' },
      { label: 'Checkout Iniciado', current: 180, benchmark: 150, status: 'above' },
      { label: 'Compra', current: 48, benchmark: 40, status: 'above' },
    ],
    recovery_branches: [
      { channel: 'Email', type: 'Cart Abandonment', open_rate: 40, click_rate: 16, recovery_rate: 7.2 },
    ],
    revenue: 4662,
    purchases: 48,
    roas: 3.15,
    cpa: 30.83,
  },
  {
    product: 'Auto-Massagem',
    sigla: 'AUT',
    stages: [
      { label: 'Impressões', current: 34000, benchmark: 50000, status: 'below' },
      { label: 'Cliques', current: 380, benchmark: 1000, status: 'below' },
      { label: 'Landing Page Views', current: 220, benchmark: 700, status: 'below' },
      { label: 'Checkout Iniciado', current: 12, benchmark: 70, status: 'below' },
      { label: 'Compra', current: 2, benchmark: 15, status: 'below' },
    ],
    recovery_branches: [],
    revenue: 60,
    purchases: 2,
    roas: 0.2,
    cpa: 150.0,
  },
  {
    product: 'Quiz MPG',
    sigla: 'Quiz MPG',
    stages: [
      { label: 'Impressões', current: 45000, benchmark: 40000, status: 'above' },
      { label: 'Quiz Iniciado', current: 2800, benchmark: 2500, status: 'above' },
      { label: 'Quiz Completo', current: 1960, benchmark: 1750, status: 'above' },
      { label: 'Lead Capturado', current: 1420, benchmark: 1200, status: 'above' },
      { label: 'Compra', current: 42, benchmark: 35, status: 'above' },
    ],
    recovery_branches: [
      { channel: 'Email', type: 'Nurture Sequence', open_rate: 45, click_rate: 12, recovery_rate: 4.2 },
    ],
    revenue: 1259,
    purchases: 42,
    roas: 2.1,
    cpa: 20.0,
  },
  {
    product: 'Quiz GPO',
    sigla: 'Quiz GPO',
    stages: [
      { label: 'Impressões', current: 28000, benchmark: 30000, status: 'at' },
      { label: 'Quiz Iniciado', current: 1800, benchmark: 1800, status: 'at' },
      { label: 'Quiz Completo', current: 1200, benchmark: 1260, status: 'at' },
      { label: 'Lead Capturado', current: 840, benchmark: 900, status: 'below' },
      { label: 'Compra', current: 22, benchmark: 25, status: 'below' },
    ],
    recovery_branches: [
      { channel: 'Email', type: 'Nurture Sequence', open_rate: 40, click_rate: 10, recovery_rate: 3.8 },
    ],
    revenue: 2134,
    purchases: 22,
    roas: 2.84,
    cpa: 36.36,
  },
]

// ── Integration Status ──

const INTEGRATIONS: IntegrationStatus[] = [
  { platform: 'Meta Ads API', status: 'connected', last_sync: '2026-03-13T14:30:00Z' },
  { platform: 'Instagram Graph API', status: 'connected', last_sync: '2026-03-13T14:28:00Z' },
  { platform: 'Google Ads API', status: 'error', last_sync: '2026-03-13T08:15:00Z', error_code: '403', error_message: 'Developer token not approved for production. Apply at ads.google.com/aw/apicenter.' },
  { platform: 'Pinterest Ads', status: 'error', last_sync: '2026-03-10T09:00:00Z', error_code: '401', error_message: 'App not approved. Submit for review at developers.pinterest.com.' },
  { platform: 'TikTok Ads', status: 'limited', last_sync: '2026-03-12T16:00:00Z', error_code: 'RATE_LIMIT', error_message: 'Sandbox mode. Request production access for full data.' },
]

// ── Engagement Data ──

const ENGAGEMENT_DATA: EngagementData[] = [
  { label: 'Visualizações', value: 248000, icon: <Eye size={12} /> },
  { label: 'Curtidas', value: 9462, icon: <Heart size={12} /> },
  { label: 'Visitas ao Perfil', value: 4280, icon: <UserCheck size={12} /> },
  { label: 'Comentários', value: 821, icon: <MessageCircle size={12} /> },
  { label: 'Compartilhamentos', value: 1762, icon: <Share2 size={12} /> },
  { label: 'Salvamentos', value: 3013, icon: <Bookmark size={12} /> },
]

// ── Daily Metrics (14 days) ──

const DAILY_METRICS: DailyMetric[] = [
  { date: '28/fev', spend: 480, impressions: 28000, reach: 18000, clicks: 620 },
  { date: '01/mar', spend: 520, impressions: 31000, reach: 20000, clicks: 680 },
  { date: '02/mar', spend: 490, impressions: 29500, reach: 19200, clicks: 640 },
  { date: '03/mar', spend: 510, impressions: 30200, reach: 19800, clicks: 660 },
  { date: '04/mar', spend: 540, impressions: 32400, reach: 21000, clicks: 720 },
  { date: '05/mar', spend: 480, impressions: 28800, reach: 18600, clicks: 600 },
  { date: '06/mar', spend: 460, impressions: 27600, reach: 17800, clicks: 580 },
  { date: '07/mar', spend: 530, impressions: 31800, reach: 20600, clicks: 700 },
  { date: '08/mar', spend: 550, impressions: 33000, reach: 21400, clicks: 740 },
  { date: '09/mar', spend: 500, impressions: 30000, reach: 19400, clicks: 650 },
  { date: '10/mar', spend: 520, impressions: 31200, reach: 20200, clicks: 680 },
  { date: '11/mar', spend: 560, impressions: 33600, reach: 21800, clicks: 760 },
  { date: '12/mar', spend: 540, impressions: 32400, reach: 21000, clicks: 720 },
  { date: '13/mar', spend: 570, impressions: 34200, reach: 22200, clicks: 780 },
]

// ── Demographics ──

const DEMOGRAPHICS: DemographicRow[] = [
  { age_range: '18-24', male: 420, female: 2180, total: 2600 },
  { age_range: '25-34', male: 1840, female: 12600, total: 14440 },
  { age_range: '35-44', male: 2200, female: 18400, total: 20600 },
  { age_range: '45-54', male: 1600, female: 14200, total: 15800 },
  { age_range: '55-64', male: 680, female: 6800, total: 7480 },
  { age_range: '65+', male: 240, female: 2840, total: 3080 },
]

// ── Optimization Suggestions ──

const OPTIMIZATION_SUGGESTIONS: OptimizationSuggestion[] = [
  {
    id: 'OPT-001',
    severity: 'critical',
    title: 'Desligar MPG — Display Remarketing (Google)',
    description: 'ROAS 0,20x com CPA de R$150. Campanha sem conversão efetiva há 14 dias. Frequência 4,2x indica fadiga criativa severa.',
    impact: 'Economia de R$40/dia (R$1.200/mês) redirecionável para campanhas SCALE.',
  },
  {
    id: 'OPT-002',
    severity: 'critical',
    title: 'Desligar AUT — Perpétua Cold',
    description: 'Apenas 2 conversões com R$300 investidos. CTR 1,12% abaixo do mínimo viável (1,5%). Produto pode não ter demanda em tráfego frio.',
    impact: 'Economia de R$15/dia. Realocar para GPO Tripwire que tem CPA 7x menor.',
  },
  {
    id: 'OPT-003',
    severity: 'warning',
    title: 'Escalar MCPM 2.0 — Perpétua Frio',
    description: 'ROAS 4,52x consistente. CPA R$33 estável. Frequência 1,8x saudável. Espaço para aumento de 20-30% no budget sem degradação.',
    impact: 'Potencial de +R$4.400 receita/mês com incremento de R$36/dia.',
  },
  {
    id: 'OPT-004',
    severity: 'warning',
    title: 'Escalar MAM — Retargeting Checkout',
    description: 'ROAS 6,69x excepcional. Audiência de retargeting limitada mas altamente qualificada. Aumentar budget com cuidado na frequência (já em 2,4x).',
    impact: 'Potencial de +R$3.700 receita/mês. Monitorar frequência — cap em 3,0x.',
  },
  {
    id: 'OPT-005',
    severity: 'warning',
    title: 'Otimizar LPV do MPG — Topo de Funil',
    description: 'CTR de 2,33% excelente mas landing page view rate caindo. Possível lentidão no carregamento ou mismatch entre anúncio e landing page.',
    impact: 'Melhoria de 10% no LPV adicionaria ~490 views e ~9 conversões/mês.',
  },
  {
    id: 'OPT-006',
    severity: 'info',
    title: 'Resolver erro Google Ads API (403)',
    description: 'Developer token pendente de aprovação para produção. Dados limitados a relatórios manuais. Submeter aplicação em ads.google.com/aw/apicenter.',
    impact: 'Desbloqueará relatórios automatizados e otimização algorítmica.',
  },
  {
    id: 'OPT-007',
    severity: 'info',
    title: 'MCPM 2.0 — Interesse Massagem em Learning',
    description: 'Campanha em fase de aprendizado com 12 conversões. Meta recomenda 50 conversões/semana para sair de learning. Budget atual pode ser insuficiente.',
    impact: 'Se viável, aumentar budget para R$80/dia por 7 dias para acelerar learning.',
  },
]

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 2: HELPERS & SVG CHARTS
// ═══════════════════════════════════════════════════════════════════════════════

function formatCurrency(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatNumber(val: number) {
  if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M'
  if (val >= 1000) return (val / 1000).toFixed(1) + 'K'
  return val.toLocaleString('pt-BR')
}

function formatPercent(val: number) {
  return val.toFixed(2).replace('.', ',') + '%'
}

function getHealthColor(health: HealthSignal): string {
  const map: Record<HealthSignal, string> = {
    scale: 'var(--aiox-lime)',
    observe: 'var(--aiox-blue)',
    learning: 'var(--aiox-gray-muted)',
    kill: 'var(--color-status-error)',
  }
  return map[health]
}

function getHealthBadge(health: HealthSignal) {
  const map: Record<HealthSignal, { variant: 'lime' | 'blue' | 'surface' | 'error'; label: string; icon: React.ReactNode }> = {
    scale: { variant: 'lime', label: 'SCALE', icon: <TrendingUp size={10} /> },
    observe: { variant: 'blue', label: 'OBSERVE', icon: <Eye size={10} /> },
    learning: { variant: 'surface', label: 'LEARNING', icon: <Zap size={10} /> },
    kill: { variant: 'error', label: 'KILL', icon: <XCircle size={10} /> },
  }
  const { variant, label, icon } = map[health]
  return (
    <CockpitBadge variant={variant} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
      {icon} {label}
    </CockpitBadge>
  )
}

function getPlatformBadge(platform: 'meta' | 'google') {
  return (
    <CockpitBadge variant={platform === 'meta' ? 'blue' : 'surface'} style={{ fontSize: '0.45rem' }}>
      {platform === 'meta' ? 'META' : 'GOOGLE'}
    </CockpitBadge>
  )
}

function getStatusIcon(status: string) {
  if (status === 'active') return <Play size={10} style={{ color: 'var(--aiox-lime)' }} />
  if (status === 'paused') return <Pause size={10} style={{ color: 'var(--aiox-gray-dim)' }} />
  return <Zap size={10} style={{ color: 'var(--aiox-blue)' }} />
}

function getPostTypeBadge(type: OrganicPost['type']) {
  const map: Record<string, 'lime' | 'blue' | 'surface' | 'error' | 'solid'> = {
    reel: 'lime',
    carousel: 'blue',
    image: 'surface',
    video: 'blue',
    story: 'surface',
  }
  return (
    <CockpitBadge variant={map[type] || 'surface'} style={{ fontSize: '0.45rem', textTransform: 'uppercase' }}>
      {type}
    </CockpitBadge>
  )
}

function getSeverityBadge(severity: OptimizationSuggestion['severity']) {
  const map: Record<string, { variant: 'error' | 'lime' | 'blue'; label: string }> = {
    critical: { variant: 'error', label: 'CRITICAL' },
    warning: { variant: 'lime', label: 'WARNING' },
    info: { variant: 'blue', label: 'INFO' },
  }
  const { variant, label } = map[severity]
  return <CockpitBadge variant={variant} style={{ fontSize: '0.45rem' }}>{label}</CockpitBadge>
}

function getFreshnessLabel(isoDate: string): { label: string; color: string } {
  const diff = Date.now() - new Date(isoDate).getTime()
  const hours = diff / (1000 * 60 * 60)
  if (hours < 1) return { label: 'Agora', color: 'var(--aiox-lime)' }
  if (hours < 6) return { label: `${Math.floor(hours)}h atrás`, color: 'var(--aiox-lime)' }
  if (hours < 24) return { label: `${Math.floor(hours)}h atrás`, color: 'var(--aiox-blue)' }
  return { label: `${Math.floor(hours / 24)}d atrás`, color: 'var(--color-status-error)' }
}

// ── SVG Charts ──

function HorizontalBarChart({
  data,
  maxValue,
  valueKey,
  labelKey,
  formatValue,
  thresholds,
}: {
  data: Array<Record<string, unknown>>
  maxValue: number
  valueKey: string
  labelKey: string
  formatValue: (v: number) => string
  thresholds?: { high: number; mid: number }
}) {
  const barHeight = 22
  const labelWidth = 200
  const valueWidth = 70
  const chartWidth = 500
  const gap = 4
  const totalHeight = data.length * (barHeight + gap)

  const getColor = (val: number) => {
    if (!thresholds) return 'var(--aiox-lime)'
    if (val >= thresholds.high) return 'var(--aiox-lime)'
    if (val >= thresholds.mid) return 'var(--aiox-blue)'
    return 'var(--color-status-error)'
  }

  return (
    <svg
      viewBox={`0 0 ${labelWidth + chartWidth + valueWidth + 20} ${totalHeight}`}
      style={{ width: '100%', height: 'auto', fontFamily: 'var(--font-family-mono)' }}
      role="img"
      aria-label="Horizontal bar chart"
    >
      {data.map((item, i) => {
        const val = item[valueKey] as number
        const barW = maxValue > 0 ? (val / maxValue) * chartWidth : 0
        const y = i * (barHeight + gap)
        return (
          <g key={i}>
            <text
              x={labelWidth - 8}
              y={y + barHeight / 2 + 1}
              textAnchor="end"
              dominantBaseline="middle"
              fill="var(--aiox-gray-muted)"
              fontSize="9"
            >
              {String(item[labelKey]).length > 28
                ? String(item[labelKey]).slice(0, 28) + '…'
                : String(item[labelKey])}
            </text>
            <rect
              x={labelWidth}
              y={y}
              width={Math.max(barW, 2)}
              height={barHeight}
              fill={getColor(val)}
              opacity={0.85}
            />
            <text
              x={labelWidth + chartWidth + 8}
              y={y + barHeight / 2 + 1}
              dominantBaseline="middle"
              fill={getColor(val)}
              fontSize="10"
              fontWeight="700"
              style={{ fontFamily: 'var(--font-family-display)' }}
            >
              {formatValue(val)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function DoughnutChart({
  segments,
  centerLabel,
  centerValue,
  size = 160,
}: {
  segments: Array<{ label: string; value: number; color: string }>
  centerLabel: string
  centerValue: string
  size?: number
}) {
  const total = segments.reduce((a, s) => a + s.value, 0)
  const cx = size / 2
  const cy = size / 2
  const radius = size * 0.38
  const strokeWidth = size * 0.12
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label="Doughnut chart"
      >
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="rgba(156,156,156,0.08)" strokeWidth={strokeWidth} />
        {segments.map((seg, i) => {
          const pct = total > 0 ? seg.value / total : 0
          const dash = pct * circumference
          const gap = circumference - dash
          const currentOffset = offset
          offset += dash
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-currentOffset}
              transform={`rotate(-90 ${cx} ${cy})`}
              style={{ transition: 'stroke-dasharray 0.5s ease' }}
            />
          )
        })}
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--aiox-gray-dim)"
          fontSize="8"
          fontFamily="var(--font-family-mono)"
          textDecoration="uppercase"
          letterSpacing="0.08em"
        >
          {centerLabel}
        </text>
        <text
          x={cx}
          y={cy + 10}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--aiox-cream)"
          fontSize="16"
          fontWeight="700"
          fontFamily="var(--font-family-display)"
        >
          {centerValue}
        </text>
      </svg>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {segments.map((seg, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <div style={{ width: 8, height: 8, background: seg.color, flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.5rem', color: 'var(--aiox-gray-muted)' }}>
              {seg.label} ({total > 0 ? ((seg.value / total) * 100).toFixed(0) : 0}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function VerticalBarChart({
  data,
  bars,
  labelKey,
  height = 200,
}: {
  data: Array<Record<string, unknown>>
  bars: Array<{ key: string; color: string; label: string }>
  labelKey: string
  height?: number
}) {
  const maxValue = data.reduce((max, item) => {
    return Math.max(max, ...bars.map((b) => (item[b.key] as number) || 0))
  }, 0)

  const chartPadding = { top: 10, right: 20, bottom: 40, left: 50 }
  const chartWidth = 600
  const chartHeight = height
  const plotW = chartWidth - chartPadding.left - chartPadding.right
  const plotH = chartHeight - chartPadding.top - chartPadding.bottom
  const groupWidth = plotW / data.length
  const barWidth = Math.min(groupWidth / (bars.length + 1), 28)

  const gridLines = 4
  const gridValues = Array.from({ length: gridLines + 1 }, (_, i) => (maxValue / gridLines) * i)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        style={{ width: '100%', height: 'auto', fontFamily: 'var(--font-family-mono)' }}
        role="img"
        aria-label="Vertical bar chart"
      >
        {/* Grid lines */}
        {gridValues.map((val, i) => {
          const y = chartPadding.top + plotH - (val / maxValue) * plotH
          return (
            <g key={i}>
              <line
                x1={chartPadding.left}
                y1={y}
                x2={chartPadding.left + plotW}
                y2={y}
                stroke="rgba(156,156,156,0.1)"
                strokeDasharray="4 4"
              />
              <text
                x={chartPadding.left - 8}
                y={y + 3}
                textAnchor="end"
                fill="var(--aiox-gray-dim)"
                fontSize="8"
              >
                {formatNumber(val)}
              </text>
            </g>
          )
        })}

        {/* Bars */}
        {data.map((item, di) => {
          const groupX = chartPadding.left + di * groupWidth
          return (
            <g key={di}>
              {bars.map((bar, bi) => {
                const val = (item[bar.key] as number) || 0
                const barH = maxValue > 0 ? (val / maxValue) * plotH : 0
                const x = groupX + (groupWidth - bars.length * barWidth) / 2 + bi * barWidth
                const y = chartPadding.top + plotH - barH
                return (
                  <rect
                    key={bi}
                    x={x}
                    y={y}
                    width={barWidth - 2}
                    height={barH}
                    fill={bar.color}
                    opacity={0.85}
                  />
                )
              })}
              <text
                x={groupX + groupWidth / 2}
                y={chartHeight - 8}
                textAnchor="middle"
                fill="var(--aiox-gray-dim)"
                fontSize="8"
              >
                {String(item[labelKey])}
              </text>
            </g>
          )
        })}
      </svg>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        {bars.map((bar, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <div style={{ width: 10, height: 10, background: bar.color }} />
            <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.5rem', color: 'var(--aiox-gray-muted)' }}>
              {bar.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Shared Sub-Components ──

function MetricCell({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div>
      <span
        style={{
          fontFamily: 'var(--font-family-mono)',
          fontSize: '0.45rem',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--aiox-gray-dim)',
          display: 'block',
          marginBottom: '0.15rem',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-family-display)',
          fontSize: '0.85rem',
          fontWeight: 700,
          color: highlight ? 'var(--aiox-lime)' : 'var(--aiox-cream)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </span>
    </div>
  )
}

function SummaryMetric({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <span
        style={{
          fontFamily: 'var(--font-family-mono)',
          fontSize: '0.5rem',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--aiox-gray-dim)',
          display: 'block',
          marginBottom: '0.25rem',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-family-display)',
          fontSize: '1.25rem',
          fontWeight: 700,
          color: color || 'var(--aiox-cream)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </span>
    </div>
  )
}

function HealthSummaryCard({
  count,
  label,
  color,
}: {
  count: number
  label: string
  color: string
}) {
  return (
    <CockpitCard variant="subtle" padding="sm">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ width: 8, height: 8, background: color, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <span
            style={{
              fontFamily: 'var(--font-family-mono)',
              fontSize: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--aiox-gray-dim)',
            }}
          >
            {label}
          </span>
        </div>
        <span
          style={{
            fontFamily: 'var(--font-family-display)',
            fontSize: '1.25rem',
            fontWeight: 700,
            color,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {count}
        </span>
      </div>
    </CockpitCard>
  )
}

function DataFreshnessIndicator({ lastSync }: { lastSync: string }) {
  const { label, color } = getFreshnessLabel(lastSync)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
      <div
        style={{
          width: 6,
          height: 6,
          background: color,
          flexShrink: 0,
          boxShadow: `0 0 4px ${color}`,
        }}
      />
      <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.5rem', color: 'var(--aiox-gray-dim)' }}>
        {label}
      </span>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 3: MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

type TabId = 'overview' | 'paid' | 'organic' | 'compare' | 'funnels'

export default function TrafficDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [dateRange, setDateRange] = useState('last_30d')
  const [platformFilter, setPlatformFilter] = useState('all')

  const filteredCampaigns = useMemo(() => {
    if (platformFilter === 'all') return CAMPAIGNS
    return CAMPAIGNS.filter((c) => c.platform === platformFilter)
  }, [platformFilter])

  const totals = useMemo(() => {
    const totalSpend = CAMPAIGNS.reduce((a, c) => a + c.spend, 0)
    const totalRevenue = CAMPAIGNS.reduce((a, c) => a + c.revenue, 0)
    const totalConversions = CAMPAIGNS.reduce((a, c) => a + c.conversions, 0)
    const totalImpressions = CAMPAIGNS.reduce((a, c) => a + c.impressions, 0)
    const totalClicks = CAMPAIGNS.reduce((a, c) => a + c.clicks, 0)
    return {
      spend: totalSpend,
      revenue: totalRevenue,
      conversions: totalConversions,
      impressions: totalImpressions,
      clicks: totalClicks,
      roas: totalSpend > 0 ? totalRevenue / totalSpend : 0,
      cpa: totalConversions > 0 ? totalSpend / totalConversions : 0,
      ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      cpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
      cpm: totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0,
    }
  }, [])

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: <Activity size={12} /> },
    { id: 'paid', label: 'Tráfego Pago', icon: <Megaphone size={12} /> },
    { id: 'organic', label: 'Orgânico', icon: <Instagram size={12} /> },
    { id: 'compare', label: 'Comparativo', icon: <BarChart3 size={12} /> },
    { id: 'funnels', label: 'Funis', icon: <Filter size={12} /> },
  ]

  return (
    <div
      className="pattern-dot-grid--sparse"
      style={{ height: '100%', overflow: 'auto', position: 'relative' }}
    >
      <CockpitTickerStrip items={TICKER_ITEMS} speed={40} />

      <div style={{ padding: '1.5rem' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-family-display)',
                fontSize: '1.75rem',
                fontWeight: 700,
                color: 'var(--aiox-cream)',
                lineHeight: 1,
                margin: 0,
              }}
            >
              Traffic Command
            </h1>
            <p
              style={{
                fontFamily: 'var(--font-family-mono)',
                fontSize: '0.6rem',
                color: 'var(--aiox-gray-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginTop: '0.25rem',
              }}
            >
              Meta Ads + Google Ads + Orgânico — Multi-Platform Intelligence
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <CockpitStatusIndicator status="online" label="Meta" />
            <CockpitStatusIndicator status="online" label="Instagram" />
            <CockpitStatusIndicator status="warning" label="Google" />
            <CockpitSelect
              options={[
                { value: 'last_7d', label: 'Últimos 7 dias' },
                { value: 'last_14d', label: 'Últimos 14 dias' },
                { value: 'last_30d', label: 'Últimos 30 dias' },
                { value: 'last_90d', label: 'Últimos 90 dias' },
              ]}
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              style={{ width: 160 }}
            />
            <CockpitButton variant="secondary" size="sm" leftIcon={<RefreshCw size={12} />}>
              Atualizar
            </CockpitButton>
          </div>
        </div>

        {/* KPI Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <CockpitKpiCard label="Investido (30d)" value={formatCurrency(totals.spend)} change="+8,2%" trend="up" />
          <CockpitKpiCard label="ROAS Geral" value={`${totals.roas.toFixed(2)}x`} change="+0,34x" trend="up" />
          <CockpitKpiCard label="CPA Médio" value={formatCurrency(totals.cpa)} change="-4,2%" trend="down" />
          <CockpitKpiCard label="Conversões" value={String(totals.conversions)} change="+18" trend="up" />
        </div>

        {/* Health Signal Summary */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '0.75rem',
            marginBottom: '1.5rem',
          }}
        >
          <HealthSummaryCard
            count={CAMPAIGNS.filter((c) => c.health === 'scale').length}
            label="Escalar"
            color="var(--aiox-lime)"
          />
          <HealthSummaryCard
            count={CAMPAIGNS.filter((c) => c.health === 'observe').length}
            label="Observar"
            color="var(--aiox-blue)"
          />
          <HealthSummaryCard
            count={CAMPAIGNS.filter((c) => c.health === 'learning').length}
            label="Aprendendo"
            color="var(--aiox-gray-muted)"
          />
          <HealthSummaryCard
            count={CAMPAIGNS.filter((c) => c.health === 'kill').length}
            label="Desligar"
            color="var(--color-status-error)"
          />
        </div>

        {/* Tabs */}
        <CockpitTabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as TabId)}
        />

        {/* Tab Content */}
        <div style={{ marginTop: '1.5rem' }}>
          {activeTab === 'overview' && <OverviewTab totals={totals} />}
          {activeTab === 'paid' && (
            <PaidTrafficTab
              campaigns={filteredCampaigns}
              allCampaigns={CAMPAIGNS}
              platformFilter={platformFilter}
              onPlatformChange={setPlatformFilter}
            />
          )}
          {activeTab === 'organic' && <OrganicTab />}
          {activeTab === 'compare' && <CompareTab campaigns={CAMPAIGNS} />}
          {activeTab === 'funnels' && <FunnelsTab />}
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: '2rem',
            paddingTop: '1rem',
            borderTop: '1px solid rgba(156, 156, 156, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <DataFreshnessIndicator lastSync={INTEGRATIONS[0].last_sync} />
            <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.45rem', color: 'var(--aiox-gray-dim)' }}>
              Dados: Mock — Integração com APIs reais pendente
            </span>
          </div>
          <CockpitButton variant="ghost" size="sm" leftIcon={<Download size={12} />}>
            Exportar JSON
          </CockpitButton>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 4: TAB — VISÃO GERAL
// ═══════════════════════════════════════════════════════════════════════════════

function OverviewTab({ totals }: { totals: Record<string, number> }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Summary Bar — 6 Metrics */}
      <CockpitSectionDivider label="Resumo Multicanal" num="01" />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '0.75rem',
        }}
      >
        <SummaryMetric label="Seguidores IG" value={formatNumber(186400)} />
        <SummaryMetric label="Reach Orgânico" value={formatNumber(124000)} />
        <SummaryMetric label="Reach Pago" value={formatNumber(totals.impressions)} />
        <SummaryMetric label="Spend 30d" value={formatCurrency(totals.spend)} />
        <SummaryMetric label="ROAS" value={`${totals.roas.toFixed(2)}x`} color="var(--aiox-lime)" />
        <SummaryMetric label="Compras" value={String(totals.conversions)} color="var(--aiox-lime)" />
      </div>

      {/* Platform KPI Cards */}
      <CockpitSectionDivider label="KPIs por Plataforma" num="02" />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1rem',
        }}
      >
        {PLATFORM_KPIS.map((pk) => (
          <CockpitCard key={pk.platform} accentBorder="top" padding="md">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <CockpitStatusIndicator status={pk.status} />
              <span style={{ color: 'var(--aiox-cream)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                {pk.icon}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-family-mono)',
                  fontSize: '0.625rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--aiox-cream)',
                }}
              >
                {pk.platform}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
              {pk.followers > 0 && <MetricCell label="Seguidores" value={formatNumber(pk.followers)} />}
              <MetricCell label="Alcance" value={formatNumber(pk.reach)} />
              {pk.spend > 0 && <MetricCell label="Investido" value={formatCurrency(pk.spend)} />}
              {pk.roas > 0 && <MetricCell label="ROAS" value={`${pk.roas.toFixed(2)}x`} highlight={pk.roas >= 3} />}
              {pk.purchases > 0 && <MetricCell label="Compras" value={String(pk.purchases)} />}
              {pk.engagement_rate > 0 && <MetricCell label="Engagement" value={formatPercent(pk.engagement_rate)} />}
            </div>
          </CockpitCard>
        ))}
      </div>

      {/* Paid Traffic KPIs — 8-metric grid */}
      <CockpitSectionDivider label="Tráfego Pago — Métricas Agregadas" num="03" />
      <CockpitCard accentBorder="left" padding="md">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '1rem',
          }}
        >
          <MetricCell label="Spend" value={formatCurrency(totals.spend)} />
          <MetricCell label="Impressões" value={formatNumber(totals.impressions)} />
          <MetricCell label="Cliques" value={formatNumber(totals.clicks)} />
          <MetricCell label="CTR" value={formatPercent(totals.ctr)} />
          <MetricCell label="CPC" value={formatCurrency(totals.cpc)} />
          <MetricCell label="CPM" value={formatCurrency(totals.cpm)} />
          <MetricCell label="Conversões" value={String(totals.conversions)} highlight />
          <MetricCell label="CPA" value={formatCurrency(totals.cpa)} />
        </div>
      </CockpitCard>

      {/* Blocked Integrations */}
      {INTEGRATIONS.filter((i) => i.status !== 'connected').length > 0 && (
        <>
          <CockpitSectionDivider label="Integrações Bloqueadas" num="04" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {INTEGRATIONS.filter((i) => i.status !== 'connected').map((integration) => (
              <CockpitAlert
                key={integration.platform}
                variant={integration.status === 'error' ? 'error' : 'warning'}
                title={`${integration.platform} — ${integration.error_code}`}
                icon={integration.status === 'error' ? <WifiOff size={14} /> : <AlertTriangle size={14} />}
              >
                <p style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.55rem', color: 'var(--aiox-gray-muted)', margin: 0 }}>
                  {integration.error_message}
                </p>
                <div style={{ marginTop: '0.35rem' }}>
                  <DataFreshnessIndicator lastSync={integration.last_sync} />
                </div>
              </CockpitAlert>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 5: TAB — TRÁFEGO PAGO
// ═══════════════════════════════════════════════════════════════════════════════

function PaidTrafficTab({
  campaigns,
  allCampaigns,
  platformFilter,
  onPlatformChange,
}: {
  campaigns: CampaignRow[]
  allCampaigns: CampaignRow[]
  platformFilter: string
  onPlatformChange: (v: string) => void
}) {
  const [sortKey, setSortKey] = useState<string>('roas')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const sortedCampaigns = useMemo(() => {
    return [...campaigns].sort((a, b) => {
      const aVal = a[sortKey as keyof CampaignRow]
      const bVal = b[sortKey as keyof CampaignRow]
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal
      }
      return 0
    })
  }, [campaigns, sortKey, sortDir])

  const metaCampaigns = allCampaigns.filter((c) => c.platform === 'meta')
  const googleCampaigns = allCampaigns.filter((c) => c.platform === 'google')
  const metaSpend = metaCampaigns.reduce((a, c) => a + c.spend, 0)
  const googleSpend = googleCampaigns.reduce((a, c) => a + c.spend, 0)
  const metaPurchases = metaCampaigns.reduce((a, c) => a + c.conversions, 0)
  const googlePurchases = googleCampaigns.reduce((a, c) => a + c.conversions, 0)

  const roasSorted = [...allCampaigns].sort((a, b) => b.roas - a.roas)
  const maxRoas = roasSorted.length > 0 ? roasSorted[0].roas : 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Filter bar */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <CockpitSelect
          options={[
            { value: 'all', label: 'Todas as plataformas' },
            { value: 'meta', label: 'Meta Ads' },
            { value: 'google', label: 'Google Ads' },
          ]}
          value={platformFilter}
          onChange={(e) => onPlatformChange(e.target.value)}
          style={{ width: 200 }}
        />
        <CockpitBadge variant="surface">{campaigns.length} campanhas</CockpitBadge>
        <div style={{ flex: 1 }} />
        <CockpitButton variant="ghost" size="sm" leftIcon={<Download size={12} />}>
          Exportar
        </CockpitButton>
      </div>

      {/* Campaign Table */}
      <CockpitSectionDivider label="Campanhas — Kill / Scale" num="01" />
      <CockpitCard accentBorder="left" padding="none">
        <div style={{ padding: '1rem' }}>
          <CockpitTable
            columns={[
              {
                key: 'name',
                header: 'Campanha',
                width: '240px',
                render: (_v: unknown, row: CampaignRow) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {getStatusIcon(row.status)}
                    <span style={{ fontSize: '0.6rem', color: 'var(--aiox-cream)' }}>{row.name}</span>
                  </div>
                ),
              },
              {
                key: 'platform',
                header: 'Platf.',
                width: '80px',
                render: (_v: unknown, row: CampaignRow) => getPlatformBadge(row.platform),
              },
              {
                key: 'health',
                header: 'Saúde',
                width: '100px',
                sortable: true,
                render: (_v: unknown, row: CampaignRow) => getHealthBadge(row.health),
              },
              {
                key: 'status',
                header: 'Status',
                width: '80px',
                render: (_v: unknown, row: CampaignRow) => (
                  <CockpitBadge variant={row.status === 'active' ? 'lime' : row.status === 'paused' ? 'surface' : 'blue'} style={{ fontSize: '0.45rem' }}>
                    {row.status.toUpperCase()}
                  </CockpitBadge>
                ),
              },
              {
                key: 'spend',
                header: 'Gasto',
                width: '100px',
                sortable: true,
                align: 'right',
                render: (_v: unknown, row: CampaignRow) => (
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(row.spend)}</span>
                ),
              },
              {
                key: 'roas',
                header: 'ROAS',
                width: '80px',
                sortable: true,
                align: 'right',
                render: (_v: unknown, row: CampaignRow) => (
                  <span
                    style={{
                      fontVariantNumeric: 'tabular-nums',
                      fontWeight: 700,
                      color: row.roas >= 3 ? 'var(--aiox-lime)' : row.roas >= 1 ? 'var(--aiox-cream)' : 'var(--color-status-error)',
                    }}
                  >
                    {row.roas.toFixed(2)}x
                  </span>
                ),
              },
              {
                key: 'conversions',
                header: 'Conv.',
                width: '70px',
                sortable: true,
                align: 'right',
                render: (_v: unknown, row: CampaignRow) => (
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>{row.conversions}</span>
                ),
              },
              {
                key: 'cpa',
                header: 'CPA',
                width: '90px',
                sortable: true,
                align: 'right',
                render: (_v: unknown, row: CampaignRow) => (
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(row.cpa)}</span>
                ),
              },
              {
                key: 'ctr',
                header: 'CTR',
                width: '70px',
                sortable: true,
                align: 'right',
                render: (_v: unknown, row: CampaignRow) => (
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>{row.ctr.toFixed(2)}%</span>
                ),
              },
            ] as CockpitTableColumn<CampaignRow>[]}
            data={sortedCampaigns}
            hoverable
            striped
            compact
            sortKey={sortKey}
            sortDirection={sortDir}
            onSort={(key, dir) => { setSortKey(key); setSortDir(dir) }}
          />
        </div>
      </CockpitCard>

      {/* Budget Allocation — 2 Doughnuts */}
      <CockpitSectionDivider label="Distribuição de Budget" num="02" />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
        }}
      >
        <CockpitCard accentBorder="top" padding="md">
          <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--aiox-gray-dim)', display: 'block', marginBottom: '1rem' }}>
            Spend por Plataforma
          </span>
          <DoughnutChart
            segments={[
              { label: 'Meta Ads', value: metaSpend, color: 'var(--aiox-blue)' },
              { label: 'Google Ads', value: googleSpend, color: 'var(--aiox-gray-muted)' },
            ]}
            centerLabel="Total"
            centerValue={formatCurrency(metaSpend + googleSpend)}
          />
        </CockpitCard>
        <CockpitCard accentBorder="top" padding="md">
          <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--aiox-gray-dim)', display: 'block', marginBottom: '1rem' }}>
            Compras por Plataforma
          </span>
          <DoughnutChart
            segments={[
              { label: 'Meta Ads', value: metaPurchases, color: 'var(--aiox-lime)' },
              { label: 'Google Ads', value: googlePurchases, color: 'var(--aiox-gray-muted)' },
            ]}
            centerLabel="Total"
            centerValue={String(metaPurchases + googlePurchases)}
          />
        </CockpitCard>
      </div>

      {/* Campaign Ranking by ROAS */}
      <CockpitSectionDivider label="Ranking por ROAS" num="03" />
      <CockpitCard accentBorder="left" padding="md">
        <HorizontalBarChart
          data={roasSorted as unknown as Array<Record<string, unknown>>}
          maxValue={maxRoas}
          valueKey="roas"
          labelKey="name"
          formatValue={(v) => `${v.toFixed(2)}x`}
          thresholds={{ high: 3, mid: 1 }}
        />
      </CockpitCard>

      {/* Health Summary Cards */}
      <CockpitSectionDivider label="Distribuição de Saúde" num="04" />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
        }}
      >
        {(['scale', 'observe', 'learning', 'kill'] as HealthSignal[]).map((signal) => {
          const matching = allCampaigns.filter((c) => c.health === signal)
          const spend = matching.reduce((a, c) => a + c.spend, 0)
          const revenue = matching.reduce((a, c) => a + c.revenue, 0)
          const conv = matching.reduce((a, c) => a + c.conversions, 0)
          return (
            <CockpitCard key={signal} accentBorder="left" padding="md" accentColor={getHealthColor(signal)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                {getHealthBadge(signal)}
                <CockpitBadge variant="surface" style={{ fontSize: '0.45rem' }}>{matching.length} camp.</CockpitBadge>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <MetricCell label="Spend" value={formatCurrency(spend)} />
                <MetricCell label="Receita" value={formatCurrency(revenue)} highlight={revenue > spend} />
                <MetricCell label="Conv." value={String(conv)} />
                <MetricCell label="ROAS" value={spend > 0 ? `${(revenue / spend).toFixed(2)}x` : '—'} highlight={spend > 0 && revenue / spend >= 3} />
              </div>
            </CockpitCard>
          )
        })}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 6: TAB — ORGÂNICO
// ═══════════════════════════════════════════════════════════════════════════════

function OrganicTab() {
  const totalDemoPopulation = DEMOGRAPHICS.reduce((a, d) => a + d.total, 0)
  const totalMale = DEMOGRAPHICS.reduce((a, d) => a + d.male, 0)
  const totalFemale = DEMOGRAPHICS.reduce((a, d) => a + d.female, 0)

  const engagementMax = Math.max(...ENGAGEMENT_DATA.map((e) => e.value))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Instagram Posts Table */}
      <CockpitSectionDivider label="Posts Instagram — Últimos 14 dias" num="01" />
      <CockpitCard accentBorder="left" padding="none">
        <div style={{ padding: '1rem' }}>
          <CockpitTable
            columns={[
              {
                key: 'date',
                header: 'Data',
                width: '90px',
                render: (v: unknown) => (
                  <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: '0.6rem' }}>{String(v)}</span>
                ),
              },
              {
                key: 'type',
                header: 'Tipo',
                width: '80px',
                render: (_v: unknown, row: OrganicPost) => getPostTypeBadge(row.type),
              },
              {
                key: 'reach',
                header: 'Alcance',
                width: '90px',
                sortable: true,
                align: 'right',
                render: (v: unknown) => (
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatNumber(v as number)}</span>
                ),
              },
              {
                key: 'likes',
                header: 'Curtidas',
                width: '80px',
                sortable: true,
                align: 'right',
                render: (v: unknown) => (
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatNumber(v as number)}</span>
                ),
              },
              {
                key: 'comments',
                header: 'Coment.',
                width: '70px',
                align: 'right',
                render: (v: unknown) => (
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>{v as number}</span>
                ),
              },
              {
                key: 'shares',
                header: 'Shares',
                width: '70px',
                align: 'right',
                render: (v: unknown) => (
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>{v as number}</span>
                ),
              },
              {
                key: 'saves',
                header: 'Salvos',
                width: '70px',
                align: 'right',
                render: (v: unknown) => (
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>{v as number}</span>
                ),
              },
              {
                key: 'engagement_rate',
                header: 'Engajam.',
                width: '90px',
                sortable: true,
                align: 'right',
                render: (v: unknown) => (
                  <span
                    style={{
                      fontVariantNumeric: 'tabular-nums',
                      fontWeight: 700,
                      color: (v as number) >= 6 ? 'var(--aiox-lime)' : (v as number) >= 3 ? 'var(--aiox-cream)' : 'var(--color-status-error)',
                    }}
                  >
                    {(v as number).toFixed(2)}%
                  </span>
                ),
              },
            ] as CockpitTableColumn<OrganicPost>[]}
            data={ORGANIC_POSTS}
            hoverable
            striped
            compact
          />
        </div>
      </CockpitCard>

      {/* Engagement Funnel */}
      <CockpitSectionDivider label="Funil de Engajamento" num="02" />
      <CockpitCard accentBorder="top" padding="md">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {ENGAGEMENT_DATA.map((eng, i) => {
            const widthPct = engagementMax > 0 ? (eng.value / engagementMax) * 100 : 0
            const isLast = i === ENGAGEMENT_DATA.length - 1
            return (
              <div key={eng.label}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--aiox-cream)' }}>
                    {eng.icon}
                    <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.6rem' }}>{eng.label}</span>
                  </div>
                  <span
                    style={{
                      fontFamily: 'var(--font-family-display)',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      color: isLast ? 'var(--aiox-lime)' : 'var(--aiox-cream)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {formatNumber(eng.value)}
                  </span>
                </div>
                <div style={{ height: 16, background: 'rgba(156,156,156,0.06)', position: 'relative', overflow: 'hidden' }}>
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      height: '100%',
                      width: `${widthPct}%`,
                      background: isLast
                        ? 'var(--aiox-lime)'
                        : `linear-gradient(90deg, rgba(0,153,255,${0.15 + i * 0.08}) 0%, rgba(0,153,255,${0.25 + i * 0.1}) 100%)`,
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>
                {i < ENGAGEMENT_DATA.length - 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '0.1rem 0' }}>
                    <ChevronDown size={10} style={{ color: 'var(--aiox-gray-dim)', opacity: 0.3 }} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CockpitCard>

      {/* Gender Breakdown */}
      <CockpitSectionDivider label="Demografia da Audiência" num="03" />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
        }}
      >
        <CockpitCard accentBorder="left" padding="md">
          <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--aiox-gray-dim)', display: 'block', marginBottom: '1rem' }}>
            Gênero
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.55rem', color: 'var(--aiox-cream)' }}>Feminino</span>
                <span style={{ fontFamily: 'var(--font-family-display)', fontSize: '0.8rem', fontWeight: 700, color: 'var(--aiox-lime)' }}>
                  {totalDemoPopulation > 0 ? ((totalFemale / totalDemoPopulation) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <CockpitProgress
                value={totalDemoPopulation > 0 ? (totalFemale / totalDemoPopulation) * 100 : 0}
                size="md"
                variant="default"
              />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.55rem', color: 'var(--aiox-cream)' }}>Masculino</span>
                <span style={{ fontFamily: 'var(--font-family-display)', fontSize: '0.8rem', fontWeight: 700, color: 'var(--aiox-blue)' }}>
                  {totalDemoPopulation > 0 ? ((totalMale / totalDemoPopulation) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <CockpitProgress
                value={totalDemoPopulation > 0 ? (totalMale / totalDemoPopulation) * 100 : 0}
                size="md"
                variant="warning"
              />
            </div>
          </div>
        </CockpitCard>

        <CockpitCard accentBorder="left" padding="md">
          <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--aiox-gray-dim)', display: 'block', marginBottom: '1rem' }}>
            Faixa Etária
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {DEMOGRAPHICS.map((d) => {
              const pct = totalDemoPopulation > 0 ? (d.total / totalDemoPopulation) * 100 : 0
              return (
                <div key={d.age_range}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.15rem' }}>
                    <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.5rem', color: 'var(--aiox-gray-muted)' }}>{d.age_range}</span>
                    <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.5rem', color: 'var(--aiox-cream)', fontVariantNumeric: 'tabular-nums' }}>
                      {pct.toFixed(1)}% ({formatNumber(d.total)})
                    </span>
                  </div>
                  <CockpitProgress value={pct} size="sm" variant={pct >= 25 ? 'default' : 'warning'} />
                </div>
              )
            })}
          </div>
        </CockpitCard>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 7: TAB — COMPARATIVO
// ═══════════════════════════════════════════════════════════════════════════════

function CompareTab({ campaigns }: { campaigns: CampaignRow[] }) {
  const totalSpend = campaigns.reduce((a, c) => a + c.spend, 0)
  const totalPaidReach = campaigns.reduce((a, c) => a + c.impressions, 0)
  const totalPaidClicks = campaigns.reduce((a, c) => a + c.clicks, 0)
  const totalPaidConversions = campaigns.reduce((a, c) => a + c.conversions, 0)

  const organicReach = 124000
  const organicEngagement = 9462
  const organicProfileVisits = 4280

  const comparisonData = DAILY_METRICS.map((d) => ({
    ...d,
    organic_reach: Math.round(organicReach / 14 + (Math.random() - 0.5) * 2000),
    paid_reach: d.reach,
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Organic vs Paid — Side by Side */}
      <CockpitSectionDivider label="Orgânico vs Pago" num="01" />
      <CockpitCard accentBorder="top" padding="md">
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontFamily: 'var(--font-family-mono)',
              fontSize: '0.6rem',
            }}
          >
            <thead>
              <tr>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid rgba(156,156,156,0.15)', color: 'var(--aiox-gray-dim)', fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Métrica</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid rgba(156,156,156,0.15)', color: 'var(--aiox-lime)', fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Orgânico</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid rgba(156,156,156,0.15)', color: 'var(--aiox-blue)', fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Pago</th>
                <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid rgba(156,156,156,0.15)', color: 'var(--aiox-gray-dim)', fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Vantagem</th>
              </tr>
            </thead>
            <tbody>
              {[
                { metric: 'Alcance', organic: organicReach, paid: totalPaidReach },
                { metric: 'Engajamento / Cliques', organic: organicEngagement, paid: totalPaidClicks },
                { metric: 'Visitas Perfil / Conversões', organic: organicProfileVisits, paid: totalPaidConversions },
                { metric: 'Investimento', organic: 0, paid: totalSpend },
                { metric: 'CPR (Custo por Resultado)', organic: 0, paid: totalPaidConversions > 0 ? totalSpend / totalPaidConversions : 0 },
              ].map((row) => (
                <tr key={row.metric} style={{ borderBottom: '1px solid rgba(156,156,156,0.06)' }}>
                  <td style={{ padding: '0.65rem 0.75rem', color: 'var(--aiox-cream)', fontWeight: 500 }}>{row.metric}</td>
                  <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right', fontFamily: 'var(--font-family-display)', fontWeight: 700, color: 'var(--aiox-lime)', fontVariantNumeric: 'tabular-nums' }}>
                    {row.metric === 'Investimento' ? 'R$ 0' : row.metric === 'CPR (Custo por Resultado)' ? 'R$ 0' : formatNumber(row.organic)}
                  </td>
                  <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right', fontFamily: 'var(--font-family-display)', fontWeight: 700, color: 'var(--aiox-blue)', fontVariantNumeric: 'tabular-nums' }}>
                    {row.metric === 'Investimento' || row.metric === 'CPR (Custo por Resultado)' ? formatCurrency(row.paid) : formatNumber(row.paid)}
                  </td>
                  <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center' }}>
                    {row.organic > row.paid ? (
                      <CockpitBadge variant="lime" style={{ fontSize: '0.45rem' }}>ORGÂNICO</CockpitBadge>
                    ) : row.paid > row.organic && row.organic > 0 ? (
                      <CockpitBadge variant="blue" style={{ fontSize: '0.45rem' }}>PAGO</CockpitBadge>
                    ) : (
                      <CockpitBadge variant="surface" style={{ fontSize: '0.45rem' }}>—</CockpitBadge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CockpitCard>

      {/* Reach Comparison Chart */}
      <CockpitSectionDivider label="Alcance Diário — Orgânico vs Pago" num="02" />
      <CockpitCard accentBorder="left" padding="md">
        <VerticalBarChart
          data={comparisonData as unknown as Array<Record<string, unknown>>}
          bars={[
            { key: 'organic_reach', color: 'var(--aiox-lime)', label: 'Orgânico' },
            { key: 'paid_reach', color: 'var(--aiox-blue)', label: 'Pago' },
          ]}
          labelKey="date"
          height={220}
        />
      </CockpitCard>

      {/* Investment Summary */}
      <CockpitSectionDivider label="Resumo de Investimento" num="03" />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
        }}
      >
        <CockpitCard variant="subtle" padding="md">
          <MetricCell label="Investimento Total (30d)" value={formatCurrency(totalSpend)} />
        </CockpitCard>
        <CockpitCard variant="subtle" padding="md">
          <MetricCell label="Custo por Dia" value={formatCurrency(totalSpend / 30)} />
        </CockpitCard>
        <CockpitCard variant="subtle" padding="md">
          <MetricCell label="Receita Paga Total" value={formatCurrency(campaigns.reduce((a, c) => a + c.revenue, 0))} highlight />
        </CockpitCard>
        <CockpitCard variant="subtle" padding="md">
          <MetricCell label="ROI Líquido" value={formatCurrency(campaigns.reduce((a, c) => a + c.revenue, 0) - totalSpend)} highlight />
        </CockpitCard>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 8: TAB — FUNIS
// ═══════════════════════════════════════════════════════════════════════════════

function FunnelsTab() {
  const [selectedFunnel, setSelectedFunnel] = useState(0)
  const funnel = PRODUCT_FUNNELS[selectedFunnel]

  const funnelTabs = PRODUCT_FUNNELS.map((f, i) => ({
    id: String(i),
    label: f.sigla,
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Product Selector */}
      <CockpitTabs
        tabs={funnelTabs}
        activeTab={String(selectedFunnel)}
        onChange={(id) => setSelectedFunnel(Number(id))}
        size="sm"
      />

      {/* Product Funnel Header */}
      <CockpitCard accentBorder="top" padding="md" accentColor="var(--aiox-lime)">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div>
            <span style={{ fontFamily: 'var(--font-family-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--aiox-cream)' }}>
              {funnel.product}
            </span>
            <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.5rem', color: 'var(--aiox-gray-dim)', display: 'block', marginTop: '0.15rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Sigla: {funnel.sigla}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <CockpitBadge variant={funnel.roas >= 3 ? 'lime' : funnel.roas >= 1 ? 'blue' : 'error'}>
              ROAS {funnel.roas.toFixed(2)}x
            </CockpitBadge>
          </div>
        </div>

        {/* Funnel KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
          <MetricCell label="Receita" value={formatCurrency(funnel.revenue)} highlight />
          <MetricCell label="Compras" value={String(funnel.purchases)} />
          <MetricCell label="ROAS" value={`${funnel.roas.toFixed(2)}x`} highlight={funnel.roas >= 3} />
          <MetricCell label="CPA" value={formatCurrency(funnel.cpa)} />
        </div>
      </CockpitCard>

      {/* Funnel Flow */}
      <CockpitSectionDivider label="Funil Multi-Estágio" num="01" />
      <CockpitCard accentBorder="left" padding="md">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {funnel.stages.map((stage, i) => {
            const maxVal = Math.max(stage.current, stage.benchmark)
            const currentPct = maxVal > 0 ? (stage.current / maxVal) * 100 : 0
            const benchmarkPct = maxVal > 0 ? (stage.benchmark / maxVal) * 100 : 0
            const isLast = i === funnel.stages.length - 1

            return (
              <div key={stage.label}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.6rem', color: 'var(--aiox-cream)', fontWeight: 500 }}>
                    {stage.label}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontFamily: 'var(--font-family-display)', fontSize: '0.9rem', fontWeight: 700, color: isLast ? 'var(--aiox-lime)' : 'var(--aiox-cream)', fontVariantNumeric: 'tabular-nums' }}>
                      {formatNumber(stage.current)}
                    </span>
                    <CockpitBadge
                      variant={stage.status === 'above' ? 'lime' : stage.status === 'at' ? 'blue' : 'error'}
                      style={{ fontSize: '0.4rem' }}
                    >
                      {stage.status === 'above' ? 'ACIMA' : stage.status === 'at' ? 'NA META' : 'ABAIXO'}
                    </CockpitBadge>
                  </div>
                </div>

                {/* Dual bar: current vs benchmark */}
                <div style={{ position: 'relative', height: 20, background: 'rgba(156,156,156,0.06)', overflow: 'hidden' }}>
                  {/* Benchmark line */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: `${benchmarkPct}%`,
                      width: 2,
                      height: '100%',
                      background: 'var(--aiox-gray-dim)',
                      opacity: 0.6,
                      zIndex: 2,
                    }}
                  />
                  {/* Current bar */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      height: '100%',
                      width: `${currentPct}%`,
                      background: stage.status === 'above'
                        ? 'var(--aiox-lime)'
                        : stage.status === 'at'
                          ? 'var(--aiox-blue)'
                          : 'var(--color-status-error)',
                      opacity: 0.7,
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.1rem' }}>
                  <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.4rem', color: 'var(--aiox-gray-dim)' }}>
                    Benchmark: {formatNumber(stage.benchmark)}
                  </span>
                  {i > 0 && (
                    <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.4rem', color: 'var(--aiox-gray-dim)' }}>
                      Taxa: {funnel.stages[i - 1].current > 0 ? ((stage.current / funnel.stages[i - 1].current) * 100).toFixed(1) : 0}%
                    </span>
                  )}
                </div>

                {i < funnel.stages.length - 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '0.1rem 0' }}>
                    <ChevronDown size={10} style={{ color: 'var(--aiox-gray-dim)', opacity: 0.3 }} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CockpitCard>

      {/* Recovery Branches */}
      {funnel.recovery_branches.length > 0 && (
        <>
          <CockpitSectionDivider label="Branches de Recuperação" num="02" />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1rem',
            }}
          >
            {funnel.recovery_branches.map((branch, i) => (
              <CockpitCard key={i} accentBorder="left" padding="md" accentColor="var(--aiox-blue)">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <CockpitBadge variant="blue" style={{ fontSize: '0.45rem' }}>{branch.channel}</CockpitBadge>
                  <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.55rem', color: 'var(--aiox-cream)' }}>
                    {branch.type}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.15rem' }}>
                      <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.5rem', color: 'var(--aiox-gray-dim)' }}>Open Rate</span>
                      <span style={{ fontFamily: 'var(--font-family-display)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--aiox-cream)' }}>{branch.open_rate}%</span>
                    </div>
                    <CockpitProgress value={branch.open_rate} size="sm" variant={branch.open_rate >= 40 ? 'default' : 'warning'} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.15rem' }}>
                      <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.5rem', color: 'var(--aiox-gray-dim)' }}>Click Rate</span>
                      <span style={{ fontFamily: 'var(--font-family-display)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--aiox-cream)' }}>{branch.click_rate}%</span>
                    </div>
                    <CockpitProgress value={branch.click_rate} size="sm" variant={branch.click_rate >= 15 ? 'default' : 'warning'} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.15rem' }}>
                      <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.5rem', color: 'var(--aiox-gray-dim)' }}>Recovery Rate</span>
                      <span style={{ fontFamily: 'var(--font-family-display)', fontSize: '0.75rem', fontWeight: 700, color: branch.recovery_rate >= 10 ? 'var(--aiox-lime)' : 'var(--aiox-cream)' }}>
                        {branch.recovery_rate}%
                      </span>
                    </div>
                    <CockpitProgress value={branch.recovery_rate} size="sm" variant={branch.recovery_rate >= 10 ? 'success' : 'warning'} />
                  </div>
                </div>
              </CockpitCard>
            ))}
          </div>
        </>
      )}

      {/* Optimization Suggestions */}
      <CockpitSectionDivider label="Sugestões de Otimização" num="03" />
      <CockpitAccordion
        items={OPTIMIZATION_SUGGESTIONS.map((sug) => ({
          id: sug.id,
          title: sug.title,
          content: (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {getSeverityBadge(sug.severity)}
              </div>
              <p style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.6rem', color: 'var(--aiox-gray-muted)', margin: 0, lineHeight: 1.6 }}>
                {sug.description}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.25rem' }}>
                <Target size={10} style={{ color: 'var(--aiox-lime)' }} />
                <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.55rem', color: 'var(--aiox-lime)' }}>
                  {sug.impact}
                </span>
              </div>
            </div>
          ),
          defaultOpen: sug.severity === 'critical',
        }))}
        allowMultiple
      />
    </div>
  )
}
