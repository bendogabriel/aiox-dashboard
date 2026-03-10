import { NextResponse } from 'next/server';

/**
 * GET /api/execute/llm/models
 * Returns the list of available LLM models grouped by provider.
 */
export async function GET() {
  return NextResponse.json({
    claude: ['claude-opus-4', 'claude-sonnet-4', 'claude-haiku'],
    openai: ['gpt-4o'],
    default: {
      fast: 'claude-haiku',
      default: 'claude-sonnet-4',
      powerful: 'claude-opus-4',
    },
  });
}
