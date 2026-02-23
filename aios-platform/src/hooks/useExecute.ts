import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { executeApi, mockExecutionHistory, buildExecuteRequest } from '../services/api';
import { useChatStore } from '../stores/chatStore';
import { useExecutionLogStore } from '../stores/executionLogStore';
import type {
  ExecuteRequest,
  ExecuteResponse,
  ExecutionHistory,
  ExecutionStats,
  LLMUsage,
  LLMHealth,
  SquadType,
  MessageAttachment,
  getSquadType,
  StreamToolsEvent,
} from '../types';

/**
 * Extract image URLs from tool results and format as markdown images
 */
function extractImagesFromToolResults(toolResults: StreamToolsEvent['toolResults']): string {
  const imageMarkdown: string[] = [];

  console.log('[extractImages] Processing tool results:', toolResults);

  for (const toolResult of toolResults) {
    // Use 'tool' field (backend) or 'name' field (fallback)
    const toolName = toolResult.tool || (toolResult as any).name || '';
    // Use 'output' field (backend) or 'result' field (fallback)
    const output = toolResult.output || (toolResult as any).result;

    console.log('[extractImages] Tool:', toolName, 'Success:', toolResult.success, 'Output:', output);

    if (!toolResult.success || !output) continue;

    const result = output as Record<string, unknown>;

    // Handle thumbnail generation results
    if (toolName.includes('thumbnail') || toolName.includes('image')) {
      const imageUrl = result.thumbnail_url || result.image_url || result.url;
      console.log('[extractImages] Found image URL in thumbnail tool:', imageUrl);
      if (typeof imageUrl === 'string' && imageUrl.startsWith('http')) {
        const altText = (result.message as string) || 'Thumbnail gerada';
        imageMarkdown.push(`\n\n![${altText}](${imageUrl})\n`);
      }
    }

    // Handle any tool that returns an image URL in standard fields
    for (const key of ['thumbnail_url', 'image_url', 'url', 'imageUrl']) {
      const url = result[key];
      if (typeof url === 'string' && url.startsWith('http') &&
          (url.includes('.png') || url.includes('.jpg') || url.includes('.jpeg') ||
           url.includes('.gif') || url.includes('.webp') || url.includes('fal.media') ||
           url.includes('fal.run') || url.includes('storage.googleapis'))) {
        // Avoid duplicates
        if (!imageMarkdown.some(md => md.includes(url))) {
          console.log('[extractImages] Found image URL in field', key, ':', url);
          const altText = (result.message as string) || (result.original_path as string) || 'Imagem';
          imageMarkdown.push(`\n\n![${altText}](${url})\n`);
        }
      }
    }
  }

  console.log('[extractImages] Final markdown:', imageMarkdown);
  return imageMarkdown.join('');
}

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

interface ExecuteParams {
  sessionId: string;
  squadId: string;
  agentId: string;
  agentName: string;
  squadType: SquadType;
  message: string;
  attachments?: MessageAttachment[];
  context?: Record<string, unknown>;
  stream?: boolean;
}

export function useExecuteAgent() {
  const queryClient = useQueryClient();
  const { addMessage, setStreaming, updateMessage, setAbortController } = useChatStore();
  const { startExecution, endExecution, addAgentStart, addAgentComplete, addToolUse, addError } = useExecutionLogStore();

  return useMutation<ExecuteResponse, Error, ExecuteParams>({
    mutationFn: async ({ sessionId, squadId, agentId, agentName, squadType, message, attachments, context, stream = true }) => {
      // Add user message immediately with attachments
      addMessage(sessionId, {
        role: 'user',
        content: message,
        attachments,
      });

      if (USE_MOCK) {
        // Simulate streaming response
        setStreaming(true);

        // Add initial agent message
        const agentMessageId = addMessage(sessionId, {
          role: 'agent',
          content: '',
          agentId,
          agentName,
          squadId,
          squadType,
          isStreaming: true,
        });

        // Simulate typing
        const mockResponse = getMockResponse(message, agentName);
        let currentContent = '';

        for (const char of mockResponse) {
          await new Promise((resolve) => setTimeout(resolve, 15 + Math.random() * 25));
          currentContent += char;
          updateMessage(sessionId, agentMessageId, currentContent);
        }

        setStreaming(false);

        return {
          executionId: `exec-${Date.now()}`,
          status: 'completed',
          result: {
            agentId,
            agentName,
            message: mockResponse,
            metadata: {
              squad: squadId,
              tier: 1,
              provider: 'mock',
              model: 'mock-model',
              usage: { inputTokens: 100, outputTokens: 300 },
              duration: 2.5,
              processedAt: new Date().toISOString(),
            },
          },
        };
      }

      if (stream) {
        setStreaming(true);

        // Create AbortController for this stream
        const abortController = new AbortController();
        setAbortController(abortController);

        // Add initial agent message for streaming
        const agentMessageId = addMessage(sessionId, {
          role: 'agent',
          content: '',
          agentId,
          agentName,
          squadId,
          squadType,
          isStreaming: true,
        });

        return new Promise((resolve, reject) => {
          let fullContent = '';
          let executionId = '';
          let finalUsage = { inputTokens: 0, outputTokens: 0 };
          let finalDuration = 0;
          let pendingImages = ''; // Images to append when tools are used

          executeApi.executeAgentStream(
            { squadId, agentId, input: { message, context } },
            {
              onStart: (event) => {
                executionId = event.executionId;
                // Log execution start
                startExecution(event.executionId, message);
                addAgentStart(agentId, agentName, 1, 1);
              },
              onText: (event) => {
                fullContent += event.content;
                updateMessage(sessionId, agentMessageId, fullContent + pendingImages);
              },
              onTools: (event) => {
                // Log tool usage
                if (event.toolResults && event.toolResults.length > 0) {
                  for (const toolResult of event.toolResults) {
                    const toolName = toolResult.tool || (toolResult as any).name || 'unknown';
                    addToolUse(
                      toolName,
                      toolResult.success,
                      toolResult.output || (toolResult as any).result,
                      toolResult.error
                    );
                  }

                  // Extract images from tool results and append as markdown
                  const imageMarkdown = extractImagesFromToolResults(event.toolResults);
                  if (imageMarkdown) {
                    pendingImages += imageMarkdown;
                    // Update message with images appended
                    updateMessage(sessionId, agentMessageId, fullContent + pendingImages);
                  }
                }
              },
              onDone: (event) => {
                finalUsage = event.usage;
                finalDuration = event.duration;
                setStreaming(false);
                setAbortController(null);

                // Log agent completion
                addAgentComplete(agentId, agentName, 1, 1, event.duration);
                endExecution(true, `Resposta gerada em ${event.duration.toFixed(1)}s`);

                // Final content includes any images from tools
                const finalContent = fullContent + pendingImages;

                // Update message with final metadata
                updateMessage(sessionId, agentMessageId, finalContent, {
                  provider: 'claude',
                  model: 'claude-sonnet-4-6-20250929',
                  usage: finalUsage,
                  duration: finalDuration,
                });

                resolve({
                  executionId,
                  status: 'completed',
                  result: {
                    agentId,
                    agentName,
                    message: finalContent,
                    metadata: {
                      squad: squadId,
                      tier: 1,
                      provider: 'claude',
                      model: 'claude-sonnet-4-6-20250929',
                      usage: finalUsage,
                      duration: finalDuration,
                      processedAt: new Date().toISOString(),
                    },
                  },
                });
              },
              onError: (event) => {
                setStreaming(false);
                setAbortController(null);
                // Log error
                addError(event.error);
                endExecution(false, event.error);
                reject(new Error(event.error));
              },
            },
            abortController.signal
          );

          // Handle abort
          abortController.signal.addEventListener('abort', () => {
            setStreaming(false);
            setAbortController(null);
            // Log cancellation
            endExecution(false, 'Execução cancelada pelo usuário');
            // Update message to indicate it was stopped
            if (fullContent) {
              updateMessage(sessionId, agentMessageId, fullContent + '\n\n*[Resposta interrompida]*');
            }
            resolve({
              executionId,
              status: 'cancelled',
            });
          });
        });
      }

      // Non-streaming execution
      const request = buildExecuteRequest(squadId, agentId, message, { context });
      const response = await executeApi.executeAgent(request);

      // Add agent response
      if (response.result) {
        addMessage(sessionId, {
          role: 'agent',
          content: response.result.message,
          agentId,
          agentName,
          squadId,
          squadType,
          metadata: response.result.metadata,
        });
      }

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['executionHistory'] });
    },
  });
}

export function useExecutionHistory(limit: number = 20) {
  return useQuery<ExecutionHistory>({
    queryKey: ['executionHistory', limit],
    queryFn: async () => {
      if (USE_MOCK) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        return mockExecutionHistory;
      }
      return executeApi.getHistory({ limit });
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - reduce API calls
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
}

export function useExecutionStats() {
  return useQuery<ExecutionStats>({
    queryKey: ['executionStats'],
    queryFn: async () => {
      // Always fetch real stats - metrics should reflect actual usage
      try {
        return await executeApi.getStats();
      } catch (error) {
        console.warn('[useExecutionStats] Failed to fetch stats, using fallback:', error);
        return {
          total: 0,
          byStatus: { completed: 0, failed: 0, pending: 0 },
          bySquad: {},
          byAgent: {},
        };
      }
    },
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
  });
}

export function useTokenUsage() {
  return useQuery<LLMUsage>({
    queryKey: ['tokenUsage'],
    queryFn: async () => {
      // Always fetch real token usage - metrics should reflect actual usage
      try {
        return await executeApi.getTokenUsage();
      } catch (error) {
        console.warn('[useTokenUsage] Failed to fetch token usage, using fallback:', error);
        return {
          claude: { input: 0, output: 0, requests: 0 },
          openai: { input: 0, output: 0, requests: 0 },
          total: { input: 0, output: 0, requests: 0 },
        };
      }
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

export function useLLMHealth() {
  return useQuery<LLMHealth>({
    queryKey: ['llmHealth'],
    queryFn: async () => {
      // Always fetch real health status - should reflect actual provider availability
      try {
        return await executeApi.getLLMHealth();
      } catch (error) {
        console.warn('[useLLMHealth] Failed to fetch LLM health, using fallback:', error);
        return {
          claude: { available: false, error: 'Could not connect to API' },
          openai: { available: false, error: 'Could not connect to API' },
        };
      }
    },
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

// Mock responses based on prompt content
function getMockResponse(prompt: string, agentName: string): string {
  const lowerPrompt = prompt.toLowerCase();

  if (lowerPrompt.includes('headline') || lowerPrompt.includes('título')) {
    return `Aqui estão algumas opções de headline:\n\n1. **"Menos caos, mais resultados"** - Direto e impactante\n\n2. **"Seu dia tem 24 horas. Por que desperdiçar 8?"** - Provocativo\n\n3. **"A produtividade que você merecia"** - Emocional\n\nRecomendo testar a opção 2 em A/B testing - ela tem alto potencial de engajamento por desafiar o status quo do leitor.`;
  }

  if (lowerPrompt.includes('roteiro') || lowerPrompt.includes('script') || lowerPrompt.includes('vídeo')) {
    return `📹 **Roteiro para Reels (60s)**\n\n**HOOK (0-3s):**\n"Pare de fazer isso agora." [olhar direto para câmera]\n\n**PROBLEMA (3-15s):**\n"Você trabalha 10 horas por dia e ainda assim sente que não produz nada?"\n\n**VIRADA (15-40s):**\n"O problema não é você. É o sistema que você usa. Deixa eu te mostrar..."\n[Demonstração rápida do método/produto]\n\n**CTA (40-60s):**\n"Link na bio. Sua vida produtiva começa agora."\n\n🎯 **Dica:** Grave 3 versões do hook e teste.`;
  }

  if (lowerPrompt.includes('code') || lowerPrompt.includes('código') || lowerPrompt.includes('solid')) {
    return `🧹 **Análise de Clean Code**\n\nIdentifiquei os seguintes pontos:\n\n**Violações SOLID encontradas:**\n\n1. **SRP (Single Responsibility)**: A classe \`UserService\` está fazendo validação, persistência e envio de emails. Sugiro separar em \`UserValidator\`, \`UserRepository\` e \`EmailService\`.\n\n2. **OCP (Open/Closed)**: O método \`calculateDiscount\` usa switch/case para tipos de cliente. Use Strategy Pattern.\n\n3. **DIP (Dependency Inversion)**: Dependência direta de \`MySQLConnection\`. Injete \`IDatabase\` interface.\n\n**Próximos passos:**\n- Extrair interfaces\n- Aplicar injeção de dependência\n- Criar testes unitários`;
  }

  if (lowerPrompt.includes('paleta') || lowerPrompt.includes('cor') || lowerPrompt.includes('design')) {
    return `🎨 **Paleta de Cores Sugerida**\n\n| Função | Cor | Hex |\n|--------|-----|-----|\n| Primária | Azul Profundo | #2D3436 |\n| Secundária | Coral Suave | #FF7675 |\n| Accent | Dourado | #FDCB6E |\n| Background | Off-White | #F8F9FA |\n| Text | Grafite | #636E72 |\n\n✨ **Racional:** Esta paleta equilibra profissionalismo (azul/grafite) com energia (coral/dourado), ideal para marcas que querem transmitir confiança com um toque de modernidade.`;
  }

  // Thumbnail generation mock - demonstrates media response
  if (lowerPrompt.includes('thumbnail') || lowerPrompt.includes('thumb') || lowerPrompt.includes('miniatura')) {
    return `🖼️ **Thumbnail Gerada!**\n\nCriei uma thumbnail otimizada para o seu vídeo com os seguintes elementos:\n\n**Elementos visuais:**\n- Fundo com gradiente vibrante (alta visibilidade no feed)\n- Texto em bold com outline (legível em qualquer tamanho)\n- Expressão facial de surpresa/curiosidade (gatilho emocional)\n- Contraste de cores complementares\n\n**Especificações técnicas:**\n- Resolução: 1280x720px (HD)\n- Formato: PNG com transparência\n- Safe zone: texto dentro da área segura\n\n**Preview da thumbnail:**\n\n![Thumbnail gerada para YouTube](https://picsum.photos/1280/720?random=${Date.now()})\n\n---\n\n💡 **Dica:** Teste esta thumb contra sua thumb atual em A/B testing no YouTube Studio!\n\nClique na imagem para ampliar e baixar.`;
  }

  // Image request mock
  if (lowerPrompt.includes('imagem') || lowerPrompt.includes('image') || lowerPrompt.includes('foto') || lowerPrompt.includes('banner')) {
    return `🎨 **Imagem Criada!**\n\nAqui está a imagem solicitada:\n\n![Imagem gerada](https://picsum.photos/800/600?random=${Date.now()})\n\n**Características:**\n- Alta resolução para web e redes sociais\n- Proporção otimizada para múltiplas plataformas\n- Composição balanceada\n\nVocê pode clicar na imagem para ampliar e fazer download direto.\n\nDeseja algum ajuste?`;
  }

  // Default response
  return `Entendi sua solicitação! Com base no que você pediu, aqui está minha análise:\n\n${prompt}\n\n---\n\n**Próximos passos sugeridos:**\n1. Validar a abordagem com stakeholders\n2. Criar um protótipo inicial\n3. Iterar baseado em feedback\n\nPosso detalhar qualquer um desses pontos. É só pedir! 🚀`;
}
