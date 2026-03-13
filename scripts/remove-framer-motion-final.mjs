#!/usr/bin/env node
/**
 * FINAL comprehensive framer-motion removal script.
 * Run this single script to perform all transformations.
 * Handles all edge cases discovered during development.
 *
 * Usage: node scripts/remove-framer-motion-final.mjs
 */

import fs from 'fs';
import { execSync } from 'child_process';

const ROOT = '/Users/rafaelcosta/Downloads/apps/dashboard/aios-platform/src';

// Files explicitly excluded (keep framer-motion)
const SKIP_FILES = new Set([
  'components/ui/GlassButton.tsx',
  'components/ui/GlassCard.tsx',
  'components/ui/GlassInput.tsx',
  'components/ui/SuccessFeedback.tsx',
  'components/ui/Toast.tsx',
  'components/orchestration/OrchestrationWidgets.tsx',
  'components/orchestration/RunningTasksIndicator.tsx',
  'components/layout/Header.tsx',
  'components/kanban/KanbanBoard.tsx',
]);

const files = execSync(
  `grep -rl "from ['\\"']framer-motion['\\"']" ${ROOT}`,
  { encoding: 'utf-8' }
).trim().split('\n').filter(Boolean);

let processed = 0;

// ═══ PASS 1: Generic transformation for all files ═══
for (const filePath of files) {
  const relPath = filePath.replace(ROOT + '/', '');
  if (SKIP_FILES.has(relPath)) continue;

  let content = fs.readFileSync(filePath, 'utf-8');
  const original = content;

  content = removeFramerMotion(content, relPath);

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    processed++;
  }
}

// ═══ PASS 2: Edge case fixes ═══

// Fix createPortal({condition && (...)}, document.body) → ternary
const portalFiles = [
  'components/agents/AgentProfileExpanded.tsx',
  'components/agents/AgentProfileModal.tsx',
  'components/chat/CommandsModal.tsx',
  'components/voice/VoiceMode.tsx',
  'components/settings/APISettings.tsx',
];

for (const relPath of portalFiles) {
  const filePath = `${ROOT}/${relPath}`;
  let content = fs.readFileSync(filePath, 'utf-8');
  const orig = content;

  content = content.replace(
    /createPortal\(\s*\n\s+\{(\w+) && \(\s*\n([\s\S]*?)\s+\)\}\s*\n\s*,/g,
    (match, condition, jsx) => {
      return `createPortal(\n    ${condition} ? (\n${jsx}\n    ) : null,`;
    }
  );

  // Also handle inline pattern: {createPortal(\n  {show && (\n...\n  )}\n,\n  document.body)}
  content = content.replace(
    /\{(show\w+) && \(\s*\n([\s\S]*?)\)\}\s*,\s*\n(\s+document\.body)/,
    (match, cond, jsx, docBody) => `${cond} ? (\n${jsx}) : null,\n${docBody}`
  );

  if (content !== orig) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`[PORTAL FIX] ${relPath}`);
  }
}

// Fix OrchestrationPanels ternary: remove extra } from })} after filtered.map
{
  const filePath = `${ROOT}/components/orchestration/OrchestrationPanels.tsx`;
  let content = fs.readFileSync(filePath, 'utf-8');
  const orig = content;

  // Fix ternary branch: {filtered.map → filtered.map
  content = content.replace(
    /\) : \(\s*\n(\s+)\{(filtered\.map\()/,
    ') : (\n$1$2'
  );

  // Fix closing: })} → })
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trimEnd() === '            })}') {
      lines[i] = '            })';
      break;
    }
  }
  content = lines.join('\n');

  if (content !== orig) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('[TERNARY FIX] OrchestrationPanels.tsx');
  }
}

// Fix Ripple.tsx: wrap useCallback return in fragment
{
  const filePath = `${ROOT}/components/ui/Ripple.tsx`;
  let content = fs.readFileSync(filePath, 'utf-8');
  const orig = content;

  content = content.replace(
    /(useCallback\(\(\) => \(\s*\n)(\s+)\{(ripples\.map)/,
    '$1$2<>\n$2  {$3'
  );
  content = content.replace(
    /(\s+\)\)\}\s*\n)(\s*\), \[ripples)/,
    '$1    </>\n$2'
  );

  if (content !== orig) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('[FRAGMENT FIX] Ripple.tsx');
  }
}

// Fix ConnectionsMap: restore `layout` variable name
{
  const filePath = `${ROOT}/components/squads/ConnectionsMap.tsx`;
  let content = fs.readFileSync(filePath, 'utf-8');
  if (content.includes('const = useMemo')) {
    content = content.replace('const = useMemo', 'const layout = useMemo');
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('[VAR FIX] ConnectionsMap.tsx');
  }
}

// Fix MobileNav: rotate CSS property
{
  const filePath = `${ROOT}/components/layout/MobileNav.tsx`;
  let content = fs.readFileSync(filePath, 'utf-8');
  if (content.includes('style={{ rotate: progress * 180 }}')) {
    content = content.replace(
      'style={{ rotate: progress * 180 }}',
      'style={{ transform: `rotate(${progress * 180}deg)` }}'
    );
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('[CSS FIX] MobileNav.tsx');
  }
}

// Fix CategoryManager: onDragStart type cast
{
  const filePath = `${ROOT}/components/settings/CategoryManager.tsx`;
  let content = fs.readFileSync(filePath, 'utf-8');
  const orig = content;
  content = content.replace(
    /onDragStart=\{\(\(e: React\.DragEvent<HTMLDivElement>\) => \{\s*e\.dataTransfer\.setData\('squadId', squad\.id\);\s*\}\) as unknown as \(event: MouseEvent \| TouchEvent \| PointerEvent\) => void\}/,
    'onDragStart={(e: React.DragEvent<HTMLDivElement>) => { e.dataTransfer.setData("squadId", squad.id); }}'
  );
  if (content !== orig) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('[TYPE FIX] CategoryManager.tsx');
  }
}

// ═══ PASS 3: Fix remaining framer-motion props with nested braces ═══
const propFixFiles = [
  'components/agents/AgentCard.tsx',
  'components/dashboard/LiveMetricCard.tsx',
  'components/layout/AgentCommandsPanel.tsx',
  'components/layout/MobileNav.tsx',
  'components/orchestration/AgentOutputCard.tsx',
  'components/ui/NetworkStatus.tsx',
  'components/world/AgentSprite.tsx',
  'components/world/IsometricTile.tsx',
];

const deepProps = [
  'initial', 'animate', 'exit', 'transition', 'variants',
  'whileHover', 'whileTap', 'whileFocus', 'whileInView',
];

for (const relPath of propFixFiles) {
  const filePath = `${ROOT}/${relPath}`;
  let content = fs.readFileSync(filePath, 'utf-8');
  const orig = content;

  // Deep prop removal: track brace depth
  for (const prop of deepProps) {
    const regex = new RegExp(`\\s+${prop}=\\{`);
    let match;
    while ((match = regex.exec(content)) !== null) {
      const startIdx = match.index;
      const braceStart = startIdx + match[0].length - 1;
      let depth = 0;
      let endIdx = -1;
      for (let j = braceStart; j < content.length; j++) {
        if (content[j] === '{') depth++;
        if (content[j] === '}') depth--;
        if (depth === 0) {
          endIdx = j + 1;
          break;
        }
      }
      if (endIdx > 0) {
        content = content.substring(0, startIdx) + content.substring(endIdx);
      } else {
        break; // Avoid infinite loop
      }
    }
  }

  if (content !== orig) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`[DEEP PROP FIX] ${relPath}`);
  }
}

console.log(`\nTotal processed in pass 1: ${processed} files`);

// Report remaining
try {
  const remaining = execSync(
    `grep -rl "from ['\\"']framer-motion['\\"']" ${ROOT} 2>/dev/null || true`,
    { encoding: 'utf-8' }
  ).trim().split('\n').filter(Boolean);
  console.log(`Remaining files with framer-motion: ${remaining.length}`);
  remaining.forEach(f => console.log(`  ${f.replace(ROOT + '/', '')}`));
} catch {
  console.log('No remaining files with framer-motion');
}

// ═══ Generic removal function ═══
function removeFramerMotion(content, debugName) {
  // Remove AnimatePresence tags
  content = content.replace(/<AnimatePresence[^>]*>\s*\n?/g, '');
  content = content.replace(/\s*<\/AnimatePresence>\s*\n?/g, '\n');

  // Replace motion.X with plain HTML
  const elements = [
    'div', 'button', 'span', 'p', 'li', 'ul', 'ol', 'section', 'aside',
    'nav', 'header', 'footer', 'a', 'label', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'img', 'input', 'textarea', 'form', 'main', 'article', 'figure', 'figcaption',
    'svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'g', 'text',
    'tr', 'td', 'th', 'table', 'thead', 'tbody'
  ];
  for (const el of elements) {
    content = content.replace(new RegExp(`<motion\\.${el}(\\s|>|\\/)`, 'g'), `<${el}$1`);
    content = content.replace(new RegExp(`<\\/motion\\.${el}>`, 'g'), `</${el}>`);
  }

  // Remove framer-motion props (simple cases)
  const props = [
    'initial', 'animate', 'exit', 'transition', 'variants',
    'whileHover', 'whileTap', 'whileFocus', 'whileInView',
    'layoutId', 'onAnimationStart', 'onAnimationComplete',
    'custom', 'drag', 'dragConstraints', 'onDragStart', 'onDragEnd',
    'dragListener', 'dragMomentum', 'dragSnapToOrigin', 'dragElastic',
  ];
  for (const prop of props) {
    content = content.replace(new RegExp(`\\s+${prop}=\\{\\{[^}]*(?:\\{[^}]*\\}[^}]*)*\\}\\}`, 'g'), '');
    content = content.replace(new RegExp(`\\s+${prop}=\\{[^{}]*\\}`, 'g'), '');
    content = content.replace(new RegExp(`\\s+${prop}="[^"]*"`, 'g'), '');
  }

  // Remove bare `layout` prop (JSX boolean) - but NOT the variable `const layout`
  // Only match when preceded by whitespace and followed by whitespace, >, or /
  // and NOT when it's part of `const layout` or `let layout` etc.
  content = content.replace(/^(\s+)layout$/gm, ''); // layout on its own line
  content = content.replace(/(\s)layout(\s*[>\\/])/g, '$1$2'); // layout before > or /
  content = content.replace(/(\s)layout(\s+\w+=)/g, '$1$2'); // layout before next prop

  // Handle Reorder components
  content = content.replace(/<Reorder\.Group[^>]*>/g, (match) => {
    const classMatch = match.match(/className=\{[^}]+\}/) || match.match(/className="([^"]*)"/);
    const cls = classMatch ? ` ${classMatch[0]}` : '';
    return `<div${cls}>`;
  });
  content = content.replace(/<\/Reorder\.Group>/g, '</div>');
  content = content.replace(/<Reorder\.Item[^>]*>/g, (match) => {
    const classMatch = match.match(/className=\{[^}]+\}/) || match.match(/className="([^"]*)"/);
    const cls = classMatch ? ` ${classMatch[0]}` : '';
    return `<div${cls}>`;
  });
  content = content.replace(/<\/Reorder\.Item>/g, '</div>');

  // Remove framer-motion import
  content = content.replace(/import\s+\{[^}]*\}\s+from\s+['"]framer-motion['"];?\s*\n/g, '');

  // LiveMetricCard: replace AnimatedNumber
  if (debugName && debugName.includes('LiveMetricCard')) {
    content = content.replace(
      /\/\/ Animated counting number[\s\S]*?return <span>\{text\}<\/span>;\s*\n\}/,
      `// Display formatted number (no animation)\nfunction AnimatedNumber({ value, format, prefix, suffix }: { value: number; format?: LiveMetricCardProps['format']; prefix?: string; suffix?: string }) {\n  return <span>{formatValue(value, format, prefix, suffix)}</span>;\n}`
    );
  }

  // Fix JSX: return (\n  {condition && (...)} \n);  → wrap in fragment
  const lines = content.split('\n');
  const fixed = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const isReturn = /^\s*return\s*\(\s*$/.test(line);

    if (isReturn && i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      if (/^\s+\{/.test(nextLine) && !/^\s+</.test(nextLine)) {
        const indent = nextLine.match(/^(\s+)/)?.[1] || '    ';
        fixed.push(line);
        fixed.push(`${indent}<>`);
        i++;
        let depth = 1;
        while (i < lines.length) {
          const cur = lines[i];
          for (const ch of cur) {
            if (ch === '(') depth++;
            if (ch === ')') depth--;
          }
          if (depth <= 0) {
            fixed.push(`${indent}</>`);
            fixed.push(cur);
            i++;
            break;
          }
          fixed.push(cur);
          i++;
        }
        continue;
      }
    }
    fixed.push(line);
    i++;
  }
  content = fixed.join('\n');

  // Remove Reorder-specific props
  content = content.replace(/\s+axis="[^"]*"/g, '');
  content = content.replace(/\s+values=\{[^{}]*\}/g, '');
  content = content.replace(/\s+onReorder=\{[^{}]*\}/g, '');
  content = content.replace(/\s+value=\{category\}/g, '');
  content = content.replace(/\s+value=\{squad\.id\}/g, '');

  // Clean up blank lines
  content = content.replace(/\n{4,}/g, '\n\n\n');

  return content;
}
