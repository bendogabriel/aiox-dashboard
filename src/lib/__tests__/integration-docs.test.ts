import { describe, it, expect } from 'vitest';
import { getIntegrationDoc, getAllIntegrationDocs, INTEGRATION_DOCS } from '../integration-docs';
import type { IntegrationId } from '../../stores/integrationStore';

const ALL_IDS: IntegrationId[] = [
  'engine', 'supabase', 'api-keys', 'whatsapp',
  'telegram', 'voice', 'google-drive', 'google-calendar',
];

describe('integration-docs', () => {
  it('has docs for all 8 integrations', () => {
    expect(Object.keys(INTEGRATION_DOCS)).toHaveLength(8);
    ALL_IDS.forEach((id) => {
      expect(INTEGRATION_DOCS[id]).toBeTruthy();
    });
  });

  it('each doc has required fields', () => {
    for (const doc of getAllIntegrationDocs()) {
      expect(doc.id).toBeTruthy();
      expect(doc.name).toBeTruthy();
      expect(doc.description.length).toBeGreaterThan(10);
      expect(doc.steps.length).toBeGreaterThan(0);
      expect(doc.envVars).toBeInstanceOf(Array);
      expect(doc.troubleshooting.length).toBeGreaterThan(0);
    }
  });

  it('getIntegrationDoc returns correct doc', () => {
    const doc = getIntegrationDoc('engine');
    expect(doc.name).toBe('AIOS Engine');
    expect(doc.id).toBe('engine');
  });

  it('getAllIntegrationDocs returns all docs', () => {
    const docs = getAllIntegrationDocs();
    expect(docs).toHaveLength(8);
  });

  it('envVars have required fields', () => {
    for (const doc of getAllIntegrationDocs()) {
      for (const env of doc.envVars) {
        expect(env.name).toBeTruthy();
        expect(env.description).toBeTruthy();
        expect(typeof env.required).toBe('boolean');
      }
    }
  });

  it('troubleshooting entries have problem and solution', () => {
    for (const doc of getAllIntegrationDocs()) {
      for (const t of doc.troubleshooting) {
        expect(t.problem).toBeTruthy();
        expect(t.solution).toBeTruthy();
      }
    }
  });

  it('critical integrations have docsUrl', () => {
    expect(getIntegrationDoc('engine').docsUrl).toBeTruthy();
    expect(getIntegrationDoc('supabase').docsUrl).toBeTruthy();
  });
});
