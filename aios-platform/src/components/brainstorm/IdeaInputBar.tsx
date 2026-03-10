import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Mic,
  MicOff,
  Link2,
  Image,
  Paperclip,
  Plus,
  X,
} from 'lucide-react';
import { GlassButton } from '../ui';
import { cn } from '../../lib/utils';

interface IdeaInputBarProps {
  onAddIdea: (type: 'text' | 'voice' | 'link' | 'image' | 'file', content: string, rawContent?: string) => void;
  disabled?: boolean;
}

export function IdeaInputBar({ onAddIdea, disabled }: IdeaInputBarProps) {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Auto-resize textarea
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  // Detect URL paste
  const isUrl = (str: string) => {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (isUrl(trimmed)) {
      onAddIdea('link', trimmed, trimmed);
    } else {
      onAddIdea('text', trimmed);
    }
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Voice recording via SpeechRecognition API
  const startRecording = useCallback(async () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.continuous = true;
      recognition.interimResults = false;

      let transcript = '';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript + ' ';
          }
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
        if (transcript.trim()) {
          onAddIdea('voice', transcript.trim());
        }
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
      return;
    }

    // Fallback to MediaRecorder (no transcription, just save audio note)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        setIsRecording(false);
        if (chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(blob);
          onAddIdea('voice', '[Audio gravado - sem transcricao]', url);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      // Mic permission denied
    }
  }, [onAddIdea]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const reader = new FileReader();
    reader.onload = () => {
      onAddIdea(
        isImage ? 'image' : 'file',
        file.name,
        reader.result as string
      );
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="sticky bottom-0 z-10 px-4 pb-4 pt-2">
      <div className="glass-panel border border-glass-border rounded-2xl p-3 shadow-lg">
        <div className="flex items-end gap-2">
          {/* Expand actions */}
          <GlassButton
            variant="ghost"
            size="icon"
            className="h-9 w-9 flex-shrink-0"
            onClick={() => setShowActions(!showActions)}
            aria-label="Mais opcoes"
          >
            <Plus size={18} className={cn('transition-transform', showActions && 'rotate-45')} />
          </GlassButton>

          {/* Text input */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Despeje uma ideia... (Enter envia, Shift+Enter quebra linha)"
            disabled={disabled || isRecording}
            rows={1}
            className={cn(
              'flex-1 bg-transparent text-sm text-primary placeholder:text-tertiary resize-none',
              'focus:outline-none min-h-[36px] max-h-[120px] py-2',
              isRecording && 'opacity-50'
            )}
          />

          {/* Voice toggle */}
          <GlassButton
            variant={isRecording ? 'destructive' : 'ghost'}
            size="icon"
            className={cn('h-9 w-9 flex-shrink-0', isRecording && 'animate-pulse bg-red-500/20')}
            onClick={isRecording ? stopRecording : startRecording}
            aria-label={isRecording ? 'Parar gravacao' : 'Gravar voz'}
          >
            {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
          </GlassButton>

          {/* Send */}
          <GlassButton
            variant="default"
            size="icon"
            className="h-9 w-9 flex-shrink-0"
            onClick={handleSubmit}
            disabled={!text.trim() || disabled}
            aria-label="Adicionar ideia"
          >
            <Send size={16} />
          </GlassButton>
        </div>

        {/* Action buttons row */}
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex gap-2 pt-2 mt-2 border-t border-glass-border">
                <GlassButton
                  variant="ghost"
                  size="sm"
                  className="text-xs gap-1.5"
                  onClick={() => {
                    const url = prompt('Cole a URL:');
                    if (url?.trim()) onAddIdea('link', url.trim(), url.trim());
                    setShowActions(false);
                  }}
                >
                  <Link2 size={14} /> Link
                </GlassButton>
                <GlassButton
                  variant="ghost"
                  size="sm"
                  className="text-xs gap-1.5"
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.accept = 'image/*';
                      fileInputRef.current.click();
                    }
                    setShowActions(false);
                  }}
                >
                  <Image size={14} /> Imagem
                </GlassButton>
                <GlassButton
                  variant="ghost"
                  size="sm"
                  className="text-xs gap-1.5"
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.accept = '*/*';
                      fileInputRef.current.click();
                    }
                    setShowActions(false);
                  }}
                >
                  <Paperclip size={14} /> Arquivo
                </GlassButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Recording indicator */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="flex items-center justify-center gap-2 mt-2 text-xs text-red-400"
          >
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            Gravando... clique no microfone para parar
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
