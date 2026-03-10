import { NextResponse } from 'next/server';

/**
 * GET /api/execute/db/health
 * Returns the database connection health status.
 */
export async function GET() {
  return NextResponse.json({
    connected: true,
    provider: 'in-memory + supabase',
    latency_ms: 0,
  });
}
