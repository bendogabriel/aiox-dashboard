/**
 * ProfileSwitcher — P10 Connection Profiles UI
 *
 * Collapsible panel for switching between integration presets,
 * saving custom profiles, and exporting health reports.
 */

import { useState } from 'react';
import {
  Layers, ChevronDown, ChevronUp, Save, Trash2, Check,
  Download, FileText,
} from 'lucide-react';
import {
  useConnectionProfileStore,
  type ConnectionProfile,
} from '../../stores/connectionProfileStore';
import { downloadHealthReport } from '../../lib/health-report';
import { inputStyle, labelStyle, hintStyle, primaryBtnStyle, secondaryBtnStyle } from './shared-styles';

export function ProfileSwitcher() {
  const {
    profiles,
    activeProfileId,
    applyProfile,
    saveCurrentAsProfile,
    deleteProfile,
  } = useConnectionProfileStore();
  const [expanded, setExpanded] = useState(false);
  const [newName, setNewName] = useState('');
  const [lastApplied, setLastApplied] = useState<string | null>(null);

  const presets = profiles.filter((p) => p.isPreset);
  const custom = profiles.filter((p) => !p.isPreset);

  const handleApply = (profile: ConnectionProfile) => {
    const result = applyProfile(profile.id);
    if (!result.notFound) {
      setLastApplied(profile.id);
      setTimeout(() => setLastApplied(null), 2000);
    }
  };

  const handleSave = () => {
    const name = newName.trim();
    if (!name) return;
    saveCurrentAsProfile(name);
    setNewName('');
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
        <Layers size={14} style={{ color: 'var(--aiox-gray-dim, #696969)' }} />
        <span style={{ flex: 1, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
          Connection Profiles
        </span>
        {activeProfileId && (
          <span style={{ fontSize: '10px', color: 'var(--aiox-cream, #E5E5E5)' }}>
            {profiles.find((p) => p.id === activeProfileId)?.name || ''}
          </span>
        )}
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {expanded && (
        <div style={{ padding: '0 14px 14px' }}>
          {/* Presets */}
          <div style={{ marginBottom: '10px' }}>
            <label style={{ ...labelStyle, marginBottom: '8px' }}>Presets</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {presets.map((p) => (
                <ProfileRow
                  key={p.id}
                  profile={p}
                  isActive={activeProfileId === p.id}
                  isApplied={lastApplied === p.id}
                  onApply={() => handleApply(p)}
                />
              ))}
            </div>
          </div>

          {/* Custom Profiles */}
          {custom.length > 0 && (
            <div style={{ marginBottom: '10px' }}>
              <label style={{ ...labelStyle, marginBottom: '8px' }}>Saved Profiles</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {custom.map((p) => (
                  <ProfileRow
                    key={p.id}
                    profile={p}
                    isActive={activeProfileId === p.id}
                    isApplied={lastApplied === p.id}
                    onApply={() => handleApply(p)}
                    onDelete={() => deleteProfile(p.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Save Current */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
            <label style={labelStyle}>Save Current Config</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Profile name..."
                style={{ ...inputStyle, flex: 1 }}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
              <button
                onClick={handleSave}
                disabled={!newName.trim()}
                style={{
                  ...primaryBtnStyle,
                  width: 'auto',
                  padding: '8px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  opacity: newName.trim() ? 1 : 0.5,
                }}
              >
                <Save size={12} />
                Save
              </button>
            </div>
          </div>

          {/* Health Report */}
          <button
            onClick={downloadHealthReport}
            style={{
              ...secondaryBtnStyle,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <FileText size={12} />
            Export Health Report
          </button>

          <p style={hintStyle}>
            Presets configure common setups. Save custom profiles to switch between environments.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Profile Row ──────────────────────────────────────────

function ProfileRow({
  profile,
  isActive,
  isApplied,
  onApply,
  onDelete,
}: {
  profile: ConnectionProfile;
  isActive: boolean;
  isApplied: boolean;
  onApply: () => void;
  onDelete?: () => void;
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 10px',
      background: isActive ? 'rgba(209, 255, 0, 0.04)' : 'rgba(255,255,255,0.02)',
      border: `1px solid ${isActive ? 'rgba(209, 255, 0, 0.15)' : 'rgba(255,255,255,0.06)'}`,
    }}>
      {/* Info */}
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: '11px',
          fontWeight: 500,
          color: 'var(--aiox-cream, #E5E5E5)',
        }}>
          {profile.name}
        </div>
        {profile.description && (
          <div style={{ fontSize: '9px', color: 'var(--aiox-gray-dim, #696969)', marginTop: '2px' }}>
            {profile.description}
          </div>
        )}
      </div>

      {/* Apply */}
      <button
        onClick={onApply}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '2px',
          color: isApplied
            ? 'var(--color-status-success, #4ADE80)'
            : 'var(--aiox-gray-muted, #999)',
        }}
        title={isApplied ? 'Applied!' : 'Apply profile'}
        aria-label={`Apply ${profile.name} profile`}
      >
        {isApplied ? <Check size={14} /> : <Download size={12} />}
      </button>

      {/* Delete (custom only) */}
      {onDelete && (
        <button
          onClick={onDelete}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px',
            color: 'var(--color-status-error, #EF4444)',
          }}
          title="Delete profile"
          aria-label={`Delete ${profile.name} profile`}
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  );
}
