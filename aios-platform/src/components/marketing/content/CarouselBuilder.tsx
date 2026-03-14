import { useState } from 'react';
import { Plus, Trash2, MoveUp, MoveDown, Type, Image as ImageIcon, Copy } from 'lucide-react';

interface Slide {
  id: string;
  type: 'text' | 'image' | 'mixed';
  headline: string;
  body: string;
  imageUrl?: string;
  bgColor: string;
}

const BG_COLORS = [
  { id: '#050505', label: 'Dark' },
  { id: '#1a1a2e', label: 'Navy' },
  { id: '#16213e', label: 'Deep Blue' },
  { id: '#0f3460', label: 'Royal' },
  { id: '#533483', label: 'Purple' },
  { id: '#e94560', label: 'Coral' },
  { id: '#D1FF00', label: 'Lime' },
];

function createSlide(index: number): Slide {
  return {
    id: `slide-${Date.now()}-${index}`,
    type: 'text',
    headline: '',
    body: '',
    bgColor: '#050505',
  };
}

export function CarouselBuilder() {
  const [slides, setSlides] = useState<Slide[]>([
    { ...createSlide(0), headline: 'Titulo do Carrossel', body: 'Swipe para ver mais →' },
    { ...createSlide(1), headline: 'Ponto 1', body: 'Conteudo do primeiro slide' },
    { ...createSlide(2), headline: 'Ponto 2', body: 'Conteudo do segundo slide' },
    { ...createSlide(3), headline: 'CTA Final', body: 'Siga @nataliatanaka.massoterapeuta' },
  ]);
  const [activeSlide, setActiveSlide] = useState(0);

  const updateSlide = (index: number, patch: Partial<Slide>) => {
    setSlides((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const addSlide = () => {
    if (slides.length >= 10) return;
    setSlides((prev) => [...prev, createSlide(prev.length)]);
    setActiveSlide(slides.length);
  };

  const removeSlide = (index: number) => {
    if (slides.length <= 2) return;
    setSlides((prev) => prev.filter((_, i) => i !== index));
    if (activeSlide >= slides.length - 1) setActiveSlide(Math.max(0, slides.length - 2));
  };

  const moveSlide = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= slides.length) return;
    const newSlides = [...slides];
    [newSlides[index], newSlides[newIndex]] = [newSlides[newIndex], newSlides[index]];
    setSlides(newSlides);
    setActiveSlide(newIndex);
  };

  const current = slides[activeSlide];

  return (
    <div className="grid gap-6 lg:grid-cols-[280px,1fr,280px]">
      {/* Left: Slide list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.55rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--aiox-gray-muted)' }}>
            Slides ({slides.length}/10)
          </span>
          <button
            onClick={addSlide}
            disabled={slides.length >= 10}
            className="p-1.5 transition-all hover:bg-white/5"
            style={{ border: '1px solid rgba(156,156,156,0.12)' }}
            title="Adicionar slide"
          >
            <Plus size={12} style={{ color: slides.length < 10 ? 'var(--aiox-lime)' : 'var(--aiox-gray-dim)' }} />
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              onClick={() => setActiveSlide(i)}
              className="flex items-center gap-2 px-3 py-2 cursor-pointer transition-all"
              style={{
                background: i === activeSlide ? 'rgba(209, 255, 0, 0.06)' : 'var(--aiox-surface)',
                border: `1px solid ${i === activeSlide ? 'rgba(209, 255, 0, 0.2)' : 'rgba(156, 156, 156, 0.08)'}`,
              }}
            >
              {/* Thumbnail preview */}
              <div
                className="flex items-center justify-center flex-shrink-0"
                style={{ width: 36, height: 36, background: slide.bgColor, border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <span style={{ fontFamily: 'var(--font-family-display)', fontSize: '0.65rem', fontWeight: 700, color: slide.bgColor === '#D1FF00' ? '#050505' : '#fff' }}>
                  {i + 1}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.65rem', color: 'var(--aiox-cream)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {slide.headline || `Slide ${i + 1}`}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100" style={{ opacity: i === activeSlide ? 1 : 0 }}>
                <button onClick={(e) => { e.stopPropagation(); moveSlide(i, -1); }} className="p-0.5"><MoveUp size={10} style={{ color: 'var(--aiox-gray-dim)' }} /></button>
                <button onClick={(e) => { e.stopPropagation(); moveSlide(i, 1); }} className="p-0.5"><MoveDown size={10} style={{ color: 'var(--aiox-gray-dim)' }} /></button>
                <button onClick={(e) => { e.stopPropagation(); removeSlide(i); }} className="p-0.5"><Trash2 size={10} style={{ color: 'var(--color-status-error)' }} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Center: Preview */}
      <div className="flex flex-col items-center">
        <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--aiox-gray-dim)', marginBottom: '0.5rem' }}>
          Preview — Slide {activeSlide + 1}/{slides.length}
        </span>
        <div
          className="w-full flex items-center justify-center p-8"
          style={{
            aspectRatio: '1/1',
            maxWidth: 400,
            background: current?.bgColor || '#050505',
            border: '1px solid rgba(156,156,156,0.15)',
          }}
        >
          <div className="text-center max-w-[80%]">
            {current?.headline && (
              <h3
                style={{
                  fontFamily: 'var(--font-family-display)',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: current.bgColor === '#D1FF00' ? '#050505' : '#fff',
                  lineHeight: 1.2,
                  marginBottom: '0.75rem',
                }}
              >
                {current.headline}
              </h3>
            )}
            {current?.body && (
              <p
                style={{
                  fontFamily: 'var(--font-family-mono)',
                  fontSize: '0.8rem',
                  color: current.bgColor === '#D1FF00' ? '#050505' : 'rgba(255,255,255,0.7)',
                  lineHeight: 1.5,
                }}
              >
                {current.body}
              </p>
            )}
          </div>
        </div>

        {/* Slide dots */}
        <div className="flex gap-1.5 mt-3">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveSlide(i)}
              className="transition-all"
              style={{
                width: i === activeSlide ? 16 : 6,
                height: 6,
                background: i === activeSlide ? 'var(--aiox-lime)' : 'var(--aiox-gray-dim)',
              }}
            />
          ))}
        </div>
      </div>

      {/* Right: Editor */}
      <div>
        <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.55rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--aiox-gray-muted)', display: 'block', marginBottom: '0.75rem' }}>
          Editar Slide {activeSlide + 1}
        </span>

        {current && (
          <div className="flex flex-col gap-4">
            {/* Headline */}
            <div>
              <label className="flex items-center gap-1.5 mb-1">
                <Type size={10} style={{ color: 'var(--aiox-gray-muted)' }} />
                <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--aiox-gray-muted)' }}>Titulo</span>
              </label>
              <input
                value={current.headline}
                onChange={(e) => updateSlide(activeSlide, { headline: e.target.value })}
                placeholder="Titulo do slide"
                style={{ width: '100%', background: 'var(--aiox-surface)', border: '1px solid rgba(156,156,156,0.15)', padding: '0.5rem 0.75rem', fontFamily: 'var(--font-family-mono)', fontSize: '0.8rem', color: 'var(--aiox-cream)', outline: 'none' }}
              />
            </div>

            {/* Body */}
            <div>
              <label className="flex items-center gap-1.5 mb-1">
                <Type size={10} style={{ color: 'var(--aiox-gray-muted)' }} />
                <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--aiox-gray-muted)' }}>Texto</span>
              </label>
              <textarea
                value={current.body}
                onChange={(e) => updateSlide(activeSlide, { body: e.target.value })}
                placeholder="Texto do slide"
                rows={3}
                className="w-full resize-none"
                style={{ background: 'var(--aiox-surface)', border: '1px solid rgba(156,156,156,0.15)', padding: '0.5rem 0.75rem', fontFamily: 'var(--font-family-mono)', fontSize: '0.8rem', color: 'var(--aiox-cream)', outline: 'none' }}
              />
            </div>

            {/* Background color */}
            <div>
              <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--aiox-gray-muted)', display: 'block', marginBottom: '0.5rem' }}>
                Cor de fundo
              </span>
              <div className="flex flex-wrap gap-1.5">
                {BG_COLORS.map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => updateSlide(activeSlide, { bgColor: bg.id })}
                    title={bg.label}
                    style={{
                      width: 28,
                      height: 28,
                      background: bg.id,
                      border: current.bgColor === bg.id ? '2px solid var(--aiox-lime)' : '1px solid rgba(156,156,156,0.2)',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
