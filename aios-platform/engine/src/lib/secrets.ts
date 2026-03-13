import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import { getDb } from './db';
import { log } from './logger';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const _AUTH_TAG_LENGTH = 16;

/**
 * Derives encryption key from ENGINE_SECRET env var (or fallback).
 * In production, ENGINE_SECRET should be a strong random string.
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.ENGINE_SECRET || 'aios-dev-secret-change-in-production';
  return scryptSync(secret, 'aios-salt', KEY_LENGTH);
}

function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:ciphertext (all hex)
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decrypt(encoded: string): string {
  const parts = encoded.split(':');
  if (parts.length !== 3) throw new Error('Invalid encrypted format');

  const [ivHex, authTagHex, ciphertext] = parts;
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// ── Public API ───────────────────────────────────────────

export function setSecret(key: string, value: string, integrationId?: string): void {
  const db = getDb();
  const encrypted = encrypt(value);
  db.run(
    `INSERT INTO secrets (key, value, integration_id, updated_at)
     VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, integration_id = excluded.integration_id, updated_at = datetime('now')`,
    [key, encrypted, integrationId || null],
  );
  log.info('Secret stored', { key, integration: integrationId });
}

export function getSecret(key: string): string | null {
  const db = getDb();
  const row = db.query<{ value: string }, [string]>('SELECT value FROM secrets WHERE key = ?').get(key);
  if (!row) return null;
  try {
    return decrypt(row.value);
  } catch (err) {
    log.error('Failed to decrypt secret', { key, error: (err as Error).message });
    return null;
  }
}

export function deleteSecret(key: string): boolean {
  const db = getDb();
  const result = db.run('DELETE FROM secrets WHERE key = ?', [key]);
  return result.changes > 0;
}

export function listSecrets(integrationId?: string): { key: string; integration_id: string | null; updated_at: string }[] {
  const db = getDb();
  if (integrationId) {
    return db.query<{ key: string; integration_id: string | null; updated_at: string }, [string]>(
      'SELECT key, integration_id, updated_at FROM secrets WHERE integration_id = ?',
    ).all(integrationId);
  }
  return db.query<{ key: string; integration_id: string | null; updated_at: string }, []>(
    'SELECT key, integration_id, updated_at FROM secrets',
  ).all();
}

/**
 * Resolves an API key: checks secrets vault first, then environment variable.
 * Useful for LLM provider keys that can come from either source.
 */
export function resolveApiKey(secretKey: string, envVar?: string): string | null {
  const fromVault = getSecret(secretKey);
  if (fromVault) return fromVault;
  if (envVar && process.env[envVar]) return process.env[envVar]!;
  return null;
}
