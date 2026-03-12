/**
 * Task Export utilities — JSON, Markdown, and ZIP export for completed orchestrations.
 * Supports structured artifact extraction, individual file downloads, and bundled exports.
 */
import type { Task, TaskArtifact } from '../services/api/tasks';
import { parseArtifacts, getArtifactFilename, getArtifactExtension } from './artifact-parser';

// ── Helpers ──────────────────────────────────────

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadText(content: string, filename: string, mimeType = 'text/plain'): void {
  downloadBlob(new Blob([content], { type: mimeType }), filename);
}

function slugify(text: string, maxLen = 40): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, maxLen);
}

/** Get all artifacts from a task, parsing from response if not already present */
function getAllArtifacts(task: Task): Array<{ stepName: string; artifact: TaskArtifact }> {
  const results: Array<{ stepName: string; artifact: TaskArtifact }> = [];
  for (const output of task.outputs) {
    const response = output.output.response || output.output.content || '';
    const artifacts = output.output.artifacts?.length
      ? output.output.artifacts
      : parseArtifacts(response);
    for (const artifact of artifacts) {
      results.push({ stepName: output.stepName, artifact });
    }
  }
  return results;
}

// ── JSON Export ──────────────────────────────────

export function exportTaskAsJSON(task: Task): void {
  const allArtifacts = getAllArtifacts(task);
  const data = {
    id: task.id,
    demand: task.demand,
    status: task.status,
    createdAt: task.createdAt,
    startedAt: task.startedAt,
    completedAt: task.completedAt,
    totalTokens: task.totalTokens,
    totalDuration: task.totalDuration,
    stepCount: task.stepCount,
    completedSteps: task.completedSteps,
    squads: task.squads,
    outputs: task.outputs.map((o) => ({
      stepId: o.stepId,
      stepName: o.stepName,
      agent: o.output.agent,
      response: o.output.response || o.output.content || '',
      artifacts: (o.output.artifacts || []).map(a => ({
        type: a.type,
        language: a.language,
        filename: a.filename,
        title: a.title,
        content: a.content,
      })),
      processingTimeMs: o.output.processingTimeMs,
      tokens: o.output.llmMetadata,
    })),
    artifacts: {
      total: allArtifacts.length,
      byType: {
        code: allArtifacts.filter(a => a.artifact.type === 'code').length,
        diagram: allArtifacts.filter(a => a.artifact.type === 'diagram').length,
        data: allArtifacts.filter(a => a.artifact.type === 'data').length,
        table: allArtifacts.filter(a => a.artifact.type === 'table').length,
        markdown: allArtifacts.filter(a => a.artifact.type === 'markdown').length,
      },
    },
    error: task.error,
  };

  downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), `task-${task.id.slice(0, 8)}.json`);
}

// ── Markdown Export ──────────────────────────────

export function exportTaskAsMarkdown(task: Task): string {
  const lines: string[] = [];
  const durationSec = task.totalDuration ? Math.round(task.totalDuration / 1000) : null;

  lines.push(`# Orchestration Report`);
  lines.push('');
  lines.push(`**Demand:** ${task.demand}`);
  lines.push(`**Status:** ${task.status}`);
  lines.push(`**Created:** ${task.createdAt}`);
  if (task.startedAt) lines.push(`**Started:** ${task.startedAt}`);
  if (task.completedAt) lines.push(`**Completed:** ${task.completedAt}`);
  if (durationSec !== null) lines.push(`**Duration:** ${durationSec}s`);
  if (task.totalTokens) lines.push(`**Total Tokens:** ${task.totalTokens.toLocaleString()}`);
  lines.push('');

  if (task.squads.length > 0) {
    lines.push(`## Squads`);
    lines.push('');
    task.squads.forEach((squad) => {
      lines.push(`### ${squad.squadId} (Chief: ${squad.chief})`);
      if (squad.agents?.length) {
        squad.agents.forEach((a) => lines.push(`- ${a.name || a.id}`));
      }
      lines.push('');
    });
  }

  if (task.outputs.length > 0) {
    lines.push(`## Agent Outputs`);
    lines.push('');
    task.outputs.forEach((output, idx) => {
      const agentName = output.output.agent?.name || output.output.agent?.id || 'Agent';
      const response = output.output.response || output.output.content || '';
      const timeMs = output.output.processingTimeMs;
      lines.push(`### Step ${idx + 1}: ${output.stepName}`);
      lines.push(`**Agent:** ${agentName}`);
      if (timeMs) lines.push(`**Processing Time:** ${Math.round(timeMs / 1000)}s`);
      lines.push('');
      if (response) {
        lines.push(response);
        lines.push('');
      }
      lines.push('---');
      lines.push('');
    });
  }

  if (task.error) {
    lines.push(`## Error`);
    lines.push('');
    lines.push(`\`\`\`\n${task.error}\n\`\`\``);
    lines.push('');
  }

  lines.push(`---`);
  lines.push(`*Exported from AIOS Platform*`);

  const markdown = lines.join('\n');
  downloadBlob(new Blob([markdown], { type: 'text/markdown' }), `task-${task.id.slice(0, 8)}.md`);
  return markdown;
}

// ── ZIP Export ──────────────────────────────────
// Uses in-memory ZIP creation (no external dependency)

interface ZipEntry {
  path: string;
  content: string;
}

/**
 * Creates a ZIP file blob from an array of text entries.
 * Minimal ZIP implementation — no compression (STORED), supports UTF-8 filenames.
 */
function createZipBlob(entries: ZipEntry[]): Blob {
  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];
  const centralDir: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.path);
    const contentBytes = encoder.encode(entry.content);

    // Local file header
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(localHeader.buffer);
    lv.setUint32(0, 0x04034b50, true);   // signature
    lv.setUint16(4, 20, true);            // version needed
    lv.setUint16(6, 0x0800, true);        // flags (UTF-8)
    lv.setUint16(8, 0, true);             // compression: STORED
    lv.setUint16(10, 0, true);            // mod time
    lv.setUint16(12, 0, true);            // mod date
    lv.setUint32(14, crc32(contentBytes), true);
    lv.setUint32(18, contentBytes.length, true);
    lv.setUint32(22, contentBytes.length, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);            // extra field length
    localHeader.set(nameBytes, 30);

    parts.push(localHeader);
    parts.push(contentBytes);

    // Central directory entry
    const centralEntry = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(centralEntry.buffer);
    cv.setUint32(0, 0x02014b50, true);   // signature
    cv.setUint16(4, 20, true);            // version made by
    cv.setUint16(6, 20, true);            // version needed
    cv.setUint16(8, 0x0800, true);        // flags (UTF-8)
    cv.setUint16(10, 0, true);            // compression
    cv.setUint16(12, 0, true);            // mod time
    cv.setUint16(14, 0, true);            // mod date
    cv.setUint32(16, crc32(contentBytes), true);
    cv.setUint32(20, contentBytes.length, true);
    cv.setUint32(24, contentBytes.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0x20, true);         // external attrs
    cv.setUint32(42, offset, true);       // local header offset
    centralEntry.set(nameBytes, 46);

    centralDir.push(centralEntry);
    offset += localHeader.length + contentBytes.length;
  }

  const centralDirOffset = offset;
  let centralDirSize = 0;
  for (const cd of centralDir) {
    parts.push(cd);
    centralDirSize += cd.length;
  }

  // End of central directory
  const endRecord = new Uint8Array(22);
  const ev = new DataView(endRecord.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, centralDirSize, true);
  ev.setUint32(16, centralDirOffset, true);
  ev.setUint16(20, 0, true);
  parts.push(endRecord);

  return new Blob(parts as BlobPart[], { type: 'application/zip' });
}

/** CRC-32 lookup table */
const crcTable: number[] = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = crcTable[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Export task as a ZIP bundle containing all artifacts organized by type.
 */
export function exportTaskAsZip(task: Task): void {
  const prefix = `task-${task.id.slice(0, 8)}`;
  const entries: ZipEntry[] = [];
  const allArtifacts = getAllArtifacts(task);
  const usedFilenames = new Set<string>();

  // Deduplicate filenames
  function uniqueName(dir: string, name: string): string {
    let path = `${prefix}/${dir}/${name}`;
    let counter = 1;
    while (usedFilenames.has(path)) {
      const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')) : '';
      const base = name.includes('.') ? name.slice(0, name.lastIndexOf('.')) : name;
      path = `${prefix}/${dir}/${base}-${counter}${ext}`;
      counter++;
    }
    usedFilenames.add(path);
    return path;
  }

  // manifest.json
  const manifest = {
    version: '1.0',
    taskId: task.id,
    demand: task.demand,
    status: task.status,
    createdAt: task.createdAt,
    completedAt: task.completedAt,
    totalTokens: task.totalTokens,
    totalDuration: task.totalDuration,
    squads: task.squads.map(s => ({ id: s.squadId, chief: s.chief, agents: s.agents.length })),
    artifacts: allArtifacts.map(({ stepName, artifact }) => ({
      type: artifact.type,
      language: artifact.language,
      filename: artifact.filename || getArtifactFilename(artifact, stepName),
      title: artifact.title,
      step: stepName,
    })),
    exportedAt: new Date().toISOString(),
    exportedBy: 'AIOS Platform',
  };
  entries.push({ path: `${prefix}/manifest.json`, content: JSON.stringify(manifest, null, 2) });

  // README.md
  const readmeLines = [
    `# ${task.demand}`,
    '',
    `**Status:** ${task.status}`,
    `**Created:** ${task.createdAt || 'N/A'}`,
    task.totalDuration ? `**Duration:** ${Math.round(task.totalDuration / 1000)}s` : '',
    task.totalTokens ? `**Tokens:** ${task.totalTokens.toLocaleString()}` : '',
    '',
    '## Contents',
    '',
    ...allArtifacts
      .filter(a => a.artifact.type !== 'markdown')
      .map(({ stepName, artifact }) => `- **${artifact.title || artifact.filename || stepName}** (${artifact.type}${artifact.language ? `: ${artifact.language}` : ''})`),
    '',
    '---',
    '*Generated by AIOS Platform*',
  ].filter(Boolean);
  entries.push({ path: `${prefix}/README.md`, content: readmeLines.join('\n') });

  // Organize artifacts by type
  for (const { stepName, artifact } of allArtifacts) {
    const filename = artifact.filename || getArtifactFilename(artifact, stepName);
    let dir: string;
    switch (artifact.type) {
      case 'code': dir = 'code'; break;
      case 'diagram': dir = 'diagrams'; break;
      case 'data': dir = 'data'; break;
      case 'table': dir = 'data'; break;
      case 'markdown': dir = 'docs'; break;
      default: dir = 'other';
    }
    entries.push({ path: uniqueName(dir, filename), content: artifact.content });
  }

  // Full report as markdown
  const fullReport = exportTaskAsMarkdownString(task);
  entries.push({ path: `${prefix}/docs/full-report.md`, content: fullReport });

  const blob = createZipBlob(entries);
  downloadBlob(blob, `${prefix}.zip`);
}

/** Generate markdown string without downloading (for ZIP inclusion) */
function exportTaskAsMarkdownString(task: Task): string {
  const lines: string[] = [];
  const durationSec = task.totalDuration ? Math.round(task.totalDuration / 1000) : null;

  lines.push(`# Orchestration Report`);
  lines.push('');
  lines.push(`**Demand:** ${task.demand}`);
  lines.push(`**Status:** ${task.status}`);
  if (task.createdAt) lines.push(`**Created:** ${task.createdAt}`);
  if (durationSec !== null) lines.push(`**Duration:** ${durationSec}s`);
  if (task.totalTokens) lines.push(`**Total Tokens:** ${task.totalTokens.toLocaleString()}`);
  lines.push('');

  task.outputs.forEach((output, idx) => {
    const agentName = output.output.agent?.name || 'Agent';
    const response = output.output.response || output.output.content || '';
    lines.push(`## Step ${idx + 1}: ${output.stepName}`);
    lines.push(`**Agent:** ${agentName}`);
    lines.push('');
    if (response) lines.push(response);
    lines.push('');
    lines.push('---');
    lines.push('');
  });

  if (task.error) {
    lines.push(`## Error`);
    lines.push(`\`\`\`\n${task.error}\n\`\`\``);
  }

  return lines.join('\n');
}

// ── Download Individual Artifact ──────────────────

export function downloadArtifact(artifact: TaskArtifact, stepName?: string): void {
  const filename = artifact.filename || getArtifactFilename(artifact, stepName);
  const mimeMap: Record<string, string> = {
    json: 'application/json', yaml: 'text/yaml', csv: 'text/csv',
    xml: 'application/xml', html: 'text/html', typescript: 'text/typescript',
    javascript: 'text/javascript', python: 'text/x-python', sql: 'text/plain',
    mermaid: 'text/plain', markdown: 'text/markdown',
  };
  const mime = artifact.language ? (mimeMap[artifact.language] || 'text/plain') : 'text/plain';
  downloadText(artifact.content, filename, mime);
}

// ── Summary (for chat) ──────────────────────────

export function formatOrchestrationSummary(state: {
  demand: string;
  status: string;
  squadSelections: Array<{ squadId: string; chief: string; agents: Array<{ id: string; name: string }> }>;
  agentOutputs: Array<{
    stepName: string;
    agent: { id: string; name: string };
    response: string;
    processingTimeMs?: number;
  }>;
  startTime?: number | null;
  error?: string;
}): string {
  const lines: string[] = [];
  const isSuccess = state.status === 'completed';
  const durationSec = state.startTime ? Math.round((Date.now() - state.startTime) / 1000) : null;

  lines.push(isSuccess ? '**Orchestration completed**' : '**Orchestration failed**');
  lines.push('');

  const demandPreview = state.demand.length > 120 ? state.demand.slice(0, 117) + '...' : state.demand;
  lines.push(`> ${demandPreview}`);
  lines.push('');

  const stats: string[] = [];
  if (state.squadSelections.length > 0) stats.push(`${state.squadSelections.length} squad${state.squadSelections.length > 1 ? 's' : ''}`);
  if (state.agentOutputs.length > 0) stats.push(`${state.agentOutputs.length} step${state.agentOutputs.length > 1 ? 's' : ''}`);
  if (durationSec !== null) stats.push(`${durationSec}s`);
  if (stats.length > 0) lines.push(stats.join(' · '));
  lines.push('');

  if (state.agentOutputs.length > 0) {
    state.agentOutputs.forEach((output) => {
      const preview = output.response.length > 200 ? output.response.slice(0, 197) + '...' : output.response;
      lines.push(`**${output.agent.name}** — ${output.stepName}`);
      lines.push(preview);
      lines.push('');
    });
  }

  if (state.error) {
    lines.push(`**Error:** ${state.error}`);
    lines.push('');
  }

  return lines.join('\n').trim();
}

/** Generate a shareable URL for a task and copy to clipboard */
export async function copyTaskShareLink(taskId: string): Promise<boolean> {
  const url = `${window.location.origin}/share/${taskId}`;
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}
