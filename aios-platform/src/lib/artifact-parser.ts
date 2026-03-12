/**
 * Frontend artifact parser — extracts structured artifacts from markdown responses.
 * Mirror of engine/src/lib/artifact-parser.ts for client-side use when artifacts
 * aren't already provided by the SSE stream (e.g., viewing history from Supabase).
 */
import type { TaskArtifact } from '../services/api/tasks';

const DIAGRAM_LANGS = new Set(['mermaid', 'plantuml', 'd2', 'dot', 'graphviz']);
const DATA_LANGS = new Set(['json', 'yaml', 'yml', 'csv', 'toml', 'xml']);

const LANG_CANONICAL: Record<string, string> = {
  ts: 'typescript', js: 'javascript', py: 'python',
  rb: 'ruby', cs: 'csharp', yml: 'yaml',
  sh: 'bash', ps1: 'powershell', gql: 'graphql',
  docker: 'dockerfile',
};

const LANG_EXTENSIONS: Record<string, string> = {
  typescript: '.ts', javascript: '.js', python: '.py',
  rust: '.rs', go: '.go', java: '.java', kotlin: '.kt',
  swift: '.swift', ruby: '.rb', php: '.php',
  sql: '.sql', bash: '.sh', html: '.html', css: '.css',
  scss: '.scss', yaml: '.yaml', json: '.json', csv: '.csv',
  xml: '.xml', toml: '.toml', dockerfile: 'Dockerfile',
  graphql: '.graphql', prisma: '.prisma', mermaid: '.mmd',
  plantuml: '.puml', markdown: '.md', tsx: '.tsx', jsx: '.jsx',
};

let counter = 0;
function nextId(): string {
  return `art_${Date.now().toString(36)}_${(++counter).toString(36)}`;
}

function isMarkdownTable(lines: string[]): boolean {
  if (lines.length < 2) return false;
  return lines[0].includes('|') && lines[1].includes('|') && /^\|?[\s-:|]+\|/.test(lines[1]);
}

function findNearestHeading(lines: string[], beforeIndex: number): string | undefined {
  for (let i = beforeIndex - 1; i >= Math.max(0, beforeIndex - 5); i--) {
    const match = lines[i].match(/^#{1,4}\s+(.+)/);
    if (match) return match[1].trim();
  }
  return undefined;
}

/** Parse markdown into structured artifacts (client-side) */
export function parseArtifacts(response: string): TaskArtifact[] {
  if (!response?.trim()) return [];

  const lines = response.split('\n');
  const artifacts: TaskArtifact[] = [];
  let i = 0;
  let proseLines: string[] = [];
  let proseStart = 0;

  function flushProse(endLine: number) {
    const text = proseLines.join('\n').trim();
    if (text.length > 0) {
      artifacts.push({
        id: nextId(),
        type: 'markdown',
        content: text,
        title: findNearestHeading(proseLines, 0),
        lineRange: [proseStart, endLine],
      });
    }
    proseLines = [];
  }

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    const codeMatch = line.match(/^(`{3,})([\w.+-]*)\s*$/);
    if (codeMatch) {
      flushProse(i);
      const fence = codeMatch[1];
      const rawLang = (codeMatch[2] || '').toLowerCase();
      const lang = LANG_CANONICAL[rawLang] || rawLang;
      const blockStart = i;
      const blockLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith(fence)) {
        blockLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++;

      const content = blockLines.join('\n');
      const title = findNearestHeading(lines, blockStart);
      let type: TaskArtifact['type'];
      if (DIAGRAM_LANGS.has(rawLang) || DIAGRAM_LANGS.has(lang)) type = 'diagram';
      else if (DATA_LANGS.has(rawLang) || DATA_LANGS.has(lang)) type = 'data';
      else type = 'code';

      artifacts.push({ id: nextId(), type, language: lang || undefined, title, content, lineRange: [blockStart, i - 1] });
      proseStart = i;
      continue;
    }

    // Markdown table
    if (line.includes('|') && i + 1 < lines.length && isMarkdownTable([line, lines[i + 1]])) {
      flushProse(i);
      const tableStart = i;
      const tableLines: string[] = [line];
      i++;
      while (i < lines.length && lines[i].includes('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      artifacts.push({ id: nextId(), type: 'table', content: tableLines.join('\n'), title: findNearestHeading(lines, tableStart), lineRange: [tableStart, i - 1] });
      proseStart = i;
      continue;
    }

    proseLines.push(line);
    i++;
  }

  flushProse(lines.length);
  return artifacts;
}

/** Get file extension for artifact */
export function getArtifactExtension(artifact: TaskArtifact): string {
  if (artifact.type === 'markdown' || artifact.type === 'table') return '.md';
  if (artifact.language) {
    const lang = LANG_CANONICAL[artifact.language] || artifact.language;
    return LANG_EXTENSIONS[lang] || `.${artifact.language}`;
  }
  return '.txt';
}

/** Generate download filename for artifact */
export function getArtifactFilename(artifact: TaskArtifact, stepName?: string): string {
  if (artifact.filename) return artifact.filename;
  const prefix = stepName?.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30) || 'output';
  const ext = getArtifactExtension(artifact);
  const suffix = artifact.type === 'markdown' ? '' : `-${artifact.type}`;
  return `${prefix}${suffix}${ext}`;
}

/** Get icon name for artifact type */
export function getArtifactIcon(type: TaskArtifact['type']): string {
  switch (type) {
    case 'code': return 'Code2';
    case 'diagram': return 'GitBranch';
    case 'data': return 'Database';
    case 'table': return 'Table2';
    case 'markdown': return 'FileText';
    default: return 'File';
  }
}

/** Get label for artifact type */
export function getArtifactLabel(type: TaskArtifact['type']): string {
  switch (type) {
    case 'code': return 'Código';
    case 'diagram': return 'Diagrama';
    case 'data': return 'Dados';
    case 'table': return 'Tabela';
    case 'markdown': return 'Texto';
    default: return 'Arquivo';
  }
}
