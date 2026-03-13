/**
 * Artifact Parser — Extracts structured artifacts from Claude CLI markdown output.
 *
 * Detects: code blocks, mermaid diagrams, JSON/YAML/CSV data, markdown tables,
 * and prose sections between them.
 */

export interface Artifact {
  id: string;
  type: 'markdown' | 'code' | 'diagram' | 'data' | 'table';
  language?: string;
  filename?: string;
  title?: string;
  content: string;
  lineRange: [number, number];
}

let artifactCounter = 0;
function nextId(): string {
  return `art_${Date.now().toString(36)}_${(++artifactCounter).toString(36)}`;
}

const DIAGRAM_LANGS = new Set(['mermaid', 'plantuml', 'd2', 'dot', 'graphviz']);
const DATA_LANGS = new Set(['json', 'yaml', 'yml', 'csv', 'toml', 'xml']);
const _CODE_LANGS = new Set([
  'typescript', 'ts', 'javascript', 'js', 'jsx', 'tsx',
  'python', 'py', 'rust', 'go', 'java', 'kotlin', 'swift',
  'c', 'cpp', 'csharp', 'cs', 'ruby', 'rb', 'php',
  'sql', 'bash', 'sh', 'zsh', 'fish', 'powershell', 'ps1',
  'html', 'css', 'scss', 'sass', 'less',
  'dockerfile', 'docker', 'nginx', 'apache',
  'prisma', 'graphql', 'gql', 'proto', 'protobuf',
  'lua', 'r', 'matlab', 'scala', 'elixir', 'haskell',
  'vue', 'svelte', 'astro',
]);

/** Mapping of language aliases to canonical names */
const LANG_CANONICAL: Record<string, string> = {
  ts: 'typescript', js: 'javascript', py: 'python',
  rb: 'ruby', cs: 'csharp', yml: 'yaml',
  sh: 'bash', ps1: 'powershell', gql: 'graphql',
  docker: 'dockerfile',
};

/** File extensions by language */
const LANG_EXTENSIONS: Record<string, string> = {
  typescript: '.ts', javascript: '.js', python: '.py',
  rust: '.rs', go: '.go', java: '.java', kotlin: '.kt',
  swift: '.swift', ruby: '.rb', php: '.php',
  sql: '.sql', bash: '.sh', html: '.html', css: '.css',
  scss: '.scss', yaml: '.yaml', json: '.json', csv: '.csv',
  xml: '.xml', toml: '.toml', dockerfile: 'Dockerfile',
  graphql: '.graphql', prisma: '.prisma', mermaid: '.mmd',
  plantuml: '.puml', markdown: '.md', tsx: '.tsx', jsx: '.jsx',
  vue: '.vue', svelte: '.svelte', astro: '.astro',
  csharp: '.cs', cpp: '.cpp', c: '.c',
};

/** Detect table in markdown lines */
function isMarkdownTable(lines: string[]): boolean {
  if (lines.length < 2) return false;
  const hasPipes = lines[0].includes('|') && lines[1].includes('|');
  const hasSeparator = /^\|?[\s-:|]+\|/.test(lines[1]);
  return hasPipes && hasSeparator;
}

/** Extract a suggested filename from context */
function suggestFilename(lang: string, title?: string, content?: string): string | undefined {
  // Look for filename hints in content (e.g. "// filename: auth.ts" or "# auth.py")
  if (content) {
    const filenameMatch = content.match(
      /(?:\/\/|#|--|\/\*)\s*(?:file(?:name)?|path):\s*([^\s*/]+)/i
    );
    if (filenameMatch) return filenameMatch[1];
  }

  if (!title) return undefined;

  // Slugify title and add extension
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);

  const ext = LANG_EXTENSIONS[LANG_CANONICAL[lang] || lang] || LANG_EXTENSIONS[lang];
  return ext ? `${slug}${ext}` : undefined;
}

/** Find the nearest heading above a given line index */
function findNearestHeading(lines: string[], beforeIndex: number): string | undefined {
  for (let i = beforeIndex - 1; i >= Math.max(0, beforeIndex - 5); i--) {
    const match = lines[i].match(/^#{1,4}\s+(.+)/);
    if (match) return match[1].trim();
  }
  return undefined;
}

/**
 * Parse a markdown response into structured artifacts.
 * Extracts code blocks, diagrams, data, tables, and prose sections.
 */
export function parseArtifacts(response: string): Artifact[] {
  if (!response || !response.trim()) return [];

  const lines = response.split('\n');
  const artifacts: Artifact[] = [];
  let i = 0;
  let proseStart = 0;
  let proseLines: string[] = [];

  function flushProse(endLine: number) {
    const text = proseLines.join('\n').trim();
    if (text.length > 0) {
      artifacts.push({
        id: nextId(),
        type: 'markdown',
        content: text,
        title: findNearestHeading(proseLines, 0) || undefined,
        lineRange: [proseStart, endLine],
      });
    }
    proseLines = [];
  }

  while (i < lines.length) {
    const line = lines[i];

    // Detect fenced code block: ```lang
    const codeMatch = line.match(/^(`{3,})([\w.+-]*)\s*$/);
    if (codeMatch) {
      flushProse(i);

      const fence = codeMatch[1];
      const rawLang = (codeMatch[2] || '').toLowerCase();
      const lang = LANG_CANONICAL[rawLang] || rawLang;
      const blockStart = i;
      const blockLines: string[] = [];
      i++;

      // Collect until closing fence
      while (i < lines.length && !lines[i].startsWith(fence)) {
        blockLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++; // skip closing fence

      const content = blockLines.join('\n');
      const title = findNearestHeading(lines, blockStart);

      let type: Artifact['type'];
      if (DIAGRAM_LANGS.has(rawLang) || DIAGRAM_LANGS.has(lang)) {
        type = 'diagram';
      } else if (DATA_LANGS.has(rawLang) || DATA_LANGS.has(lang)) {
        type = 'data';
      } else {
        type = 'code';
      }

      artifacts.push({
        id: nextId(),
        type,
        language: lang || undefined,
        filename: suggestFilename(rawLang || lang, title, content),
        title,
        content,
        lineRange: [blockStart, i - 1],
      });

      proseStart = i;
      continue;
    }

    // Detect markdown table
    if (line.includes('|') && i + 1 < lines.length && isMarkdownTable([line, lines[i + 1]])) {
      flushProse(i);

      const tableStart = i;
      const tableLines: string[] = [line];
      i++;

      // Collect table rows
      while (i < lines.length && lines[i].includes('|')) {
        tableLines.push(lines[i]);
        i++;
      }

      artifacts.push({
        id: nextId(),
        type: 'table',
        content: tableLines.join('\n'),
        title: findNearestHeading(lines, tableStart),
        lineRange: [tableStart, i - 1],
      });

      proseStart = i;
      continue;
    }

    // Regular prose line
    proseLines.push(line);
    i++;
  }

  // Flush remaining prose
  flushProse(lines.length);

  return artifacts;
}

/**
 * Get a file extension suggestion for an artifact.
 */
export function getArtifactExtension(artifact: Artifact): string {
  if (artifact.type === 'markdown') return '.md';
  if (artifact.type === 'table') return '.md';
  if (artifact.language) {
    const lang = LANG_CANONICAL[artifact.language] || artifact.language;
    return LANG_EXTENSIONS[lang] || `.${artifact.language}`;
  }
  return '.txt';
}

/**
 * Generate a download filename for an artifact.
 */
export function getArtifactFilename(artifact: Artifact, stepName?: string): string {
  if (artifact.filename) return artifact.filename;

  const prefix = stepName
    ? stepName.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)
    : 'output';
  const ext = getArtifactExtension(artifact);
  const suffix = artifact.type === 'markdown' ? '' : `-${artifact.type}`;

  return `${prefix}${suffix}${ext}`;
}
