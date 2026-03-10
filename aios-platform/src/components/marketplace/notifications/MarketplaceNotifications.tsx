/**
 * MarketplaceNotifications — Notification center for marketplace events
 * Story 5.5
 */
import { useState, useEffect, useCallback } from 'react';
import {
  Bell, X, Check, ShoppingCart, Star, Package,
  AlertTriangle, DollarSign, Shield, Clock,
} from 'lucide-react';
import { useToastStore, useToast } from '../../../stores/toastStore';
import { useUIStore } from '../../../stores/uiStore';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';

// --- Marketplace notification types ---
export type MarketplaceEventType =
  | 'order_status_change'
  | 'new_review'
  | 'new_order'
  | 'submission_status'
  | 'payout_completed'
  | 'dispute_opened'
  | 'dispute_update'
  | 'escrow_released';

const EVENT_CONFIG: Record<MarketplaceEventType, {
  icon: typeof Bell;
  toastType: 'success' | 'info' | 'warning' | 'error';
  defaultTitle: string;
}> = {
  order_status_change: { icon: ShoppingCart, toastType: 'info', defaultTitle: 'Status da order atualizado' },
  new_review: { icon: Star, toastType: 'info', defaultTitle: 'Nova avaliacao recebida' },
  new_order: { icon: Package, toastType: 'success', defaultTitle: 'Nova venda!' },
  submission_status: { icon: Shield, toastType: 'info', defaultTitle: 'Status da submissao atualizado' },
  payout_completed: { icon: DollarSign, toastType: 'success', defaultTitle: 'Payout concluido' },
  dispute_opened: { icon: AlertTriangle, toastType: 'warning', defaultTitle: 'Disputa aberta' },
  dispute_update: { icon: AlertTriangle, toastType: 'info', defaultTitle: 'Disputa atualizada' },
  escrow_released: { icon: Clock, toastType: 'success', defaultTitle: 'Escrow liberado' },
};

// --- Notification Badge (for sidebar) ---
export function NotificationBadge() {
  const unreadCount = useToastStore((s) => s.unreadCount);

  if (unreadCount === 0) return null;

  return (
    <span className="
      absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center
      bg-[var(--bb-error,#EF4444)] text-white text-[9px] font-mono font-bold
      px-1
    ">
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  );
}

// --- Notification Center (dropdown panel) ---
export function NotificationCenter({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { notifications, markAllRead, clearNotifications } = useToastStore();
  const setCurrentView = useUIStore((s) => s.setCurrentView);

  if (!isOpen) return null;

  const navigateTo = (view: string) => {
    setCurrentView(view as never);
    onClose();
  };

  return (
    <div className="
      absolute top-full right-0 mt-1 w-80 max-h-96 z-50
      bg-[var(--color-bg-surface,#0a0a0a)]
      border border-[var(--color-border-default,#333)]
      shadow-lg overflow-hidden flex flex-col
    ">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-3 py-2 border-b border-[var(--color-border-default,#333)]">
        <span className="text-xs font-mono uppercase tracking-wider font-semibold text-[var(--color-text-primary,#fff)]">
          Notificacoes
        </span>
        <div className="flex items-center gap-2">
          {notifications.length > 0 && (
            <>
              <button
                type="button"
                onClick={markAllRead}
                className="text-[10px] font-mono text-[var(--color-text-muted,#666)] hover:text-[var(--aiox-lime,#D1FF00)] transition-colors"
                title="Marcar todas como lidas"
              >
                <Check size={12} />
              </button>
              <button
                type="button"
                onClick={clearNotifications}
                className="text-[10px] font-mono text-[var(--color-text-muted,#666)] hover:text-[var(--bb-error,#EF4444)] transition-colors"
                title="Limpar"
              >
                <X size={12} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-8 text-center">
            <Bell size={20} className="mx-auto text-[var(--color-text-muted,#666)] mb-2" />
            <p className="text-xs font-mono text-[var(--color-text-muted,#666)]">
              Nenhuma notificacao
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => navigateTo('marketplace-purchases')}
              className={`
                w-full text-left px-3 py-2.5 border-b border-[var(--color-border-default,#333)]/50
                hover:bg-[var(--color-bg-elevated,#1a1a1a)] transition-colors
                ${!n.read ? 'bg-[var(--aiox-lime,#D1FF00)]/3' : ''}
              `}
            >
              <div className="flex items-start gap-2">
                {!n.read && (
                  <div className="w-1.5 h-1.5 mt-1.5 shrink-0 bg-[var(--aiox-lime,#D1FF00)]" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono text-[var(--color-text-primary,#fff)] truncate">
                    {n.title}
                  </p>
                  {n.message && (
                    <p className="text-[10px] text-[var(--color-text-secondary,#999)] mt-0.5 line-clamp-2">
                      {n.message}
                    </p>
                  )}
                  <p className="text-[9px] font-mono text-[var(--color-text-muted,#666)] mt-1">
                    {formatTimeAgo(n.timestamp)}
                  </p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// --- Supabase Realtime Hook ---
export function useMarketplaceRealtime(userId: string | null) {
  const toast = useToast();

  useEffect(() => {
    if (!userId || !isSupabaseConfigured || !supabase) return;

    // Subscribe to order changes
    const channel = supabase
      .channel('marketplace-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'marketplace_orders',
          filter: `buyer_id=eq.${userId}`,
        },
        (payload) => {
          const newStatus = payload.new?.status as string;
          toast.info('Status da order atualizado', `Order atualizada para: ${newStatus}`);
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'marketplace_reviews',
        },
        (payload) => {
          toast.info('Nova avaliacao recebida', `Rating: ${payload.new?.rating_overall}/5`);
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'marketplace_submissions',
        },
        (payload) => {
          const status = payload.new?.review_status as string;
          if (status === 'approved') {
            toast.success('Submissao aprovada!', 'Seu agente foi publicado no marketplace.');
          } else if (status === 'rejected') {
            toast.error('Submissao rejeitada', 'Verifique o feedback do reviewer.');
          } else if (status === 'needs_changes') {
            toast.warning('Alteracoes solicitadas', 'O reviewer solicitou ajustes.');
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, toast]);
}

// --- Helpers ---
function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'agora';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m atras`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atras`;
  const days = Math.floor(hours / 24);
  return `${days}d atras`;
}
