import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AgentEmotesProps {
  /** Position (center of the emote ring) */
  x: number;
  y: number;
  onEmote: (emote: string) => void;
  onClose: () => void;
}

const EMOTES = [
  { emoji: '👋', label: 'Wave' },
  { emoji: '👍', label: 'Thumbs up' },
  { emoji: '❤️', label: 'Love' },
  { emoji: '🎉', label: 'Celebrate' },
  { emoji: '🤔', label: 'Thinking' },
  { emoji: '⚡', label: 'Lightning' },
  { emoji: '🔥', label: 'Fire' },
  { emoji: '💡', label: 'Idea' },
];

const RING_RADIUS = 44;

export function AgentEmotes({ x, y, onEmote, onClose }: AgentEmotesProps) {
  const [selectedEmote, setSelectedEmote] = useState<string | null>(null);

  const handleEmote = (emoji: string) => {
    setSelectedEmote(emoji);
    onEmote(emoji);
    // Auto-close after brief display
    setTimeout(onClose, 800);
  };

  return (
    <>
      {/* Backdrop to catch clicks */}
      <div className="absolute inset-0 z-30" onClick={onClose} />

      {/* Emote ring */}
      <motion.div
        className="absolute z-40 pointer-events-none"
        style={{ left: x, top: y - 20 }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.5 }}
        transition={{ type: 'spring', damping: 15, stiffness: 300 }}
      >
        {EMOTES.map((emote, i) => {
          const angle = (i / EMOTES.length) * Math.PI * 2 - Math.PI / 2;
          const ex = Math.cos(angle) * RING_RADIUS;
          const ey = Math.sin(angle) * RING_RADIUS;

          return (
            <motion.button
              key={emote.emoji}
              className="absolute pointer-events-auto flex items-center justify-center rounded-full"
              style={{
                width: 28,
                height: 28,
                left: ex - 14,
                top: ey - 14,
                fontSize: '14px',
                background: 'rgba(0,0,0,0.7)',
                border: '1px solid rgba(255,255,255,0.15)',
                cursor: 'pointer',
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04, type: 'spring', damping: 12 }}
              whileHover={{ scale: 1.3, background: 'rgba(255,255,255,0.2)' }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                handleEmote(emote.emoji);
              }}
              title={emote.label}
            >
              {emote.emoji}
            </motion.button>
          );
        })}
      </motion.div>

      {/* Floating emote animation */}
      <AnimatePresence>
        {selectedEmote && (
          <motion.div
            className="absolute z-50 pointer-events-none text-2xl"
            style={{ left: x - 12, top: y - 30 }}
            initial={{ opacity: 1, y: 0, scale: 1 }}
            animate={{ opacity: 0, y: -40, scale: 1.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            {selectedEmote}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/** Small floating emote that rises and fades — used after selection */
export function FloatingEmote({ emoji, x, y }: { emoji: string; x: number; y: number }) {
  return (
    <motion.div
      className="absolute pointer-events-none text-xl"
      style={{ left: x - 10, top: y - 30, zIndex: 45 }}
      initial={{ opacity: 1, y: 0, scale: 0.8 }}
      animate={{ opacity: 0, y: -50, scale: 1.4 }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
    >
      {emoji}
    </motion.div>
  );
}
