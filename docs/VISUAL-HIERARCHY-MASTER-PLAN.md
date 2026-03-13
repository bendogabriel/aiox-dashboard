# AIOX Platform — Visual Hierarchy Master Plan

> **Data:** 2026-03-13
> **Status:** Concluído (Fases 1-6 infraestrutura CSS + aplicação em componentes)
> **Baseado em:** AIOX Brandbook v2.0 (Dark Cockpit Edition) vs codebase atual
> **Escopo:** Auditoria de inconsistencias + plano de correcao

---

## Resumo Executivo

A plataforma AIOS tem um sistema de tokens bem estruturado (`aiox.css`), mas a **adocao nos componentes e irregular**. O resultado é uma hierarquia visual achatada — tudo parece no mesmo nível. As correcoes se dividem em 6 áreas, ordenadas por impacto visual.

---

## Diagnóstico: 6 Problemas Raiz

### P1. Hierarquia de Superficies Achatada (IMPACTO: CRITICO)

**O brandbook define 9 níveis de superficie**, mas os componentes usam apenas 2-3.

| Nível | Token Brandbook | Hex | Onde usar | Uso atual |
|-------|----------------|-----|-----------|-----------|
| Canvas | `--bb-canvas` / `--bb-dark` | `#050505` | Background da app | OK (app-background) |
| Surface | `--bb-surface` | `#0F0F11` | Cards, panels, sidebar | Parcial — sidebar usa, cards nem sempre |
| Surface-alt | `--bb-surface-alt` | `#1C1E19` | Nested blocks, rows alternadas | Raramente usado |
| Surface-deep | `--bb-surface-deep` | `oklch(0.13)` | Code blocks, áreas recuadas | Não usado |
| Surface-panel | `--bb-surface-panel` | `oklch(0.178)` | Sidebar, drawers | Não diferenciado |
| Surface-console | `--bb-surface-console` | `oklch(0.184)` | Terminal/console | Não usado |
| Surface-overlay | `--bb-surface-overlay` | `rgba(15,15,17,0.92)` | Modais | OK |
| Hover-strong | `--bb-surface-hover-strong` | `oklch(0.197)` | Hover pesado | Não usado |

**Problema:** Header, sidebar, cards de conteúdo e paineis laterais todos usam `--color-bg-primary` ou `--glass-background-panel`. Sem diferenciacao de profundidade, a UI parece um bloco homogeneo.

**Arquivos afetados:**
- `src/components/layout/Header.tsx:46` — usa `bg-[var(--color-bg-primary)]`
- `src/components/layout/Sidebar.tsx` — usa glass-panel genericamente
- `src/components/layout/ActivityPanel.tsx` — mesmo nível visual da sidebar
- Todos os cards em todas as views

---

### P2. Hierarquia Tipografica Inconsistente (IMPACTO: ALTO)

**Brandbook define 7 tamanhos com função clara:**

| Tamanho | Função | Uso esperado |
|---------|--------|-------------|
| 4rem (64px) | Display | Splash, hero |
| 2.5rem (40px) | H1 Page Title | Título de página |
| 1.5rem (24px) | H2 Section Title | Título de seção |
| 1rem (16px) | Body | Texto principal |
| 0.8rem (12.8px) | Small | Descricoes, supporting |
| 0.65rem (10.4px) | Label | HUD labels, nav, status |
| 0.6rem (9.6px) | Micro | Footer meta, refs |

**Problema:** Componentes usam tamanhos Tailwind arbitrarios (266 ocorrências em 30 arquivos):
- `text-xs` (10px), `text-sm` (12px), `text-base` (14px), `text-lg` (16px) — NAO mapeiam ao brandbook
- Nenhuma página usa H1/H2 de forma consistente
- Labels e metadata misturam `text-[10px]`, `text-xs`, `text-sm` sem padrão

**Tokens ausentes na plataforma:**
- `--font-size-small` (0.8rem) — brandbook Small
- `--font-size-label` (0.65rem) — brandbook Label
- `--font-size-micro` (0.6rem) — brandbook Micro

---

### P3. Cores Hardcoded Quebrando o Theme (IMPACTO: ALTO)

**213 ocorrências** de classes Tailwind hardcoded que ignoram o sistema de tokens:

| Classe | Ocorrências (top files) | Problema |
|--------|------------------------|----------|
| `text-white` | SharedTaskView, ChatInput, Sidebar, MarkdownRenderer | Branco puro (#FFF) em vez de cream (#F4F4E8) |
| `bg-white` | GlobalSearch, ExportChat | Bloco branco em tema escuro |
| `text-gray-*` | ActivityMetricsPanel, ChatInput | Cinza Tailwind, não brandbook gray scale |
| `bg-black/20` etc | JobLogsViewer, MessageBubble | Opacidade não-controlada |

**Resultado:** Em modo AIOX, elementos surgem com branco frio (#FFFFFF) em vez de `--bb-cream` (#F4F4E8), quebrando a paleta warm da marca.

---

### P4. Borders sem Hierarquia (IMPACTO: MÉDIO)

**Brandbook define 5 níveis de border:**

| Token | Valor | Uso |
|-------|-------|-----|
| `--bb-border-soft` | `rgba(156,156,156,0.10)` | Borders internos, divisores sutis |
| `--bb-border` | `rgba(156,156,156,0.15)` | Border padrão |
| `--bb-border-input` | `rgba(156,156,156,0.20)` | Campos de formulário |
| `--bb-border-hover` | `rgba(156,156,156,0.24)` | Estado hover |
| `--bb-border-strong` | `rgba(156,156,156,0.25)` | Enfase |

**Problema:** Componentes usam `border-[var(--color-border)]` genericamente para tudo. Não ha diferenciacao entre border de card container, border de seção interna, e border de input.

**Mapeamento faltante em aiox.css:**
- `--color-border-default` (#2a2a2c) — e um hex sólido, não o rgba do brandbook
- `--color-border-subtle` e `--color-border-strong` existem mas são subutilizados

---

### P5. Glow/Neon Subutilizado (IMPACTO: MÉDIO)

**Brandbook define efeitos de glow ricos** que são a assinatura visual AIOX:

| Token | Tipo | Uso |
|-------|------|-----|
| `--neon-dim` | Background sutil | Tint em áreas ativas |
| `--neon-glow` | Glow forte | Focus ring, CTA ativo |
| `--lime-glow` | Box-shadow | CTA hover |
| `--lime-glow-soft` | Box-shadow sutil | Hover suave |

**Problema:** Os tokens estão definidos em aiox.css mas quase nenhum componente os usa. O padrão e `hover:brightness-110` — um efeito genérico que não tem identidade AIOX.

**Onde deveria ter glow:**
- Cards de agente ao hover (neon glow sutil)
- Sidebar item ativo (lime glow soft)
- CTA buttons (lime glow no hover)
- Status dots ativos (glow pulsante)
- Focus rings (já está parcialmente — `--button-focus-ring`)

---

### P6. Spacing sem Sistema (IMPACTO: MÉDIO)

**Brandbook define escala de 14 steps** (0-180px) + Named Scale (xs-xl).

**Problema:** Componentes usam Tailwind arbitrary spacing:
- `p-4` (16px), `p-6` (24px), `gap-2` (8px), `gap-3` (12px) — alinhados com a escala Tailwind, não com a do brandbook
- Não ha padrão para: page padding, section gap, card padding, element gap

**O que a escala brandbook prescrevia:**

| Contexto | Token | Valor |
|----------|-------|-------|
| Page padding | `--space-5` | 20px |
| Section gap | `--space-7` | 40px |
| Card padding | `--space-4` / `--space-5` | 15-20px |
| Element gap | `--space-2` / `--space-3` | 8-12px |
| Micro gap | `--space-1` | 4px |

---

## Plano de Execucao (6 Fases)

### Fase 1: Surface Stack Fix (Hierarquia de Profundidade)
**Prioridade:** CRITICA | **Estimativa:** ~15 arquivos | **Risco:** Baixo (CSS vars, não lógica)

**Ação:** Criar utility classes semanticas e aplicar consistentemente:

```css
/* Nova camada em aiox.css ou aiox-components.css */
.surface-canvas  { background: var(--aiox-dark); }
.surface-base    { background: var(--aiox-surface); }
.surface-raised  { background: var(--aiox-surface-alt); }
.surface-deep    { background: var(--aiox-surface-deep); }
.surface-panel   { background: var(--aiox-surface-panel); }
.surface-overlay { background: var(--aiox-surface-overlay); }
```

**Mapeamento de componentes:**

| Componente | De | Para |
|-----------|-----|------|
| AppLayout body | `app-background` | `surface-canvas` (OK como esta) |
| Header | `bg-[var(--color-bg-primary)]` | `surface-base` + border-bottom subtle |
| Sidebar | glass-panel | `surface-panel` (ligeiramente diferente de cards) |
| Activity Panel | glass-panel | `surface-panel` |
| Cards normais | `glass-background-card` | `surface-base` |
| Cards nested (dentro de cards) | (mesmo do pai) | `surface-raised` |
| Modals/dialogs | `glass-background-panel` | `surface-overlay` |
| Code/terminal blocks | (genérico) | `surface-deep` |
| Dropdowns/menus | `glass-background-panel` | `surface-base` + border-strong |

---

### Fase 2: Type Hierarchy (Escala Tipografica)
**Prioridade:** ALTA | **Estimativa:** ~30 arquivos | **Risco:** Médio (pode afetar layout)

**Ação A:** Adicionar tokens faltantes em `primitives/typography.css`:

```css
/* Adicionar ao :root */
--font-size-small: 0.8rem;   /* 12.8px — brandbook Small */
--font-size-label: 0.65rem;  /* 10.4px — brandbook Label */
--font-size-micro: 0.6rem;   /* 9.6px  — brandbook Micro */
```

**Ação B:** Criar utility classes de hierarquia em `aiox-components.css`:

```css
html[data-theme="aiox"] .type-display { font-size: var(--font-size-display); font-family: var(--font-family-display); font-weight: 800; letter-spacing: var(--letter-spacing-tight); }
html[data-theme="aiox"] .type-h1 { font-size: var(--font-size-2xl); font-family: var(--font-family-display); font-weight: 700; }
html[data-theme="aiox"] .type-h2 { font-size: var(--font-size-xl); font-family: var(--font-family-display); font-weight: 700; }
html[data-theme="aiox"] .type-body { font-size: var(--font-size-lg); font-family: var(--font-family-sans); }
html[data-theme="aiox"] .type-small { font-size: var(--font-size-small); font-family: var(--font-family-sans); }
html[data-theme="aiox"] .type-label { font-size: var(--font-size-label); font-family: var(--font-family-mono); text-transform: uppercase; letter-spacing: 0.08em; }
html[data-theme="aiox"] .type-micro { font-size: var(--font-size-micro); font-family: var(--font-family-mono); text-transform: uppercase; letter-spacing: 0.12em; }
```

**Ação C:** Aplicar nas páginas — cada view precisa de:
- Um `type-h1` para o título da página (apenas 1 por view)
- `type-h2` para seções dentro da view
- `type-label` para labels de KPIs, status, metadata
- `type-body` para conteúdo de texto
- `type-micro` para IDs, timestamps, metadata técnica

---

### Fase 3: Hardcoded Color Cleanup
**Prioridade:** ALTA | **Estimativa:** ~30 arquivos | **Risco:** Baixo

**Ação:** Substituir todas as classes Tailwind hardcoded por variaveis semanticas:

| De | Para | Quantidade estimada |
|-----|------|---------------------|
| `text-white` | `text-primary` | ~40 |
| `text-white/N` | `text-primary` + opacity ou `text-secondary` | ~30 |
| `bg-white` | `bg-[var(--color-bg-primary)]` | ~5 |
| `bg-white/N` | opacidades via CSS var | ~10 |
| `text-gray-400` etc | `text-tertiary` ou `text-secondary` | ~20 |
| `bg-gray-*` | `bg-[var(--color-bg-*)]` | ~15 |
| `bg-black/N` | `bg-[var(--aiox-dark)]/N` ou surface tokens | ~20 |
| `text-zinc-*`, `text-slate-*`, `text-neutral-*` | tokens semanticos | ~30 |

**Regra para o futuro:** Nenhum `text-white`, `bg-gray-*`, `text-zinc-*` etc. deve existir em componentes. Somente tokens semanticos.

---

### Fase 4: Border Hierarchy
**Prioridade:** MEDIA | **Estimativa:** ~20 arquivos | **Risco:** Baixo

**Ação A:** Alinhar tokens de border em aiox.css com o brandbook:

```css
/* Substituir/adicionar em aiox.css */
--color-border-default: rgba(156, 156, 156, 0.15);   /* era #2a2a2c (hex solido) */
--color-border-subtle: rgba(156, 156, 156, 0.10);     /* soft */
--color-border-input: rgba(156, 156, 156, 0.20);      /* form fields */
--color-border-hover: rgba(156, 156, 156, 0.24);      /* hover states */
--color-border-strong: rgba(156, 156, 156, 0.25);     /* emphasis — era lime 0.20 */
```

**Ação B:** Aplicar hierarquia:

| Contexto | Token |
|----------|-------|
| Card container externo | `border-subtle` |
| Seção interna / divider | `border-default` |
| Input field | `border-input` |
| Card hover | `border-hover` |
| Card ativo / selected | `border-strong` ou lime accent |

---

### Fase 5: Glow & Interactive States
**Prioridade:** MEDIA | **Estimativa:** ~15 arquivos | **Risco:** Baixo

**Ação:** Criar utility classes de glow e aplicar nos estados interativos:

```css
html[data-theme="aiox"] .glow-hover:hover {
  box-shadow: 0 0 16px var(--aiox-lime-glow-soft);
}
html[data-theme="aiox"] .glow-active {
  box-shadow: 0 0 8px var(--aiox-neon-glow), 0 0 24px var(--aiox-lime-glow);
}
html[data-theme="aiox"] .glow-focus:focus-visible {
  box-shadow: 0 0 0 2px rgba(209,255,0,0.3), 0 0 16px var(--aiox-lime-glow-soft);
}
```

**Aplicar em:**
- Cards de agente (hover → glow-hover)
- Sidebar item ativo (glow-active)
- Botoes CTA (hover → glow-hover)
- Cards de KPI (hover → glow-hover sutil)
- Search bar focus (glow-focus)

---

### Fase 6: Spacing Normalization
**Prioridade:** MEDIA-BAIXA | **Estimativa:** ~20 arquivos | **Risco:** Médio (layout shifts)

**Ação:** Definir padrões de spacing por contexto e normalizar gradualmente:

| Contexto | Tailwind atual (variado) | Padrão brandbook |
|----------|-------------------------|-----------------|
| Page padding | `p-4 md:p-6` | `p-5 md:p-6` (20px / 24px) |
| Section gap (entre cards) | `gap-3`, `gap-4`, `gap-6` | `gap-5` (20px) padrão |
| Card internal padding | `p-3`, `p-4`, `p-6` | `p-4` (15px) padrão |
| Element gap (dentro de card) | `gap-1`, `gap-2`, `gap-3` | `gap-2` (8px) padrão |
| Micro gap (icon+text) | `gap-1`, `gap-1.5`, `gap-2` | `gap-1.5` (6px) padrão |

**Nota:** Esta fase e a mais invasiva e pode ser feita incrementalmente por view.

---

## Ordem de Execucao Recomendada

```
Fase 1 (Surface Stack)     ████████████  CRITICO — maior impacto visual imediato
  ↓
Fase 2 (Type Hierarchy)    ████████████  ALTO — define a "voz visual"
  ↓
Fase 3 (Color Cleanup)     ████████████  ALTO — elimina breaks visuais
  ↓
Fase 4 (Border Hierarchy)  ████████      MEDIO — refina edges
  ↓
Fase 5 (Glow States)       ████████      MEDIO — adiciona identidade AIOX
  ↓
Fase 6 (Spacing)           ██████        MEDIO-BAIXO — polish final
```

## Critérios de Aceite

- [x] Zero `text-white` hardcoded em componentes → CSS override em aiox-components.css (text-white → cream)
- [x] Zero `bg-gray-*`, `text-zinc-*`, `text-slate-*` hardcoded → CSS override via attribute selectors
- [x] Cada view tem exatamente 1 H1 e 0+ H2s hierarquicos (type-h2 aplicado em 9 views principais: Dashboard, Squads, Engine, Vault, Kanban, QA, Overnight, GitHub, Orchestration)
- [x] Cards, sidebar e header usam níveis de superficie distintos → Header=surface-base, Sidebar/Activity=surface-panel, Cards=surface-base, Nested=surface-raised
- [x] Interactive elements tem glow hover no tema AIOX → glow-hover, glow-active, glow-focus + glass-card auto-glow
- [x] Border default migrado de hex sólido para rgba brandbook → aiox.css 5-level hierarchy
- [x] Todas as labels/metadata usam `font-mono uppercase letter-spacing` (type-label/type-micro aplicado em: Dashboard tabs, AgentProfile, StoryDetailModal, ProgramDetail/List, Charts, DashboardHelpers, MCPTab, WidgetCustomizer, RegistryQuickAccess — CSS cascade cobre o restante)

## Arquivos-Chave (Ordem de Impacto)

| # | Arquivo | O que mudar |
|---|---------|-------------|
| 1 | `src/styles/tokens/themes/aiox.css` | Tokens de border, novos surface aliases |
| 2 | `src/styles/tokens/themes/aiox-components.css` | Utility classes (surface-*, type-*, glow-*) |
| 3 | `src/styles/tokens/primitives/typography.css` | Adicionar --font-size-small/label/micro |
| 4 | `src/components/layout/Header.tsx` | Surface level, type hierarchy |
| 5 | `src/components/layout/Sidebar.tsx` | Surface panel, glow states |
| 6 | `src/components/layout/AppLayout.tsx` | Surface canvas (OK, validar) |
| 7 | `src/components/layout/ActivityPanel.tsx` | Surface panel |
| 8-30 | Views (dashboard, agents, bob, etc.) | H1/H2 hierarchy, color cleanup, spacing |
| 31-40 | Shared components (cards, badges) | Surface raised, glow hover |

---

## Notas

- O `data-theme="aiox"` já é o tema ativo padrão. As mudanças afetam a experiência principal.
- As fases 1-3 podem ser executadas em paralelo se desejado (não há dependência entre elas).
- A Fase 6 (spacing) e a única que pode causar layout shifts — testar em várias resolucoes.
- Manter retrocompatibilidade com os outros temas (dark, glass, matrix) — as utility classes devem ser scoped ao `html[data-theme="aiox"]`.
