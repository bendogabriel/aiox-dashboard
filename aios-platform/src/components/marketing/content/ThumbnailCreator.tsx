import { useState } from 'react';
import { Image, Wand2, Download, Copy, RotateCw } from 'lucide-react';

interface ThumbnailRequest {
  prompt: string;
  style: string;
  aspectRatio: string;
}

const STYLES = [
  { id: 'photorealistic', label: 'Fotorrealista' },
  { id: 'cinematic', label: 'Cinematico' },
  { id: 'editorial', label: 'Editorial' },
  { id: 'bold-text', label: 'Bold Text' },
  { id: 'minimalist', label: 'Minimalista' },
];

const ASPECT_RATIOS = [
  { id: '16:9', label: '16:9', desc: 'YouTube' },
  { id: '1:1', label: '1:1', desc: 'Instagram' },
  { id: '9:16', label: '9:16', desc: 'Reels/Stories' },
  { id: '4:5', label: '4:5', desc: 'Feed IG' },
];

const PROMPT_TEMPLATES = [
  'Massoterapeuta profissional aplicando tecnica em paciente, iluminacao suave de studio',
  'Close-up de maos fazendo massagem terapeutica, tons quentes, foco seletivo',
  'Massoterapeuta confiante em clinica moderna, olhando para camera, fundo clean',
  'Antes e depois de tratamento estetico, split screen, resultado impressionante',
  'Texto bold "R$ 400/SESSAO" com fundo gradient profissional, massoterapeuta ao lado',
];

export function ThumbnailCreator() {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('photorealistic');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);

    // TODO: Connect to Engine /content/thumbnail/generate endpoint
    // For now, simulate generation
    await new Promise((r) => setTimeout(r, 2000));

    // Demo placeholder images
    setGeneratedImages((prev) => [
      ...prev,
      `https://placehold.co/1280x720/050505/D1FF00?text=${encodeURIComponent(style.toUpperCase())}`,
    ]);

    setIsGenerating(false);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr,1fr]">
      {/* Left: Controls */}
      <div>
        {/* Prompt */}
        <div className="mb-4">
          <label
            style={{
              fontFamily: 'var(--font-family-mono)',
              fontSize: '0.55rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--aiox-gray-muted)',
              display: 'block',
              marginBottom: '0.5rem',
            }}
          >
            Prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Descreva a thumbnail que deseja gerar..."
            rows={4}
            className="w-full resize-none"
            style={{
              background: 'var(--aiox-surface)',
              border: '1px solid rgba(156, 156, 156, 0.15)',
              padding: '0.75rem',
              fontFamily: 'var(--font-family-mono)',
              fontSize: '0.8rem',
              color: 'var(--aiox-cream)',
              outline: 'none',
            }}
          />
        </div>

        {/* Quick prompts */}
        <div className="mb-4">
          <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.5rem', color: 'var(--aiox-gray-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Templates rapidos
          </span>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {PROMPT_TEMPLATES.map((t, i) => (
              <button
                key={i}
                onClick={() => setPrompt(t)}
                className="px-2 py-1 text-left transition-all hover:bg-white/5"
                style={{
                  fontFamily: 'var(--font-family-mono)',
                  fontSize: '0.6rem',
                  color: 'var(--aiox-gray-muted)',
                  border: '1px solid rgba(156, 156, 156, 0.1)',
                  maxWidth: '100%',
                }}
              >
                {t.slice(0, 60)}...
              </button>
            ))}
          </div>
        </div>

        {/* Style */}
        <div className="mb-4">
          <label style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.55rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--aiox-gray-muted)', display: 'block', marginBottom: '0.5rem' }}>
            Estilo
          </label>
          <div className="flex flex-wrap gap-1.5">
            {STYLES.map((s) => (
              <button
                key={s.id}
                onClick={() => setStyle(s.id)}
                className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-all"
                style={{
                  background: style === s.id ? 'var(--aiox-lime)' : 'var(--aiox-surface)',
                  color: style === s.id ? '#050505' : 'var(--aiox-gray-muted)',
                  border: `1px solid ${style === s.id ? 'var(--aiox-lime)' : 'rgba(156, 156, 156, 0.12)'}`,
                  fontWeight: style === s.id ? 700 : 400,
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Aspect Ratio */}
        <div className="mb-6">
          <label style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.55rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--aiox-gray-muted)', display: 'block', marginBottom: '0.5rem' }}>
            Proporcao
          </label>
          <div className="flex gap-2">
            {ASPECT_RATIOS.map((ar) => (
              <button
                key={ar.id}
                onClick={() => setAspectRatio(ar.id)}
                className="flex flex-col items-center gap-1 px-3 py-2 transition-all"
                style={{
                  background: aspectRatio === ar.id ? 'rgba(209, 255, 0, 0.08)' : 'var(--aiox-surface)',
                  border: `1px solid ${aspectRatio === ar.id ? 'rgba(209, 255, 0, 0.3)' : 'rgba(156, 156, 156, 0.12)'}`,
                }}
              >
                <span style={{ fontFamily: 'var(--font-family-display)', fontSize: '0.85rem', fontWeight: 700, color: aspectRatio === ar.id ? 'var(--aiox-lime)' : 'var(--aiox-cream)' }}>
                  {ar.label}
                </span>
                <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.5rem', color: 'var(--aiox-gray-dim)', textTransform: 'uppercase' }}>
                  {ar.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
          className="w-full flex items-center justify-center gap-2 py-3 transition-all"
          style={{
            background: prompt.trim() && !isGenerating ? 'var(--aiox-lime)' : 'rgba(156, 156, 156, 0.1)',
            color: prompt.trim() && !isGenerating ? '#050505' : 'var(--aiox-gray-dim)',
            fontFamily: 'var(--font-family-mono)',
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            border: 'none',
            cursor: prompt.trim() && !isGenerating ? 'pointer' : 'not-allowed',
          }}
        >
          {isGenerating ? (
            <>
              <RotateCw size={14} className="animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <Wand2 size={14} />
              Gerar Thumbnail
            </>
          )}
        </button>
      </div>

      {/* Right: Generated images */}
      <div>
        <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.55rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--aiox-gray-muted)', display: 'block', marginBottom: '0.75rem' }}>
          Gerados ({generatedImages.length})
        </span>

        {generatedImages.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center gap-3"
            style={{
              height: 300,
              background: 'var(--aiox-surface)',
              border: '1px dashed rgba(156, 156, 156, 0.15)',
            }}
          >
            <Image size={32} style={{ color: 'var(--aiox-gray-dim)' }} />
            <p style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.6rem', color: 'var(--aiox-gray-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Thumbnails gerados aparecerão aqui
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {generatedImages.map((url, i) => (
              <div
                key={i}
                className="relative group"
                style={{ border: '1px solid rgba(156, 156, 156, 0.12)' }}
              >
                <img
                  src={url}
                  alt={`Thumbnail ${i + 1}`}
                  className="w-full"
                  style={{ aspectRatio: aspectRatio.replace(':', '/'), objectFit: 'cover', display: 'block' }}
                />
                {/* Overlay actions */}
                <div
                  className="absolute inset-0 flex items-end justify-end gap-2 p-3 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'linear-gradient(transparent 60%, rgba(5,5,5,0.8))' }}
                >
                  <button
                    className="p-2"
                    style={{ background: 'var(--aiox-surface)', border: '1px solid rgba(156,156,156,0.2)' }}
                    title="Download"
                  >
                    <Download size={14} style={{ color: 'var(--aiox-cream)' }} />
                  </button>
                  <button
                    className="p-2"
                    style={{ background: 'var(--aiox-surface)', border: '1px solid rgba(156,156,156,0.2)' }}
                    title="Copiar URL"
                  >
                    <Copy size={14} style={{ color: 'var(--aiox-cream)' }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
