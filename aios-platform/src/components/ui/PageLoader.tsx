import { useEffect, useState } from 'react';

interface PageLoaderProps {
  message?: string;
}

function useIsAioxTheme() {
  const [isAiox, setIsAiox] = useState(false);
  useEffect(() => {
    const check = () => {
      const t = document.documentElement.dataset.theme;
      setIsAiox(t === 'aiox' || t === 'aiox-gold');
    };
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, []);
  return isAiox;
}

// Particle Orbit loader for AIOX theme
function ParticleOrbitLoader({ message }: PageLoaderProps) {
  const particles = [0, 1, 2, 3];
  const orbitRadius = 28;

  return (
    <div className="h-full flex flex-col items-center justify-center">
      <div
        className="relative"
      >
        <div className="relative h-20 w-20">
          {/* Orbit ring */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              border: '1px solid rgba(209, 255, 0, 0.12)',
            }}
          />

          {/* Central mark with pulse */}
          <div
            className="absolute inset-0 flex items-center justify-center"
          >
            <svg
              viewBox="0 0 377 320"
              fill="none"
              className="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill="var(--aiox-lime)"
                d="M0 310.6H376.464L188.219 9.4L0 310.6ZM96.047 257.35L188.219 109.875L280.392 257.35H96.047Z"
              />
            </svg>
          </div>

          {/* Orbiting particles */}
          {particles.map((i) => (
            <div
              key={i}
              className="absolute"
              style={{
                top: '50%',
                left: '50%',
                width: 6,
                height: 6,
                marginTop: -3,
                marginLeft: -3,
              }}
            >
              <div
                className="h-full w-full rounded-full"
                style={{
                  background: 'var(--aiox-lime)',
                  boxShadow: '0 0 8px rgba(209, 255, 0, 0.5)',
                  opacity: 0.8 - i * 0.1,
                }}
              />
            </div>
          ))}
        </div>

        {/* Loading text */}
        <p
          className="mt-5 text-sm text-secondary text-center"
        >
          {message}
        </p>
      </div>
    </div>
  );
}

// Default loader
function DefaultLoader({ message }: PageLoaderProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center">
      <div
        className="relative"
      >
        {/* Animated logo/spinner */}
        <div className="relative h-16 w-16">
          {/* Outer ring */}
          <div
            className="absolute inset-0 rounded-full border-2 border-[var(--loader-ring)]"
          />

          {/* Inner spinning arc */}
          <div
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--loader-arc)]"
          />

          {/* Center dot */}
          <div
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="h-3 w-3 rounded-full" style={{ background: 'linear-gradient(to bottom right, var(--loader-dot-from), var(--loader-dot-to))' }} />
          </div>
        </div>

        {/* Loading text */}
        <p
          className="mt-4 text-sm text-secondary text-center"
        >
          {message}
        </p>
      </div>
    </div>
  );
}

export function PageLoader({ message = 'Carregando...' }: PageLoaderProps) {
  const isAiox = useIsAioxTheme();

  if (isAiox) {
    return <ParticleOrbitLoader message={message} />;
  }

  return <DefaultLoader message={message} />;
}

// Compact inline loader for smaller areas
export function InlineLoader({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div
      className={`${sizes[size]} rounded-full border-2 border-transparent border-t-[var(--loader-arc)]`}
    />
  );
}
