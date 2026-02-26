import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export interface SuccessFeedbackProps {
  show: boolean;
  message?: string;
  onComplete?: () => void;
  variant?: 'checkmark' | 'confetti' | 'minimal';
}

export function SuccessFeedback({
  show,
  message = 'Success!',
  onComplete,
  variant = 'checkmark',
}: SuccessFeedbackProps) {
  return (
    <AnimatePresence onExitComplete={onComplete}>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 flex items-center justify-center z-[200] pointer-events-none"
        >
          {variant === 'checkmark' && <CheckmarkAnimation message={message} />}
          {variant === 'confetti' && <ConfettiAnimation message={message} />}
          {variant === 'minimal' && <MinimalAnimation message={message} />}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CheckmarkAnimation({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ type: 'spring', damping: 15, stiffness: 300 }}
      className="flex flex-col items-center gap-4 p-8 rounded-2xl glass-strong glass-border glass-shadow"
    >
      <div className="relative h-20 w-20">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', damping: 15 }}
          className="absolute inset-0 rounded-full bg-green-500/20"
        />

        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="rgb(34 197 94)"
            strokeWidth="4"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
          <motion.path
            d="M30 50 L45 65 L70 35"
            fill="none"
            stroke="rgb(34 197 94)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.4, duration: 0.3, ease: 'easeOut' }}
          />
        </svg>
      </div>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="font-medium text-lg"
      >
        {message}
      </motion.p>
    </motion.div>
  );
}

function ConfettiAnimation({ message }: { message: string }) {
  const confettiColors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      className="flex flex-col items-center gap-4 p-8 rounded-2xl glass-strong glass-border glass-shadow relative overflow-hidden"
    >
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            backgroundColor: confettiColors[i % confettiColors.length],
            left: '50%',
            top: '50%',
          }}
          initial={{ x: 0, y: 0, scale: 0 }}
          animate={{
            x: (Math.random() - 0.5) * 200,
            y: (Math.random() - 0.5) * 200,
            scale: [0, 1, 0],
            rotate: Math.random() * 360,
          }}
          transition={{
            duration: 0.8,
            delay: 0.2 + Math.random() * 0.2,
            ease: 'easeOut',
          }}
        />
      ))}

      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', damping: 12, stiffness: 200 }}
        className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white"
      >
        <Sparkles size={24} />
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="font-medium text-lg"
      >
        {message}
      </motion.p>
    </motion.div>
  );
}

function MinimalAnimation({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -20, opacity: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className="flex items-center gap-3 px-6 py-3 rounded-full glass-strong glass-border glass-shadow"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring' }}
        className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </motion.div>
      <span className="font-medium">{message}</span>
    </motion.div>
  );
}

export function useSuccessFeedback(duration = 1500) {
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState('Success!');

  const trigger = (msg = 'Success!') => {
    setMessage(msg);
    setShow(true);
    setTimeout(() => setShow(false), duration);
  };

  return {
    show,
    message,
    trigger,
    SuccessFeedbackComponent: () => <SuccessFeedback show={show} message={message} />,
  };
}
