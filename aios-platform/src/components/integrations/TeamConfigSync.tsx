/**
 * TeamConfigSync — P18 Team Config Sync UI
 *
 * Collapsible panel for sharing integration profiles with team members
 * via Supabase. Falls back gracefully when Supabase is not configured.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Users, ChevronDown, ChevronUp, Upload, Download,
  Trash2, RefreshCw, Check, AlertTriangle, Loader2,
} from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase';
import {
  listTeamProfiles,
  upsertTeamProfile,
  deleteTeamProfile,
  checkSyncAvailability,
  type TeamProfile,
} from '../../services/supabase/config-sync';
import { useIntegrationStore, type IntegrationId } from '../../stores/integrationStore';
import { inputStyle, labelStyle, hintStyle, primaryBtnStyle, secondaryBtnStyle } from './shared-styles';

export function TeamConfigSync() {
  const [expanded, setExpanded] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [profiles, setProfiles] = useState<TeamProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  const checkAvailable = useCallback(async () => {
    const ok = await checkSyncAvailability();
    setAvailable(ok);
    return ok;
  }, []);

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await listTeamProfiles();
    if (result.success && Array.isArray(result.data)) {
      setProfiles(result.data);
    } else {
      setError(result.error || 'Failed to load profiles');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (expanded && available === null) {
      checkAvailable().then((ok) => {
        if (ok) loadProfiles();
      });
    }
  }, [expanded, available, checkAvailable, loadProfiles]);

  const handlePush = async () => {
    const name = newName.trim();
    if (!name) return;

    setSyncing('push');
    setError(null);

    const integrations = useIntegrationStore.getState().integrations;
    const configs: Partial<Record<IntegrationId, Record<string, string>>> = {};
    for (const [id, entry] of Object.entries(integrations)) {
      if (Object.keys(entry.config).length > 0) {
        configs[id as IntegrationId] = { ...entry.config };
      }
    }

    const result = await upsertTeamProfile({
      name,
      description: newDesc.trim(),
      configs,
      settings: {
        engineUrl: integrations.engine?.config?.url,
        supabaseUrl: integrations.supabase?.config?.url,
      },
      created_by: 'dashboard-user',
    });

    if (result.success) {
      setNewName('');
      setNewDesc('');
      await loadProfiles();
    } else {
      setError(result.error || 'Failed to push profile');
    }
    setSyncing(null);
  };

  const handlePull = async (profile: TeamProfile) => {
    setSyncing(profile.id);
    setError(null);

    const store = useIntegrationStore.getState();
    for (const [id, config] of Object.entries(profile.configs)) {
      if (config && Object.keys(config).length > 0) {
        store.setConfig(id as IntegrationId, config);
      }
    }

    setSuccessId(profile.id);
    setTimeout(() => setSuccessId(null), 2000);
    setSyncing(null);
  };

  const handleDelete = async (id: string) => {
    setSyncing(id);
    const result = await deleteTeamProfile(id);
    if (result.success) {
      setProfiles((prev) => prev.filter((p) => p.id !== id));
    } else {
      setError(result.error || 'Failed to delete');
    }
    setSyncing(null);
  };

  return (
    <div style={{
      border: '1px solid rgba(255,255,255,0.08)',
      fontFamily: 'var(--font-family-mono, monospace)',
    }}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 14px',
          background: 'rgba(255,255,255,0.02)',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--aiox-cream, #E5E5E5)',
          fontSize: '12px',
          fontFamily: 'inherit',
          textAlign: 'left',
        }}
      >
        <Users size={14} style={{ color: 'var(--aiox-lime, #D1FF00)' }} />
        <span style={{ flex: 1, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
          Team Config Sync
        </span>
        {!isSupabaseConfigured && (
          <span style={{ fontSize: '9px', color: 'var(--aiox-gray-dim)' }}>
            Requires Supabase
          </span>
        )}
        {profiles.length > 0 && (
          <span style={{ fontSize: '10px', color: 'var(--aiox-gray-dim)' }}>
            {profiles.length} shared
          </span>
        )}
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {expanded && (
        <div style={{ padding: '0 14px 14px' }}>
          {/* Not available */}
          {available === false && (
            <div style={{
              padding: '12px',
              background: 'rgba(239, 68, 68, 0.06)',
              border: '1px solid rgba(239, 68, 68, 0.15)',
              fontSize: '10px',
              color: 'var(--aiox-gray-muted, #999)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '10px',
            }}>
              <AlertTriangle size={12} style={{ color: 'var(--aiox-warning)', flexShrink: 0 }} />
              <div>
                <div style={{ color: 'var(--aiox-cream)', fontWeight: 500, marginBottom: '2px' }}>
                  Supabase not available
                </div>
                Configure Supabase and run the migration to enable team sync.
                See Setup Guides &gt; Supabase for instructions.
              </div>
            </div>
          )}

          {/* Loading */}
          {available === null && (
            <div style={{ padding: '16px', textAlign: 'center' }}>
              <Loader2 size={16} style={{ color: 'var(--aiox-blue)', animation: 'spin 1s linear infinite' }} />
            </div>
          )}

          {/* Available: show profiles + push form */}
          {available && (
            <>
              {/* Error */}
              {error && (
                <div style={{
                  padding: '8px 10px',
                  fontSize: '10px',
                  color: 'var(--color-status-error)',
                  background: 'rgba(239,68,68,0.06)',
                  border: '1px solid rgba(239,68,68,0.15)',
                  marginBottom: '10px',
                }}>
                  {error}
                </div>
              )}

              {/* Shared profiles */}
              {profiles.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={labelStyle}>Shared Profiles</label>
                    <button
                      onClick={loadProfiles}
                      disabled={loading}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '2px',
                        color: 'var(--aiox-blue, #0099FF)',
                      }}
                      title="Refresh"
                      aria-label="Refresh profiles"
                    >
                      <RefreshCw size={11} style={loading ? { animation: 'spin 1s linear infinite' } : undefined} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {profiles.map((p) => (
                      <div
                        key={p.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 10px',
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '11px', color: 'var(--aiox-cream)', fontWeight: 500 }}>
                            {p.name}
                          </div>
                          {p.description && (
                            <div style={{ fontSize: '9px', color: 'var(--aiox-gray-dim)', marginTop: '1px' }}>
                              {p.description}
                            </div>
                          )}
                          <div style={{ fontSize: '8px', color: 'var(--aiox-gray-dim)', marginTop: '2px' }}>
                            by {p.created_by} · {new Date(p.updated_at).toLocaleDateString()}
                          </div>
                        </div>

                        {/* Pull */}
                        <button
                          onClick={() => handlePull(p)}
                          disabled={syncing === p.id}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '2px',
                            color: successId === p.id ? 'var(--aiox-lime)' : 'var(--aiox-blue)',
                          }}
                          title="Pull config"
                          aria-label={`Pull ${p.name} profile`}
                        >
                          {successId === p.id ? <Check size={14} /> : <Download size={12} />}
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(p.id)}
                          disabled={syncing === p.id}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '2px',
                            color: 'var(--color-status-error)',
                          }}
                          title="Delete"
                          aria-label={`Delete ${p.name} profile`}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {profiles.length === 0 && !loading && (
                <div style={{
                  padding: '12px',
                  textAlign: 'center',
                  fontSize: '10px',
                  color: 'var(--aiox-gray-dim)',
                  marginBottom: '10px',
                }}>
                  No shared profiles yet. Push your current config to share with the team.
                </div>
              )}

              {/* Push form */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={labelStyle}>Share Current Config</label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Profile name..."
                  style={inputStyle}
                />
                <input
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Description (optional)..."
                  style={{ ...inputStyle, fontSize: '11px' }}
                />
                <button
                  onClick={handlePush}
                  disabled={!newName.trim() || syncing === 'push'}
                  style={{
                    ...primaryBtnStyle,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    opacity: !newName.trim() ? 0.5 : 1,
                  }}
                >
                  {syncing === 'push' ? (
                    <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <Upload size={12} />
                  )}
                  Push to Team
                </button>
              </div>

              <p style={hintStyle}>
                Shared profiles are stored in Supabase and visible to all team members.
                Sensitive values (API keys, tokens) are included — share only within trusted teams.
              </p>
            </>
          )}

          {/* Spin animation */}
          <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
        </div>
      )}
    </div>
  );
}
