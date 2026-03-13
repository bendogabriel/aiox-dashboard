import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase module before imports
vi.mock('../../../lib/supabase', () => ({
  supabase: null as any,
  isSupabaseConfigured: false,
}));

import {
  listTeamProfiles,
  getTeamProfile,
  upsertTeamProfile,
  deleteTeamProfile,
  checkSyncAvailability,
} from '../config-sync';
import * as supabaseModule from '../../../lib/supabase';

// Helpers to set mock state
function setSupabaseConfigured(configured: boolean) {
  (supabaseModule as any).isSupabaseConfigured = configured;
}

function setSupabaseClient(client: any) {
  (supabaseModule as any).supabase = client;
}

function createMockClient(overrides: Record<string, any> = {}) {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    ...overrides,
  };
  return {
    from: vi.fn(() => chain),
    _chain: chain,
  };
}

describe('config-sync', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setSupabaseConfigured(false);
    setSupabaseClient(null);
  });

  describe('checkSyncAvailability', () => {
    it('returns false when supabase is not configured', async () => {
      const result = await checkSyncAvailability();
      expect(result).toBe(false);
    });

    it('returns true when table is accessible', async () => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ error: null }),
      };
      setSupabaseConfigured(true);
      setSupabaseClient({ from: vi.fn(() => chain) });

      const result = await checkSyncAvailability();
      expect(result).toBe(true);
    });

    it('returns false when table query errors', async () => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ error: { message: 'not found' } }),
      };
      setSupabaseConfigured(true);
      setSupabaseClient({ from: vi.fn(() => chain) });

      const result = await checkSyncAvailability();
      expect(result).toBe(false);
    });
  });

  describe('listTeamProfiles', () => {
    it('returns error when supabase not configured', async () => {
      const result = await listTeamProfiles();
      expect(result.success).toBe(false);
      expect(result.error).toContain('not configured');
    });

    it('returns profiles on success', async () => {
      const mockProfiles = [
        { id: '1', name: 'Local Dev', configs: {}, settings: {} },
        { id: '2', name: 'Docker', configs: {}, settings: {} },
      ];
      const client = createMockClient();
      client._chain.order.mockResolvedValue({ data: mockProfiles, error: null });
      setSupabaseConfigured(true);
      setSupabaseClient(client);

      const result = await listTeamProfiles();
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockProfiles);
    });

    it('returns error on query failure', async () => {
      const client = createMockClient();
      client._chain.order.mockResolvedValue({ data: null, error: { message: 'DB error' } });
      setSupabaseConfigured(true);
      setSupabaseClient(client);

      const result = await listTeamProfiles();
      expect(result.success).toBe(false);
      expect(result.error).toBe('DB error');
    });
  });

  describe('getTeamProfile', () => {
    it('returns error when supabase not configured', async () => {
      const result = await getTeamProfile('some-id');
      expect(result.success).toBe(false);
    });

    it('returns single profile on success', async () => {
      const profile = { id: '1', name: 'Test', configs: {} };
      const client = createMockClient();
      client._chain.single.mockResolvedValue({ data: profile, error: null });
      setSupabaseConfigured(true);
      setSupabaseClient(client);

      const result = await getTeamProfile('1');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(profile);
    });
  });

  describe('upsertTeamProfile', () => {
    it('returns error when supabase not configured', async () => {
      const result = await upsertTeamProfile({
        name: 'Test',
        description: '',
        configs: {},
        settings: {},
        created_by: 'user',
      });
      expect(result.success).toBe(false);
    });

    it('upserts profile successfully', async () => {
      const profile = { id: '1', name: 'Test', configs: {}, updated_at: '2026-01-01' };
      const client = createMockClient();
      client._chain.single.mockResolvedValue({ data: profile, error: null });
      setSupabaseConfigured(true);
      setSupabaseClient(client);

      const result = await upsertTeamProfile({
        name: 'Test',
        description: 'desc',
        configs: {},
        settings: {},
        created_by: 'user',
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual(profile);
      expect(client._chain.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Test', description: 'desc' }),
        { onConflict: 'name' },
      );
    });
  });

  describe('deleteTeamProfile', () => {
    it('returns error when supabase not configured', async () => {
      const result = await deleteTeamProfile('some-id');
      expect(result.success).toBe(false);
    });

    it('deletes successfully', async () => {
      const client = createMockClient();
      client._chain.eq.mockResolvedValue({ error: null });
      setSupabaseConfigured(true);
      setSupabaseClient(client);

      const result = await deleteTeamProfile('1');
      expect(result.success).toBe(true);
    });

    it('returns error on delete failure', async () => {
      const client = createMockClient();
      client._chain.eq.mockResolvedValue({ error: { message: 'Not found' } });
      setSupabaseConfigured(true);
      setSupabaseClient(client);

      const result = await deleteTeamProfile('1');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Not found');
    });
  });
});
