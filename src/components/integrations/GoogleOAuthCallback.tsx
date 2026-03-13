import { useEffect, useState } from 'react';
import { completeGoogleOAuth } from '../../lib/integration-sync';
import { useIntegrationStore } from '../../stores/integrationStore';
import { useUIStore } from '../../stores/uiStore';

/**
 * Handles the Google OAuth callback redirect.
 * Extracts code/state from URL, exchanges for tokens via engine,
 * then redirects back to integrations page.
 */
// Parse URL params once at module level to avoid setting state synchronously in effect
function getOAuthParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    code: params.get('code'),
    state: params.get('state'),
    error: params.get('error'),
  };
}

export default function GoogleOAuthCallback() {
  const oauthParams = getOAuthParams();
  const initialStatus = oauthParams.error ? 'error' as const : !oauthParams.code ? 'error' as const : 'processing' as const;
  const initialMessage = oauthParams.error
    ? `OAuth error: ${oauthParams.error}`
    : !oauthParams.code
      ? 'No authorization code received'
      : 'Completing authentication...';

  const [status, setStatus] = useState<'processing' | 'success' | 'error'>(initialStatus);
  const [message, setMessage] = useState(initialMessage);
  const setCurrentView = useUIStore((s) => s.setCurrentView);
  const setIntegrationStatus = useIntegrationStore((s) => s.setStatus);

  useEffect(() => {
    if (initialStatus === 'error' || !oauthParams.code) return;

    completeGoogleOAuth(oauthParams.code, oauthParams.state || '').then((result) => {
      if (result.success) {
        setStatus('success');
        setMessage(`Connected as ${result.email || 'authenticated'}`);

        // Update integration store
        if (result.service === 'google-drive' || result.service === 'google-calendar') {
          setIntegrationStatus(result.service, 'connected', result.email || 'Authenticated');
        }

        // Redirect to integrations page after a moment
        setTimeout(() => {
          window.history.replaceState({}, '', window.location.pathname.replace(/\/auth\/google\/callback.*/, ''));
          setCurrentView('integrations');
        }, 1500);
      } else {
        setStatus('error');
        setMessage(result.error || 'Authentication failed');
      }
    });
  }, [initialStatus, oauthParams.code, oauthParams.state, setCurrentView, setIntegrationStatus]);

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--aiox-dark, #050505)',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          padding: '40px',
          maxWidth: 400,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            margin: '0 auto 16px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: status === 'success'
              ? 'rgba(209, 255, 0, 0.1)'
              : status === 'error'
                ? 'rgba(239, 68, 68, 0.1)'
                : 'rgba(66, 133, 244, 0.1)',
            border: `1px solid ${
              status === 'success'
                ? 'rgba(209, 255, 0, 0.3)'
                : status === 'error'
                  ? 'rgba(239, 68, 68, 0.3)'
                  : 'rgba(66, 133, 244, 0.3)'
            }`,
          }}
        >
          {status === 'processing' && (
            <div style={{ width: 20, height: 20, border: '2px solid #4285F4', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          )}
          {status === 'success' && (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--aiox-lime, #D1FF00)" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
          {status === 'error' && (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-status-error, #EF4444)" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          )}
        </div>
        <p
          style={{
            fontFamily: 'var(--font-family-mono, monospace)',
            fontSize: '13px',
            color: status === 'success'
              ? 'var(--aiox-lime, #D1FF00)'
              : status === 'error'
                ? 'var(--color-status-error, #EF4444)'
                : 'var(--aiox-gray-muted, #999)',
          }}
        >
          {message}
        </p>
      </div>
    </div>
  );
}
