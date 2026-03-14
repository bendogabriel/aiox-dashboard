import { useState } from 'react';
import { ChevronLeft, ChevronRight, Instagram, Youtube, Facebook } from 'lucide-react';

interface CalendarPost {
  id: string;
  title: string;
  platform: 'instagram' | 'youtube' | 'facebook';
  type: 'post' | 'reel' | 'carousel' | 'live' | 'story';
  time: string;
  status: 'draft' | 'scheduled' | 'published';
}

const PLATFORM_ICONS = {
  instagram: Instagram,
  youtube: Youtube,
  facebook: Facebook,
};

const PLATFORM_COLORS = {
  instagram: '#E1306C',
  youtube: '#FF0000',
  facebook: '#1877F2',
};

const STATUS_COLORS = {
  draft: 'var(--aiox-gray-dim)',
  scheduled: 'var(--aiox-lime)',
  published: 'var(--aiox-blue)',
};

// Demo posts for current week
function getDemoPosts(): Record<string, CalendarPost[]> {
  const today = new Date();
  const posts: Record<string, CalendarPost[]> = {};

  const offsets = [
    { day: 0, items: [
      { id: 'p1', title: 'Carrossel: 5 Pontos Gatilhos', platform: 'instagram' as const, type: 'carousel' as const, time: '15:00', status: 'scheduled' as const },
    ]},
    { day: 1, items: [
      { id: 'p2', title: 'Reel: Protocolo MAL', platform: 'instagram' as const, type: 'reel' as const, time: '12:00', status: 'scheduled' as const },
      { id: 'p3', title: 'Post: Depoimento cliente', platform: 'facebook' as const, type: 'post' as const, time: '14:00', status: 'draft' as const },
    ]},
    { day: 2, items: [] },
    { day: 3, items: [
      { id: 'p4', title: 'LIVE: Perguntas e Respostas', platform: 'youtube' as const, type: 'live' as const, time: '20:00', status: 'scheduled' as const },
    ]},
    { day: 4, items: [
      { id: 'p5', title: 'Carrossel: Pos-Operatorio', platform: 'instagram' as const, type: 'carousel' as const, time: '11:00', status: 'draft' as const },
      { id: 'p6', title: 'Story: Bastidores clinica', platform: 'instagram' as const, type: 'story' as const, time: '18:00', status: 'draft' as const },
    ]},
    { day: 5, items: [
      { id: 'p7', title: 'Video: Agenda Magica', platform: 'youtube' as const, type: 'post' as const, time: '10:00', status: 'draft' as const },
    ]},
    { day: 6, items: [] },
  ];

  offsets.forEach(({ day, items }) => {
    const d = new Date(today);
    d.setDate(d.getDate() + day - today.getDay()); // Start from Sunday of current week
    const key = d.toISOString().split('T')[0];
    posts[key] = items;
  });

  return posts;
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

export function ContentCalendar() {
  const [weekOffset, setWeekOffset] = useState(0);
  const posts = getDemoPosts();

  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + weekOffset * 7);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    return d;
  });

  const isToday = (d: Date) => d.toDateString() === today.toDateString();

  return (
    <div>
      {/* Week navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setWeekOffset((w) => w - 1)}
          className="p-2 hover:bg-white/5 transition-colors"
          style={{ border: '1px solid rgba(156,156,156,0.12)' }}
        >
          <ChevronLeft size={14} style={{ color: 'var(--aiox-gray-muted)' }} />
        </button>

        <div className="flex items-center gap-2">
          <span style={{ fontFamily: 'var(--font-family-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--aiox-cream)' }}>
            {startOfWeek.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} — {days[6].toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="px-2 py-0.5 text-xs font-mono uppercase tracking-wider"
              style={{ background: 'rgba(209,255,0,0.08)', border: '1px solid rgba(209,255,0,0.2)', color: 'var(--aiox-lime)' }}
            >
              Hoje
            </button>
          )}
        </div>

        <button
          onClick={() => setWeekOffset((w) => w + 1)}
          className="p-2 hover:bg-white/5 transition-colors"
          style={{ border: '1px solid rgba(156,156,156,0.12)' }}
        >
          <ChevronRight size={14} style={{ color: 'var(--aiox-gray-muted)' }} />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px" style={{ border: '1px solid rgba(156,156,156,0.12)' }}>
        {/* Header */}
        {days.map((d, i) => (
          <div
            key={`header-${i}`}
            className="text-center py-2"
            style={{
              background: isToday(d) ? 'rgba(209,255,0,0.06)' : 'rgba(5,5,5,0.4)',
              borderBottom: '1px solid rgba(156,156,156,0.12)',
            }}
          >
            <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--aiox-gray-muted)', display: 'block' }}>
              {WEEKDAYS[i]}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-family-display)',
                fontSize: '1rem',
                fontWeight: 700,
                color: isToday(d) ? 'var(--aiox-lime)' : 'var(--aiox-cream)',
              }}
            >
              {d.getDate()}
            </span>
          </div>
        ))}

        {/* Content cells */}
        {days.map((d, i) => {
          const key = d.toISOString().split('T')[0];
          const dayPosts = posts[key] || [];
          return (
            <div
              key={`cell-${i}`}
              className="p-2"
              style={{
                minHeight: 120,
                background: isToday(d) ? 'rgba(209,255,0,0.02)' : 'var(--aiox-surface)',
              }}
            >
              {dayPosts.map((post) => {
                const PlatformIcon = PLATFORM_ICONS[post.platform];
                return (
                  <div
                    key={post.id}
                    className="p-2 mb-1.5 cursor-pointer hover:bg-white/5 transition-colors"
                    style={{
                      background: 'rgba(5,5,5,0.4)',
                      borderLeft: `2px solid ${PLATFORM_COLORS[post.platform]}`,
                    }}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <PlatformIcon size={10} style={{ color: PLATFORM_COLORS[post.platform] }} />
                      <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.5rem', color: 'var(--aiox-gray-dim)' }}>
                        {post.time}
                      </span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.6rem', color: 'var(--aiox-cream)', display: 'block', lineHeight: 1.3 }}>
                      {post.title}
                    </span>
                    <span
                      className="inline-block mt-1"
                      style={{
                        fontFamily: 'var(--font-family-mono)',
                        fontSize: '0.45rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: STATUS_COLORS[post.status],
                      }}
                    >
                      {post.status}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
