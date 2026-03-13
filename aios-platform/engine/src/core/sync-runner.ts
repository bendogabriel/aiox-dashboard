/**
 * Sync Runner — orchestrates the full ETL pipeline:
 *   discover -> extract -> transform (AI classify + summarize) -> load (save to vault-store)
 *
 * Tracks progress in vault_sync_jobs and emits progress callbacks
 * for real-time SSE streaming.
 */
import * as vaultStore from './vault-store';
import { getConnector } from '../connectors/registry';
import { classifyDocument, summarizeDocument, suggestTaxonomy, generateTags, scoreQuality } from './ai-services';
import type { RawContent } from '../connectors/types';

// ── Types ──

export interface SyncRunnerOptions {
  sourceId: string;
  workspaceId: string;
  spaceId?: string;
  onProgress?: (phase: string, current: number, total: number) => void;
}

export interface SyncResult {
  jobId: string;
  status: 'completed' | 'failed' | 'partial';
  documentsCreated: number;
  documentsUpdated: number;
  documentsSkipped: number;
  errors: Array<{ itemId: string; error: string }>;
  durationMs: number;
}

// ── Core ──

export async function runSync(options: SyncRunnerOptions): Promise<SyncResult> {
  const { sourceId, workspaceId, spaceId, onProgress } = options;
  const startTime = Date.now();
  const errors: Array<{ itemId: string; error: string }> = [];
  let documentsCreated = 0;
  let documentsUpdated = 0;
  let documentsSkipped = 0;

  // Get the source
  const source = vaultStore.getSource(sourceId);
  if (!source) {
    throw new Error(`Source not found: ${sourceId}`);
  }

  // Create sync job
  const jobId = vaultStore.createSyncJob({
    sourceId,
    workspaceId,
    spaceId,
  });

  // Update job: started
  vaultStore.updateSyncJob(jobId, {
    status: 'running',
    phase: 'discovering',
    started_at: new Date().toISOString(),
  });

  try {
    // Get connector
    const connector = getConnector(source.type);
    if (!connector) {
      throw new Error(`No connector found for source type: ${source.type}`);
    }

    const config = JSON.parse(source.config || '{}');

    // Phase 1: Discover
    onProgress?.('discovering', 0, 0);
    vaultStore.updateSyncJob(jobId, { phase: 'discovering' });

    const items = await connector.discover(config);
    const total = items.length;

    vaultStore.updateSyncJob(jobId, {
      progress_total: total,
      phase: 'extracting',
    });

    if (total === 0) {
      vaultStore.updateSyncJob(jobId, {
        status: 'completed',
        phase: 'done',
        completed_at: new Date().toISOString(),
      });
      return {
        jobId,
        status: 'completed',
        documentsCreated: 0,
        documentsUpdated: 0,
        documentsSkipped: 0,
        errors: [],
        durationMs: Date.now() - startTime,
      };
    }

    // Phase 2: Extract
    onProgress?.('extracting', 0, total);
    let extractedCount = 0;
    const extracted: RawContent[] = [];

    for await (const raw of connector.extract(items)) {
      extracted.push(raw);
      extractedCount++;
      onProgress?.('extracting', extractedCount, total);
      vaultStore.updateSyncJob(jobId, {
        progress_current: extractedCount,
        phase: 'extracting',
      });
    }

    // Phase 3: Transform + Load
    vaultStore.updateSyncJob(jobId, { phase: 'transforming' });
    onProgress?.('transforming', 0, extracted.length);

    for (let i = 0; i < extracted.length; i++) {
      const raw = extracted[i];

      try {
        // Check if content was an error
        if (raw.originalFormat === 'error') {
          errors.push({ itemId: raw.sourceItemId, error: raw.content });
          documentsSkipped++;
          onProgress?.('transforming', i + 1, extracted.length);
          continue;
        }

        // Skip empty content
        if (!raw.content || raw.content.trim().length < 10) {
          documentsSkipped++;
          onProgress?.('transforming', i + 1, extracted.length);
          continue;
        }

        // Check for duplicates by content hash
        const hasher = new Bun.CryptoHasher('sha256');
        hasher.update(raw.content);
        const contentHash = hasher.digest('hex');

        const existingDocs = vaultStore.listDocuments({
          workspaceId,
          spaceId: spaceId || undefined,
        });
        const duplicate = existingDocs.find((d) => d.content_hash === contentHash);
        if (duplicate) {
          documentsSkipped++;
          onProgress?.('transforming', i + 1, extracted.length);
          continue;
        }

        // AI enrichment
        onProgress?.('enriching', i + 1, extracted.length);
        vaultStore.updateSyncJob(jobId, {
          phase: 'enriching',
          progress_current: i + 1,
        });

        const [classification, summary, tags] = await Promise.all([
          classifyDocument(raw.content, raw.title),
          summarizeDocument(raw.content),
          generateTags(raw.content, raw.title),
        ]);

        const taxonomy = await suggestTaxonomy(raw.content, raw.title, classification.category);
        const quality = await scoreQuality(raw.content, raw.title);

        // Token count estimation
        const tokenCount = Math.ceil(raw.content.split(/\s+/).length / 0.75);

        // Phase 4: Load
        vaultStore.createDocument({
          workspaceId,
          spaceId: spaceId || undefined,
          sourceId,
          name: raw.title,
          type: classification.type,
          content: raw.content,
          contentHash,
          summary,
          status: 'enriched',
          tokenCount,
          tags,
          source: raw.originalUrl || source.name,
          taxonomy: taxonomy.path,
          categoryId: classification.category,
        });

        documentsCreated++;
        onProgress?.('loading', i + 1, extracted.length);
      } catch (err) {
        errors.push({
          itemId: raw.sourceItemId,
          error: (err as Error).message,
        });
        documentsSkipped++;
      }

      vaultStore.updateSyncJob(jobId, {
        documents_created: documentsCreated,
        documents_updated: documentsUpdated,
        documents_skipped: documentsSkipped,
        progress_current: i + 1,
      });
    }

    // Finalize
    const status = errors.length > 0 && documentsCreated === 0 ? 'failed' : errors.length > 0 ? 'partial' : 'completed';

    vaultStore.updateSyncJob(jobId, {
      status: status === 'partial' ? 'completed' : status,
      phase: 'done',
      documents_created: documentsCreated,
      documents_updated: documentsUpdated,
      documents_skipped: documentsSkipped,
      errors: JSON.stringify(errors),
      completed_at: new Date().toISOString(),
    });

    // Update source metadata
    vaultStore.updateSource(sourceId, {
      last_sync_at: new Date().toISOString(),
      status: 'connected',
      documents_count: documentsCreated,
    });

    return {
      jobId,
      status,
      documentsCreated,
      documentsUpdated,
      documentsSkipped,
      errors,
      durationMs: Date.now() - startTime,
    };
  } catch (err) {
    const errorMsg = (err as Error).message;
    vaultStore.updateSyncJob(jobId, {
      status: 'failed',
      phase: 'error',
      errors: JSON.stringify([{ itemId: 'global', error: errorMsg }]),
      completed_at: new Date().toISOString(),
    });

    return {
      jobId,
      status: 'failed',
      documentsCreated,
      documentsUpdated,
      documentsSkipped,
      errors: [{ itemId: 'global', error: errorMsg }],
      durationMs: Date.now() - startTime,
    };
  }
}
