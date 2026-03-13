/**
 * Task persistence via bun:sqlite.
 */
import { Database } from 'bun:sqlite';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';

export interface Task {
  id: string;
  demand: string;
  status: string;
  plan: string | null;
  squads: string | null;
  outputs: string | null;
  error: string | null;
  feedback: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

let db: Database | null = null;

function getDb(): Database {
  if (db) return db;

  const engineRoot = resolve(import.meta.dir, '../..');
  const dbPath = resolve(engineRoot, 'engine.db');
  db = new Database(dbPath, { create: true });
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');

  // Run migration
  const migrationPath = resolve(engineRoot, 'migrations', '001_tasks.sql');
  const migration = readFileSync(migrationPath, 'utf-8');
  db.exec(migration);

  return db;
}

export function createTask(demand: string): string {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO tasks (id, demand, status, created_at) VALUES (?, ?, 'pending', ?)`
    )
    .run(id, demand, now);
  return id;
}

export function getTask(taskId: string): Task | null {
  return getDb()
    .prepare('SELECT * FROM tasks WHERE id = ?')
    .get(taskId) as Task | null;
}

export function updateTask(
  taskId: string,
  update: Partial<Omit<Task, 'id' | 'created_at'>>
): void {
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  for (const [key, value] of Object.entries(update)) {
    if (value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (fields.length === 0) return;
  values.push(taskId);

  getDb()
    .prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`)
    .run(...values);
}

export function listTasks(limit = 50): Task[] {
  return getDb()
    .prepare('SELECT * FROM tasks ORDER BY created_at DESC LIMIT ?')
    .all(limit) as Task[];
}
