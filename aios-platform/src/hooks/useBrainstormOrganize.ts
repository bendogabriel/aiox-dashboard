import { useCallback, useRef } from 'react';
import { executeApi } from '../services/api';
import type { OutputType } from '../stores/brainstormStore';

// ── Types ─────────────────────────────────────────────────────────────

interface IdeaInput {
  type: string;
  content: string;
  tags: string[];
}

interface OrganizeResult {
  type: OutputType;
  title: string;
  content: string;
}

interface OrganizeOptions {
  onProgress: (progress: number) => void;
  signal?: AbortSignal;
}

// ── Prompt Builder ────────────────────────────────────────────────────

function buildOrganizePrompt(
  ideas: IdeaInput[],
  outputTypes: OutputType[]
): string {
  const ideasText = ideas
    .map(
      (i, idx) =>
        `${idx + 1}. [${i.type}]${i.tags.length ? ` (tags: ${i.tags.join(', ')})` : ''}: ${i.content}`
    )
    .join('\n');

  const typeInstructions: Record<OutputType, string> = {
    'action-plan': `## Plano de Acao
Gere uma lista priorizada de tarefas com:
- Titulo da tarefa
- Prioridade (P0/P1/P2)
- Dependencias
- Estimativa de complexidade (simple/standard/complex)
- Responsavel sugerido (@dev, @architect, @pm, etc.)`,

    story: `## Story AIOS
Gere uma story no formato AIOS com:
- Title, description, status: Draft
- Acceptance Criteria (Given/When/Then)
- Scope (IN/OUT)
- Complexity, Priority
- Technical Notes`,

    prd: `## PRD (Product Requirements Document)
Gere um PRD com:
- Executive Summary
- User Personas
- Functional Requirements (FR-001, FR-002...)
- Non-Functional Requirements (NFR-001...)
- Success Metrics
- Constraints`,

    epic: `## Epic AIOS
Gere um Epic com:
- Epic title e descricao
- Lista de stories derivadas
- Wave plan (stories paralelas vs sequenciais)
- Dependencias entre stories`,

    requirements: `## Requirements
Gere os requisitos estruturados:
- Functional Requirements (FR-*)
- Non-Functional Requirements (NFR-*)
- Constraints (CON-*)
- User Stories em formato Given/When/Then`,
  };

  const selectedInstructions = outputTypes.map((t) => typeInstructions[t]).join('\n\n');

  return `Voce e um agente organizador do framework AIOS (AI-Orchestrated System).

Recebeu as seguintes ideias brutas de um brainstorm:

${ideasText}

Organize essas ideias nos seguintes formatos de output:

${selectedInstructions}

REGRAS:
1. Use APENAS informacoes presentes nas ideias - nao invente features (Article IV - No Invention)
2. Agrupe ideias relacionadas
3. Identifique dependencias entre itens
4. Priorize por impacto e urgencia
5. Use a terminologia AIOS (stories, epics, squads, agents)
6. Formato: Markdown estruturado
7. Separe cada output com uma linha contendo exatamente: ---OUTPUT_SEPARATOR---
8. Comece cada output com uma linha no formato: [OUTPUT_TYPE:tipo] onde tipo e um de: ${outputTypes.join(', ')}
9. Na linha seguinte coloque: [OUTPUT_TITLE:titulo do output]`;
}

// ── AI Response Parser ────────────────────────────────────────────────

function parseAIResponse(
  rawContent: string,
  requestedTypes: OutputType[]
): OrganizeResult[] {
  const results: OrganizeResult[] = [];

  // Try structured parsing first (separator-based)
  const sections = rawContent.split('---OUTPUT_SEPARATOR---').filter((s) => s.trim());

  if (sections.length > 0) {
    for (const section of sections) {
      const trimmed = section.trim();

      // Try to extract type marker
      const typeMatch = trimmed.match(/^\[OUTPUT_TYPE:\s*([^\]]+)\]/m);
      const titleMatch = trimmed.match(/^\[OUTPUT_TITLE:\s*([^\]]+)\]/m);

      if (typeMatch) {
        const rawType = typeMatch[1].trim() as OutputType;
        const outputType = requestedTypes.includes(rawType) ? rawType : null;

        if (outputType) {
          const title =
            titleMatch?.[1]?.trim() ||
            getDefaultTitle(outputType);

          // Remove the marker lines from content
          const content = trimmed
            .replace(/^\[OUTPUT_TYPE:[^\]]+\]\s*/m, '')
            .replace(/^\[OUTPUT_TITLE:[^\]]+\]\s*/m, '')
            .trim();

          results.push({ type: outputType, title, content });
          continue;
        }
      }

      // Fallback: try to detect type from content headings
      const detectedType = detectOutputType(trimmed, requestedTypes);
      if (detectedType) {
        const heading = trimmed.match(/^#\s+(.+)/m);
        results.push({
          type: detectedType,
          title: heading?.[1]?.trim() || getDefaultTitle(detectedType),
          content: trimmed,
        });
      }
    }
  }

  // If structured parsing yielded nothing, try heading-based splitting
  if (results.length === 0 && rawContent.trim()) {
    const headingSections = splitByTopHeadings(rawContent);

    for (const hs of headingSections) {
      const detectedType = detectOutputType(hs.content, requestedTypes);
      if (detectedType && !results.some((r) => r.type === detectedType)) {
        results.push({
          type: detectedType,
          title: hs.heading || getDefaultTitle(detectedType),
          content: hs.content.trim(),
        });
      }
    }

    // If we still got nothing, treat the entire response as one output for the first requested type
    if (results.length === 0 && requestedTypes.length > 0) {
      results.push({
        type: requestedTypes[0],
        title: getDefaultTitle(requestedTypes[0]),
        content: rawContent.trim(),
      });
    }
  }

  return results;
}

function detectOutputType(
  text: string,
  candidates: OutputType[]
): OutputType | null {
  const lowerText = text.toLowerCase();

  const typeSignals: Record<OutputType, string[]> = {
    'action-plan': ['plano de acao', 'action plan', 'tarefas priorizadas', 'prioridade'],
    story: ['story', 'acceptance criteria', 'given', 'when', 'then', 'scope'],
    prd: ['prd', 'product requirements', 'executive summary', 'functional requirements'],
    epic: ['epic', 'wave plan', 'stories derivadas', 'wave'],
    requirements: ['requirements', 'fr-', 'nfr-', 'con-', 'requisitos'],
  };

  let bestMatch: OutputType | null = null;
  let bestScore = 0;

  for (const candidate of candidates) {
    const signals = typeSignals[candidate] || [];
    const score = signals.filter((s) => lowerText.includes(s)).length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = candidate;
    }
  }

  return bestMatch;
}

function splitByTopHeadings(
  text: string
): { heading: string; content: string }[] {
  const lines = text.split('\n');
  const sections: { heading: string; content: string }[] = [];
  let currentHeading = '';
  let currentLines: string[] = [];

  for (const line of lines) {
    const h1Match = line.match(/^#\s+(.+)/);
    const h2Match = line.match(/^##\s+(.+)/);

    if (h1Match || h2Match) {
      if (currentLines.length > 0) {
        sections.push({
          heading: currentHeading,
          content: currentLines.join('\n'),
        });
      }
      currentHeading = (h1Match || h2Match)![1].trim();
      currentLines = [line];
    } else {
      currentLines.push(line);
    }
  }

  if (currentLines.length > 0) {
    sections.push({
      heading: currentHeading,
      content: currentLines.join('\n'),
    });
  }

  return sections;
}

function getDefaultTitle(type: OutputType): string {
  const titles: Record<OutputType, string> = {
    'action-plan': 'Plano de Acao - Brainstorm',
    story: 'Story Draft - Brainstorm',
    prd: 'PRD Draft - Brainstorm',
    epic: 'Epic Draft - Brainstorm',
    requirements: 'Requirements - Brainstorm',
  };
  return titles[type];
}

// ── Mock Fallback ─────────────────────────────────────────────────────

async function mockOrganize(
  ideas: IdeaInput[],
  outputTypes: OutputType[],
  onProgress: (p: number) => void
): Promise<OrganizeResult[]> {
  const results: OrganizeResult[] = [];

  for (let i = 0; i <= 70; i += 10) {
    await new Promise((r) => setTimeout(r, 200));
    onProgress(i);
  }

  const ideaSummary = ideas.map((i) => `- ${i.content}`).join('\n');
  const tags = [...new Set(ideas.flatMap((i) => i.tags))];
  const tagLine = tags.length > 0 ? `\n**Tags identificadas:** ${tags.join(', ')}` : '';

  for (const ot of outputTypes) {
    let title = '';
    let content = '';

    switch (ot) {
      case 'action-plan':
        title = 'Plano de Acao - Brainstorm';
        content = `# Plano de Acao\n\n## Contexto\nBaseado em ${ideas.length} ideias do brainstorm.${tagLine}\n\n## Tarefas Priorizadas\n\n${ideas
          .map((idea, idx) => {
            const priority = idx < 2 ? 'P0' : idx < 5 ? 'P1' : 'P2';
            return `### ${idx + 1}. ${idea.content.slice(0, 80)}\n- **Prioridade:** ${priority}\n- **Tipo:** ${idea.type}\n- **Complexidade:** ${idea.content.length > 100 ? 'standard' : 'simple'}\n- **Responsavel:** @dev\n`;
          })
          .join('\n')}`;
        break;

      case 'story':
        title = 'Story Draft - Brainstorm';
        content = `---\nstory_id: "draft"\ntitle: "Implementar features do brainstorm"\nstatus: Draft\ncomplexity: standard\npriority: P1\n---\n\n# Story: Features do Brainstorm\n\n## Descricao\n${ideas[0]?.content || 'Feature definida no brainstorm'}\n\n## Acceptance Criteria\n${ideas
          .slice(0, 5)
          .map(
            (i, idx) =>
              `- [ ] **AC${idx + 1}:** Given contexto, When ${i.content.slice(0, 50)}, Then resultado esperado`
          )
          .join('\n')}\n\n## Scope\n### IN\n${ideaSummary}\n\n### OUT\n- Itens nao mencionados no brainstorm\n\n## Technical Notes\n${tagLine}`;
        break;

      case 'prd':
        title = 'PRD Draft - Brainstorm';
        content = `# PRD: ${ideas[0]?.content.slice(0, 50) || 'Produto'}\n\n## Executive Summary\nDocumento gerado a partir de ${ideas.length} ideias de brainstorm.\n\n## Functional Requirements\n${ideas
          .map(
            (i, idx) =>
              `### FR-${String(idx + 1).padStart(3, '0')}: ${i.content.slice(0, 60)}\n${i.content}\n`
          )
          .join('\n')}\n\n## Non-Functional Requirements\n- **NFR-001:** Performance adequada\n- **NFR-002:** Usabilidade intuitiva\n\n## Success Metrics\n- Implementacao completa de todas FRs\n- Aprovacao no QA Gate\n\n## Constraints\n- Seguir padroes AIOS existentes\n- Manter compatibilidade com theme system`;
        break;

      case 'epic':
        title = 'Epic Draft - Brainstorm';
        content = `# EPIC: ${ideas[0]?.content.slice(0, 50) || 'Epic do Brainstorm'}\n\n## Descricao\nEpic gerado a partir de brainstorm com ${ideas.length} ideias.\n\n## Stories\n${ideas
          .map(
            (i, idx) =>
              `### Story ${idx + 1}: ${i.content.slice(0, 60)}\n- **Complexidade:** ${i.content.length > 100 ? 'standard' : 'simple'}\n- **Wave:** ${Math.floor(idx / 3) + 1}\n`
          )
          .join('\n')}\n\n## Wave Plan\n- **Wave 1:** Stories 1-3 (paralelas)\n- **Wave 2:** Stories 4+ (dependem de Wave 1)\n\n## Quality Gates\n- Story validation por @po\n- QA Gate por @qa em cada story`;
        break;

      case 'requirements':
        title = 'Requirements - Brainstorm';
        content = `# Requirements Document\n\n## Functional Requirements\n${ideas
          .map(
            (i, idx) =>
              `### FR-${String(idx + 1).padStart(3, '0')}\n**Titulo:** ${i.content.slice(0, 60)}\n**Descricao:** ${i.content}\n**Prioridade:** ${idx < 3 ? 'Must Have' : 'Should Have'}\n`
          )
          .join('\n')}\n\n## Non-Functional Requirements\n### NFR-001: Performance\nTempo de resposta < 2s para operacoes principais.\n\n### NFR-002: Acessibilidade\nWCAG AA compliance.\n\n## Constraints\n### CON-001: Framework\nDeve seguir padroes AIOS (stories, agents, workflows).\n\n### CON-002: Stack\nReact 19 + TypeScript + Zustand + Tailwind CSS.${tagLine}`;
        break;
    }

    results.push({ type: ot, title, content });
  }

  onProgress(100);
  return results;
}

// ── Hook ──────────────────────────────────────────────────────────────

export function useBrainstormOrganize() {
  const abortControllerRef = useRef<AbortController | null>(null);

  const organize = useCallback(
    async (
      ideas: IdeaInput[],
      outputTypes: OutputType[],
      options: OrganizeOptions
    ): Promise<OrganizeResult[]> => {
      const { onProgress, signal } = options;

      // Cancel any in-flight request
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Merge external signal
      if (signal) {
        signal.addEventListener('abort', () => controller.abort());
      }

      const prompt = buildOrganizePrompt(ideas, outputTypes);

      // ── Try real API (streaming) ────────────────────────────────
      try {
        onProgress(5);

        const fullContent = await new Promise<string>((resolve, reject) => {
          let accumulated = '';
          let resolved = false;

          const safeResolve = (value: string) => {
            if (!resolved) {
              resolved = true;
              resolve(value);
            }
          };

          const safeReject = (reason: unknown) => {
            if (!resolved) {
              resolved = true;
              reject(reason);
            }
          };

          // Timeout: if no response within 8s, fall back to mock
          const timeoutId = setTimeout(() => {
            safeReject(new Error('API timeout — falling back to mock'));
          }, 8000);

          controller.signal.addEventListener('abort', () => {
            clearTimeout(timeoutId);
            safeReject(new DOMException('Aborted', 'AbortError'));
          });

          executeApi
            .executeAgentStream(
              {
                squadId: 'orchestrator',
                agentId: 'brainstorm-organizer',
                input: {
                  message: prompt,
                  context: {
                    ideaCount: ideas.length,
                    outputTypes,
                    source: 'brainstorm-room',
                  },
                },
              },
              {
                onStart: () => {
                  clearTimeout(timeoutId);
                  onProgress(10);
                },
                onText: (event) => {
                  accumulated += event.content;
                  // Estimate progress based on content length vs expected (~200 chars per idea per output)
                  const expected = ideas.length * outputTypes.length * 200;
                  const streamProgress = Math.min(
                    90,
                    10 + Math.floor((accumulated.length / expected) * 80)
                  );
                  onProgress(streamProgress);
                },
                onDone: () => {
                  clearTimeout(timeoutId);
                  onProgress(95);
                  safeResolve(accumulated);
                },
                onError: (event) => {
                  clearTimeout(timeoutId);
                  safeReject(new Error(event.error));
                },
              },
              controller.signal
            )
            .catch((err) => {
              safeReject(err);
            });
        });

        // Parse the AI response into structured outputs
        const parsed = parseAIResponse(fullContent, outputTypes);

        // Ensure we have at least one result per requested type
        const coveredTypes = new Set(parsed.map((r) => r.type));
        for (const ot of outputTypes) {
          if (!coveredTypes.has(ot)) {
            // The AI response may have combined everything; add a fallback entry
            parsed.push({
              type: ot,
              title: getDefaultTitle(ot),
              content: fullContent,
            });
          }
        }

        onProgress(100);
        return parsed;
      } catch (error) {
        // If aborted, re-throw
        if ((error as Error).name === 'AbortError') {
          throw error;
        }

        // ── Fallback to mock ────────────────────────────────────
        console.warn(
          '[useBrainstormOrganize] API unavailable, falling back to mock generation:',
          (error as Error).message
        );

        return mockOrganize(ideas, outputTypes, onProgress);
      }
    },
    []
  );

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
  }, []);

  return { organize, cancel };
}
