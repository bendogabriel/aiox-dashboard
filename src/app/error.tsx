'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="mx-auto w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-6">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Algo deu errado
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Ocorreu um erro inesperado. Tente novamente ou recarregue a página.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <p className="text-xs font-mono text-red-400 mb-4 p-3 rounded-lg bg-red-500/5">
            {error.message}
          </p>
        )}
        <div className="flex items-center justify-center gap-3">
          <Button variant="default" size="sm" onClick={reset}>
            Tentar novamente
          </Button>
          <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
            Recarregar página
          </Button>
        </div>
      </div>
    </div>
  );
}
