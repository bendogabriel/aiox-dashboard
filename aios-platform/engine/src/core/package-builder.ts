/**
 * Context Package Builder — assembles selected documents into
 * an exportable context package (markdown, JSON, or YAML).
 *
 * Packages are used to provide curated context to AI agents.
 */
import * as vaultStore from './vault-store';

// ── Types ──

export interface BuildResult {
  totalTokens: number;
  documentCount: number;
}

export interface FilterCriteria {
  spaceIds?: string[];
  categories?: string[];
  statuses?: string[];
  tags?: string[];
  minQuality?: number;
  maxTokens?: number;
}

// ── Core Functions ──

/**
 * Build a context package by selecting documents that match the filter criteria.
 * Updates the package with the assembled content.
 */
export async function buildPackage(packageId: string): Promise<BuildResult> {
  const pkg = vaultStore.getPackage(packageId);
  if (!pkg) {
    throw new Error(`Package not found: ${packageId}`);
  }

  const criteria: FilterCriteria = JSON.parse(pkg.filter_criteria || '{}');

  // Get all documents in the workspace
  let docs = vaultStore.listDocuments({
    workspaceId: pkg.workspace_id,
  });

  // Apply filters
  if (criteria.spaceIds && criteria.spaceIds.length > 0) {
    docs = docs.filter((d) => d.space_id && criteria.spaceIds!.includes(d.space_id));
  }

  if (criteria.categories && criteria.categories.length > 0) {
    docs = docs.filter((d) => criteria.categories!.includes(d.category_id));
  }

  if (criteria.statuses && criteria.statuses.length > 0) {
    docs = docs.filter((d) => criteria.statuses!.includes(d.status));
  }

  if (criteria.tags && criteria.tags.length > 0) {
    docs = docs.filter((d) => {
      const docTags: string[] = JSON.parse(d.tags || '[]');
      return criteria.tags!.some((t) => docTags.includes(t));
    });
  }

  if (criteria.minQuality && criteria.minQuality > 0) {
    docs = docs.filter((d) => {
      const quality = JSON.parse(d.quality || '{}');
      const avg = ((quality.completeness || 0) + (quality.freshness || 0) + (quality.consistency || 0)) / 3;
      return avg >= criteria.minQuality!;
    });
  }

  // Also include explicitly selected document IDs
  const explicitIds: string[] = JSON.parse(pkg.document_ids || '[]');
  if (explicitIds.length > 0) {
    const explicitDocs = explicitIds
      .map((id) => vaultStore.getDocument(id))
      .filter((d): d is NonNullable<typeof d> => d !== null);
    // Merge, avoiding duplicates
    const existingIds = new Set(docs.map((d) => d.id));
    for (const d of explicitDocs) {
      if (!existingIds.has(d.id)) {
        docs.push(d);
      }
    }
  }

  // Sort by category then by name for consistent output
  docs.sort((a, b) => {
    if (a.category_id !== b.category_id) return a.category_id.localeCompare(b.category_id);
    return a.name.localeCompare(b.name);
  });

  // Apply token budget if set
  if (criteria.maxTokens && criteria.maxTokens > 0) {
    let runningTokens = 0;
    const budgetDocs = [];
    for (const d of docs) {
      if (runningTokens + d.token_count > criteria.maxTokens) break;
      budgetDocs.push(d);
      runningTokens += d.token_count;
    }
    docs = budgetDocs;
  }

  // Build markdown content
  const parts: string[] = [];
  parts.push(`# Context Package: ${pkg.name}\n`);
  if (pkg.description) {
    parts.push(`${pkg.description}\n`);
  }
  parts.push(`**Documents:** ${docs.length} | **Generated:** ${new Date().toISOString()}\n`);
  parts.push('---\n');

  let currentCategory = '';
  for (const doc of docs) {
    if (doc.category_id !== currentCategory) {
      currentCategory = doc.category_id;
      parts.push(`\n## ${formatCategoryTitle(currentCategory)}\n`);
    }

    parts.push(`### ${doc.name}\n`);
    if (doc.summary) {
      parts.push(`> ${doc.summary}\n`);
    }
    parts.push(`${doc.content}\n`);
    parts.push('---\n');
  }

  const builtContent = parts.join('\n');
  const totalTokens = docs.reduce((sum, d) => sum + d.token_count, 0);

  // Save the built package
  vaultStore.updatePackage(packageId, {
    document_ids: JSON.stringify(docs.map((d) => d.id)),
    total_tokens: totalTokens,
    document_count: docs.length,
    built_content: builtContent,
    built_at: new Date().toISOString(),
    status: 'built',
  });

  return {
    totalTokens,
    documentCount: docs.length,
  };
}

/**
 * Export a built package in the specified format.
 */
export function exportPackage(
  packageId: string,
  format: 'markdown' | 'json' | 'yaml' = 'markdown'
): string {
  const pkg = vaultStore.getPackage(packageId);
  if (!pkg) {
    throw new Error(`Package not found: ${packageId}`);
  }

  if (format === 'markdown') {
    if (!pkg.built_content) {
      return `# ${pkg.name}\n\nPackage has not been built yet. Call /vault/packages/${packageId}/build first.`;
    }
    return pkg.built_content;
  }

  // For JSON/YAML, return structured data
  const documentIds: string[] = JSON.parse(pkg.document_ids || '[]');
  const documents = documentIds
    .map((id) => vaultStore.getDocument(id))
    .filter((d): d is NonNullable<typeof d> => d !== null)
    .map((d) => ({
      id: d.id,
      name: d.name,
      category: d.category_id,
      type: d.type,
      summary: d.summary,
      content: d.content,
      tags: JSON.parse(d.tags || '[]'),
      taxonomy: d.taxonomy,
      tokenCount: d.token_count,
    }));

  const structured = {
    package: {
      id: pkg.id,
      name: pkg.name,
      description: pkg.description,
      totalTokens: pkg.total_tokens,
      documentCount: pkg.document_count,
      builtAt: pkg.built_at,
    },
    documents,
  };

  if (format === 'json') {
    return JSON.stringify(structured, null, 2);
  }

  // YAML format
  return toYaml(structured);
}

// ── Helpers ──

function formatCategoryTitle(category: string): string {
  const titles: Record<string, string> = {
    company: 'Company',
    products: 'Products',
    brand: 'Brand',
    campaigns: 'Campaigns',
    tech: 'Technology',
    operations: 'Operations',
    market: 'Market',
    finance: 'Finance',
    legal: 'Legal',
    people: 'People',
    generic: 'General',
  };
  return titles[category] || category.charAt(0).toUpperCase() + category.slice(1);
}

/**
 * Minimal YAML serializer for export (avoids adding a dependency).
 */
function toYaml(obj: unknown, indent = 0): string {
  const prefix = '  '.repeat(indent);

  if (obj === null || obj === undefined) return `${prefix}null\n`;
  if (typeof obj === 'string') {
    if (obj.includes('\n')) {
      return `${prefix}|\n${obj
        .split('\n')
        .map((line) => `${prefix}  ${line}`)
        .join('\n')}\n`;
    }
    if (obj.match(/[:#{}[\],&*?|>!%@`]/)) {
      return `${prefix}"${obj.replace(/"/g, '\\"')}"\n`;
    }
    return `${prefix}${obj}\n`;
  }
  if (typeof obj === 'number' || typeof obj === 'boolean') return `${prefix}${obj}\n`;

  if (Array.isArray(obj)) {
    if (obj.length === 0) return `${prefix}[]\n`;
    return obj.map((item) => {
      if (typeof item === 'object' && item !== null) {
        const first = toYaml(item, indent + 1).trimStart();
        return `${prefix}- ${first}`;
      }
      return `${prefix}- ${String(item)}\n`;
    }).join('');
  }

  if (typeof obj === 'object') {
    const entries = Object.entries(obj as Record<string, unknown>);
    if (entries.length === 0) return `${prefix}{}\n`;
    return entries.map(([key, val]) => {
      if (typeof val === 'object' && val !== null) {
        return `${prefix}${key}:\n${toYaml(val, indent + 1)}`;
      }
      return `${prefix}${key}: ${toYaml(val, 0).trim()}\n`;
    }).join('');
  }

  return `${prefix}${String(obj)}\n`;
}
