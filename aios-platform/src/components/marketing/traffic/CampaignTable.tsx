import { useState } from 'react';
import { ArrowUpDown, Pause, Play } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  platform: 'Meta' | 'Google';
  spend: number;
  roas: number;
  conversions: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
}

interface CampaignTableProps {
  campaigns: Campaign[];
}

type SortKey = 'name' | 'spend' | 'roas' | 'conversions' | 'ctr' | 'cpc';

const COLUMNS: { key: SortKey | 'platform' | 'status'; label: string; sortable: boolean }[] = [
  { key: 'name', label: 'Campanha', sortable: true },
  { key: 'platform', label: 'Plataforma', sortable: false },
  { key: 'status', label: 'Status', sortable: false },
  { key: 'spend', label: 'Investimento', sortable: true },
  { key: 'ctr', label: 'CTR', sortable: true },
  { key: 'cpc', label: 'CPC', sortable: true },
  { key: 'roas', label: 'ROAS', sortable: true },
  { key: 'conversions', label: 'Conversoes', sortable: true },
];

function isActiveStatus(status: string): boolean {
  return ['ACTIVE', 'ENABLED', 'Ativo'].includes(status);
}

export function CampaignTable({ campaigns }: CampaignTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('spend');
  const [sortDesc, setSortDesc] = useState(true);
  const [filterPlatform, setFilterPlatform] = useState<'all' | 'Meta' | 'Google'>('all');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDesc(!sortDesc);
    } else {
      setSortKey(key);
      setSortDesc(true);
    }
  };

  const filtered = filterPlatform === 'all'
    ? campaigns
    : campaigns.filter((c) => c.platform === filterPlatform);

  const sorted = [...filtered].sort((a, b) => {
    const av = a[sortKey] ?? 0;
    const bv = b[sortKey] ?? 0;
    if (typeof av === 'string' && typeof bv === 'string') {
      return sortDesc ? bv.localeCompare(av) : av.localeCompare(bv);
    }
    return sortDesc ? (bv as number) - (av as number) : (av as number) - (bv as number);
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3
          style={{
            fontFamily: 'var(--font-family-mono)',
            fontSize: '0.6rem',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: 'var(--aiox-gray-muted)',
          }}
        >
          Campanhas ({sorted.length})
        </h3>

        {/* Platform filter */}
        <div className="flex items-center gap-1">
          {(['all', 'Meta', 'Google'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setFilterPlatform(p)}
              className="px-2 py-1 text-xs font-mono uppercase tracking-wider transition-all"
              style={{
                color: filterPlatform === p ? 'var(--aiox-cream)' : 'var(--aiox-gray-dim)',
                background: filterPlatform === p ? 'rgba(209, 255, 0, 0.08)' : 'transparent',
                border: `1px solid ${filterPlatform === p ? 'rgba(209, 255, 0, 0.2)' : 'rgba(156, 156, 156, 0.08)'}`,
              }}
            >
              {p === 'all' ? 'Todas' : p}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ border: '1px solid rgba(156, 156, 156, 0.12)', overflow: 'auto' }}>
        <table className="w-full" style={{ minWidth: 700 }}>
          <thead>
            <tr style={{ background: 'rgba(209, 255, 0, 0.03)', borderBottom: '1px solid rgba(156, 156, 156, 0.12)' }}>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className="text-left px-4 py-2"
                  style={{
                    fontFamily: 'var(--font-family-mono)',
                    fontSize: '0.55rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'var(--aiox-gray-muted)',
                    cursor: col.sortable ? 'pointer' : 'default',
                    userSelect: 'none',
                  }}
                  onClick={() => col.sortable && handleSort(col.key as SortKey)}
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      <ArrowUpDown size={10} style={{ color: 'var(--aiox-lime)' }} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((campaign) => {
              const active = isActiveStatus(campaign.status);
              return (
                <tr
                  key={`${campaign.platform}-${campaign.id}`}
                  style={{ borderBottom: '1px solid rgba(156, 156, 156, 0.06)' }}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  {/* Name */}
                  <td className="px-4 py-2.5" style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.75rem', color: 'var(--aiox-cream)', maxWidth: 260 }}>
                    <span className="block truncate">{campaign.name}</span>
                  </td>

                  {/* Platform */}
                  <td className="px-4 py-2.5">
                    <span
                      style={{
                        fontFamily: 'var(--font-family-mono)',
                        fontSize: '0.6rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: campaign.platform === 'Meta' ? '#0099FF' : '#D1FF00',
                        background: campaign.platform === 'Meta' ? 'rgba(0, 153, 255, 0.1)' : 'rgba(209, 255, 0, 0.1)',
                        padding: '0.15rem 0.5rem',
                      }}
                    >
                      {campaign.platform}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-2.5">
                    <span className="flex items-center gap-1.5">
                      {active ? <Play size={10} style={{ color: 'var(--aiox-lime)' }} /> : <Pause size={10} style={{ color: 'var(--aiox-gray-dim)' }} />}
                      <span
                        style={{
                          fontFamily: 'var(--font-family-mono)',
                          fontSize: '0.6rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: active ? 'var(--aiox-lime)' : 'var(--aiox-gray-dim)',
                        }}
                      >
                        {campaign.status}
                      </span>
                    </span>
                  </td>

                  {/* Spend */}
                  <td className="px-4 py-2.5" style={{ fontFamily: 'var(--font-family-display)', fontSize: '0.85rem', color: 'var(--aiox-cream)' }}>
                    R$ {campaign.spend.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                  </td>

                  {/* CTR */}
                  <td className="px-4 py-2.5" style={{ fontFamily: 'var(--font-family-display)', fontSize: '0.85rem', color: campaign.ctr > 2 ? 'var(--aiox-lime)' : 'var(--aiox-cream)' }}>
                    {campaign.ctr.toFixed(2)}%
                  </td>

                  {/* CPC */}
                  <td className="px-4 py-2.5" style={{ fontFamily: 'var(--font-family-display)', fontSize: '0.85rem', color: 'var(--aiox-cream)' }}>
                    R$ {campaign.cpc.toFixed(2)}
                  </td>

                  {/* ROAS */}
                  <td className="px-4 py-2.5" style={{ fontFamily: 'var(--font-family-display)', fontSize: '0.85rem', color: campaign.roas > 3 ? 'var(--aiox-lime)' : campaign.roas > 0 ? 'var(--aiox-cream)' : 'var(--aiox-gray-dim)' }}>
                    {campaign.roas > 0 ? `${campaign.roas.toFixed(1)}x` : '—'}
                  </td>

                  {/* Conversions */}
                  <td className="px-4 py-2.5" style={{ fontFamily: 'var(--font-family-display)', fontSize: '0.85rem', color: 'var(--aiox-cream)' }}>
                    {campaign.conversions.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
