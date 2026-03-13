import { useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card'
import { Input } from '../ui/input'
import { CockpitButton } from '../ui/cockpit/CockpitButton'

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl font-semibold tracking-tight text-primary mb-4 border-b border-border pb-2">
      {children}
    </h2>
  )
}

function SubSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">
        {label}
      </p>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  )
}

export default function DSPreview() {
  const [inputValue, setInputValue] = useState('')

  return (
    <div className="h-full overflow-y-auto p-8 bg-background text-foreground">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">
            Design System Preview
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            shadcn/ui components with AIOX theme bridge — matching dashboard-aiox-lovable
          </p>
        </div>

        {/* ─── BUTTONS ─── */}
        <section>
          <SectionTitle>Button</SectionTitle>

          <SubSection label="Variants">
            <Button variant="default">Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
          </SubSection>

          <SubSection label="Sizes">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
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
            <Button variant="outline" disabled>
              Disabled Outline
            </Button>
          </SubSection>
        </section>

        {/* ─── CARDS ─── */}
        <section>
          <SectionTitle>Card</SectionTitle>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>All agents operational</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
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
                  <span className="text-4xl font-bold text-primary">847</span>
                  <span className="text-sm text-muted-foreground">
                    tasks completed
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ─── INPUTS ─── */}
        <section>
          <SectionTitle>Input</SectionTitle>

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
                  className="text-sm font-medium leading-none"
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
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-4">
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
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-4">
                shadcn (Tailwind + CSS vars)
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="default">Default</Button>
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
