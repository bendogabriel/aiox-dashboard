/**
 * CreativeGallery — AIOX Cockpit creative approval gallery
 *
 * Adapted from: link.nataliatanaka.com.br/criativos-aut-dor/
 * Single-file component following SalesDashboard/TrafficDashboard pattern.
 *
 * Features:
 *   - Pain-segmented creative cards (6 categories, 16 creatives)
 *   - Lightbox modal for full-res image inspection
 *   - Approve/reject voting with Supabase persistence (localStorage fallback)
 *   - Expandable ad copy (headline, primary text, CTA)
 *   - Export approved/rejected/pending summary to clipboard
 *   - Campaign config footer table
 *   - Filter by vote status (all / approved / rejected / pending)
 *   - Real-time approval counter in header
 *   - Dispatch approved creatives to media-buy squad via Engine API
 *   - Dispatch rejected creatives to creative-studio for revision
 *   - Campaign mode for batch submission of all approved creatives
 *   - Rejection notes modal for detailed feedback
 */

import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  Check,
  X,
  Eye,
  Download,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Image as ImageIcon,
  Clipboard,
  Filter,
  Crosshair,
  Target,
  Zap,
  Send,
  Loader,
  MessageSquare,
  Package,
} from 'lucide-react'
import {
  CockpitCard,
  CockpitBadge,
  CockpitButton,
  CockpitModal,
  CockpitTabs,
  CockpitProgress,
  CockpitAlert,
  CockpitSectionDivider,
  CockpitTickerStrip,
} from '../ui/cockpit'
import { useCreativeDispatch } from '../../hooks/useCreativeDispatch'
import { creativeVotesService } from '../../services/supabase/creative-votes'
import type { DispatchStatus } from '../../services/supabase/creative-votes'

// ─── Types ──────────────────────────────────────────────────────────────────

interface Creative {
  id: string
  title: string
  category: string
  categoryIcon: string
  imageUrl: string
  visualStyle: string
  headline: string
  subheadline: string
  primaryText: string
  cta: string
  hasWarning: boolean
  warningText?: string
}

interface CategoryGroup {
  name: string
  icon: string
  creatives: Creative[]
}

type VoteStatus = 'approved' | 'rejected' | 'pending'
type VoteMap = Record<string, VoteStatus>
type FilterTab = 'all' | 'approved' | 'rejected' | 'pending'
type GalleryMode = 'browse' | 'campaign'

interface CampaignConfigRow {
  label: string
  value: string
}

// ─── Constants ──────────────────────────────────────────────────────────────

const GALLERY_ID = 'aut-dor-v1'
const STORAGE_KEY = `aiox-creative-votes-${GALLERY_ID}`

const CAMPAIGN_CONFIG: CampaignConfigRow[] = [
  { label: 'Campanha', value: '[CONVERSÃO] [VENDAS] [ADV+] [AUTO] [DOR-SEGMENTADA]' },
  { label: 'Budget', value: 'R$ 150/dia (CBO)' },
  { label: 'Ad Set', value: 'DOR-SEGMENTADA — Advantage+ Audience, BR 25-65' },
  { label: 'Ads', value: '16 criativos (6 dores × 2-3 estilos)' },
  { label: 'Formato', value: 'Feed 1:1 (1024×1024)' },
  { label: 'Destino', value: 'link.nataliatanaka.com.br/aut/' },
  { label: 'CTA', value: 'LEARN_MORE' },
  { label: 'Pixel', value: '1825729030861605' },
  { label: 'Kill Rule', value: 'CPA > R$30 (3d) | CTR < 0.8% (48h)' },
  { label: 'Scale Rule', value: 'CPA < R$20 + ROAS > 1.0 por 3d' },
]

const TICKER_ITEMS = [
  'AUT Dor Segmentada',
  '16 Criativos para Teste',
  'Feed 1:1 — 1024×1024',
  'Advantage+ Audience',
  'Kill: CPA > R$30',
  'Scale: CPA < R$20',
  'Budget: R$150/dia CBO',
  '6 Segmentos de Dor',
]

const CREATIVES: Creative[] = [
  // ── Dor Lombar (3) ──
  {
    id: 'AUT-21',
    title: 'Mulher com dor lombar — pessoa real, texto integrado',
    category: 'Dor Lombar',
    categoryIcon: '🔴',
    imageUrl: 'https://placehold.co/1024x1024/141414/D1FF00?text=AUT-21%0ADor+Lombar',
    visualStyle: 'person-based',
    headline: 'Dor nas costas te impede de viver?',
    subheadline: 'Descubra a auto-massagem que alivia em minutos',
    primaryText: 'Você já acordou travada, sem conseguir se mover? A dor lombar afeta 80% dos adultos. Com técnicas simples de auto-massagem, você pode aliviar a dor sem sair de casa. Método comprovado por mais de 10.000 alunas.',
    cta: 'QUERO ALIVIAR MINHA DOR',
    hasWarning: false,
  },
  {
    id: 'AUT-21b',
    title: 'Dor lombar editorial — texto sobre fundo escuro',
    category: 'Dor Lombar',
    categoryIcon: '🔴',
    imageUrl: 'https://placehold.co/1024x1024/141414/ff6b35?text=AUT-21b%0AEditorial',
    visualStyle: 'text-only-editorial',
    headline: '80% dos adultos sofrem com dor lombar',
    subheadline: 'Você não precisa ser um deles',
    primaryText: 'A dor lombar é a principal causa de afastamento do trabalho no Brasil. Mas existe uma solução simples que você pode aplicar em casa, em apenas 15 minutos por dia.',
    cta: 'CONHECER O MÉTODO',
    hasWarning: false,
  },
  {
    id: 'AUT-21c',
    title: 'Dor lombar — antes e depois visual',
    category: 'Dor Lombar',
    categoryIcon: '🔴',
    imageUrl: 'https://placehold.co/1024x1024/141414/f7c948?text=AUT-21c%0AAntes+Depois',
    visualStyle: 'before-after',
    headline: 'De travada a livre em 15 minutos',
    subheadline: 'Auto-massagem para dor lombar',
    primaryText: 'Imagine poder se levantar da cama sem aquela pontada nas costas. Com as técnicas certas de auto-massagem, isso é possível. Resultados desde a primeira aplicação.',
    cta: 'QUERO COMEÇAR HOJE',
    hasWarning: false,
  },
  // ── Dor nas Costas (3) ──
  {
    id: 'AUT-22',
    title: 'Mulher com dor nas costas — postura no trabalho',
    category: 'Dor nas Costas',
    categoryIcon: '🟠',
    imageUrl: 'https://placehold.co/1024x1024/141414/D1FF00?text=AUT-22%0ACostas',
    visualStyle: 'person-based',
    headline: 'Suas costas doem depois de trabalhar?',
    subheadline: 'A solução está nas suas mãos — literalmente',
    primaryText: 'Horas sentada no computador, carregando peso, ou em pé o dia todo. Suas costas pedem socorro e você já tentou de tudo. Conheça a auto-massagem que resolve.',
    cta: 'ALIVIAR AGORA',
    hasWarning: false,
  },
  {
    id: 'AUT-22b',
    title: 'Dor nas costas — infográfico de pontos',
    category: 'Dor nas Costas',
    categoryIcon: '🟠',
    imageUrl: 'https://placehold.co/1024x1024/141414/ff6b35?text=AUT-22b%0APontos',
    visualStyle: 'infographic',
    headline: '5 pontos que aliviam dor nas costas',
    subheadline: 'Técnica de auto-massagem passo a passo',
    primaryText: 'Você sabia que existem 5 pontos específicos que, quando massageados corretamente, aliviam até 70% da dor nas costas? Aprenda a localizar e pressionar cada um.',
    cta: 'VER TÉCNICA COMPLETA',
    hasWarning: false,
  },
  {
    id: 'AUT-22c',
    title: 'Dor nas costas editorial — estatísticas',
    category: 'Dor nas Costas',
    categoryIcon: '🟠',
    imageUrl: 'https://placehold.co/1024x1024/141414/f7c948?text=AUT-22c%0AStats',
    visualStyle: 'text-only-editorial',
    headline: '7 em cada 10 brasileiros têm dor nas costas',
    subheadline: 'Existe solução sem remédio',
    primaryText: 'Pesquisas mostram que a auto-massagem regular pode reduzir dores crônicas nas costas em até 65%. Sem medicamentos, sem efeitos colaterais. Apenas suas mãos e a técnica certa.',
    cta: 'APRENDER A TÉCNICA',
    hasWarning: true,
    warningText: 'Texto na imagem contém erro de digitação — corrigir antes de publicar',
  },
  // ── Dor no Pescoço (3) ──
  {
    id: 'AUT-23',
    title: 'Mulher com dor no pescoço — tensão cervical',
    category: 'Dor no Pescoço',
    categoryIcon: '🟡',
    imageUrl: 'https://placehold.co/1024x1024/141414/D1FF00?text=AUT-23%0APescoco',
    visualStyle: 'person-based',
    headline: 'Pescoço travado? Isso tem solução',
    subheadline: 'Auto-massagem cervical em 10 minutos',
    primaryText: 'A tensão cervical é uma das maiores causas de dor de cabeça e insônia. Com movimentos simples de auto-massagem, você desbloqueia o pescoço e recupera o bem-estar.',
    cta: 'DESTRAVAR MEU PESCOÇO',
    hasWarning: false,
  },
  {
    id: 'AUT-23b',
    title: 'Dor no pescoço — celular e postura',
    category: 'Dor no Pescoço',
    categoryIcon: '🟡',
    imageUrl: 'https://placehold.co/1024x1024/141414/ff6b35?text=AUT-23b%0ACelular',
    visualStyle: 'lifestyle',
    headline: 'O celular está destruindo seu pescoço',
    subheadline: 'Mas você pode reverter isso em casa',
    primaryText: 'A "text neck" (pescoço de celular) já é considerada uma epidemia moderna. Cada grau de inclinação adiciona 4,5kg de pressão no pescoço. Aprenda a aliviar essa tensão.',
    cta: 'CONHECER A SOLUÇÃO',
    hasWarning: false,
  },
  {
    id: 'AUT-23c',
    title: 'Dor no pescoço editorial — dados médicos',
    category: 'Dor no Pescoço',
    categoryIcon: '🟡',
    imageUrl: 'https://placehold.co/1024x1024/141414/f7c948?text=AUT-23c%0AMedico',
    visualStyle: 'text-only-editorial',
    headline: 'Dor cervical: a segunda dor mais comum',
    subheadline: 'Auto-massagem resolve em 73% dos casos',
    primaryText: 'Estudos clínicos demonstram que a auto-massagem cervical regular reduz a intensidade da dor em 73% dos pacientes. Sem agulhas, sem medicação — apenas a técnica certa.',
    cta: 'QUERO APRENDER',
    hasWarning: false,
  },
  // ── Dor no Ombro (3) ──
  {
    id: 'AUT-24',
    title: 'Mulher com dor no ombro — movimento limitado',
    category: 'Dor no Ombro',
    categoryIcon: '🔵',
    imageUrl: 'https://placehold.co/1024x1024/141414/D1FF00?text=AUT-24%0AOmbro',
    visualStyle: 'person-based',
    headline: 'Ombro travado? Recupere o movimento',
    subheadline: 'Técnica de auto-massagem para ombro congelado',
    primaryText: 'Não consegue levantar o braço sem dor? O ombro congelado afeta milhões de pessoas, mas a auto-massagem pode devolver sua mobilidade. Resultados progressivos em 7 dias.',
    cta: 'RECUPERAR MOVIMENTO',
    hasWarning: false,
  },
  {
    id: 'AUT-24b',
    title: 'Dor no ombro — exercícios de alívio',
    category: 'Dor no Ombro',
    categoryIcon: '🔵',
    imageUrl: 'https://placehold.co/1024x1024/141414/ff6b35?text=AUT-24b%0AExercicios',
    visualStyle: 'tutorial',
    headline: '3 movimentos para aliviar dor no ombro',
    subheadline: 'Faça em casa, sem equipamento',
    primaryText: 'Bursite, tendinite, ombro congelado — não importa o diagnóstico, esses 3 movimentos de auto-massagem ajudam a aliviar. Indicados por fisioterapeutas.',
    cta: 'VER OS 3 MOVIMENTOS',
    hasWarning: true,
    warningText: 'Texto na imagem gerado por IA — revisar ortografia',
  },
  {
    id: 'AUT-24c',
    title: 'Dor no ombro — depoimento paciente',
    category: 'Dor no Ombro',
    categoryIcon: '🔵',
    imageUrl: 'https://placehold.co/1024x1024/141414/f7c948?text=AUT-24c%0ADepoimento',
    visualStyle: 'testimonial',
    headline: '"Voltei a pentear meu cabelo sem dor"',
    subheadline: 'Resultado real com auto-massagem no ombro',
    primaryText: 'Maria, 52 anos, sofria com ombro congelado há 8 meses. Depois de 2 semanas praticando auto-massagem, recuperou 90% do movimento. Conheça a técnica que ela usou.',
    cta: 'QUERO O MESMO RESULTADO',
    hasWarning: true,
    warningText: 'Verificar permissão de uso do depoimento',
  },
  // ── Dor de Cabeça (2) ──
  {
    id: 'AUT-25',
    title: 'Mulher com dor de cabeça — tensional',
    category: 'Dor de Cabeça',
    categoryIcon: '🟣',
    imageUrl: 'https://placehold.co/1024x1024/141414/D1FF00?text=AUT-25%0ACabeca',
    visualStyle: 'person-based',
    headline: 'Dor de cabeça toda semana? Pare agora',
    subheadline: 'Auto-massagem nos pontos certos elimina a dor',
    primaryText: 'A cefaleia tensional está quase sempre ligada a pontos de tensão no pescoço e ombros. Aprenda a encontrar e desativar esses pontos com auto-massagem.',
    cta: 'ELIMINAR MINHA DOR',
    hasWarning: false,
  },
  {
    id: 'AUT-25b',
    title: 'Dor de cabeça — pontos de pressão',
    category: 'Dor de Cabeça',
    categoryIcon: '🟣',
    imageUrl: 'https://placehold.co/1024x1024/141414/ff6b35?text=AUT-25b%0APressao',
    visualStyle: 'infographic',
    headline: '4 pontos que eliminam dor de cabeça',
    subheadline: 'Sem remédio, sem efeito colateral',
    primaryText: 'Existe uma conexão direta entre pontos de tensão muscular e dor de cabeça. Aprenda a pressionar os 4 pontos certos e sentir alívio em menos de 5 minutos.',
    cta: 'APRENDER OS 4 PONTOS',
    hasWarning: true,
    warningText: 'Texto na imagem contém erro — "cabeça" sem acento',
  },
  // ── Dor no Joelho (2) ──
  {
    id: 'AUT-26',
    title: 'Pessoa com dor no joelho — dificuldade de subir escadas',
    category: 'Dor no Joelho',
    categoryIcon: '🟢',
    imageUrl: 'https://placehold.co/1024x1024/141414/D1FF00?text=AUT-26%0AJoelho',
    visualStyle: 'person-based',
    headline: 'Joelho dói para subir escada?',
    subheadline: 'Auto-massagem que fortalece e alivia',
    primaryText: 'A dor no joelho não precisa te impedir de viver. Técnicas de auto-massagem ao redor da articulação podem reduzir inflamação e melhorar mobilidade.',
    cta: 'ALIVIAR DOR NO JOELHO',
    hasWarning: false,
  },
  {
    id: 'AUT-26b',
    title: 'Dor no joelho — músculos ao redor',
    category: 'Dor no Joelho',
    categoryIcon: '🟢',
    imageUrl: 'https://placehold.co/1024x1024/141414/ff6b35?text=AUT-26b%0AMusculos',
    visualStyle: 'infographic',
    headline: 'O segredo está nos músculos ao redor',
    subheadline: 'Auto-massagem para dor no joelho',
    primaryText: 'Na maioria dos casos, a dor no joelho vem de músculos tensos ao redor da articulação — quadríceps, isquiotibiais, panturrilha. Massageando esses pontos, o joelho agradece.',
    cta: 'VER TÉCNICA COMPLETA',
    hasWarning: true,
    warningText: 'Texto gerado por IA — revisar antes de publicar',
  },
]

const CATEGORIES: CategoryGroup[] = [
  { name: 'Dor Lombar', icon: '🔴', creatives: CREATIVES.filter(c => c.category === 'Dor Lombar') },
  { name: 'Dor nas Costas', icon: '🟠', creatives: CREATIVES.filter(c => c.category === 'Dor nas Costas') },
  { name: 'Dor no Pescoço', icon: '🟡', creatives: CREATIVES.filter(c => c.category === 'Dor no Pescoço') },
  { name: 'Dor no Ombro', icon: '🔵', creatives: CREATIVES.filter(c => c.category === 'Dor no Ombro') },
  { name: 'Dor de Cabeça', icon: '🟣', creatives: CREATIVES.filter(c => c.category === 'Dor de Cabeça') },
  { name: 'Dor no Joelho', icon: '🟢', creatives: CREATIVES.filter(c => c.category === 'Dor no Joelho') },
]

const CATEGORY_COLORS: Record<string, string> = {
  'Dor Lombar': '#EF4444',
  'Dor nas Costas': '#ED4609',
  'Dor no Pescoço': '#f59e0b',
  'Dor no Ombro': '#0099FF',
  'Dor de Cabeça': '#a855f7',
  'Dor no Joelho': '#22c55e',
}

const STYLE_LABELS: Record<string, { label: string; variant: 'lime' | 'surface' | 'blue' }> = {
  'person-based': { label: 'PESSOA REAL', variant: 'lime' },
  'text-only-editorial': { label: 'EDITORIAL', variant: 'surface' },
  'before-after': { label: 'ANTES/DEPOIS', variant: 'blue' },
  'infographic': { label: 'INFOGRÁFICO', variant: 'blue' },
  'lifestyle': { label: 'LIFESTYLE', variant: 'surface' },
  'tutorial': { label: 'TUTORIAL', variant: 'lime' },
  'testimonial': { label: 'DEPOIMENTO', variant: 'lime' },
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function loadVotes(): VoteMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveVotes(votes: VoteMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(votes))
  } catch {
    // localStorage full or unavailable
  }
}

function getVoteStatus(votes: VoteMap, id: string): VoteStatus {
  return votes[id] || 'pending'
}

// ─── Dispatch Status Labels ─────────────────────────────────────────────────

const DISPATCH_STATUS_CONFIG: Record<DispatchStatus, {
  label: string
  color: string
  bg: string
  border: string
}> = {
  idle: { label: '', color: '', bg: '', border: '' },
  dispatching: {
    label: 'ENVIANDO',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.1)',
    border: 'rgba(245, 158, 11, 0.3)',
  },
  executing: {
    label: 'EXECUTANDO',
    color: '#0099FF',
    bg: 'rgba(0, 153, 255, 0.1)',
    border: 'rgba(0, 153, 255, 0.3)',
  },
  completed: {
    label: 'PUBLICADO',
    color: 'var(--aiox-lime)',
    bg: 'rgba(209, 255, 0, 0.1)',
    border: 'rgba(209, 255, 0, 0.3)',
  },
  failed: {
    label: 'FALHOU',
    color: 'var(--color-status-error)',
    bg: 'rgba(239, 68, 68, 0.1)',
    border: 'rgba(239, 68, 68, 0.3)',
  },
}

// ─── Sub-Components ─────────────────────────────────────────────────────────

function DispatchIndicator({ status }: { status: DispatchStatus }) {
  if (status === 'idle') return null
  const config = DISPATCH_STATUS_CONFIG[status]
  const isAnimating = status === 'dispatching' || status === 'executing'

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.35rem',
      padding: '0.25rem 0.5rem',
      background: config.bg,
      border: `1px solid ${config.border}`,
      fontFamily: 'var(--font-family-mono)',
      fontSize: '0.4rem',
      fontWeight: 600,
      color: config.color,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
    }}>
      {isAnimating ? (
        <Loader size={9} style={{ animation: 'spin 1s linear infinite' }} />
      ) : status === 'completed' ? (
        <Check size={9} />
      ) : (
        <X size={9} />
      )}
      {config.label}
    </div>
  )
}

function ApprovalCounter({ votes }: { votes: VoteMap }) {
  const approved = Object.values(votes).filter(v => v === 'approved').length
  const rejected = Object.values(votes).filter(v => v === 'rejected').length
  const total = CREATIVES.length
  const pct = Math.round((approved / total) * 100)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{
          fontFamily: 'var(--font-family-display)',
          fontSize: '1.5rem',
          fontWeight: 700,
          color: 'var(--aiox-lime)',
        }}>
          {approved}
        </span>
        <span style={{
          fontFamily: 'var(--font-family-mono)',
          fontSize: '0.6rem',
          color: 'var(--aiox-gray-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}>
          /{total} aprovados
        </span>
      </div>
      {rejected > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <X size={10} style={{ color: 'var(--color-status-error)' }} />
          <span style={{
            fontFamily: 'var(--font-family-mono)',
            fontSize: '0.55rem',
            color: 'var(--color-status-error)',
          }}>
            {rejected} rejeitados
          </span>
        </div>
      )}
      <CockpitProgress
        value={pct}
        size="sm"
        variant={pct >= 80 ? 'success' : pct >= 40 ? 'warning' : 'default'}
        style={{ width: 80 }}
      />
    </div>
  )
}

function CreativeCard({
  creative,
  status,
  dispatchStatus = 'idle',
  onVote,
  onOpenLightbox,
  onDispatch,
  onReject,
  isEngineOnline,
}: {
  creative: Creative
  status: VoteStatus
  dispatchStatus?: DispatchStatus
  onVote: (id: string, vote: VoteStatus) => void
  onOpenLightbox: (creative: Creative) => void
  onDispatch?: (creative: Creative) => void
  onReject?: (creative: Creative) => void
  isEngineOnline?: boolean
}) {
  const [copyExpanded, setCopyExpanded] = useState(false)
  const styleInfo = STYLE_LABELS[creative.visualStyle] || { label: creative.visualStyle.toUpperCase(), variant: 'surface' as const }
  const catColor = CATEGORY_COLORS[creative.category] || '#696969'

  return (
    <CockpitCard
      variant="elevated"
      padding="none"
      style={{
        overflow: 'hidden',
        borderColor: status === 'approved'
          ? 'rgba(209, 255, 0, 0.3)'
          : status === 'rejected'
            ? 'rgba(239, 68, 68, 0.3)'
            : undefined,
        transition: 'border-color 0.3s',
      }}
    >
      {/* Image area */}
      <div
        role="button"
        tabIndex={0}
        aria-label={`Ver ${creative.id} em tela cheia`}
        onClick={() => onOpenLightbox(creative)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpenLightbox(creative) } }}
        style={{
          position: 'relative',
          aspectRatio: '1 / 1',
          overflow: 'hidden',
          cursor: 'pointer',
          background: 'var(--aiox-surface-deep, #050505)',
        }}
      >
        <img
          src={creative.imageUrl}
          alt={creative.title}
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.3s',
          }}
          onMouseEnter={(e) => { (e.target as HTMLImageElement).style.transform = 'scale(1.05)' }}
          onMouseLeave={(e) => { (e.target as HTMLImageElement).style.transform = 'scale(1)' }}
        />

        {/* Hover overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.5)',
          opacity: 0,
          transition: 'opacity 0.2s',
          pointerEvents: 'none',
        }}
          className="card-image-overlay"
        >
          <Eye size={24} style={{ color: 'var(--aiox-cream)' }} />
        </div>

        {/* Warning badge */}
        {creative.hasWarning && (
          <div style={{
            position: 'absolute',
            top: 8,
            right: 8,
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.25rem 0.5rem',
            background: 'rgba(245, 158, 11, 0.9)',
            fontFamily: 'var(--font-family-mono)',
            fontSize: '0.45rem',
            fontWeight: 600,
            color: '#050505',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            <AlertTriangle size={10} />
            REVISAR
          </div>
        )}

        {/* Status indicator overlay */}
        {status !== 'pending' && (
          <div style={{
            position: 'absolute',
            top: 8,
            left: 8,
            width: 24,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: status === 'approved' ? 'var(--aiox-lime)' : 'var(--color-status-error)',
            color: '#050505',
          }}>
            {status === 'approved' ? <Check size={14} strokeWidth={3} /> : <X size={14} strokeWidth={3} />}
          </div>
        )}
      </div>

      {/* Card body */}
      <div style={{ padding: '0.875rem' }}>
        {/* ID + style badge row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: 'var(--font-family-display)',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: catColor,
            letterSpacing: '0.04em',
          }}>
            {creative.id}
          </span>
          <CockpitBadge variant={styleInfo.variant} style={{ fontSize: '0.4rem', padding: '0.15rem 0.5rem' }}>
            {styleInfo.label}
          </CockpitBadge>
        </div>

        {/* Title */}
        <p style={{
          margin: 0,
          fontFamily: 'var(--font-family-mono)',
          fontSize: '0.6rem',
          fontWeight: 500,
          color: 'var(--aiox-cream)',
          lineHeight: 1.4,
          marginBottom: '0.625rem',
        }}>
          {creative.title}
        </p>

        {/* Warning box */}
        {creative.hasWarning && creative.warningText && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.375rem',
            padding: '0.5rem 0.625rem',
            marginBottom: '0.625rem',
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            fontFamily: 'var(--font-family-mono)',
            fontSize: '0.5rem',
            color: '#f59e0b',
            lineHeight: 1.4,
          }}>
            <AlertTriangle size={11} style={{ flexShrink: 0, marginTop: 1 }} />
            {creative.warningText}
          </div>
        )}

        {/* CTA badge */}
        <div style={{ marginBottom: '0.625rem' }}>
          <span style={{
            display: 'inline-block',
            padding: '0.2rem 0.5rem',
            background: 'rgba(237, 70, 9, 0.12)',
            border: '1px solid rgba(237, 70, 9, 0.25)',
            fontFamily: 'var(--font-family-mono)',
            fontSize: '0.45rem',
            fontWeight: 500,
            color: '#ED4609',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}>
            CTA: {creative.cta}
          </span>
        </div>

        {/* Copy toggle */}
        <button
          type="button"
          onClick={() => setCopyExpanded(!copyExpanded)}
          aria-expanded={copyExpanded}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            width: '100%',
            padding: '0.4rem 0.625rem',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(156, 156, 156, 0.1)',
            color: 'var(--aiox-gray-muted)',
            fontFamily: 'var(--font-family-mono)',
            fontSize: '0.5rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            cursor: 'pointer',
            transition: 'border-color 0.2s',
          }}
        >
          {copyExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
          {copyExpanded ? 'Ocultar copy' : 'Ver copy completa'}
        </button>

        {/* Expandable copy content */}
        {copyExpanded && (
          <div style={{
            marginTop: '0.5rem',
            padding: '0.75rem',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(156, 156, 156, 0.08)',
          }}>
            <CopyField label="Headline" value={creative.headline} />
            <CopyField label="Sub-headline" value={creative.subheadline} />
            <CopyField label="Texto Primário" value={creative.primaryText} />
            <CopyField label="CTA" value={creative.cta} isLast />
          </div>
        )}

        {/* Dispatch status indicator */}
        {dispatchStatus !== 'idle' && (
          <div style={{ marginBottom: '0.625rem' }}>
            <DispatchIndicator status={dispatchStatus} />
          </div>
        )}

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(156, 156, 156, 0.1)', margin: '0.75rem 0' }} />

        {/* Approval buttons */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => onVote(creative.id, status === 'approved' ? 'pending' : 'approved')}
            aria-label={status === 'approved' ? 'Remover aprovação' : 'Aprovar criativo'}
            aria-pressed={status === 'approved'}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              padding: '0.5rem',
              fontFamily: 'var(--font-family-mono)',
              fontSize: '0.5rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              cursor: 'pointer',
              transition: 'all 0.2s',
              border: status === 'approved'
                ? '1px solid var(--aiox-lime)'
                : '1px solid rgba(156, 156, 156, 0.15)',
              background: status === 'approved'
                ? 'rgba(209, 255, 0, 0.12)'
                : 'transparent',
              color: status === 'approved'
                ? 'var(--aiox-lime)'
                : 'var(--aiox-gray-dim)',
            }}
          >
            <Check size={12} />
            Aprovar
          </button>
          <button
            type="button"
            onClick={() => {
              if (status === 'rejected') {
                onVote(creative.id, 'pending')
              } else if (onReject) {
                onReject(creative)
              } else {
                onVote(creative.id, 'rejected')
              }
            }}
            aria-label={status === 'rejected' ? 'Remover rejeição' : 'Rejeitar criativo'}
            aria-pressed={status === 'rejected'}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              padding: '0.5rem',
              fontFamily: 'var(--font-family-mono)',
              fontSize: '0.5rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              cursor: 'pointer',
              transition: 'all 0.2s',
              border: status === 'rejected'
                ? '1px solid var(--color-status-error)'
                : '1px solid rgba(156, 156, 156, 0.15)',
              background: status === 'rejected'
                ? 'rgba(239, 68, 68, 0.12)'
                : 'transparent',
              color: status === 'rejected'
                ? 'var(--color-status-error)'
                : 'var(--aiox-gray-dim)',
            }}
          >
            <X size={12} />
            Rejeitar
          </button>
        </div>

        {/* Dispatch button — only for approved creatives with idle dispatch */}
        {status === 'approved' && dispatchStatus === 'idle' && onDispatch && (
          <button
            type="button"
            onClick={() => onDispatch(creative)}
            disabled={!isEngineOnline}
            aria-label="Enviar criativo para publicação"
            title={!isEngineOnline ? 'Engine offline — dispatch indisponível' : 'Enviar para publicação via media-buy squad'}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              padding: '0.5rem',
              marginTop: '0.5rem',
              fontFamily: 'var(--font-family-mono)',
              fontSize: '0.5rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              cursor: isEngineOnline ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              border: '1px solid rgba(0, 153, 255, 0.3)',
              background: isEngineOnline ? 'rgba(0, 153, 255, 0.08)' : 'transparent',
              color: isEngineOnline ? '#0099FF' : 'var(--aiox-gray-dim)',
              opacity: isEngineOnline ? 1 : 0.5,
            }}
          >
            <Send size={11} />
            Dispatch
          </button>
        )}

        {/* Dispatch button — for rejected with notes, show revision status */}
        {status === 'rejected' && dispatchStatus === 'idle' && onReject && (
          <button
            type="button"
            onClick={() => onReject(creative)}
            disabled={!isEngineOnline}
            aria-label="Enviar para revisão"
            title={!isEngineOnline ? 'Engine offline — dispatch indisponível' : 'Enviar feedback para creative-studio'}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              padding: '0.5rem',
              marginTop: '0.5rem',
              fontFamily: 'var(--font-family-mono)',
              fontSize: '0.5rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              cursor: isEngineOnline ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              border: '1px solid rgba(237, 70, 9, 0.3)',
              background: isEngineOnline ? 'rgba(237, 70, 9, 0.08)' : 'transparent',
              color: isEngineOnline ? '#ED4609' : 'var(--aiox-gray-dim)',
              opacity: isEngineOnline ? 1 : 0.5,
            }}
          >
            <MessageSquare size={11} />
            Enviar Revisão
          </button>
        )}
      </div>
    </CockpitCard>
  )
}

function CopyField({ label, value, isLast = false }: { label: string; value: string; isLast?: boolean }) {
  return (
    <div style={{ marginBottom: isLast ? 0 : '0.625rem' }}>
      <span style={{
        display: 'block',
        fontFamily: 'var(--font-family-mono)',
        fontSize: '0.45rem',
        fontWeight: 600,
        color: 'var(--aiox-gray-dim)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom: '0.2rem',
      }}>
        {label}
      </span>
      <span style={{
        display: 'block',
        fontFamily: 'var(--font-family-mono)',
        fontSize: '0.55rem',
        color: 'var(--aiox-cream)',
        lineHeight: 1.5,
      }}>
        {value}
      </span>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function CreativeGallery() {
  const [votes, setVotes] = useState<VoteMap>(loadVotes)
  const [lightboxCreative, setLightboxCreative] = useState<Creative | null>(null)
  const [filterTab, setFilterTab] = useState<FilterTab>('all')
  const [exportMsg, setExportMsg] = useState<string | null>(null)
  const [galleryMode, setGalleryMode] = useState<GalleryMode>('browse')
  const [rejectionTarget, setRejectionTarget] = useState<Creative | null>(null)
  const [rejectionNotes, setRejectionNotes] = useState('')

  // Dispatch hook
  const {
    dispatchApproval,
    dispatchRejection,
    dispatchBatch,
    dispatchStatus,
    isEngineOnline,
  } = useCreativeDispatch()

  // Load votes from Supabase on mount (fallback to localStorage)
  useEffect(() => {
    let cancelled = false
    if (creativeVotesService.isAvailable()) {
      creativeVotesService.getVotes(GALLERY_ID).then(rows => {
        if (cancelled || rows.length === 0) return
        const supaVotes: VoteMap = {}
        for (const row of rows) {
          if (row.vote !== 'pending') {
            supaVotes[row.creative_id] = row.vote
          }
        }
        setVotes(prev => {
          // Merge: Supabase wins for any existing keys
          const merged = { ...prev, ...supaVotes }
          saveVotes(merged)
          return merged
        })
      })
    }
    return () => { cancelled = true }
  }, [])

  // Persist votes to localStorage + Supabase
  useEffect(() => {
    saveVotes(votes)
  }, [votes])

  const handleVote = useCallback((id: string, vote: VoteStatus) => {
    setVotes(prev => {
      const next = { ...prev }
      if (vote === 'pending') {
        delete next[id]
      } else {
        next[id] = vote
      }
      return next
    })
    // Async persist to Supabase (fire-and-forget)
    creativeVotesService.upsertVote(GALLERY_ID, id, vote)
  }, [])

  // Rejection flow: open modal, then dispatch
  const handleRejectWithNotes = useCallback((creative: Creative) => {
    setRejectionTarget(creative)
    setRejectionNotes('')
  }, [])

  const handleConfirmRejection = useCallback(() => {
    if (!rejectionTarget) return
    // Set vote to rejected
    handleVote(rejectionTarget.id, 'rejected')
    // Save notes to Supabase
    creativeVotesService.upsertVote(GALLERY_ID, rejectionTarget.id, 'rejected', rejectionNotes)
    // Dispatch to creative-studio if engine is online and notes provided
    if (isEngineOnline && rejectionNotes.trim()) {
      dispatchRejection(rejectionTarget, GALLERY_ID, rejectionNotes)
    }
    setRejectionTarget(null)
    setRejectionNotes('')
  }, [rejectionTarget, rejectionNotes, isEngineOnline, handleVote, dispatchRejection])

  // Dispatch individual approval
  const handleDispatchApproval = useCallback((creative: Creative) => {
    dispatchApproval(creative, GALLERY_ID)
  }, [dispatchApproval])

  // Batch dispatch all approved
  const handleBatchDispatch = useCallback(() => {
    const approvedCreatives = CREATIVES.filter(
      c => votes[c.id] === 'approved' && (dispatchStatus[c.id] || 'idle') === 'idle'
    )
    if (approvedCreatives.length === 0) return

    dispatchBatch(approvedCreatives, GALLERY_ID, {
      product: 'Auto-Massagem',
      sigla: 'AUT',
      dailyBudget: 150,
      totalBudget: 150,
      targeting: 'Advantage+ Audience, BR 25-65',
      objective: 'OUTCOME_SALES',
    })
  }, [votes, dispatchStatus, dispatchBatch])

  // Filtered categories
  const filteredCategories = useMemo(() => {
    if (filterTab === 'all') return CATEGORIES

    return CATEGORIES.map(cat => ({
      ...cat,
      creatives: cat.creatives.filter(c => getVoteStatus(votes, c.id) === filterTab),
    })).filter(cat => cat.creatives.length > 0)
  }, [filterTab, votes])

  const totalFiltered = useMemo(
    () => filteredCategories.reduce((acc, cat) => acc + cat.creatives.length, 0),
    [filteredCategories]
  )

  // Counts for filter tabs
  const counts = useMemo(() => ({
    all: CREATIVES.length,
    approved: Object.values(votes).filter(v => v === 'approved').length,
    rejected: Object.values(votes).filter(v => v === 'rejected').length,
    pending: CREATIVES.length - Object.keys(votes).length,
  }), [votes])

  // Approved with idle dispatch (for batch button)
  const batchableCount = useMemo(() =>
    CREATIVES.filter(c => votes[c.id] === 'approved' && (dispatchStatus[c.id] || 'idle') === 'idle').length,
    [votes, dispatchStatus]
  )

  // Export function
  const handleExport = useCallback(async () => {
    const approved = CREATIVES.filter(c => votes[c.id] === 'approved').map(c => c.id)
    const rejected = CREATIVES.filter(c => votes[c.id] === 'rejected').map(c => c.id)
    const pending = CREATIVES.filter(c => !votes[c.id]).map(c => c.id)

    const text = [
      '=== CRIATIVOS AUT DOR SEGMENTADA — RESULTADO ===',
      '',
      `✓ APROVADOS (${approved.length}):`,
      approved.length ? approved.join(', ') : '  (nenhum)',
      '',
      `✗ REJEITADOS (${rejected.length}):`,
      rejected.length ? rejected.join(', ') : '  (nenhum)',
      '',
      `◌ PENDENTES (${pending.length}):`,
      pending.length ? pending.join(', ') : '  (nenhum)',
      '',
      `Total: ${approved.length} aprovados / ${rejected.length} rejeitados / ${pending.length} pendentes de ${CREATIVES.length}`,
    ].join('\n')

    try {
      await navigator.clipboard.writeText(text)
      setExportMsg('Copiado para a área de transferência')
    } catch {
      setExportMsg('Erro ao copiar — verifique permissões do navegador')
    }

    setTimeout(() => setExportMsg(null), 3000)
  }, [votes])

  // Filter tabs config
  const filterTabs = [
    { id: 'all' as const, label: `Todos (${counts.all})`, icon: <Filter size={11} /> },
    { id: 'approved' as const, label: `Aprovados (${counts.approved})`, icon: <Check size={11} /> },
    { id: 'rejected' as const, label: `Rejeitados (${counts.rejected})`, icon: <X size={11} /> },
    { id: 'pending' as const, label: `Pendentes (${counts.pending})`, icon: <Target size={11} /> },
  ]

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      background: 'var(--aiox-dark, #050505)',
      fontFamily: 'var(--font-family-mono)',
      color: 'var(--aiox-cream, #FAF9F6)',
    }}>
      {/* Ticker */}
      <CockpitTickerStrip items={TICKER_ITEMS} />

      {/* Header */}
      <div style={{
        padding: '2rem 2rem 1rem',
        borderBottom: '1px solid rgba(156, 156, 156, 0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <ImageIcon size={18} style={{ color: 'var(--aiox-lime)' }} />
              <h1 style={{
                margin: 0,
                fontFamily: 'var(--font-family-display)',
                fontSize: '1.1rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                color: 'var(--aiox-cream)',
              }}>
                Criativos AUT Dor Segmentada
              </h1>
              <CockpitBadge variant="solid" style={{ fontSize: '0.4rem' }}>
                {CREATIVES.length} CRIATIVOS
              </CockpitBadge>
            </div>
            <p style={{
              margin: 0,
              fontFamily: 'var(--font-family-mono)',
              fontSize: '0.6rem',
              color: 'var(--aiox-gray-muted)',
              lineHeight: 1.5,
              maxWidth: 600,
            }}>
              Galeria de criativos hipersegmentados por tipo de dor para campanha de Auto-Massagem.
              Aprove ou rejeite cada criativo — o resultado é salvo automaticamente.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>
            <ApprovalCounter votes={votes} />

            {/* Mode toggle + action buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {/* Gallery mode toggle */}
              <div style={{
                display: 'flex',
                border: '1px solid rgba(156, 156, 156, 0.15)',
                overflow: 'hidden',
              }}>
                {(['browse', 'campaign'] as const).map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setGalleryMode(mode)}
                    style={{
                      padding: '0.35rem 0.625rem',
                      fontFamily: 'var(--font-family-mono)',
                      fontSize: '0.45rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      cursor: 'pointer',
                      border: 'none',
                      transition: 'all 0.2s',
                      background: galleryMode === mode ? 'rgba(209, 255, 0, 0.12)' : 'transparent',
                      color: galleryMode === mode ? 'var(--aiox-lime)' : 'var(--aiox-gray-dim)',
                    }}
                  >
                    {mode === 'browse' ? 'Browse' : 'Campaign'}
                  </button>
                ))}
              </div>

              <CockpitButton
                variant="outline"
                size="sm"
                onClick={handleExport}
              >
                <Clipboard size={11} />
                Exportar
              </CockpitButton>

              {/* Batch dispatch button — campaign mode only */}
              {galleryMode === 'campaign' && (
                <CockpitButton
                  variant="primary"
                  size="sm"
                  onClick={handleBatchDispatch}
                  disabled={!isEngineOnline || batchableCount === 0}
                >
                  <Package size={11} />
                  Submeter Campanha ({batchableCount})
                </CockpitButton>
              )}
            </div>

            {!isEngineOnline && galleryMode === 'campaign' && (
              <span style={{
                fontFamily: 'var(--font-family-mono)',
                fontSize: '0.45rem',
                color: 'var(--color-status-error)',
              }}>
                Engine offline — dispatch indisponível
              </span>
            )}

            {exportMsg && (
              <span style={{
                fontFamily: 'var(--font-family-mono)',
                fontSize: '0.5rem',
                color: 'var(--aiox-lime)',
              }}>
                {exportMsg}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Engine offline alert — campaign mode */}
      {galleryMode === 'campaign' && !isEngineOnline && (
        <div style={{ padding: '0 2rem' }}>
          <CockpitAlert variant="info" style={{ marginTop: '0.75rem' }}>
            <strong>Engine não detectado.</strong> O dispatch de criativos requer o AIOS Engine
            rodando na porta 4002. Aprovação e rejeição funcionam normalmente sem o Engine.
          </CockpitAlert>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ padding: '0 2rem' }}>
        <CockpitTabs
          tabs={filterTabs}
          activeTab={filterTab}
          onChange={(id) => setFilterTab(id as FilterTab)}
          size="sm"
        />
      </div>

      {/* Main content */}
      <div style={{ padding: '1.5rem 2rem 2rem' }}>
        {totalFiltered === 0 ? (
          <CockpitCard variant="subtle" padding="lg" style={{ textAlign: 'center' }}>
            <p style={{
              fontFamily: 'var(--font-family-mono)',
              fontSize: '0.65rem',
              color: 'var(--aiox-gray-dim)',
            }}>
              Nenhum criativo nesta categoria de filtro.
            </p>
          </CockpitCard>
        ) : (
          filteredCategories.map((category) => (
            <div key={category.name} style={{ marginBottom: '2.5rem' }}>
              {/* Category header */}
              <CockpitSectionDivider style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: 4,
                    height: 28,
                    background: CATEGORY_COLORS[category.name] || '#696969',
                    flexShrink: 0,
                  }} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.85rem' }}>{category.icon}</span>
                      <span style={{
                        fontFamily: 'var(--font-family-display)',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: 'var(--aiox-cream)',
                        letterSpacing: '0.03em',
                      }}>
                        {category.name}
                      </span>
                    </div>
                    <span style={{
                      fontFamily: 'var(--font-family-mono)',
                      fontSize: '0.5rem',
                      color: 'var(--aiox-gray-dim)',
                      letterSpacing: '0.04em',
                    }}>
                      {category.creatives.length} criativo{category.creatives.length !== 1 ? 's' : ''} — {category.creatives.map(c => c.id).join(', ')}
                    </span>
                  </div>
                </div>
              </CockpitSectionDivider>

              {/* Creative grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1.25rem',
              }}>
                {category.creatives.map(creative => (
                  <CreativeCard
                    key={creative.id}
                    creative={creative}
                    status={getVoteStatus(votes, creative.id)}
                    dispatchStatus={dispatchStatus[creative.id] || 'idle'}
                    onVote={handleVote}
                    onOpenLightbox={setLightboxCreative}
                    onDispatch={handleDispatchApproval}
                    onReject={handleRejectWithNotes}
                    isEngineOnline={isEngineOnline}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Campaign config footer */}
      <div style={{
        margin: '0 2rem 2rem',
        borderTop: '1px solid rgba(156, 156, 156, 0.1)',
        paddingTop: '1.5rem',
      }}>
        <CockpitCard variant="default" padding="md" accentBorder="top" accentColor="var(--aiox-lime)">
          <h3 style={{
            margin: '0 0 1rem',
            fontFamily: 'var(--font-family-display)',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--aiox-cream)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}>
            Configuração da Campanha
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.625rem' }}>
            {CAMPAIGN_CONFIG.map((row) => (
              <div key={row.label} style={{
                display: 'flex',
                gap: '0.75rem',
                padding: '0.5rem 0',
                borderBottom: '1px solid rgba(156, 156, 156, 0.06)',
              }}>
                <span style={{
                  fontFamily: 'var(--font-family-mono)',
                  fontSize: '0.5rem',
                  fontWeight: 600,
                  color: 'var(--aiox-gray-dim)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  minWidth: 80,
                  flexShrink: 0,
                }}>
                  {row.label}
                </span>
                <span style={{
                  fontFamily: 'var(--font-family-mono)',
                  fontSize: '0.55rem',
                  color: 'var(--aiox-cream)',
                  lineHeight: 1.4,
                  wordBreak: 'break-word',
                }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </CockpitCard>

        {/* Warning note */}
        <CockpitAlert
          variant="warning"
          style={{ marginTop: '1rem' }}
        >
          <strong>Nota sobre texto nas imagens:</strong> Alguns criativos marcados com ⚠ contêm erros de digitação gerados
          por IA na imagem. O texto primário do anúncio (que aparece fora da imagem no Meta Ads) está correto.
          Revise a imagem antes de publicar.
        </CockpitAlert>
      </div>

      {/* Lightbox Modal */}
      <CockpitModal
        open={!!lightboxCreative}
        onClose={() => setLightboxCreative(null)}
        title={lightboxCreative?.id || ''}
        description={lightboxCreative?.title}
        size="lg"
      >
        {lightboxCreative && (
          <div>
            <img
              src={lightboxCreative.imageUrl}
              alt={lightboxCreative.title}
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                marginBottom: '1rem',
              }}
            />
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              flexWrap: 'wrap',
            }}>
              <CockpitBadge
                variant={STYLE_LABELS[lightboxCreative.visualStyle]?.variant || 'surface'}
                style={{ fontSize: '0.45rem' }}
              >
                {STYLE_LABELS[lightboxCreative.visualStyle]?.label || lightboxCreative.visualStyle}
              </CockpitBadge>
              <CockpitBadge variant="surface" style={{ fontSize: '0.45rem' }}>
                {lightboxCreative.category}
              </CockpitBadge>
              {lightboxCreative.hasWarning && (
                <CockpitBadge variant="error" style={{ fontSize: '0.45rem' }}>
                  <AlertTriangle size={9} style={{ marginRight: 4 }} />
                  REVISAR
                </CockpitBadge>
              )}
            </div>

            <div style={{ marginTop: '1rem' }}>
              <CopyField label="Headline" value={lightboxCreative.headline} />
              <CopyField label="Sub-headline" value={lightboxCreative.subheadline} />
              <CopyField label="Texto Primário" value={lightboxCreative.primaryText} />
              <CopyField label="CTA" value={lightboxCreative.cta} isLast />
            </div>
          </div>
        )}
      </CockpitModal>

      {/* Rejection Notes Modal */}
      <CockpitModal
        open={!!rejectionTarget}
        onClose={() => { setRejectionTarget(null); setRejectionNotes('') }}
        title={`Rejeitar ${rejectionTarget?.id || ''}`}
        description="Adicione notas sobre o motivo da rejeição. Estas serão enviadas ao creative-studio para revisão."
        size="md"
      >
        {rejectionTarget && (
          <div>
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              marginBottom: '1rem',
              padding: '0.75rem',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(156, 156, 156, 0.08)',
            }}>
              <img
                src={rejectionTarget.imageUrl}
                alt={rejectionTarget.title}
                style={{ width: 80, height: 80, objectFit: 'cover', flexShrink: 0 }}
              />
              <div>
                <span style={{
                  fontFamily: 'var(--font-family-display)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: 'var(--aiox-cream)',
                }}>
                  {rejectionTarget.id}
                </span>
                <p style={{
                  margin: '0.25rem 0 0',
                  fontFamily: 'var(--font-family-mono)',
                  fontSize: '0.55rem',
                  color: 'var(--aiox-gray-muted)',
                  lineHeight: 1.4,
                }}>
                  {rejectionTarget.title}
                </p>
              </div>
            </div>

            <label
              htmlFor="rejection-notes"
              style={{
                display: 'block',
                fontFamily: 'var(--font-family-mono)',
                fontSize: '0.5rem',
                fontWeight: 600,
                color: 'var(--aiox-gray-dim)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '0.375rem',
              }}
            >
              Motivo da rejeição
            </label>
            <textarea
              id="rejection-notes"
              value={rejectionNotes}
              onChange={(e) => setRejectionNotes(e.target.value)}
              placeholder="Ex: Texto muito genérico, precisa de mais especificidade na dor..."
              rows={4}
              style={{
                width: '100%',
                padding: '0.625rem',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(156, 156, 156, 0.15)',
                color: 'var(--aiox-cream)',
                fontFamily: 'var(--font-family-mono)',
                fontSize: '0.6rem',
                lineHeight: 1.5,
                resize: 'vertical',
                outline: 'none',
              }}
            />

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
              <CockpitButton
                variant="outline"
                size="sm"
                onClick={() => { setRejectionTarget(null); setRejectionNotes('') }}
              >
                Cancelar
              </CockpitButton>
              <CockpitButton
                variant="primary"
                size="sm"
                onClick={handleConfirmRejection}
              >
                <X size={11} />
                Rejeitar{rejectionNotes.trim() && isEngineOnline ? ' + Enviar Revisão' : ''}
              </CockpitButton>
            </div>
          </div>
        )}
      </CockpitModal>

      {/* CSS for hover overlay + spinner animation */}
      <style>{`
        .card-image-overlay { opacity: 0 !important; }
        div:hover > .card-image-overlay { opacity: 1 !important; }
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}
