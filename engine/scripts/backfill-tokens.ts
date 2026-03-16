#!/usr/bin/env bun
// Backfill tokens_used from jobs.output_result NDJSON
// Run once: bun scripts/backfill-tokens.ts

import { Database } from "bun:sqlite";
import path from "path";

const DB_PATH = process.env.ENGINE_DB_PATH || path.join(import.meta.dir, "..", "data", "engine.db");
const db = new Database(DB_PATH);

function parseTokensFromOutput(output: string | null): number | null {
  if (!output) return null;
  try {
    const lines = output.trim().split("\n");
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (!line) continue;
      try {
        const parsed = JSON.parse(line);
        if (parsed.type === "result" && parsed.usage) {
          const u = parsed.usage;
          const total =
            (u.input_tokens || 0) +
            (u.cache_creation_input_tokens || 0) +
            (u.cache_read_input_tokens || 0) +
            (u.output_tokens || 0);
          return total > 0 ? total : null;
        }
      } catch {
        continue;
      }
    }
  } catch { /* noop */ }
  return null;
}

const query = `
  SELECT e.id as exec_id, j.output_result
  FROM executions e
  JOIN jobs j ON e.job_id = j.id
  WHERE e.tokens_used IS NULL
    AND j.output_result IS NOT NULL
`;

const rows = db.query(query).all() as Array<{ exec_id: string; output_result: string }>;

console.log(`Found ${rows.length} executions to backfill`);

let updated = 0;
const updateStmt = db.prepare("UPDATE executions SET tokens_used = ? WHERE id = ?");

for (const row of rows) {
  const tokens = parseTokensFromOutput(row.output_result);
  if (tokens !== null) {
    updateStmt.run(tokens, row.exec_id);
    updated++;
  }
}

console.log(`Backfilled ${updated}/${rows.length} executions with token counts`);
db.close();
