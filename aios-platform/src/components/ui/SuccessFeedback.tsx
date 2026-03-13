import { useState } from 'react';

interface SuccessFeedbackProps {
  show: boolean;
  message?: string;
  onComplete?: () => void;
  /** @deprecated All variants now render as minimal fade */
  variant?: 'checkmark' | 'confetti' | 'minimal';
}

/**
 * Minimal success feedback overlay — CSS-only fade animation.
 */
export function SuccessFeedback({
  show,
  message = 'Sucesso!',
}: SuccessFeedbackProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[200] pointer-events-none animate-[fade-in-out_1.2s_ease-out_forwards]">
      <div className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10">
        <div className="h-6 w-6 flex items-center justify-center bg-[var(--color-status-success,#4ADE80)]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <span className="text-primary font-medium font-mono text-sm uppercase tracking-wider">{message}</span>
      </div>
    </div>
  );
}

/**
 * Hook for showing temporary success feedback
 */
export function useSuccessFeedback(duration = 1500) {
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState('Sucesso!');

  const trigger = (msg = 'Sucesso!') => {
    setMessage(msg);
    setShow(true);
    setTimeout(() => setShow(false), duration);
  };

  return {
    show,
    message,
    trigger,
    SuccessFeedback: () => <SuccessFeedback show={show} message={message} />,
  };
}

export default SuccessFeedback;
