import { useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card'
import { Input } from '../ui/input'
import { CockpitButton } from '../ui/cockpit/CockpitButton'

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontFamily: 'var(--font-family-display)',
        fontSize: '1.25rem',
        color: 'var(--aiox-lime)',
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        marginBottom: '1rem',
        borderBottom: '1px solid rgba(209, 255, 0, 0.15)',
        paddingBottom: '0.5rem',
      }}
    >
      {children}
    </h2>
  )
}

function SubSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <p
        style={{
          fontFamily: 'var(--font-family-mono)',
          fontSize: '0.6rem',
          color: 'var(--aiox-gray-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: '0.75rem',
        }}
      >
        {label}
      </p>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  )
}

export default function DSPreview() {
  const [inputValue, setInputValue] = useState('')

  return (
    <div
      className="h-full overflow-y-auto p-8"
      style={{ background: 'var(--aiox-dark)', color: 'var(--aiox-warm-white)' }}
    >
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Header */}
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-family-display)',
              fontSize: '2rem',
              color: 'var(--aiox-lime)',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
            }}
          >
            Design System Preview
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-family-mono)',
              fontSize: '0.7rem',
              color: 'var(--aiox-gray-muted)',
              marginTop: '0.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            shadcn/ui components with AIOX Cockpit theme bridge
          </p>
        </div>

        {/* ─── BUTTONS ─── */}
        <section>
          <SectionTitle>shadcn Button</SectionTitle>

          <SubSection label="Variants">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="link">Link</Button>
          </SubSection>

          <SubSection label="Sizes">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <Button size="icon" aria-label="Icon button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </Button>
          </SubSection>

          <SubSection label="States">
            <Button disabled>Disabled</Button>
            <Button variant="secondary" disabled>
              Disabled Secondary
            </Button>
          </SubSection>
        </section>

        {/* ─── CARDS ─── */}
        <section>
          <SectionTitle>shadcn Card</SectionTitle>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>All agents operational</CardDescription>
              </CardHeader>
              <CardContent>
                <p style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.7rem' }}>
                  12 agents active across 4 squads. No incidents in the last 24h.
                </p>
              </CardContent>
              <CardFooter>
                <Button size="sm" variant="secondary">
                  View Details
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Metrics</CardTitle>
                <CardDescription>Last 7 days performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span
                    style={{
                      fontFamily: 'var(--font-family-display)',
                      fontSize: '2rem',
                      color: 'var(--aiox-lime)',
                    }}
                  >
                    847
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-family-mono)',
                      fontSize: '0.6rem',
                      color: 'var(--aiox-gray-muted)',
                      textTransform: 'uppercase',
                    }}
                  >
                    tasks completed
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ─── INPUTS ─── */}
        <section>
          <SectionTitle>shadcn Input</SectionTitle>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SubSection label="Default">
              <Input
                placeholder="Type something..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
            </SubSection>

            <SubSection label="Disabled">
              <Input placeholder="Disabled input" disabled />
            </SubSection>

            <SubSection label="Error (aria-invalid)">
              <Input placeholder="Invalid input" aria-invalid="true" defaultValue="bad value" />
            </SubSection>

            <SubSection label="With label">
              <div className="w-full space-y-2">
                <label
                  htmlFor="ds-label-input"
                  style={{
                    fontFamily: 'var(--font-family-mono)',
                    fontSize: '0.55rem',
                    color: 'var(--aiox-gray-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}
                >
                  Agent Name
                </label>
                <Input id="ds-label-input" placeholder="e.g. Neo" />
              </div>
            </SubSection>
          </div>
        </section>

        {/* ─── COCKPIT VS SHADCN ─── */}
        <section>
          <SectionTitle>Cockpit vs shadcn — Side by Side</SectionTitle>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Cockpit */}
            <div>
              <p
                style={{
                  fontFamily: 'var(--font-family-mono)',
                  fontSize: '0.6rem',
                  color: 'var(--aiox-gray-dim)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: '1rem',
                }}
              >
                Cockpit (inline styles)
              </p>
              <div className="flex flex-wrap gap-3">
                <CockpitButton variant="primary">Primary</CockpitButton>
                <CockpitButton variant="secondary">Secondary</CockpitButton>
                <CockpitButton variant="ghost">Ghost</CockpitButton>
                <CockpitButton variant="destructive">Destructive</CockpitButton>
              </div>
            </div>

            {/* shadcn */}
            <div>
              <p
                style={{
                  fontFamily: 'var(--font-family-mono)',
                  fontSize: '0.6rem',
                  color: 'var(--aiox-gray-dim)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: '1rem',
                }}
              >
                shadcn (Tailwind + CSS vars)
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
