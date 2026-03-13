import { useEffect, useRef } from 'react';
import { getImportFromUrl, clearImportFromUrl, decodeConfigFromShare } from '../lib/qr-config-share';
import { applyConfigImport } from '../lib/config-export';
import { useToastStore } from '../stores/toastStore';

/**
 * Detects ?import= URL parameter on page load
 * and offers to apply the shared config.
 */
export function useUrlConfigImport() {
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;

    const encoded = getImportFromUrl();
    if (!encoded) return;

    processedRef.current = true;

    // Decode and apply async
    (async () => {
      const result = await decodeConfigFromShare(encoded);

      if ('error' in result) {
        useToastStore.getState().addToast({
          type: 'error',
          title: 'Import failed',
          message: result.error,
          duration: 6000,
        });
        clearImportFromUrl();
        return;
      }

      // Apply config
      const { applied, skipped } = applyConfigImport(result);

      useToastStore.getState().addToast({
        type: 'success',
        title: 'Config imported via shared link',
        message: `${applied.length} settings applied${skipped.length > 0 ? `, ${skipped.length} skipped` : ''}`,
        duration: 8000,
      });

      // Clean up URL
      clearImportFromUrl();
    })();
  }, []);
}
