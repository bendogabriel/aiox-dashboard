/**
 * Vault Connector interface — defines how external sources
 * are discovered, tested, and extracted into the vault.
 */

export interface VaultConnector {
  type: string;
  name: string;
  testConnection(config: Record<string, unknown>): Promise<{ ok: boolean; error?: string }>;
  discover(config: Record<string, unknown>): Promise<SourceItem[]>;
  extract(items: SourceItem[]): AsyncGenerator<RawContent>;
}

export interface SourceItem {
  id: string;
  path: string;
  name: string;
  type: string;
  size?: number;
  lastModified?: string;
  preview?: string;
}

export interface RawContent {
  sourceItemId: string;
  title: string;
  content: string;
  originalFormat: string;
  originalUrl?: string;
  metadata: Record<string, unknown>;
}
