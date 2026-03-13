/**
 * Marketing Hub API service.
 * Fetches traffic, analytics, and campaign data from the Engine API.
 */

const ENGINE_URL = import.meta.env.VITE_ENGINE_URL || 'http://localhost:4002';

interface TrafficDashboardResponse {
  source: 'live' | 'demo';
  datePreset: string;
  meta: MetaDashboard;
  google: GoogleDashboard;
  errors?: { meta?: string | null; google?: string | null };
}

export interface MetaDashboard {
  account: { name: string; currency: string };
  summary: MetaSummary;
  campaigns: MetaCampaign[];
}

export interface MetaSummary {
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  conversions: number;
  cpa: number;
  revenue: number;
  roas: number;
}

export interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  spend: number;
  roas: number;
  conversions: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
}

export interface GoogleDashboard {
  account: { name: string; currency: string };
  summary: GoogleSummary;
  campaigns: GoogleCampaign[];
}

export interface GoogleSummary {
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  conversions: number;
  cpa: number;
}

export interface GoogleCampaign {
  id: string;
  name: string;
  status: string;
  spend: number;
  conversions: number;
  ctr: number;
  cpc: number;
  qualityScore?: number;
}

export interface GA4Report {
  sessions: number;
  users: number;
  newUsers: number;
  bounceRate: number;
  avgSessionDuration: number;
  pagesPerSession: number;
  topPages: { page: string; sessions: number; bounceRate: number }[];
  trafficSources: { source: string; sessions: number; conversions: number }[];
}

// ── Unified KPI type ─────────────────────────────────────────

export interface TrafficKpi {
  key: string;
  label: string;
  value: number;
  formatted: string;
  change?: string;
  trend: 'up' | 'down' | 'neutral';
  category: 'investment' | 'reach' | 'engagement' | 'conversion' | 'revenue';
}

// ── API calls ────────────────────────────────────────────────

export async function fetchTrafficDashboard(datePreset = 'last_14d'): Promise<TrafficDashboardResponse> {
  const res = await fetch(`${ENGINE_URL}/marketing/traffic/dashboard?datePreset=${datePreset}`);
  if (!res.ok) throw new Error(`Engine error: ${res.status}`);
  return res.json();
}

export async function fetchMetaCampaigns(datePreset = 'last_14d'): Promise<{ source: string; campaigns: MetaCampaign[] }> {
  const res = await fetch(`${ENGINE_URL}/marketing/traffic/meta/campaigns?datePreset=${datePreset}`);
  if (!res.ok) throw new Error(`Engine error: ${res.status}`);
  return res.json();
}

export async function fetchGoogleCampaigns(): Promise<{ source: string; campaigns: GoogleCampaign[] }> {
  const res = await fetch(`${ENGINE_URL}/marketing/traffic/google/campaigns`);
  if (!res.ok) throw new Error(`Engine error: ${res.status}`);
  return res.json();
}

export async function fetchGA4Report(start?: string, end?: string): Promise<{ source: string; report: GA4Report }> {
  const params = new URLSearchParams();
  if (start) params.set('start', start);
  if (end) params.set('end', end);
  const qs = params.toString() ? `?${params}` : '';
  const res = await fetch(`${ENGINE_URL}/marketing/traffic/ga4/report${qs}`);
  if (!res.ok) throw new Error(`Engine error: ${res.status}`);
  return res.json();
}

export async function fetchGA4Realtime(): Promise<{ source: string; realtime: { activeUsers: number } }> {
  const res = await fetch(`${ENGINE_URL}/marketing/traffic/ga4/realtime`);
  if (!res.ok) throw new Error(`Engine error: ${res.status}`);
  return res.json();
}

export async function updateCampaignStatus(id: string, status: string): Promise<{ ok: boolean }> {
  const res = await fetch(`${ENGINE_URL}/marketing/traffic/meta/campaign/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, status }),
  });
  if (!res.ok) throw new Error(`Engine error: ${res.status}`);
  return res.json();
}

// ── KPI derivation ───────────────────────────────────────────

export function deriveKpis(meta: MetaSummary, google: GoogleSummary): TrafficKpi[] {
  const totalSpend = meta.spend + google.spend;
  const totalImpressions = meta.impressions + google.impressions;
  const totalClicks = meta.clicks + google.clicks;
  const totalConversions = meta.conversions + google.conversions;
  const totalRevenue = meta.revenue;
  const overallCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const overallCpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
  const overallCpm = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;
  const overallCpa = totalConversions > 0 ? totalSpend / totalConversions : 0;
  const overallRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

  return [
    { key: 'spend', label: 'Investimento', value: totalSpend, formatted: `R$ ${fmt(totalSpend)}`, trend: 'neutral', category: 'investment' },
    { key: 'impressions', label: 'Impressoes', value: totalImpressions, formatted: fmtLarge(totalImpressions), trend: 'up', category: 'reach' },
    { key: 'clicks', label: 'Cliques', value: totalClicks, formatted: fmtLarge(totalClicks), trend: 'up', category: 'engagement' },
    { key: 'ctr', label: 'CTR', value: overallCtr, formatted: `${overallCtr.toFixed(2)}%`, trend: overallCtr > 1.5 ? 'up' : 'down', category: 'engagement' },
    { key: 'cpc', label: 'CPC', value: overallCpc, formatted: `R$ ${overallCpc.toFixed(2)}`, trend: overallCpc < 0.5 ? 'up' : 'neutral', category: 'investment' },
    { key: 'cpm', label: 'CPM', value: overallCpm, formatted: `R$ ${overallCpm.toFixed(2)}`, trend: 'neutral', category: 'investment' },
    { key: 'conversions', label: 'Conversoes', value: totalConversions, formatted: fmtLarge(totalConversions), trend: 'up', category: 'conversion' },
    { key: 'cpa', label: 'CPA', value: overallCpa, formatted: `R$ ${overallCpa.toFixed(2)}`, trend: overallCpa < 15 ? 'up' : 'down', category: 'conversion' },
    { key: 'roas', label: 'ROAS', value: overallRoas, formatted: `${overallRoas.toFixed(1)}x`, trend: overallRoas > 3 ? 'up' : overallRoas > 1 ? 'neutral' : 'down', category: 'revenue' },
    { key: 'revenue', label: 'Receita', value: totalRevenue, formatted: `R$ ${fmt(totalRevenue)}`, trend: 'up', category: 'revenue' },
    { key: 'metaSpend', label: 'Meta Spend', value: meta.spend, formatted: `R$ ${fmt(meta.spend)}`, trend: 'neutral', category: 'investment' },
    { key: 'googleSpend', label: 'Google Spend', value: google.spend, formatted: `R$ ${fmt(google.spend)}`, trend: 'neutral', category: 'investment' },
  ];
}

// ── Helpers ──────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toFixed(2);
}

function fmtLarge(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}
