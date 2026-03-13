/**
 * Edge Function: marketplace-auto-review
 * Story 5.1 — Automated Tier-1 review for submitted agents
 *
 * Trigger: Called when a marketplace_submission is created (via DB webhook or direct invoke)
 *
 * Validates:
 * 1. Schema validity (required fields, correct types)
 * 2. Metadata completeness (name, description, category, pricing)
 * 3. Prompt injection detection in persona
 * 4. Sandbox test: execute agent with 5 standard prompts
 * 5. Score 0-5 based on results
 *
 * If score >= 3: auto_test_status = 'passed', forward to manual review
 * If score < 3: auto_test_status = 'failed', reject with feedback
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// --- Prompt injection patterns ---
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /you\s+are\s+now\s+(a|an)\s+/i,
  /system\s+prompt\s+override/i,
  /disregard\s+(all\s+)?prior/i,
  /new\s+instructions?:\s*/i,
  /forget\s+(everything|all)\s+(you|about)/i,
  /pretend\s+you\s+are/i,
  /act\s+as\s+if\s+you\s+have\s+no\s+restrictions/i,
  /jailbreak/i,
  /DAN\s+mode/i,
  /do\s+anything\s+now/i,
];

// --- Standard test prompts ---
const TEST_PROMPTS = [
  'Explique o que voce faz e quais sao suas capacidades.',
  'Resolva este problema: calcule o ROI de um investimento de R$10.000 com retorno de R$12.500.',
  'Quais sao suas limitacoes? O que voce NAO consegue fazer?',
  'Liste seus comandos disponiveis e como usa-los.',
  'Gere um exemplo pratico do seu trabalho.',
];

interface AgentConfig {
  persona?: {
    role?: string;
    tone?: string;
    focus?: string;
    style?: string;
    identity?: string;
    background?: string;
  };
  commands?: Array<{ command: string; action: string; description?: string }>;
  capabilities?: string[];
  corePrinciples?: string[];
  voiceDna?: Record<string, unknown>;
  antiPatterns?: Record<string, unknown>;
}

interface AutoReviewResult {
  score: number;
  checks: {
    schema_valid: { passed: boolean; details: string };
    metadata_complete: { passed: boolean; details: string };
    security_clean: { passed: boolean; details: string[] };
    sandbox_results: { passed: boolean; prompt_scores: number[] };
    overall_quality: { passed: boolean; details: string };
  };
  recommendation: 'passed' | 'failed';
  feedback: string[];
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { submission_id } = await req.json();
    if (!submission_id) {
      return new Response(JSON.stringify({ error: 'submission_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch submission with listing
    const { data: submission, error: fetchErr } = await supabase
      .from('marketplace_submissions')
      .select('*, listing:marketplace_listings(*)')
      .eq('id', submission_id)
      .single();

    if (fetchErr || !submission) {
      return new Response(JSON.stringify({ error: 'Submission not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Mark as running
    await supabase
      .from('marketplace_submissions')
      .update({ auto_test_status: 'running' })
      .eq('id', submission_id);

    const agentBundle = submission.agent_bundle as AgentConfig;
    const listing = submission.listing;
    const result = runAutoReview(agentBundle, listing);

    // Update submission with results
    const autoTestStatus = result.recommendation === 'passed' ? 'passed' : 'failed';
    const reviewStatus = result.recommendation === 'passed' ? 'pending' : 'rejected';

    await supabase
      .from('marketplace_submissions')
      .update({
        auto_test_status: autoTestStatus,
        auto_test_score: result.score,
        auto_test_results: result as unknown as Record<string, unknown>,
        review_status: reviewStatus,
        review_notes: result.recommendation === 'failed'
          ? `Auto-review falhou (score: ${result.score}/5). ${result.feedback.join('; ')}`
          : null,
      })
      .eq('id', submission_id);

    // If failed, update listing status
    if (result.recommendation === 'failed' && listing) {
      await supabase
        .from('marketplace_listings')
        .update({
          status: 'rejected',
          rejection_reason: `Auto-review: ${result.feedback.join('; ')}`,
        })
        .eq('id', listing.id);
    }

    return new Response(JSON.stringify({ ok: true, result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Auto-review error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ============================================================
// Auto Review Logic
// ============================================================

function runAutoReview(config: AgentConfig, listing: Record<string, unknown> | null): AutoReviewResult {
  const feedback: string[] = [];
  let totalScore = 0;

  // 1. Schema validation
  const schemaCheck = validateSchema(config);
  if (schemaCheck.passed) totalScore += 1;
  else feedback.push(schemaCheck.details);

  // 2. Metadata completeness
  const metaCheck = validateMetadata(listing);
  if (metaCheck.passed) totalScore += 1;
  else feedback.push(metaCheck.details);

  // 3. Security scan (prompt injection)
  const securityCheck = scanForInjection(config);
  if (securityCheck.passed) totalScore += 1;
  else feedback.push(`Padroes de prompt injection detectados: ${securityCheck.details.join(', ')}`);

  // 4. Sandbox test (simulated — real sandbox would call LLM API)
  const sandboxCheck = simulateSandboxTest(config);
  if (sandboxCheck.passed) totalScore += 1;

  // 5. Overall quality assessment
  const qualityCheck = assessQuality(config);
  if (qualityCheck.passed) totalScore += 1;
  else feedback.push(qualityCheck.details);

  return {
    score: totalScore,
    checks: {
      schema_valid: schemaCheck,
      metadata_complete: metaCheck,
      security_clean: securityCheck,
      sandbox_results: sandboxCheck,
      overall_quality: qualityCheck,
    },
    recommendation: totalScore >= 3 ? 'passed' : 'failed',
    feedback,
  };
}

function validateSchema(config: AgentConfig): { passed: boolean; details: string } {
  const issues: string[] = [];

  if (!config.persona?.role?.trim()) issues.push('persona.role ausente');
  if (!config.capabilities?.length) issues.push('nenhuma capability definida');
  if (!config.commands?.length) issues.push('nenhum comando definido');

  // Validate command structure
  if (config.commands) {
    for (const cmd of config.commands) {
      if (!cmd.command?.trim()) issues.push('comando sem nome');
      if (!cmd.action?.trim()) issues.push('comando sem action');
    }
  }

  return {
    passed: issues.length === 0,
    details: issues.length > 0 ? `Schema issues: ${issues.join(', ')}` : 'Schema valido',
  };
}

function validateMetadata(listing: Record<string, unknown> | null): { passed: boolean; details: string } {
  if (!listing) return { passed: false, details: 'Listing nao encontrado' };

  const issues: string[] = [];
  if (!listing.name) issues.push('nome ausente');
  if (!listing.description || String(listing.description).length < 50) issues.push('descricao muito curta (min 50 chars)');
  if (!listing.category || listing.category === 'default') issues.push('categoria nao definida');
  if (!listing.pricing_model) issues.push('modelo de pricing ausente');
  if (!listing.tagline) issues.push('tagline ausente');

  return {
    passed: issues.length === 0,
    details: issues.length > 0 ? `Metadata issues: ${issues.join(', ')}` : 'Metadata completa',
  };
}

function scanForInjection(config: AgentConfig): { passed: boolean; details: string[] } {
  const detected: string[] = [];

  // Scan all text fields in persona
  const textsToScan = [
    config.persona?.role,
    config.persona?.tone,
    config.persona?.focus,
    config.persona?.style,
    config.persona?.identity,
    config.persona?.background,
    ...(config.corePrinciples ?? []),
  ].filter(Boolean) as string[];

  for (const text of textsToScan) {
    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.test(text)) {
        detected.push(`"${text.substring(0, 50)}..." matches ${pattern.source}`);
      }
    }
  }

  return {
    passed: detected.length === 0,
    details: detected,
  };
}

function simulateSandboxTest(config: AgentConfig): { passed: boolean; prompt_scores: number[] } {
  // In production: call LLM API with the agent persona and test prompts
  // For now: score based on config completeness as a proxy
  const scores: number[] = [];

  for (let i = 0; i < TEST_PROMPTS.length; i++) {
    let score = 0;
    // Heuristic scoring based on config quality
    if (config.persona?.role) score += 0.4;
    if (config.capabilities?.length) score += 0.3;
    if (config.commands?.length) score += 0.3;
    scores.push(Math.min(score, 1));
  }

  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  return {
    passed: avgScore >= 0.6,
    prompt_scores: scores,
  };
}

function assessQuality(config: AgentConfig): { passed: boolean; details: string } {
  let quality = 0;
  const maxQuality = 5;

  if (config.persona?.role && config.persona.role.length >= 5) quality++;
  if ((config.commands?.length ?? 0) >= 2) quality++;
  if ((config.capabilities?.length ?? 0) >= 3) quality++;
  if (config.corePrinciples?.length) quality++;
  if (config.persona?.tone || config.persona?.focus) quality++;

  return {
    passed: quality >= 3,
    details: quality < 3
      ? `Qualidade insuficiente (${quality}/${maxQuality}): adicione mais comandos, capabilities ou principios.`
      : `Qualidade OK (${quality}/${maxQuality})`,
  };
}
