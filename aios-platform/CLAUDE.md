# AIOS Platform — Claude Code Instructions

## Project

This is the AIOS Platform UI — a Vite + React + TypeScript dashboard for orchestrating AI agent squads.

## Tech Stack

- **Runtime**: Vite 7 + React 19 + TypeScript
- **Styling**: Tailwind CSS + Liquid Glass design system (CSS custom properties)
- **State**: Zustand stores (`src/stores/`)
- **Testing**: Vitest + React Testing Library

## Design System Squad

The design system squad is available locally at `.squads-design/` (git-ignored).
Use it as reference for tokens, components, accessibility, and design decisions.

### Key resources

| Resource | Path |
|----------|------|
| Squad config | `.squads-design/config.yaml` |
| Agents (Brad Frost, Dave Malouf, Dan Mall) | `.squads-design/agents/` |
| Design tokens spec | `.squads-design/data/design-tokens-spec.yaml` |
| Component quality checklist | `.squads-design/checklists/ds-component-quality-checklist.md` |
| Accessibility checklist (WCAG) | `.squads-design/checklists/ds-accessibility-wcag-checklist.md` |
| Coding standards | `.squads-design/config/coding-standards.md` |
| Atomic design principles | `.squads-design/data/atomic-design-principles.md` |
| Tasks (slash commands) | `.squads-design/tasks/` |

### Design System Rules

- NEVER hardcode color, spacing, radius, shadow, or font values
- ALWAYS use CSS variables from the token system defined in `src/styles/liquid-glass.css`
- Token tiers: **Primitive** → **Semantic** → **Component**
- Before creating ANY new UI element, check existing components in `src/components/ui/`
- EVERY interactive element MUST be keyboard accessible
- EVERY form input MUST have an associated label
- EVERY icon-only button MUST have `aria-label`
- Color contrast MUST meet WCAG AA (4.5:1 normal text, 3:1 large text)

### Available Slash Commands (from squad tasks)

Use these task files as detailed instructions when performing design system work:

- `ds-audit-codebase` — Audit existing codebase for DS adoption
- `ds-build-component` — Build a new design system component
- `ds-compose-molecule` — Compose atoms into a molecule
- `ds-extract-tokens` — Extract design tokens from codebase
- `ds-setup-design-system` — Bootstrap a new design system
- `ds-generate-documentation` — Generate component documentation
- `ds-critical-eye-inventory` — Inventory UI patterns
- `ds-critical-eye-score` — Score component quality
- `ds-critical-eye-compare` — Compare implementations
- `a11y-audit` — Full accessibility audit
- `contrast-matrix` — Color contrast matrix audit
- `bootstrap-shadcn-library` — Bootstrap shadcn component library

For the full list, see `.squads-design/config.yaml` → `tasks:` section.

## Code Conventions

- Components in `src/components/` organized by feature domain
- Shared UI primitives in `src/components/ui/`
- Hooks in `src/hooks/`
- Stores in `src/stores/`
- API services in `src/services/api/`
- Use `cn()` from `src/lib/utils` for conditional class merging
- Use glass-* CSS classes for the glassmorphism design language
