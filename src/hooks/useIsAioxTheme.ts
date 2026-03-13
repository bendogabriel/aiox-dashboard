import { useState, useEffect } from 'react';

/**
 * Returns true when any AIOX variant theme is active on <html>.
 * Matches: data-theme="aiox" OR data-theme="aiox-gold"
 * Updates reactively via MutationObserver.
 */
export function useIsAioxTheme(): boolean {
  const [isAiox, setIsAiox] = useState(
    () => {
      const theme = document.documentElement.getAttribute('data-theme');
      return theme === 'aiox' || theme === 'aiox-gold';
    }
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const theme = document.documentElement.getAttribute('data-theme');
      setIsAiox(theme === 'aiox' || theme === 'aiox-gold');
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, []);

  return isAiox;
}
