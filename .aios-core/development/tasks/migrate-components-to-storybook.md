# Migrate Components to Storybook

> **Task ID:** migrate-components-to-storybook
> **Agent:** @ux-design-expert (Uma)
> **Version:** 1.0.0
> **Phase:** Migration

---

## Execution Modes

### 1. YOLO Mode - Batch Migration (0-1 prompts)
- Migrates all components in batch
- Minimal user interaction
- **Best for:** Simple UI components, well-documented source

### 2. Interactive Mode - Component by Component **[DEFAULT]**
- Reviews each component before migration
- Asks for clarification on complex cases
- **Best for:** Complex components, first-time migration

### 3. Dry-Run Mode - Analysis Only
- Scans and reports without changes
- Generates migration plan
- **Best for:** Planning, estimating effort

---

## Task Definition

```yaml
task: migrateComponentsToStorybook()
responsável: Uma (Empathizer)
responsavel_type: Agente
atomic_layer: Workflow

Entrada:
  - campo: source_dir
    tipo: string
    origem: User Input
    obrigatório: true
    validação: Must be valid directory with React components
    exemplo: "./aios-platform/src/components"

  - campo: target_dir
    tipo: string
    origem: User Input
    obrigatório: true
    validação: Must be valid Storybook project
    exemplo: "./glass-ui"

  - campo: category
    tipo: string
    origem: User Input
    obrigatório: false
    validação: Component category to migrate (ui, layout, agents, world, etc)
    exemplo: "ui"

  - campo: component
    tipo: string
    origem: User Input
    obrigatório: false
    validação: Single component name to migrate
    exemplo: "GlassCard"

  - campo: batch_size
    tipo: number
    origem: User Input
    obrigatório: false
    default: 5
    validação: 1-20

  - campo: dry_run
    tipo: boolean
    origem: User Input
    obrigatório: false
    default: false

  - campo: with_tests
    tipo: boolean
    origem: User Input
    obrigatório: false
    default: true

Saída:
  - campo: migrated_components
    tipo: array
    destino: Report
    persistido: true

  - campo: stories_created
    tipo: array
    destino: File system
    persistido: true

  - campo: tests_created
    tipo: array
    destino: File system
    persistido: true

  - campo: migration_report
    tipo: object
    destino: docs/migration-reports/
    persistido: true
```

---

## Pre-Conditions

```yaml
pre-conditions:
  - [ ] Source directory exists and contains .tsx files
    blocker: true
  - [ ] Target directory has Storybook configured (.storybook/)
    blocker: true
  - [ ] Target has cn() utility available
    blocker: true
  - [ ] Target has design tokens configured
    blocker: false (warning only)
```

---

## Usage

```bash
# Activate agent
@ux-design-expert

# Migrate single component
*migrate-to-storybook --component=GlassCard --source=./aios-platform/src/components --target=./glass-ui

# Migrate category
*migrate-to-storybook --category=ui --source=./aios-platform/src/components --target=./glass-ui

# Migrate all (dry-run first)
*migrate-to-storybook --source=./aios-platform/src/components --target=./glass-ui --dry-run

# Migrate all with tests
*migrate-to-storybook --source=./aios-platform/src/components --target=./glass-ui --with-tests
```

---

## Workflow Steps

### Step 1: Scan Source Directory
```
1. Find all .tsx files (excluding .test.tsx, .stories.tsx)
2. Categorize by directory (ui/, layout/, agents/, etc)
3. Detect existing stories in source
4. Build dependency graph
5. Output: Component inventory with metadata
```

### Step 2: Analyze Each Component
```
For each component:
1. Parse TypeScript AST
2. Extract:
   - Props interface
   - Variants (if using cva)
   - Internal dependencies
   - External dependencies (npm)
   - Design tokens used
   - Tailwind classes
3. Score complexity (Low/Medium/High)
4. Identify migration challenges
```

### Step 3: Prepare Target Structure
```
1. Create directories if needed:
   - glass-ui/src/components/{category}/
   - glass-ui/stories/{category}/
2. Check for naming conflicts
3. Prepare import mappings
```

### Step 4: Migrate Component
```
For each component:
1. Copy component file
2. Transform imports:
   - @/components/ui/* → ../ui/*
   - @/lib/utils → ../../lib/utils
   - @/hooks/* → ../../hooks/*
3. Adapt to glass-ui tokens if needed
4. Validate TypeScript compiles
```

### Step 5: Generate Story
```
1. Create {Component}.stories.tsx
2. Include:
   - Meta with title, component, tags
   - Default story
   - All variants as separate stories
   - Interactive controls
   - Documentation
3. Template:
```

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { {Component} } from '../src/components/{category}/{Component}';

const meta: Meta<typeof {Component}> = {
  title: '{Category}/{Component}',
  component: {Component},
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'glass-dark',
    },
  },
  argTypes: {
    // Generated from props
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // Default props
  },
};

// Additional variants...
```

### Step 6: Generate Tests (Optional)
```
1. Create {Component}.test.tsx
2. Include:
   - Render test
   - Props test
   - Accessibility test (jest-axe)
   - Interaction tests
3. Target: >80% coverage
```

### Step 7: Update Exports
```
1. Add to glass-ui/src/index.ts
2. Update barrel exports
3. Validate all exports work
```

### Step 8: Generate Report
```
Output migration report:
- Components migrated
- Stories created
- Tests created
- Issues found
- Manual fixes needed
```

---

## Output Structure

```
glass-ui/
├── src/
│   └── components/
│       ├── ui/
│       │   ├── GlassCard.tsx
│       │   ├── GlassButton.tsx
│       │   └── ...
│       ├── agents/
│       │   ├── AgentCard.tsx
│       │   └── ...
│       └── world/
│           ├── IsometricTile.tsx
│           └── ...
├── stories/
│   ├── ui/
│   │   ├── GlassCard.stories.tsx
│   │   └── ...
│   ├── agents/
│   │   └── ...
│   └── world/
│       └── ...
└── __tests__/
    └── components/
        └── ...
```

---

## Migration Report Template

```markdown
# Migration Report: {timestamp}

## Summary
- **Source:** {source_dir}
- **Target:** {target_dir}
- **Components Found:** {total}
- **Successfully Migrated:** {success}
- **Failed:** {failed}
- **Skipped:** {skipped}

## By Category
| Category | Found | Migrated | Stories | Tests |
|----------|-------|----------|---------|-------|
| ui | 18 | 18 | 18 | 15 |
| layout | 6 | 6 | 6 | 4 |
| ... | ... | ... | ... | ... |

## Issues Found
1. **{Component}**: {issue description}
   - Suggested fix: {fix}

## Manual Fixes Required
- [ ] {Component}: {what needs manual attention}

## Next Steps
1. Run `npm run storybook` to verify
2. Fix any TypeScript errors
3. Complete manual fixes
4. Run tests: `npm test`
```

---

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| `SOURCE_NOT_FOUND` | Source dir doesn't exist | Verify path |
| `NO_COMPONENTS` | No .tsx files found | Check source structure |
| `STORYBOOK_NOT_CONFIGURED` | No .storybook/ in target | Run `npx storybook init` |
| `IMPORT_RESOLUTION_FAILED` | Cannot resolve imports | Check tsconfig paths |
| `TYPESCRIPT_ERROR` | Component doesn't compile | Fix type errors first |
| `DEPENDENCY_MISSING` | npm package not installed | Add to target package.json |

---

## Success Criteria

- [ ] All components compile without TypeScript errors
- [ ] All stories render in Storybook
- [ ] No hardcoded color/spacing values
- [ ] Accessibility tests pass
- [ ] Migration report generated
- [ ] Index exports updated

---

## Related

- **Task:** `build-component.md` - For building new components
- **Task:** `ux-ds-scan-artifact.md` - For scanning design artifacts
- **Agent:** @ux-design-expert (Uma)
- **Schema:** Component migration schema

---

## Examples

### Example 1: Migrate UI Category

```bash
@ux-design-expert
*migrate-to-storybook --category=ui --source=./aios-platform/src/components --target=./glass-ui

# Output:
🔍 Scanning ./aios-platform/src/components/ui/...
   Found 18 components

📦 Migrating UI components to glass-ui...

  ✅ GlassCard.tsx → glass-ui/src/components/ui/
     └── Created GlassCard.stories.tsx
     └── Created GlassCard.test.tsx

  ✅ GlassButton.tsx → glass-ui/src/components/ui/
     └── Created GlassButton.stories.tsx
     └── Created GlassButton.test.tsx

  ... (16 more)

📊 Migration Complete!
   ✅ 18/18 components migrated
   ✅ 18 stories created
   ✅ 18 tests created
   ⚠️ 2 manual fixes needed (see report)

📄 Report saved: docs/migration-reports/ui-2026-02-25.md
```

### Example 2: Dry Run

```bash
*migrate-to-storybook --source=./aios-platform/src/components --target=./glass-ui --dry-run

# Output:
🔍 DRY RUN - No files will be modified

📊 Migration Analysis:
   Total components: 95

   By Category:
   - ui: 18 (12 Low, 4 Medium, 2 High complexity)
   - layout: 6 (2 Low, 2 Medium, 2 High)
   - agents: 8 (3 Low, 3 Medium, 2 High)
   - world: 15 (5 Low, 7 Medium, 3 High)
   ...

   Dependencies to install:
   - @radix-ui/react-context-menu
   - framer-motion

   Potential issues:
   - 3 components use deprecated APIs
   - 5 components missing prop types

💡 Recommendation: Start with 'ui' category (simplest)
```
