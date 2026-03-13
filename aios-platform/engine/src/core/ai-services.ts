/**
 * AI Services — calls Claude CLI for document classification,
 * summarization, taxonomy suggestion, quality scoring, and tag generation.
 *
 * Uses claude-haiku-4-5 for fast classification.
 * Falls back to sensible defaults when Claude CLI is unavailable.
 */
import { isClaudeAvailable, spawnClaude, extractTextFromAssistant } from '../lib/claude-cli';

// ── Types ──

export interface ClassificationResult {
  category: string;
  type: string;
  confidence: number;
  reasoning: string;
}

export interface TaxonomySuggestion {
  path: string;
  confidence: number;
}

export interface QualityScore {
  completeness: number;
  freshness: number;
  consistency: number;
  issues: string[];
}

// ── Constants ──

const HAIKU_MODEL = 'claude-haiku-4-5-20250514';

const VALID_CATEGORIES = [
  'company', 'products', 'brand', 'campaigns', 'tech',
  'operations', 'market', 'finance', 'legal', 'people',
] as const;

const VALID_TYPES = [
  'offerbook', 'brand', 'narrative', 'strategy', 'diagnostic',
  'proof', 'sop', 'reference', 'raw', 'generic',
] as const;

// ── Helpers ──

/**
 * Call Claude CLI with a prompt and extract the text response.
 * Returns null if CLI is unavailable or an error occurs.
 */
async function callClaude(prompt: string, model?: string): Promise<string | null> {
  if (!isClaudeAvailable()) return null;

  try {
    const claude = spawnClaude(prompt, { model: model || HAIKU_MODEL });
    let fullResponse = '';
    let assistantText = '';

    for await (const event of claude.events()) {
      switch (event.type) {
        case 'assistant':
          if (event.message) {
            assistantText = extractTextFromAssistant(event.message);
          }
          break;
        case 'result':
          if (event.result) {
            fullResponse = event.result;
          }
          break;
      }
    }

    return fullResponse || assistantText || null;
  } catch (err) {
    console.error('[AI Services] Claude CLI error:', (err as Error).message);
    return null;
  }
}

/**
 * Parse JSON from Claude response, handling markdown code fences.
 */
function parseJsonResponse<T>(text: string | null, fallback: T): T {
  if (!text) return fallback;

  // Strip markdown code fences if present
  let cleaned = text.trim();
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Try extracting the first JSON object from the text
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]) as T;
      } catch {
        // Fall through
      }
    }
    return fallback;
  }
}

function truncateContent(content: string, maxChars = 4000): string {
  if (content.length <= maxChars) return content;
  return content.slice(0, maxChars) + '\n\n[... content truncated for analysis ...]';
}

// ── Public API ──

/**
 * Classify a document into a category and document type.
 */
export async function classifyDocument(
  content: string,
  name: string
): Promise<ClassificationResult> {
  const fallback: ClassificationResult = {
    category: 'generic',
    type: 'raw',
    confidence: 0,
    reasoning: 'Claude CLI unavailable — default classification applied',
  };

  const prompt = `You are a document classifier for a business knowledge vault. Analyze the following document and classify it.

## Document Name
${name}

## Document Content (excerpt)
${truncateContent(content)}

## Task
Return a JSON object with these fields:
- "category": one of [${VALID_CATEGORIES.map((c) => `"${c}"`).join(', ')}]
  - company: company info, about us, history, team
  - products: product descriptions, pricing, features, offers
  - brand: brand guidelines, visual identity, tone of voice
  - campaigns: marketing campaigns, ads, launches, promotions
  - tech: technical docs, APIs, architecture, code
  - operations: SOPs, processes, workflows, checklists
  - market: market research, competitor analysis, trends
  - finance: financial data, revenue, budgets, costs
  - legal: contracts, terms, policies, compliance
  - people: HR, hiring, team structure, roles

- "type": one of [${VALID_TYPES.map((t) => `"${t}"`).join(', ')}]
  - offerbook: product/service offer details with pricing
  - brand: brand identity and guidelines
  - narrative: storytelling, origin stories, testimonials
  - strategy: strategic plans, roadmaps, goals
  - diagnostic: audits, assessments, analysis reports
  - proof: case studies, metrics, social proof
  - sop: standard operating procedures, how-to guides
  - reference: lookup tables, registries, catalogs
  - raw: unprocessed/unstructured content
  - generic: does not fit other types

- "confidence": number 0-1 (how confident you are)
- "reasoning": brief explanation of your classification

Return ONLY the JSON object, no other text.`;

  const response = await callClaude(prompt);
  const result = parseJsonResponse<ClassificationResult>(response, fallback);

  // Validate category and type
  if (!VALID_CATEGORIES.includes(result.category as (typeof VALID_CATEGORIES)[number])) {
    result.category = 'generic';
  }
  if (!VALID_TYPES.includes(result.type as (typeof VALID_TYPES)[number])) {
    result.type = 'raw';
  }
  result.confidence = Math.max(0, Math.min(1, result.confidence || 0));

  return result;
}

/**
 * Generate a 2-3 sentence summary of a document.
 */
export async function summarizeDocument(
  content: string,
  maxTokens?: number
): Promise<string> {
  const fallback = '';

  const tokenHint = maxTokens ? ` Keep the summary under ${maxTokens} tokens.` : '';

  const prompt = `Summarize the following document in 2-3 concise sentences. Focus on the key information and purpose of the document.${tokenHint}

## Document Content
${truncateContent(content, 6000)}

Return ONLY the summary text, no labels or prefixes.`;

  const response = await callClaude(prompt);
  return response?.trim() || fallback;
}

/**
 * Suggest a taxonomy path for the document (dot-notation).
 */
export async function suggestTaxonomy(
  content: string,
  name: string,
  category: string
): Promise<TaxonomySuggestion> {
  const fallback: TaxonomySuggestion = {
    path: `context.${category}.general`,
    confidence: 0.3,
  };

  const prompt = `You are organizing a business knowledge vault into a hierarchical taxonomy.

## Document Name
${name}

## Category
${category}

## Content (excerpt)
${truncateContent(content, 3000)}

## Task
Suggest a taxonomy path using dot-notation. The path should follow this pattern:
  context.{domain}.{subdomain}

Examples:
  context.product.offer
  context.brand.voice
  context.company.history
  context.campaigns.meta-ads
  context.tech.architecture
  context.operations.workflows
  context.market.competitors

Return a JSON object with:
- "path": the taxonomy path (dot-notation, lowercase, hyphens for multi-word)
- "confidence": number 0-1

Return ONLY the JSON object.`;

  const response = await callClaude(prompt);
  const result = parseJsonResponse<TaxonomySuggestion>(response, fallback);
  result.confidence = Math.max(0, Math.min(1, result.confidence || 0));

  return result;
}

/**
 * Score document quality on three dimensions (0-100 each).
 */
export async function scoreQuality(
  content: string,
  name: string
): Promise<QualityScore> {
  const fallback: QualityScore = {
    completeness: 50,
    freshness: 50,
    consistency: 50,
    issues: [],
  };

  const prompt = `You are a document quality auditor for a business knowledge vault.

## Document Name
${name}

## Content
${truncateContent(content, 5000)}

## Task
Score this document on three dimensions (0-100 each):

1. **completeness**: How complete is the information? Does it cover the topic adequately?
   - 0-30: Missing major sections, very incomplete
   - 31-60: Has basics but missing important details
   - 61-80: Reasonably complete, minor gaps
   - 81-100: Comprehensive, well-structured

2. **freshness**: How current/timely does the content appear?
   - 0-30: Clearly outdated, references old data
   - 31-60: Somewhat dated, some info may be stale
   - 61-80: Reasonably current
   - 81-100: Up-to-date, recent references

3. **consistency**: How internally consistent is the content? Are there contradictions?
   - 0-30: Major contradictions or mixed messages
   - 31-60: Some inconsistencies
   - 61-80: Mostly consistent
   - 81-100: Fully consistent

Also list any specific issues found (max 5).

Return a JSON object with:
- "completeness": number 0-100
- "freshness": number 0-100
- "consistency": number 0-100
- "issues": string[] (list of specific issues, max 5)

Return ONLY the JSON object.`;

  const response = await callClaude(prompt);
  const result = parseJsonResponse<QualityScore>(response, fallback);

  // Clamp values
  result.completeness = Math.max(0, Math.min(100, Math.round(result.completeness || 50)));
  result.freshness = Math.max(0, Math.min(100, Math.round(result.freshness || 50)));
  result.consistency = Math.max(0, Math.min(100, Math.round(result.consistency || 50)));
  if (!Array.isArray(result.issues)) result.issues = [];
  result.issues = result.issues.slice(0, 5);

  return result;
}

/**
 * Auto-generate tags from document content.
 */
export async function generateTags(
  content: string,
  name: string
): Promise<string[]> {
  const prompt = `Extract 3-8 relevant tags from this document. Tags should be lowercase, single or hyphenated words that describe key topics.

## Document Name
${name}

## Content (excerpt)
${truncateContent(content, 3000)}

Return a JSON array of strings. Example: ["pricing", "massage-therapy", "marketing", "landing-page"]

Return ONLY the JSON array.`;

  const response = await callClaude(prompt);
  if (!response) return [];

  // Try parsing as JSON array
  let cleaned = response.trim();
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  try {
    const tags = JSON.parse(cleaned);
    if (Array.isArray(tags)) {
      return tags
        .filter((t): t is string => typeof t === 'string')
        .map((t) => t.toLowerCase().trim())
        .filter((t) => t.length > 0 && t.length < 50)
        .slice(0, 8);
    }
  } catch {
    // Try extracting tags from plain text
    const tagPattern = /["']([a-z][a-z0-9-]+)["']/g;
    const tags: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = tagPattern.exec(cleaned)) !== null) {
      tags.push(m[1]);
    }
    return tags.slice(0, 8);
  }

  return [];
}

/**
 * Run full AI enrichment pipeline on a document.
 * Calls classify, summarize, taxonomy, quality, and tags in sequence.
 */
export async function enrichDocument(
  content: string,
  name: string
): Promise<{
  classification: ClassificationResult;
  summary: string;
  taxonomy: TaxonomySuggestion;
  quality: QualityScore;
  tags: string[];
}> {
  const classification = await classifyDocument(content, name);
  const summary = await summarizeDocument(content);
  const taxonomy = await suggestTaxonomy(content, name, classification.category);
  const quality = await scoreQuality(content, name);
  const tags = await generateTags(content, name);

  return { classification, summary, taxonomy, quality, tags };
}
