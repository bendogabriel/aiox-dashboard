import { useState, useMemo } from 'react'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  AlertTriangle,
  RotateCcw,
  CreditCard,
  Search,
  ChevronDown,
  BarChart3,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download,
  RefreshCw,
  Package,
  Users,
  XCircle,
  CheckCircle,
  Clock,
  Eye,
} from 'lucide-react'
import {
  CockpitKpiCard,
  CockpitCard,
  CockpitTable,
  CockpitTabs,
  CockpitBadge,
  CockpitButton,
  CockpitProgress,
  CockpitSelect,
  CockpitTickerStrip,
  CockpitStatusIndicator,
  CockpitSectionDivider,
} from '../ui/cockpit'

// ── Mock Data ──

const TICKER_ITEMS = [
  'Receita Aprovada: R$ 47.832,00',
  'Ticket Médio: R$ 156,40',
  'Taxa Aprovação: 78,2%',
  'Vendas Hoje: 42',
  'Reembolsos: 3',
  'Chargebacks: 0',
  'Maior Venda: R$ 1.497,00',
  'Conversão Checkout: 4,2%',
]

const KPI_DATA = [
  {
    label: 'Receita Aprovada',
    value: 'R$ 47.832',
    change: '+12,4%',
    trend: 'up' as const,
    context: 'vs. mês anterior',
  },
  {
    label: 'Ticket Médio',
    value: 'R$ 156,40',
    change: '+3,2%',
    trend: 'up' as const,
    context: 'últimos 30 dias',
  },
  {
    label: 'Taxa de Aprovação',
    value: '78,2%',
    change: '-1,8%',
    trend: 'down' as const,
    context: 'meta: 82%',
  },
  {
    label: 'Receita Líquida',
    value: 'R$ 43.104',
    change: '+9,7%',
    trend: 'up' as const,
    context: 'após taxas e reembolsos',
  },
]

interface SaleRow {
  id: string
  date: string
  product: string
  buyer: string
  value: number
  status: 'approved' | 'pending' | 'refunded' | 'chargeback' | 'failed'
  method: string
}

const SALES_DATA: SaleRow[] = [
  { id: 'TX-4821', date: '13/03/2026 14:32', product: 'MCPM 2.0', buyer: 'Maria Silva', value: 1497.0, status: 'approved', method: 'Cartão' },
  { id: 'TX-4820', date: '13/03/2026 13:15', product: 'MAM', buyer: 'João Santos', value: 297.0, status: 'approved', method: 'PIX' },
  { id: 'TX-4819', date: '13/03/2026 12:48', product: 'MPG', buyer: 'Ana Costa', value: 29.97, status: 'approved', method: 'Cartão' },
  { id: 'TX-4818', date: '13/03/2026 11:20', product: 'GPO', buyer: 'Carla Dias', value: 97.0, status: 'pending', method: 'Boleto' },
  { id: 'TX-4817', date: '13/03/2026 10:05', product: 'FDS', buyer: 'Pedro Alves', value: 97.0, status: 'approved', method: 'Cartão' },
  { id: 'TX-4816', date: '12/03/2026 23:40', product: 'MPG', buyer: 'Fernanda Lima', value: 29.97, status: 'refunded', method: 'Cartão' },
  { id: 'TX-4815', date: '12/03/2026 22:18', product: 'MAM', buyer: 'Lucas Rocha', value: 297.0, status: 'approved', method: 'PIX' },
  { id: 'TX-4814', date: '12/03/2026 20:55', product: 'MCPM 2.0', buyer: 'Beatriz Souza', value: 1497.0, status: 'approved', method: 'Cartão' },
  { id: 'TX-4813', date: '12/03/2026 19:30', product: 'MPE', buyer: 'Roberto Nunes', value: 297.0, status: 'failed', method: 'Cartão' },
  { id: 'TX-4812', date: '12/03/2026 18:02', product: 'GPO', buyer: 'Juliana Mendes', value: 97.0, status: 'approved', method: 'PIX' },
]

interface ProductMetric {
  product: string
  sigla: string
  revenue: number
  sales: number
  approvalRate: number
  avgTicket: number
  refundRate: number
}

const PRODUCT_METRICS: ProductMetric[] = [
  { product: 'Método Cura Pelas Mãos 2.0', sigla: 'MCPM', revenue: 22455, sales: 15, approvalRate: 86.7, avgTicket: 1497.0, refundRate: 2.1 },
  { product: 'Método Agenda Mágica', sigla: 'MAM', revenue: 11880, sales: 40, approvalRate: 82.5, avgTicket: 297.0, refundRate: 3.4 },
  { product: 'Manual dos Pontos Gatilhos', sigla: 'MPG', revenue: 5994, sales: 200, approvalRate: 74.3, avgTicket: 29.97, refundRate: 5.8 },
  { product: 'Guia Pós-Operatório', sigla: 'GPO', revenue: 3880, sales: 40, approvalRate: 78.0, avgTicket: 97.0, refundRate: 4.2 },
  { product: 'Masterclass Fórmula do Sucesso', sigla: 'FDS', revenue: 2910, sales: 30, approvalRate: 76.5, avgTicket: 97.0, refundRate: 3.0 },
  { product: 'Massagem para Eventos', sigla: 'MPE', revenue: 1485, sales: 5, approvalRate: 80.0, avgTicket: 297.0, refundRate: 0.0 },
]

interface FunnelStage {
  label: string
  value: number
  rate?: number
}

const FUNNEL_DATA: FunnelStage[] = [
  { label: 'Visitantes', value: 12480 },
  { label: 'Página de Vendas', value: 4320, rate: 34.6 },
  { label: 'Checkout Iniciado', value: 890, rate: 20.6 },
  { label: 'Pagamento Enviado', value: 412, rate: 46.3 },
  { label: 'Compra Aprovada', value: 322, rate: 78.2 },
]

interface RefundRow {
  id: string
  date: string
  product: string
  buyer: string
  value: number
  reason: string
  daysAfterPurchase: number
}

const REFUNDS_DATA: RefundRow[] = [
  { id: 'RF-081', date: '12/03/2026', product: 'MPG', buyer: 'Fernanda Lima', value: 29.97, reason: 'Não era o que esperava', daysAfterPurchase: 3 },
  { id: 'RF-080', date: '11/03/2026', product: 'MAM', buyer: 'Marcos Vieira', value: 297.0, reason: 'Desistência', daysAfterPurchase: 5 },
  { id: 'RF-079', date: '10/03/2026', product: 'GPO', buyer: 'Patrícia Reis', value: 97.0, reason: 'Compra duplicada', daysAfterPurchase: 1 },
]

// ── Helpers ──

function formatCurrency(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function getStatusBadge(status: SaleRow['status']) {
  const map: Record<string, { variant: 'lime' | 'blue' | 'error' | 'surface'; label: string }> = {
    approved: { variant: 'lime', label: 'Aprovada' },
    pending: { variant: 'blue', label: 'Pendente' },
    refunded: { variant: 'surface', label: 'Reembolso' },
    chargeback: { variant: 'error', label: 'Chargeback' },
    failed: { variant: 'error', label: 'Falhou' },
  }
  const { variant, label } = map[status] || { variant: 'surface' as const, label: status }
  return <CockpitBadge variant={variant}>{label}</CockpitBadge>
}

// ── Main Component ──

type TabId = 'overview' | 'products' | 'refunds' | 'funnel'

export default function SalesDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateRange, setDateRange] = useState('last_30d')

  const filteredSales = useMemo(() => {
    if (!searchQuery) return SALES_DATA
    const q = searchQuery.toLowerCase()
    return SALES_DATA.filter(
      (s) =>
        s.id.toLowerCase().includes(q) ||
        s.product.toLowerCase().includes(q) ||
        s.buyer.toLowerCase().includes(q)
    )
  }, [searchQuery])

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: <BarChart3 size={12} /> },
    { id: 'products', label: 'Produtos', icon: <Package size={12} /> },
    { id: 'refunds', label: 'Reembolsos', icon: <RotateCcw size={12} /> },
    { id: 'funnel', label: 'Funil', icon: <Filter size={12} /> },
  ]

  return (
    <div
      className="pattern-dot-grid--sparse"
      style={{ height: '100%', overflow: 'auto', position: 'relative' }}
    >
      {/* Ticker Strip */}
      <CockpitTickerStrip items={TICKER_ITEMS} speed={40} />

      <div style={{ padding: '1.5rem' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem',
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
              Sales Intelligence
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
              Hotmart Revenue Dashboard — Real-time
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <CockpitStatusIndicator status="online" label="Hotmart API" />
            <CockpitSelect
              options={[
                { value: 'last_7d', label: 'Últimos 7 dias' },
                { value: 'last_14d', label: 'Últimos 14 dias' },
                { value: 'last_30d', label: 'Últimos 30 dias' },
                { value: 'last_90d', label: 'Últimos 90 dias' },
                { value: 'this_month', label: 'Este mês' },
                { value: 'last_month', label: 'Mês anterior' },
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

        {/* KPI Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          {KPI_DATA.map((kpi) => (
            <CockpitKpiCard
              key={kpi.label}
              label={kpi.label}
              value={kpi.value}
              change={kpi.change}
              trend={kpi.trend}
            />
          ))}
        </div>

        {/* Tabs */}
        <CockpitTabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as TabId)}
        />

        {/* Tab Content */}
        <div style={{ marginTop: '1.5rem' }}>
          {activeTab === 'overview' && (
            <OverviewTab
              sales={filteredSales}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          )}
          {activeTab === 'products' && <ProductsTab />}
          {activeTab === 'refunds' && <RefundsTab />}
          {activeTab === 'funnel' && <FunnelTab />}
        </div>
      </div>
    </div>
  )
}

// ── Overview Tab ──

function OverviewTab({
  sales,
  searchQuery,
  onSearchChange,
}: {
  sales: SaleRow[]
  searchQuery: string
  onSearchChange: (q: string) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Search */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--aiox-gray-dim)',
            }}
          />
          <input
            type="text"
            placeholder="Buscar por ID, produto ou comprador..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem 0.75rem 0.6rem 2.25rem',
              fontFamily: 'var(--font-family-mono)',
              fontSize: '0.7rem',
              letterSpacing: '0.02em',
              background: 'var(--aiox-surface-deep, #050505)',
              border: '1px solid rgba(156, 156, 156, 0.15)',
              color: 'var(--aiox-cream)',
              outline: 'none',
              minHeight: 44,
            }}
          />
        </div>
        <CockpitButton variant="ghost" size="sm" leftIcon={<Download size={12} />}>
          Exportar
        </CockpitButton>
      </div>

      {/* Transactions Table */}
      <CockpitCard accent="left">
        <div style={{ padding: '1rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
            }}
          >
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
              Transações Recentes
            </span>
            <CockpitBadge variant="surface">{sales.length} registros</CockpitBadge>
          </div>

          <CockpitTable
            columns={[
              { key: 'id', label: 'ID', width: '90px' },
              { key: 'date', label: 'Data', width: '150px', sortable: true },
              { key: 'product', label: 'Produto', sortable: true },
              { key: 'buyer', label: 'Comprador' },
              {
                key: 'value',
                label: 'Valor',
                width: '120px',
                sortable: true,
                render: (row: SaleRow) => (
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {formatCurrency(row.value)}
                  </span>
                ),
              },
              {
                key: 'status',
                label: 'Status',
                width: '110px',
                render: (row: SaleRow) => getStatusBadge(row.status),
              },
              { key: 'method', label: 'Método', width: '90px' },
            ]}
            data={sales}
            hoverable
            striped
          />
        </div>
      </CockpitCard>

      {/* Quick Stats Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
        }}
      >
        <QuickStatCard
          icon={<CheckCircle size={16} />}
          label="Vendas Aprovadas"
          value="322"
          color="var(--aiox-lime)"
        />
        <QuickStatCard
          icon={<Clock size={16} />}
          label="Pendentes"
          value="18"
          color="var(--aiox-blue)"
        />
        <QuickStatCard
          icon={<RotateCcw size={16} />}
          label="Reembolsos"
          value="12"
          color="var(--aiox-gray-muted)"
        />
        <QuickStatCard
          icon={<XCircle size={16} />}
          label="Chargebacks"
          value="2"
          color="var(--color-status-error)"
        />
      </div>
    </div>
  )
}

function QuickStatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  color: string
}) {
  return (
    <CockpitCard variant="subtle" padding="md">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ color, flexShrink: 0 }}>{icon}</div>
        <div>
          <span
            style={{
              fontFamily: 'var(--font-family-mono)',
              fontSize: '0.55rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--aiox-gray-muted)',
              display: 'block',
            }}
          >
            {label}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-family-display)',
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--aiox-cream)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {value}
          </span>
        </div>
      </div>
    </CockpitCard>
  )
}

// ── Products Tab ──

function ProductsTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Product Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1rem',
        }}
      >
        {PRODUCT_METRICS.map((pm) => (
          <ProductCard key={pm.sigla} product={pm} />
        ))}
      </div>

      {/* Product Comparison Table */}
      <CockpitCard accent="left">
        <div style={{ padding: '1rem' }}>
          <span
            style={{
              fontFamily: 'var(--font-family-mono)',
              fontSize: '0.625rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--aiox-cream)',
              display: 'block',
              marginBottom: '1rem',
            }}
          >
            Comparativo de Produtos
          </span>

          <CockpitTable
            columns={[
              {
                key: 'sigla',
                label: 'Produto',
                width: '80px',
                render: (row: ProductMetric) => (
                  <CockpitBadge variant="solid" style={{ fontSize: '0.45rem' }}>
                    {row.sigla}
                  </CockpitBadge>
                ),
              },
              {
                key: 'revenue',
                label: 'Receita',
                sortable: true,
                render: (row: ProductMetric) => (
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {formatCurrency(row.revenue)}
                  </span>
                ),
              },
              { key: 'sales', label: 'Vendas', width: '80px', sortable: true },
              {
                key: 'avgTicket',
                label: 'Ticket Médio',
                sortable: true,
                render: (row: ProductMetric) => (
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {formatCurrency(row.avgTicket)}
                  </span>
                ),
              },
              {
                key: 'approvalRate',
                label: 'Aprovação',
                width: '100px',
                sortable: true,
                render: (row: ProductMetric) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CockpitProgress
                      value={row.approvalRate}
                      size="sm"
                      variant={row.approvalRate >= 80 ? 'success' : row.approvalRate >= 70 ? 'warning' : 'error'}
                      style={{ width: 48 }}
                    />
                    <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: '0.65rem' }}>
                      {row.approvalRate}%
                    </span>
                  </div>
                ),
              },
              {
                key: 'refundRate',
                label: 'Reembolso',
                width: '90px',
                sortable: true,
                render: (row: ProductMetric) => (
                  <span
                    style={{
                      color:
                        row.refundRate > 5
                          ? 'var(--color-status-error)'
                          : row.refundRate > 3
                            ? '#f59e0b'
                            : 'var(--aiox-gray-muted)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {row.refundRate}%
                  </span>
                ),
              },
            ]}
            data={PRODUCT_METRICS}
            hoverable
            striped
          />
        </div>
      </CockpitCard>
    </div>
  )
}

function ProductCard({ product }: { product: ProductMetric }) {
  const revenueShare = (product.revenue / PRODUCT_METRICS.reduce((a, p) => a + p.revenue, 0)) * 100

  return (
    <CockpitCard accent="top" padding="md">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CockpitBadge variant="solid" style={{ fontSize: '0.5rem' }}>
            {product.sigla}
          </CockpitBadge>
          <span
            style={{
              fontFamily: 'var(--font-family-mono)',
              fontSize: '0.6rem',
              color: 'var(--aiox-cream)',
              fontWeight: 500,
            }}
          >
            {product.product}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div>
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
            Receita
          </span>
          <span
            style={{
              fontFamily: 'var(--font-family-display)',
              fontSize: '1.1rem',
              fontWeight: 700,
              color: 'var(--aiox-lime)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {formatCurrency(product.revenue)}
          </span>
        </div>
        <div>
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
            Vendas
          </span>
          <span
            style={{
              fontFamily: 'var(--font-family-display)',
              fontSize: '1.1rem',
              fontWeight: 700,
              color: 'var(--aiox-cream)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {product.sales}
          </span>
        </div>
      </div>

      <div style={{ marginTop: '0.75rem' }}>
        <CockpitProgress
          value={product.approvalRate}
          label="Taxa de Aprovação"
          showValue
          size="sm"
          variant={product.approvalRate >= 80 ? 'success' : product.approvalRate >= 70 ? 'warning' : 'error'}
        />
      </div>

      <div
        style={{
          marginTop: '0.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          borderTop: '1px solid rgba(156, 156, 156, 0.1)',
          paddingTop: '0.5rem',
        }}
      >
        <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.5rem', color: 'var(--aiox-gray-dim)' }}>
          Share: {revenueShare.toFixed(1)}%
        </span>
        <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.5rem', color: 'var(--aiox-gray-dim)' }}>
          Reembolso: {product.refundRate}%
        </span>
      </div>
    </CockpitCard>
  )
}

// ── Refunds Tab ──

function RefundsTab() {
  const totalRefunded = REFUNDS_DATA.reduce((a, r) => a + r.value, 0)
  const avgDays = REFUNDS_DATA.reduce((a, r) => a + r.daysAfterPurchase, 0) / REFUNDS_DATA.length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Refund KPIs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
        }}
      >
        <CockpitKpiCard label="Total Reembolsado" value={formatCurrency(totalRefunded)} trend="neutral" />
        <CockpitKpiCard label="Reembolsos (30d)" value={String(REFUNDS_DATA.length)} trend="neutral" />
        <CockpitKpiCard label="Média Dias p/ Reembolso" value={avgDays.toFixed(1)} trend="neutral" />
        <CockpitKpiCard label="Taxa de Reembolso" value="3,7%" change="-0,3%" trend="down" />
      </div>

      {/* Refunds Table */}
      <CockpitCard accent="left">
        <div style={{ padding: '1rem' }}>
          <span
            style={{
              fontFamily: 'var(--font-family-mono)',
              fontSize: '0.625rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--aiox-cream)',
              display: 'block',
              marginBottom: '1rem',
            }}
          >
            Reembolsos Recentes
          </span>
          <CockpitTable
            columns={[
              { key: 'id', label: 'ID', width: '80px' },
              { key: 'date', label: 'Data', width: '110px', sortable: true },
              { key: 'product', label: 'Produto', width: '100px' },
              { key: 'buyer', label: 'Comprador' },
              {
                key: 'value',
                label: 'Valor',
                width: '110px',
                sortable: true,
                render: (row: RefundRow) => (
                  <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--color-status-error)' }}>
                    -{formatCurrency(row.value)}
                  </span>
                ),
              },
              { key: 'reason', label: 'Motivo' },
              {
                key: 'daysAfterPurchase',
                label: 'Dias',
                width: '60px',
                sortable: true,
                render: (row: RefundRow) => (
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>{row.daysAfterPurchase}d</span>
                ),
              },
            ]}
            data={REFUNDS_DATA}
            hoverable
            striped
          />
        </div>
      </CockpitCard>
    </div>
  )
}

// ── Funnel Tab ──

function FunnelTab() {
  const maxValue = FUNNEL_DATA[0].value

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Funnel Visualization */}
      <CockpitCard accent="top" padding="lg">
        <span
          style={{
            fontFamily: 'var(--font-family-mono)',
            fontSize: '0.625rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--aiox-cream)',
            display: 'block',
            marginBottom: '1.5rem',
          }}
        >
          Funil de Conversão
        </span>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {FUNNEL_DATA.map((stage, i) => {
            const widthPercent = (stage.value / maxValue) * 100
            const isLast = i === FUNNEL_DATA.length - 1

            return (
              <div key={stage.label}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.35rem',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-family-mono)',
                      fontSize: '0.6rem',
                      color: 'var(--aiox-cream)',
                      fontWeight: 500,
                    }}
                  >
                    {stage.label}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-family-display)',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        color: isLast ? 'var(--aiox-lime)' : 'var(--aiox-cream)',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {stage.value.toLocaleString('pt-BR')}
                    </span>
                    {stage.rate !== undefined && (
                      <CockpitBadge
                        variant={stage.rate >= 50 ? 'lime' : stage.rate >= 20 ? 'blue' : 'error'}
                        style={{ fontSize: '0.45rem' }}
                      >
                        {stage.rate}%
                      </CockpitBadge>
                    )}
                  </div>
                </div>
                <div
                  style={{
                    height: 24,
                    background: 'rgba(156, 156, 156, 0.06)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      height: '100%',
                      width: `${widthPercent}%`,
                      background: isLast
                        ? 'var(--aiox-lime)'
                        : `linear-gradient(90deg, rgba(209, 255, 0, ${0.15 + (i * 0.08)}) 0%, rgba(209, 255, 0, ${0.25 + (i * 0.1)}) 100%)`,
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>
                {i < FUNNEL_DATA.length - 1 && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      padding: '0.2rem 0',
                    }}
                  >
                    <ChevronDown size={14} style={{ color: 'var(--aiox-gray-dim)', opacity: 0.5 }} />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Funnel Summary */}
        <div
          style={{
            marginTop: '1.5rem',
            borderTop: '1px solid rgba(156, 156, 156, 0.1)',
            paddingTop: '1rem',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '1rem',
          }}
        >
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
              Conversão Total
            </span>
            <span
              style={{
                fontFamily: 'var(--font-family-display)',
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'var(--aiox-lime)',
              }}
            >
              2,58%
            </span>
          </div>
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
              Custo por Venda
            </span>
            <span
              style={{
                fontFamily: 'var(--font-family-display)',
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'var(--aiox-cream)',
              }}
            >
              R$ 38,70
            </span>
          </div>
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
              ROAS
            </span>
            <span
              style={{
                fontFamily: 'var(--font-family-display)',
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'var(--aiox-lime)',
              }}
            >
              3,84x
            </span>
          </div>
        </div>
      </CockpitCard>

      {/* Conversion Rate by Step */}
      <CockpitCard accent="left" padding="md">
        <span
          style={{
            fontFamily: 'var(--font-family-mono)',
            fontSize: '0.625rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--aiox-cream)',
            display: 'block',
            marginBottom: '1rem',
          }}
        >
          Taxas de Conversão por Etapa
        </span>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {FUNNEL_DATA.slice(1).map((stage, i) => {
            const prev = FUNNEL_DATA[i]
            const dropoff = prev.value - stage.value
            const dropoffPct = ((dropoff / prev.value) * 100).toFixed(1)

            return (
              <div key={stage.label} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-family-mono)',
                    fontSize: '0.55rem',
                    color: 'var(--aiox-gray-muted)',
                    width: 140,
                    flexShrink: 0,
                  }}
                >
                  {prev.label} → {stage.label}
                </span>
                <CockpitProgress
                  value={stage.rate || 0}
                  size="sm"
                  variant={
                    (stage.rate || 0) >= 50
                      ? 'success'
                      : (stage.rate || 0) >= 20
                        ? 'warning'
                        : 'error'
                  }
                  style={{ flex: 1 }}
                />
                <span
                  style={{
                    fontFamily: 'var(--font-family-mono)',
                    fontSize: '0.55rem',
                    color: 'var(--aiox-gray-dim)',
                    width: 50,
                    textAlign: 'right',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {stage.rate}%
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-family-mono)',
                    fontSize: '0.5rem',
                    color: 'var(--color-status-error)',
                    width: 80,
                    textAlign: 'right',
                    opacity: 0.7,
                  }}
                >
                  -{dropoff.toLocaleString('pt-BR')} ({dropoffPct}%)
                </span>
              </div>
            )
          })}
        </div>
      </CockpitCard>
    </div>
  )
}
