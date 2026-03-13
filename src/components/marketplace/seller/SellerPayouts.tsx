/**
 * SellerPayouts — Payout dashboard with KPIs and transaction list
 * Story 6.2
 */
import { useState, memo } from 'react';
import {
  DollarSign, TrendingUp, Clock, ExternalLink,
  ArrowUpRight, ArrowDownLeft, Minus, Filter,
} from 'lucide-react';
import { useSellerTransactions } from '../../../hooks/useMarketplaceSeller';
import type { MarketplaceTransaction, TransactionType, TransactionStatus } from '../../../types/marketplace';

// --- KPI Card ---
function PayoutKpi({
  label,
  value,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string;
  icon: typeof DollarSign;
  accent?: boolean;
}) {
  return (
    <div className="p-4 bg-[var(--color-bg-surface,#0a0a0a)] border border-[var(--color-border-default,#333)]">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className={accent ? 'text-[var(--aiox-lime,#D1FF00)]' : 'text-[var(--color-text-muted,#666)]'} />
        <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted,#666)]">
          {label}
        </span>
      </div>
      <p className={`text-xl font-mono font-bold ${accent ? 'text-[var(--aiox-lime,#D1FF00)]' : 'text-[var(--color-text-primary,#fff)]'}`}>
        {value}
      </p>
    </div>
  );
}

// --- Transaction type config ---
const TX_TYPE_CONFIG: Record<TransactionType, { label: string; icon: typeof ArrowUpRight; color: string }> = {
  payment: { label: 'Pagamento', icon: ArrowDownLeft, color: 'text-[var(--status-success,#4ADE80)]' },
  refund: { label: 'Reembolso', icon: ArrowUpRight, color: 'text-[var(--bb-error,#EF4444)]' },
  payout: { label: 'Payout', icon: ArrowUpRight, color: 'text-[var(--aiox-lime,#D1FF00)]' },
  platform_fee: { label: 'Comissao', icon: Minus, color: 'text-[var(--bb-warning,#f59e0b)]' },
  escrow_hold: { label: 'Escrow Hold', icon: Clock, color: 'text-[var(--bb-blue,#0099FF)]' },
  escrow_release: { label: 'Escrow Release', icon: ArrowUpRight, color: 'text-[var(--status-success,#4ADE80)]' },
};

const TX_STATUS_LABELS: Record<TransactionStatus, string> = {
  pending: 'Pendente',
  processing: 'Processando',
  completed: 'Concluido',
  failed: 'Falhou',
  cancelled: 'Cancelado',
};

// --- Transaction Row ---
const TransactionRow = memo(function TransactionRow({ tx }: { tx: MarketplaceTransaction }) {
  const config = TX_TYPE_CONFIG[tx.type] ?? TX_TYPE_CONFIG.payment;
  const Icon = config.icon;

  return (
    <div className="
      flex items-center gap-3 px-3 py-2.5
      bg-[var(--color-bg-surface,#0a0a0a)]
      border border-[var(--color-border-default,#333)]
    ">
      <div className={`w-8 h-8 flex items-center justify-center shrink-0 ${config.color}`}>
        <Icon size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold text-[var(--color-text-primary,#fff)]">
            {config.label}
          </span>
          <span className="text-[10px] font-mono text-[var(--color-text-muted,#666)]">
            {TX_STATUS_LABELS[tx.status]}
          </span>
        </div>
        {tx.description && (
          <p className="text-[10px] text-[var(--color-text-secondary,#999)] truncate mt-0.5">
            {tx.description}
          </p>
        )}
      </div>
      <div className="text-right shrink-0">
        <p className={`text-sm font-mono font-bold ${config.color}`}>
          {tx.type === 'refund' || tx.type === 'platform_fee' ? '-' : '+'}
          {formatCurrency(tx.amount, tx.currency)}
        </p>
        <p className="text-[9px] font-mono text-[var(--color-text-muted,#666)]">
          {new Date(tx.created_at).toLocaleDateString('pt-BR')}
        </p>
      </div>
    </div>
  );
});

// --- Earnings Chart (simplified bar chart) ---
function EarningsChart({ data }: { data: { month: string; amount: number }[] }) {
  const max = Math.max(...data.map((d) => d.amount), 1);

  return (
    <div className="p-4 bg-[var(--color-bg-surface,#0a0a0a)] border border-[var(--color-border-default,#333)]">
      <h3 className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted,#666)] mb-4">
        Earnings (Ultimos 6 Meses)
      </h3>
      <div className="flex items-end gap-2 h-32">
        {data.map((d) => (
          <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[9px] font-mono text-[var(--color-text-muted,#666)]">
              {formatCurrency(d.amount, 'BRL')}
            </span>
            <div
              className="w-full bg-[var(--aiox-lime,#D1FF00)]/20 border border-[var(--aiox-lime,#D1FF00)]/30 relative"
              style={{ height: `${Math.max((d.amount / max) * 100, 4)}%` }}
            >
              <div
                className="absolute bottom-0 w-full bg-[var(--aiox-lime,#D1FF00)]"
                style={{ height: `${Math.max((d.amount / max) * 100, 4)}%` }}
              />
            </div>
            <span className="text-[9px] font-mono text-[var(--color-text-muted,#666)]">
              {d.month}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function SellerPayouts({ sellerId }: { sellerId: string }) {
  const [txTypeFilter, setTxTypeFilter] = useState<TransactionType | 'all'>('all');
  const { data, isLoading } = useSellerTransactions(sellerId);

  const transactions = data?.data ?? [];

  // Filter transactions
  const filtered = txTypeFilter === 'all'
    ? transactions
    : transactions.filter((tx) => tx.type === txTypeFilter);

  // Calculate KPIs
  const totalReceived = transactions
    .filter((tx) => tx.type === 'payout' && tx.status === 'completed')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const pendingEscrow = transactions
    .filter((tx) => tx.type === 'escrow_hold' && tx.status === 'completed')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const totalRefunds = transactions
    .filter((tx) => tx.type === 'refund' && tx.status === 'completed')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const available = totalReceived - totalRefunds;

  // Mock monthly data (in production: aggregate from transactions)
  const monthlyData = generateMonthlyData(transactions);

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <PayoutKpi label="Saldo Disponivel" value={formatCurrency(available, 'BRL')} icon={DollarSign} accent />
        <PayoutKpi label="Total Recebido" value={formatCurrency(totalReceived, 'BRL')} icon={TrendingUp} />
        <PayoutKpi label="Em Escrow" value={formatCurrency(pendingEscrow, 'BRL')} icon={Clock} />
        <PayoutKpi label="Reembolsos" value={formatCurrency(totalRefunds, 'BRL')} icon={ArrowDownLeft} />
      </div>

      {/* Earnings chart */}
      <EarningsChart data={monthlyData} />

      {/* Stripe Express link */}
      <button
        type="button"
        onClick={() => {
          // In production: redirect to Stripe Express Dashboard login link
          console.log('Open Stripe Express Dashboard');
        }}
        className="
          w-full py-2.5 font-mono text-xs uppercase tracking-wider
          border border-[var(--color-border-default,#333)]
          text-[var(--color-text-secondary,#999)]
          hover:text-[var(--color-text-primary,#fff)]
          hover:border-[var(--color-text-muted,#666)]
          transition-colors flex items-center justify-center gap-2
        "
      >
        <ExternalLink size={12} />
        Abrir Stripe Express Dashboard
      </button>

      {/* Transaction filter */}
      <div className="flex items-center gap-2">
        <Filter size={12} className="text-[var(--color-text-muted,#666)]" />
        <div className="flex gap-1 flex-wrap">
          {(['all', 'payment', 'payout', 'refund', 'escrow_hold', 'platform_fee'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setTxTypeFilter(type)}
              className={`
                px-2 py-1 text-[10px] font-mono uppercase tracking-wider transition-colors
                ${txTypeFilter === type
                  ? 'bg-[var(--aiox-lime,#D1FF00)]/10 text-[var(--aiox-lime,#D1FF00)] border border-[var(--aiox-lime,#D1FF00)]/30'
                  : 'text-[var(--color-text-muted,#666)] border border-transparent hover:text-[var(--color-text-secondary,#999)]'
                }
              `}
            >
              {type === 'all' ? 'Todos' : TX_TYPE_CONFIG[type]?.label ?? type}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction list */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-[var(--color-bg-surface,#0a0a0a)] border border-[var(--color-border-default,#333)] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center">
          <DollarSign size={24} className="mx-auto text-[var(--color-text-muted,#666)] mb-2" />
          <p className="text-xs font-mono text-[var(--color-text-muted,#666)] uppercase tracking-wider">
            Nenhuma transacao encontrada
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((tx) => (
            <TransactionRow key={tx.id} tx={tx} />
          ))}
        </div>
      )}
    </div>
  );
}

// --- Helpers ---
function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(amount / 100);
}

function generateMonthlyData(transactions: MarketplaceTransaction[]): { month: string; amount: number }[] {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const now = new Date();
  const result: { month: string; amount: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const amount = transactions
      .filter((tx) => tx.type === 'payout' && tx.status === 'completed' && tx.created_at.startsWith(monthKey))
      .reduce((sum, tx) => sum + tx.amount, 0);
    result.push({ month: months[d.getMonth()], amount });
  }

  return result;
}
