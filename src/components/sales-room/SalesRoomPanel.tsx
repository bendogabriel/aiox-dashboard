'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  ShoppingCart,
  Phone,
  Headphones,
  MessageSquare,
  Clock,
  Users,
  TrendingUp,
  Zap,
  CheckCircle2,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Send,
  Bot,
  User,
  Radio,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ─────────────────────────────────────────────

type AgentStatus = 'atendendo' | 'ocioso' | 'recuperando-carrinho' | 'follow-up' | 'pausado';
type LeadTemperature = 'hot' | 'warm' | 'cold';
type MessageDirection = 'agent' | 'lead';
type ActivityType = 'message-sent' | 'message-received' | 'cart-recovered' | 'lead-qualified' | 'sale-closed' | 'follow-up-scheduled' | 'lead-lost';

interface Message {
  id: string;
  direction: MessageDirection;
  text: string;
  timestamp: Date;
}

interface Lead {
  id: string;
  name: string;
  phone: string;
  temperature: LeadTemperature;
  source: string;
  cartValue?: number;
  product?: string;
}

interface SalesAgent {
  id: string;
  name: string;
  avatar: string;
  status: AgentStatus;
  currentLead: Lead | null;
  messages: Message[];
  activeConversations: number;
  resolvedToday: number;
  conversionRate: number;
  avgResponseTime: number; // seconds
}

interface ActivityEvent {
  id: string;
  agentId: string;
  agentName: string;
  type: ActivityType;
  description: string;
  timestamp: Date;
  value?: number;
}

interface SalesMetrics {
  activeConversations: number;
  cartsRecovered: number;
  cartRecoveryValue: number;
  avgResponseTime: number;
  conversionRate: number;
  leadsToday: number;
  salesClosed: number;
  totalRevenue: number;
}

// ─── Mock Data ─────────────────────────────────────────

const MOCK_AGENTS: SalesAgent[] = [
  {
    id: 'agent-luna',
    name: 'Luna',
    avatar: 'L',
    status: 'atendendo',
    activeConversations: 3,
    resolvedToday: 12,
    conversionRate: 68,
    avgResponseTime: 8,
    currentLead: {
      id: 'lead-1',
      name: 'Maria Silva',
      phone: '(11) 99876-5432',
      temperature: 'hot',
      source: 'Instagram',
      cartValue: 347.90,
      product: 'Kit Skincare Premium',
    },
    messages: [
      { id: 'm1', direction: 'lead', text: 'Oi, vi o kit de skincare no Instagram, ainda tem?', timestamp: new Date(Date.now() - 180000) },
      { id: 'm2', direction: 'agent', text: 'Oi Maria! Sim, temos sim! O Kit Skincare Premium esta com 15% OFF hoje. Posso te ajudar com mais detalhes?', timestamp: new Date(Date.now() - 150000) },
      { id: 'm3', direction: 'lead', text: 'Qual o preco com desconto?', timestamp: new Date(Date.now() - 120000) },
      { id: 'm4', direction: 'agent', text: 'Com o desconto fica R$ 347,90 (de R$ 409,00). E o frete e gratis pra SP! Quer que eu reserve pra voce?', timestamp: new Date(Date.now() - 60000) },
    ],
  },
  {
    id: 'agent-kai',
    name: 'Kai',
    avatar: 'K',
    status: 'recuperando-carrinho',
    activeConversations: 2,
    resolvedToday: 8,
    conversionRate: 55,
    avgResponseTime: 12,
    currentLead: {
      id: 'lead-2',
      name: 'Joao Mendes',
      phone: '(21) 98765-1234',
      temperature: 'warm',
      source: 'Site',
      cartValue: 892.00,
      product: 'Combo Suplementos 90 dias',
    },
    messages: [
      { id: 'm5', direction: 'agent', text: 'Oi Joao! Vi que voce deixou o Combo Suplementos 90 dias no carrinho. Posso te ajudar com alguma duvida?', timestamp: new Date(Date.now() - 300000) },
      { id: 'm6', direction: 'lead', text: 'Ah sim, achei um pouco caro', timestamp: new Date(Date.now() - 240000) },
      { id: 'm7', direction: 'agent', text: 'Entendo! Tenho um cupom especial VOLTA10 que da 10% de desconto. Fica R$ 802,80 e parcela em ate 6x sem juros!', timestamp: new Date(Date.now() - 200000) },
    ],
  },
  {
    id: 'agent-neo',
    name: 'Neo',
    avatar: 'N',
    status: 'follow-up',
    activeConversations: 1,
    resolvedToday: 15,
    conversionRate: 72,
    avgResponseTime: 6,
    currentLead: {
      id: 'lead-3',
      name: 'Ana Costa',
      phone: '(31) 97654-3210',
      temperature: 'warm',
      source: 'WhatsApp',
      product: 'Plano Anual Fitness',
    },
    messages: [
      { id: 'm8', direction: 'agent', text: 'Oi Ana! Tudo bem? Passando pra saber se voce pensou sobre o Plano Anual Fitness que conversamos ontem.', timestamp: new Date(Date.now() - 60000) },
    ],
  },
  {
    id: 'agent-aria',
    name: 'Aria',
    avatar: 'A',
    status: 'ocioso',
    activeConversations: 0,
    resolvedToday: 10,
    conversionRate: 61,
    avgResponseTime: 9,
    currentLead: null,
    messages: [],
  },
  {
    id: 'agent-rex',
    name: 'Rex',
    avatar: 'R',
    status: 'atendendo',
    activeConversations: 4,
    resolvedToday: 18,
    conversionRate: 75,
    avgResponseTime: 5,
    currentLead: {
      id: 'lead-4',
      name: 'Carlos Ferreira',
      phone: '(41) 96543-2109',
      temperature: 'hot',
      source: 'Facebook Ads',
      cartValue: 1250.00,
      product: 'Curso Completo Marketing Digital',
    },
    messages: [
      { id: 'm9', direction: 'lead', text: 'Vi o anuncio do curso, quero saber mais', timestamp: new Date(Date.now() - 90000) },
      { id: 'm10', direction: 'agent', text: 'Oi Carlos! Otima escolha! O Curso Completo de Marketing Digital tem 120h de conteudo + mentoria ao vivo. Quer que eu envie o conteudo programatico?', timestamp: new Date(Date.now() - 45000) },
      { id: 'm11', direction: 'lead', text: 'Sim, manda!', timestamp: new Date(Date.now() - 20000) },
    ],
  },
  {
    id: 'agent-zara',
    name: 'Zara',
    avatar: 'Z',
    status: 'pausado',
    activeConversations: 0,
    resolvedToday: 6,
    conversionRate: 58,
    avgResponseTime: 11,
    currentLead: null,
    messages: [],
  },
];

const MOCK_ACTIVITIES: ActivityEvent[] = [
  { id: 'a1', agentId: 'agent-rex', agentName: 'Rex', type: 'sale-closed', description: 'Venda fechada: Curso Basico SEO - R$ 497,00', timestamp: new Date(Date.now() - 30000), value: 497.00 },
  { id: 'a2', agentId: 'agent-kai', agentName: 'Kai', type: 'cart-recovered', description: 'Carrinho recuperado: Combo Vitaminas - R$ 234,50', timestamp: new Date(Date.now() - 120000), value: 234.50 },
  { id: 'a3', agentId: 'agent-luna', agentName: 'Luna', type: 'lead-qualified', description: 'Lead qualificado: Maria Silva (Instagram)', timestamp: new Date(Date.now() - 180000) },
  { id: 'a4', agentId: 'agent-neo', agentName: 'Neo', type: 'follow-up-scheduled', description: 'Follow-up agendado: Ana Costa - amanha 14h', timestamp: new Date(Date.now() - 300000) },
  { id: 'a5', agentId: 'agent-rex', agentName: 'Rex', type: 'message-sent', description: 'Mensagem enviada para Carlos Ferreira', timestamp: new Date(Date.now() - 45000) },
  { id: 'a6', agentId: 'agent-aria', agentName: 'Aria', type: 'sale-closed', description: 'Venda fechada: Pack Consultoria - R$ 1.890,00', timestamp: new Date(Date.now() - 600000), value: 1890.00 },
  { id: 'a7', agentId: 'agent-luna', agentName: 'Luna', type: 'message-received', description: 'Nova mensagem de Maria Silva', timestamp: new Date(Date.now() - 120000) },
  { id: 'a8', agentId: 'agent-kai', agentName: 'Kai', type: 'lead-lost', description: 'Lead perdido: Pedro Santos (sem resposta 48h)', timestamp: new Date(Date.now() - 900000) },
];

const MOCK_METRICS: SalesMetrics = {
  activeConversations: 10,
  cartsRecovered: 7,
  cartRecoveryValue: 3421.50,
  avgResponseTime: 8,
  conversionRate: 64,
  leadsToday: 47,
  salesClosed: 14,
  totalRevenue: 12847.90,
};

// ─── Helpers ───────────────────────────────────────────

const STATUS_CONFIG: Record<AgentStatus, { label: string; color: string; bgColor: string; borderColor: string; pulse?: boolean }> = {
  'atendendo': { label: 'Atendendo', color: '#4ADE80', bgColor: 'rgba(74,222,128,0.12)', borderColor: 'rgba(74,222,128,0.3)', pulse: true },
  'recuperando-carrinho': { label: 'Recuperando Carrinho', color: '#0099FF', bgColor: 'rgba(0,153,255,0.12)', borderColor: 'rgba(0,153,255,0.3)', pulse: true },
  'follow-up': { label: 'Follow-up', color: '#f59e0b', bgColor: 'rgba(245,158,11,0.12)', borderColor: 'rgba(245,158,11,0.3)' },
  'ocioso': { label: 'Disponivel', color: '#999999', bgColor: 'rgba(153,153,153,0.12)', borderColor: 'rgba(153,153,153,0.3)' },
  'pausado': { label: 'Pausado', color: '#696969', bgColor: 'rgba(105,105,105,0.12)', borderColor: 'rgba(105,105,105,0.3)' },
};

const TEMP_CONFIG: Record<LeadTemperature, { label: string; color: string; icon: typeof Zap }> = {
  hot: { label: 'Quente', color: '#EF4444', icon: Zap },
  warm: { label: 'Morno', color: '#f59e0b', icon: TrendingUp },
  cold: { label: 'Frio', color: '#0099FF', icon: ArrowDown },
};

const ACTIVITY_CONFIG: Record<ActivityType, { icon: typeof Zap; color: string; bgColor: string }> = {
  'message-sent': { icon: Send, color: '#0099FF', bgColor: 'rgba(0,153,255,0.12)' },
  'message-received': { icon: MessageSquare, color: '#4ADE80', bgColor: 'rgba(74,222,128,0.12)' },
  'cart-recovered': { icon: ShoppingCart, color: '#D1FF00', bgColor: 'rgba(209,255,0,0.12)' },
  'lead-qualified': { icon: CheckCircle2, color: '#4ADE80', bgColor: 'rgba(74,222,128,0.12)' },
  'sale-closed': { icon: Zap, color: '#D1FF00', bgColor: 'rgba(209,255,0,0.15)' },
  'follow-up-scheduled': { icon: Clock, color: '#f59e0b', bgColor: 'rgba(245,158,11,0.12)' },
  'lead-lost': { icon: AlertCircle, color: '#EF4444', bgColor: 'rgba(239,68,68,0.12)' },
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h`;
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ─── Sub-components ────────────────────────────────────

function KpiCard({ icon: Icon, label, value, subtitle, color, trend }: {
  icon: typeof Zap;
  label: string;
  value: string;
  subtitle?: string;
  color: string;
  trend?: { value: number; positive: boolean };
}) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-none border"
      style={{
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderColor: 'rgba(255,255,255,0.06)',
      }}
    >
      <div
        className="flex items-center justify-center h-9 w-9 rounded-none"
        style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)` }}
      >
        <Icon className="h-4 w-4" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-detail text-[var(--text-muted)] truncate">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-lg font-light tabular-nums" style={{ color: 'var(--text-primary)' }}>
            {value}
          </p>
          {trend && (
            <span
              className="flex items-center gap-0.5 text-detail"
              style={{ color: trend.positive ? '#4ADE80' : '#EF4444' }}
            >
              {trend.positive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {trend.value}%
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-[10px] text-[var(--text-muted)] truncate">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

function AgentCard({ agent, isSelected, onClick }: {
  agent: SalesAgent;
  isSelected: boolean;
  onClick: () => void;
}) {
  const statusCfg = STATUS_CONFIG[agent.status];
  const lead = agent.currentLead;
  const lastMessage = agent.messages[agent.messages.length - 1];

  return (
    <motion.button
      layout
      onClick={onClick}
      className={cn(
        'w-full text-left px-4 py-3 border transition-all cursor-pointer rounded-none',
        isSelected && 'ring-1 ring-[rgba(209,255,0,0.2)]'
      )}
      style={{
        backgroundColor: isSelected ? 'rgba(209,255,0,0.05)' : 'rgba(255,255,255,0.02)',
        borderColor: isSelected ? 'rgba(209,255,0,0.3)' : 'rgba(255,255,255,0.06)',
      }}
      whileHover={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
    >
      {/* Agent Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="relative flex items-center justify-center h-8 w-8 rounded-none text-sm font-medium"
            style={{
              backgroundColor: statusCfg.bgColor,
              color: statusCfg.color,
              border: `1px solid ${statusCfg.borderColor}`,
            }}
          >
            {agent.avatar}
            {statusCfg.pulse && (
              <span
                className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full animate-pulse"
                style={{ backgroundColor: statusCfg.color }}
              />
            )}
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{agent.name}</p>
            <span
              className="text-detail px-1.5 py-0.5 rounded-none"
              style={{
                backgroundColor: statusCfg.bgColor,
                color: statusCfg.color,
                border: `1px solid ${statusCfg.borderColor}`,
              }}
            >
              {statusCfg.label}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-detail tabular-nums" style={{ color: 'var(--text-muted)' }}>
            {agent.activeConversations} ativas
          </p>
          <p className="text-detail tabular-nums" style={{ color: '#4ADE80' }}>
            {agent.conversionRate}% conv.
          </p>
        </div>
      </div>

      {/* Lead Info */}
      {lead && (
        <div
          className="px-3 py-2 mb-2 rounded-none"
          style={{
            backgroundColor: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {lead.name}
            </span>
            {lead.temperature && (
              <span
                className="flex items-center gap-1 text-detail"
                style={{ color: TEMP_CONFIG[lead.temperature].color }}
              >
                {(() => { const TempIcon = TEMP_CONFIG[lead.temperature].icon; return <TempIcon className="h-3 w-3" />; })()}
                {TEMP_CONFIG[lead.temperature].label}
              </span>
            )}
          </div>
          {lead.product && (
            <p className="text-detail truncate" style={{ color: 'var(--text-muted)' }}>
              {lead.product}
            </p>
          )}
          {lead.cartValue && (
            <p className="text-sm font-medium mt-1" style={{ color: '#D1FF00' }}>
              {formatCurrency(lead.cartValue)}
            </p>
          )}
        </div>
      )}

      {/* Last Message Preview */}
      {lastMessage && (
        <div className="flex items-start gap-2">
          {lastMessage.direction === 'agent' ? (
            <Bot className="h-3 w-3 mt-0.5 flex-shrink-0" style={{ color: '#0099FF' }} />
          ) : (
            <User className="h-3 w-3 mt-0.5 flex-shrink-0" style={{ color: '#999' }} />
          )}
          <p className="text-detail leading-relaxed line-clamp-2" style={{ color: 'var(--text-muted)' }}>
            {lastMessage.text}
          </p>
          <span className="text-[10px] flex-shrink-0 tabular-nums" style={{ color: 'var(--text-muted)' }}>
            {timeAgo(lastMessage.timestamp)}
          </span>
        </div>
      )}

      {/* Stats Footer */}
      <div className="flex items-center gap-3 mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <span className="text-detail tabular-nums" style={{ color: 'var(--text-muted)' }}>
          <Clock className="h-3 w-3 inline mr-1" />{agent.avgResponseTime}s
        </span>
        <span className="text-detail tabular-nums" style={{ color: 'var(--text-muted)' }}>
          <CheckCircle2 className="h-3 w-3 inline mr-1" />{agent.resolvedToday} hoje
        </span>
      </div>
    </motion.button>
  );
}

function ConversationView({ agent }: { agent: SalesAgent }) {
  const statusCfg = STATUS_CONFIG[agent.status];

  if (!agent.currentLead) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3" style={{ color: 'var(--text-muted)' }}>
        <Headphones className="h-10 w-10 opacity-30" />
        <p className="text-sm">Agente disponivel, sem conversa ativa</p>
      </div>
    );
  }

  const lead = agent.currentLead;

  return (
    <div className="flex flex-col h-full">
      {/* Conversation Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center h-10 w-10 rounded-none text-sm font-bold"
            style={{
              backgroundColor: statusCfg.bgColor,
              color: statusCfg.color,
              border: `1px solid ${statusCfg.borderColor}`,
            }}
          >
            {agent.avatar}
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {agent.name} <span style={{ color: 'var(--text-muted)' }}>atendendo</span> {lead.name}
            </p>
            <div className="flex items-center gap-3 text-detail" style={{ color: 'var(--text-muted)' }}>
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" /> {lead.phone}
              </span>
              <span>{lead.source}</span>
              {lead.temperature && (
                <span
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded-none"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${TEMP_CONFIG[lead.temperature].color} 15%, transparent)`,
                    color: TEMP_CONFIG[lead.temperature].color,
                    border: `1px solid color-mix(in srgb, ${TEMP_CONFIG[lead.temperature].color} 30%, transparent)`,
                  }}
                >
                  {TEMP_CONFIG[lead.temperature].label}
                </span>
              )}
            </div>
          </div>
        </div>
        {lead.cartValue && (
          <div className="text-right">
            <p className="text-detail" style={{ color: 'var(--text-muted)' }}>Valor do carrinho</p>
            <p className="text-lg font-light" style={{ color: '#D1FF00' }}>
              {formatCurrency(lead.cartValue)}
            </p>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        <AnimatePresence initial={false}>
          {agent.messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'flex gap-2 max-w-[85%]',
                msg.direction === 'agent' ? 'ml-auto flex-row-reverse' : ''
              )}
            >
              <div
                className="flex items-center justify-center h-6 w-6 rounded-none flex-shrink-0 mt-1"
                style={{
                  backgroundColor: msg.direction === 'agent'
                    ? 'rgba(0,153,255,0.15)'
                    : 'rgba(153,153,153,0.15)',
                }}
              >
                {msg.direction === 'agent'
                  ? <Bot className="h-3 w-3" style={{ color: '#0099FF' }} />
                  : <User className="h-3 w-3" style={{ color: '#999' }} />
                }
              </div>
              <div>
                <div
                  className="px-3 py-2 text-sm leading-relaxed rounded-none"
                  style={{
                    backgroundColor: msg.direction === 'agent'
                      ? 'rgba(0,153,255,0.08)'
                      : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${msg.direction === 'agent'
                      ? 'rgba(0,153,255,0.2)'
                      : 'rgba(255,255,255,0.06)'}`,
                    color: 'var(--text-secondary)',
                  }}
                >
                  {msg.text}
                </div>
                <p className="text-[10px] mt-1 tabular-nums" style={{ color: 'var(--text-muted)' }}>
                  {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Typing indicator */}
      {agent.status === 'atendendo' && (
        <div
          className="px-4 py-2 border-t flex items-center gap-2"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-1">
            <motion.span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: '#0099FF' }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.2, delay: 0 }}
            />
            <motion.span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: '#0099FF' }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }}
            />
            <motion.span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: '#0099FF' }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.2, delay: 0.4 }}
            />
          </div>
          <span className="text-detail" style={{ color: 'var(--text-muted)' }}>
            {agent.name} esta digitando...
          </span>
        </div>
      )}
    </div>
  );
}

function ActivityTimeline({ activities }: { activities: ActivityEvent[] }) {
  return (
    <div className="space-y-1">
      {activities.map((activity) => {
        const cfg = ACTIVITY_CONFIG[activity.type];
        const Icon = cfg.icon;
        return (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 px-3 py-2 rounded-none transition-colors"
            style={{ backgroundColor: 'transparent' }}
            whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
          >
            <div
              className="flex items-center justify-center h-6 w-6 rounded-none flex-shrink-0"
              style={{ backgroundColor: cfg.bgColor }}
            >
              <Icon className="h-3 w-3" style={{ color: cfg.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
                <span style={{ color: cfg.color }} className="font-medium">{activity.agentName}</span>
                {' '}{activity.description.replace(activity.agentName, '').replace(/^[\s-]+/, '')}
              </p>
            </div>
            {activity.value && (
              <span className="text-sm font-medium tabular-nums flex-shrink-0" style={{ color: '#D1FF00' }}>
                {formatCurrency(activity.value)}
              </span>
            )}
            <span className="text-detail tabular-nums flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
              {timeAgo(activity.timestamp)}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────

interface SalesRoomPanelProps {
  className?: string;
}

export const SalesRoomPanel = memo(function SalesRoomPanel({ className }: SalesRoomPanelProps) {
  const [selectedAgentId, setSelectedAgentId] = useState<string>(MOCK_AGENTS[0].id);
  const [agents] = useState<SalesAgent[]>(MOCK_AGENTS);
  const [activities] = useState<ActivityEvent[]>(MOCK_ACTIVITIES);
  const [metrics] = useState<SalesMetrics>(MOCK_METRICS);
  const [liveTime, setLiveTime] = useState(0);

  const selectedAgent = agents.find((a) => a.id === selectedAgentId) || agents[0];

  // Live clock tick
  useEffect(() => {
    const interval = setInterval(() => setLiveTime((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={cn('flex flex-col h-full', className)} style={{ backgroundColor: 'var(--bg-base)' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-3">
          <Eye className="h-4 w-4" style={{ color: '#D1FF00' }} />
          <div>
            <h2 className="text-sm font-light" style={{ color: 'var(--text-primary)' }}>
              Sala de Observacao
            </h2>
            <span className="text-detail" style={{ color: 'var(--text-muted)' }}>
              Monitoramento em tempo real dos agentes de vendas
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <motion.span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: '#4ADE80' }}
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
            <span className="text-detail font-medium" style={{ color: '#4ADE80' }}>
              LIVE
            </span>
          </div>
          <span className="text-detail tabular-nums" style={{ color: 'var(--text-muted)' }}>
            {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
      </div>

      {/* KPIs */}
      <div
        className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-px border-b"
        style={{
          borderColor: 'rgba(255,255,255,0.06)',
          backgroundColor: 'rgba(255,255,255,0.04)',
        }}
      >
        <KpiCard
          icon={MessageSquare}
          label="Conversas Ativas"
          value={String(metrics.activeConversations)}
          color="#0099FF"
          trend={{ value: 12, positive: true }}
        />
        <KpiCard
          icon={ShoppingCart}
          label="Carrinhos Recuperados"
          value={String(metrics.cartsRecovered)}
          subtitle={formatCurrency(metrics.cartRecoveryValue)}
          color="#D1FF00"
          trend={{ value: 23, positive: true }}
        />
        <KpiCard
          icon={Clock}
          label="Tempo Medio Resposta"
          value={`${metrics.avgResponseTime}s`}
          color="#f59e0b"
          trend={{ value: 5, positive: true }}
        />
        <KpiCard
          icon={TrendingUp}
          label="Taxa Conversao"
          value={`${metrics.conversionRate}%`}
          color="#4ADE80"
          trend={{ value: 3, positive: true }}
        />
        <KpiCard
          icon={Users}
          label="Leads Hoje"
          value={String(metrics.leadsToday)}
          color="#999999"
        />
        <KpiCard
          icon={Zap}
          label="Vendas Fechadas"
          value={String(metrics.salesClosed)}
          color="#D1FF00"
        />
        <KpiCard
          icon={Radio}
          label="Agentes Online"
          value={`${agents.filter((a) => a.status !== 'pausado').length}/${agents.length}`}
          color="#4ADE80"
        />
        <KpiCard
          icon={TrendingUp}
          label="Receita Hoje"
          value={formatCurrency(metrics.totalRevenue)}
          color="#D1FF00"
          trend={{ value: 18, positive: true }}
        />
      </div>

      {/* Main Content: Agent List + Conversation + Activity */}
      <div className="flex-1 flex overflow-hidden">
        {/* Agent List (Left) */}
        <div
          className="w-80 flex-shrink-0 border-r overflow-y-auto"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div className="px-4 py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            <p className="text-detail font-medium" style={{ color: 'var(--text-muted)' }}>
              AGENTES ({agents.length})
            </p>
          </div>
          <div className="p-2 space-y-1">
            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                isSelected={agent.id === selectedAgentId}
                onClick={() => setSelectedAgentId(agent.id)}
              />
            ))}
          </div>
        </div>

        {/* Conversation (Center) */}
        <div className="flex-1 flex flex-col min-w-0">
          <ConversationView agent={selectedAgent} />
        </div>

        {/* Activity Timeline (Right) */}
        <div
          className="w-80 flex-shrink-0 border-l overflow-y-auto"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div className="px-4 py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            <p className="text-detail font-medium" style={{ color: 'var(--text-muted)' }}>
              ATIVIDADE RECENTE
            </p>
          </div>
          <div className="py-1">
            <ActivityTimeline activities={activities} />
          </div>
        </div>
      </div>

      {/* Footer Status Bar */}
      <div
        className="px-4 py-2 border-t flex items-center justify-between"
        style={{
          borderColor: 'rgba(255,255,255,0.06)',
          backgroundColor: 'rgba(255,255,255,0.02)',
        }}
      >
        <div className="flex items-center gap-4 text-detail" style={{ color: 'var(--text-muted)' }}>
          <span>
            <strong style={{ color: '#4ADE80' }}>{agents.filter((a) => a.status === 'atendendo' || a.status === 'recuperando-carrinho').length}</strong> atendendo
          </span>
          <span>
            <strong style={{ color: '#f59e0b' }}>{agents.filter((a) => a.status === 'follow-up').length}</strong> follow-up
          </span>
          <span>
            <strong style={{ color: '#999' }}>{agents.filter((a) => a.status === 'ocioso').length}</strong> disponiveis
          </span>
        </div>
        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          Dados atualizados em tempo real
        </span>
      </div>
    </div>
  );
});
