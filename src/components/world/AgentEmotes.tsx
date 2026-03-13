import { useState } from 'react';
import { EMOTE_LIST, type EmoteKey } from '../../lib/icons';

interface AgentEmotesProps {
  /** Position (center of the emote ring) */
  x: number;
  y: number;
  onEmote: (emote: string) => void;
  onClose: () => void;
}

const RING_RADIUS = 44;

export function AgentEmotes({ x, y, onEmote, onClose }: AgentEmotesProps) {
  const [selectedEmote, setSelectedEmote] = useState<EmoteKey | null>(null);

  const handleEmote = (key: EmoteKey) => {
    setSelectedEmote(key);
    onEmote(key);
    setTimeout(onClose, 800);
  };

  return (
    <>
      {/* Backdrop to catch clicks */}
      <div className="absolute inset-0 z-30" onClick={onClose} />

      {/* Emote ring */}
      <div
        className="absolute z-40 pointer-events-none"
        style={{ left: x, top: y - 20 }}
      >
        {EMOTE_LIST.map((emote, i) => {
          const angle = (i / EMOTE_LIST.length) * Math.PI * 2 - Math.PI / 2;
          const ex = Math.cos(angle) * RING_RADIUS;
          const ey = Math.sin(angle) * RING_RADIUS;

          return (
            <button
              key={emote.key}
              className="absolute pointer-events-auto flex items-center justify-center rounded-full"
              style={{
                width: 28,
                height: 28,
                left: ex - 14,
                top: ey - 14,
                background: 'rgba(0,0,0,0.7)',
                border: '1px solid rgba(255,255,255,0.15)',
                cursor: 'pointer',
                color: 'rgba(255,255,255,0.8)',
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleEmote(emote.key);
              }}
              title={emote.label}
            >
              <emote.Icon size={14} />
            </button>
          );
        })}
      </div>

      {/* Floating emote animation */}
      {selectedEmote && (() => {
          const selected = EMOTE_LIST.find(e => e.key === selectedEmote);
          if (!selected) return null;
          return (
            <div
              className="absolute z-50 pointer-events-none"
              style={{ left: x - 12, top: y - 30, color: 'rgba(255,255,255,0.9)' }}
            >
              <selected.Icon size={24} />
            </div>
          );
        })()}
</>
  );
}

/** Small floating emote that rises and fades — used after selection */
export function FloatingEmote({ emoteKey, x, y }: { emoteKey: string; x: number; y: number }) {
  const emote = EMOTE_LIST.find(e => e.key === emoteKey);
  if (!emote) return null;
  return (
    <div
      className="absolute pointer-events-none"
      style={{ left: x - 10, top: y - 30, zIndex: 45, color: 'rgba(255,255,255,0.9)' }}
    >
      <emote.Icon size={20} />
    </div>
  );
}
