// Minimalist sound design using Web Audio API — zero dependencies
// Sounds are synthesized procedurally (no audio files needed)

let userHasInteracted = false;

// Track first user gesture to enable AudioContext
if (typeof window !== 'undefined') {
  const markInteracted = () => {
    userHasInteracted = true;
    window.removeEventListener('click', markInteracted);
    window.removeEventListener('keydown', markInteracted);
    window.removeEventListener('touchstart', markInteracted);
    // Resume suspended context if it exists
    const win = window as unknown as Record<string, unknown>;
    const ctx = win.__aiosSoundCtx as AudioContext | undefined;
    if (ctx?.state === 'suspended') ctx.resume();
  };
  window.addEventListener('click', markInteracted);
  window.addEventListener('keydown', markInteracted);
  window.addEventListener('touchstart', markInteracted);
}

const audioCtx = (): AudioContext | null => {
  if (!userHasInteracted) return null;
  const win = window as unknown as Record<string, unknown>;
  if (!win.__aiosSoundCtx) {
    win.__aiosSoundCtx = new AudioContext();
  }
  const ctx = win.__aiosSoundCtx as AudioContext;
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
};

type SoundName =
  | 'navigate'    // view switch click
  | 'success'     // celebration / task complete
  | 'error'       // error feedback
  | 'notify'      // toast notification
  | 'drop'        // drag & drop release
  | 'hover'       // subtle hover tick
  | 'open'        // modal/panel open
  | 'close';      // modal/panel close

const SOUNDS: Record<SoundName, () => void> = {
  navigate: () => {
    const ctx = audioCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  },

  success: () => {
    const ctx = audioCtx();
    if (!ctx) return;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 chord arpeggio
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
      gain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.3);
      osc.start(ctx.currentTime + i * 0.08);
      osc.stop(ctx.currentTime + i * 0.08 + 0.3);
    });
  },

  error: () => {
    const ctx = audioCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  },

  notify: () => {
    const ctx = audioCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.07, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  },

  drop: () => {
    const ctx = audioCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);
  },

  hover: () => {
    const ctx = audioCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, ctx.currentTime);
    gain.gain.setValueAtTime(0.02, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.04);
  },

  open: () => {
    const ctx = audioCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  },

  close: () => {
    const ctx = audioCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);
  },
};

let soundEnabled = true;

export function useSound() {
  const play = (name: SoundName) => {
    if (!soundEnabled) return;
    try {
      SOUNDS[name]();
    } catch {
      // AudioContext may not be available
    }
  };

  const toggle = () => {
    soundEnabled = !soundEnabled;
    return soundEnabled;
  };

  return { play, toggle, enabled: soundEnabled };
}

// Direct play for non-hook contexts (stores, callbacks)
export function playSound(name: SoundName) {
  if (!soundEnabled) return;
  try {
    SOUNDS[name]();
  } catch {
    // AudioContext may not be available
  }
}
