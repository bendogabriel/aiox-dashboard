import { useState, useEffect } from 'react';
import { useToastStore, type Toast, type ToastType } from '../../stores/toastStore';
import { cn } from '../../lib/utils';

// Icons
const SuccessIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const ErrorIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

const WarningIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const InfoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const iconMap: Record<ToastType, React.FC> = {
  success: SuccessIcon,
  error: ErrorIcon,
  warning: WarningIcon,
  info: InfoIcon,
};

const styleMap: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: {
    bg: 'bg-[var(--toast-success-bg)]',
    border: 'border-[var(--toast-success-border)]',
    icon: 'text-[var(--toast-success-text)]',
  },
  error: {
    bg: 'bg-[var(--toast-error-bg)]',
    border: 'border-[var(--toast-error-border)]',
    icon: 'text-[var(--toast-error-text)]',
  },
  warning: {
    bg: 'bg-[var(--toast-warning-bg)]',
    border: 'border-[var(--toast-warning-border)]',
    icon: 'text-[var(--toast-warning-text)]',
  },
  info: {
    bg: 'bg-[var(--toast-info-bg)]',
    border: 'border-[var(--toast-info-border)]',
    icon: 'text-[var(--toast-info-text)]',
  },
};

interface ToastItemProps {
  toast: Toast;
  onDismiss: () => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const Icon = iconMap[toast.type];
  const styles = styleMap[toast.type];
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [progress, setProgress] = useState(100);

  // Enter animation
  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // Progress bar countdown
  useEffect(() => {
    if (!toast.duration || toast.duration <= 0) return;

    const startTime = Date.now();
    const duration = toast.duration;
    let rafId: number;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining > 0) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [toast.duration]);

  const handleDismiss = () => {
    setExiting(true);
    setTimeout(onDismiss, 200);
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={cn(
        'relative flex items-start gap-3 p-4 rounded-none border',
        'min-w-[280px] max-w-[420px] sm:min-w-[320px]',
        'transition-all duration-200 ease-out',
        styles.bg,
        styles.border,
        visible && !exiting ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
        exiting && 'opacity-0 translate-x-8'
      )}
    >
      {/* Icon */}
      <div className={cn('flex-shrink-0 mt-0.5', styles.icon)}>
        <Icon />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-primary font-medium text-sm">{toast.title}</p>
        {toast.message && (
          <p className="text-secondary text-xs mt-0.5 line-clamp-2">{toast.message}</p>
        )}
        {toast.action && (
          <button
            onClick={() => {
              toast.action?.onClick();
              handleDismiss();
            }}
            className={cn(
              'mt-2 text-xs font-medium transition-colors',
              styles.icon,
              'hover:underline'
            )}
          >
            {toast.action.label}
          </button>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={handleDismiss}
        aria-label="Fechar notificacao"
        className="flex-shrink-0 p-1 rounded-none text-tertiary hover:text-primary hover:bg-[var(--color-bg-tertiary)] transition-colors"
      >
        <CloseIcon aria-hidden="true" />
      </button>

      {/* Progress bar for auto-dismiss */}
      {toast.duration && toast.duration > 0 && (
        <div
          className={cn('absolute bottom-0 left-0 h-0.5', styles.icon.replace('text-', 'bg-'))}
          style={{
            width: `${progress}%`,
            transition: 'width 100ms linear',
          }}
        />
      )}
    </div>
  );
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-20 md:bottom-4 right-4 left-4 md:left-auto z-[100] flex flex-col items-center md:items-end gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto w-full md:w-auto">
          <ToastItem toast={toast} onDismiss={() => removeToast(toast.id)} />
        </div>
      ))}
    </div>
  );
}

// Re-export for convenience
export { useToast } from '../../stores/toastStore';
export type { Toast, ToastType } from '../../stores/toastStore';
