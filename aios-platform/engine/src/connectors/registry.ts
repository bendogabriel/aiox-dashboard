/**
 * Connector registry — maps connector type strings to implementations.
 */
import type { VaultConnector } from './types';
import { urlScrapeConnector } from './url-scrape';
import { aiMemoryConnector } from './ai-memory';

export const CONNECTORS: Record<string, VaultConnector> = {
  'url-scrape': urlScrapeConnector,
  'ai-memory': aiMemoryConnector,
};

export function getConnector(type: string): VaultConnector | null {
  return CONNECTORS[type] || null;
}

export function listConnectorTypes(): string[] {
  return Object.keys(CONNECTORS);
}
