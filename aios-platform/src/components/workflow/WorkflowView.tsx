import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassButton, Badge, Avatar } from '../ui';
import { WorkflowCanvas } from './WorkflowCanvas';
import { WorkflowSidebar } from './WorkflowSidebar';
import { WorkflowMissionDetail } from './WorkflowMissionDetail';
import { cn, formatRelativeTime, getSquadTheme } from '../../lib/utils';
import { useWorkflows, useCreateWorkflow, useExecuteWorkflow, useWorkflowExecutions, useExecuteWorkflowStream, useSmartOrchestration } from '../../hooks/useWorkflows';
import { workflowsApi } from '../../services/api';
import { CreateWorkflowModal } from '../settings/WorkflowManager';
import { WorkflowExecutionLive } from './WorkflowExecutionLive';
import type { WorkflowMission, WorkflowOperation, AgentTool } from './types';
import type { SquadType } from '../../types';

// Icons
const PlayIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const PauseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </svg>
);

const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
  </svg>
);

const GridIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const ListIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);

const ZoomInIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
    <line x1="11" y1="8" x2="11" y2="14" />
    <line x1="8" y1="11" x2="14" y2="11" />
  </svg>
);

const ZoomOutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
    <line x1="8" y1="11" x2="14" y2="11" />
  </svg>
);

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ClockIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const TokenIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v12M9 9l3-3 3 3M9 15l3 3 3-3" />
  </svg>
);

// Helper functions
const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

const formatTokens = (tokens: number): string => {
  if (tokens < 1000) return tokens.toString();
  if (tokens < 1000000) return `${(tokens / 1000).toFixed(1)}K`;
  return `${(tokens / 1000000).toFixed(2)}M`;
};

// Tool definitions
const AGENT_TOOLS: Record<string, AgentTool[]> = {
  orchestrator: [
    { id: 'api', name: 'API', description: 'Integração com APIs externas', connected: true },
    { id: 'slack', name: 'Slack', description: 'Comunicação com equipe', connected: true },
    { id: 'notion', name: 'Notion', description: 'Documentação e wikis', connected: true },
    { id: 'calendar', name: 'Calendar', description: 'Agendamento de tarefas', connected: true },
    { id: 'analytics', name: 'Analytics', description: 'Métricas e dashboards', connected: true },
  ],
  copywriting: [
    { id: 'web-search', name: 'Web Search', description: 'Pesquisa na internet', connected: true },
    { id: 'web-scraper', name: 'Web Scraper', description: 'Extração de conteúdo', connected: true },
    { id: 'docs', name: 'Google Docs', description: 'Edição de documentos', connected: true },
    { id: 'notion', name: 'Notion', description: 'Base de conhecimento', connected: true },
    { id: 'analytics', name: 'Analytics', description: 'Dados de SEO', connected: false },
  ],
  design: [
    { id: 'figma', name: 'Figma', description: 'Design de interfaces', connected: true },
    { id: 'image-gen', name: 'Image Gen', description: 'Geração de imagens AI', connected: true },
    { id: 'web-scraper', name: 'Web Scraper', description: 'Referências visuais', connected: true },
    { id: 'file-system', name: 'File System', description: 'Gerenciamento de assets', connected: true },
    { id: 'notion', name: 'Notion', description: 'Brand guidelines', connected: true },
  ],
  creator: [
    { id: 'image-gen', name: 'Image Gen', description: 'Criação de visuais', connected: true },
    { id: 'web-search', name: 'Web Search', description: 'Pesquisa de trends', connected: true },
    { id: 'analytics', name: 'Analytics', description: 'Métricas de conteúdo', connected: true },
    { id: 'calendar', name: 'Calendar', description: 'Calendário editorial', connected: true },
    { id: 'slack', name: 'Slack', description: 'Comunicação', connected: false },
  ],
};

// Mock data for simple workflow
const createSimpleMission = (): WorkflowMission => ({
  id: 'mission-001',
  name: 'Campanha de Lançamento Q1',
  description: 'Criação completa de campanha incluindo copy, design e conteúdo para redes sociais',
  status: 'in-progress',
  startedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  progress: 45,
  currentNode: 'node-copy-1',
  tokens: { input: 12450, output: 8320, total: 20770 },
  estimatedTimeRemaining: 420, // 7 minutes
  nodes: [
    {
      id: 'node-start',
      type: 'start',
      label: 'Início',
      status: 'completed',
      position: { x: 100, y: 300 },
    },
    {
      id: 'node-orchestrator',
      type: 'agent',
      label: 'Orquestração',
      agentName: 'Orion',
      squadType: 'orchestrator',
      status: 'completed',
      position: { x: 250, y: 300 },
      progress: 100,
      currentAction: 'Tarefa concluída',
      request: 'Coordenar a criação de uma campanha de lançamento completa para o produto X, incluindo headlines, body copy, design visual e conteúdo para redes sociais.',
      startedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
      tools: AGENT_TOOLS.orchestrator,
      tokens: { input: 2150, output: 1820, total: 3970 },
      estimatedDuration: 60,
      todos: [
        { id: 't1', text: 'Analisar briefing do cliente', status: 'completed' },
        { id: 't2', text: 'Identificar dependências entre tarefas', status: 'completed' },
        { id: 't3', text: 'Distribuir tarefas para agents especializados', status: 'completed' },
        { id: 't4', text: 'Monitorar progresso geral', status: 'completed' },
      ],
      files: [
        { id: 'f1', name: 'task-distribution.json', type: 'json', size: '2.1 KB', createdAt: new Date(Date.now() - 4 * 60 * 1000).toISOString() },
        { id: 'f2', name: 'workflow-plan.md', type: 'markdown', size: '1.5 KB', createdAt: new Date(Date.now() - 4.5 * 60 * 1000).toISOString() },
      ],
      output: 'Workflow configurado com sucesso. 5 agents alocados, 4 tarefas principais distribuídas.',
    },
    {
      id: 'node-copy-1',
      type: 'agent',
      label: 'Headlines',
      agentName: 'Luna',
      squadType: 'copywriting',
      status: 'active',
      position: { x: 420, y: 180 },
      progress: 65,
      currentAction: 'Escrevendo variação #3...',
      request: 'Criar 5 opções de headline impactantes para a landing page do produto X. Foco em conversão e benefícios principais. Tom: profissional mas acessível.',
      startedAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
      tools: AGENT_TOOLS.copywriting,
      tokens: { input: 3200, output: 2150, total: 5350 },
      estimatedDuration: 180,
      todos: [
        { id: 't1', text: 'Analisar público-alvo e tom de voz', status: 'completed' },
        { id: 't2', text: 'Pesquisar headlines de concorrentes', status: 'completed' },
        { id: 't3', text: 'Criar headline #1 - Foco em benefício principal', status: 'completed' },
        { id: 't4', text: 'Criar headline #2 - Foco em urgência', status: 'completed' },
        { id: 't5', text: 'Criar headline #3 - Foco em prova social', status: 'in-progress' },
        { id: 't6', text: 'Criar headline #4 - Foco em exclusividade', status: 'pending' },
        { id: 't7', text: 'Criar headline #5 - Variação criativa', status: 'pending' },
      ],
      files: [
        { id: 'f1', name: 'headlines-v1.md', type: 'markdown', size: '1.8 KB', createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString() },
        { id: 'f2', name: 'competitor-research.txt', type: 'text', size: '3.2 KB', createdAt: new Date(Date.now() - 3 * 60 * 1000).toISOString() },
      ],
    },
    {
      id: 'node-copy-2',
      type: 'agent',
      label: 'Body Copy',
      agentName: 'Atlas',
      squadType: 'copywriting',
      status: 'waiting',
      position: { x: 420, y: 420 },
      progress: 0,
      currentAction: 'Aguardando headlines...',
      request: 'Desenvolver o body copy da landing page com base nas headlines aprovadas. Incluir: introdução, benefícios, features, prova social e CTA.',
      tools: AGENT_TOOLS.copywriting,
      tokens: { input: 0, output: 0, total: 0 },
      estimatedDuration: 240,
      todos: [
        { id: 't1', text: 'Aguardar headlines finalizadas', status: 'in-progress' },
        { id: 't2', text: 'Desenvolver introdução', status: 'pending' },
        { id: 't3', text: 'Escrever seção de benefícios', status: 'pending' },
        { id: 't4', text: 'Detalhar features do produto', status: 'pending' },
        { id: 't5', text: 'Criar seção de prova social', status: 'pending' },
        { id: 't6', text: 'Escrever CTAs', status: 'pending' },
      ],
      files: [],
    },
    {
      id: 'node-design',
      type: 'agent',
      label: 'Visual Design',
      agentName: 'Maya',
      squadType: 'design',
      status: 'waiting',
      position: { x: 600, y: 300 },
      progress: 0,
      currentAction: 'Aguardando copy...',
      request: 'Criar o design visual da landing page seguindo o brand guideline. Incluir hero section, layout de benefícios, e elementos visuais de suporte.',
      tools: AGENT_TOOLS.design,
      tokens: { input: 0, output: 0, total: 0 },
      estimatedDuration: 300,
      todos: [
        { id: 't1', text: 'Aguardar copy finalizado', status: 'in-progress' },
        { id: 't2', text: 'Criar hero section', status: 'pending' },
        { id: 't3', text: 'Desenvolver layout de benefícios', status: 'pending' },
        { id: 't4', text: 'Criar elementos visuais de suporte', status: 'pending' },
        { id: 't5', text: 'Adaptar para versão mobile', status: 'pending' },
      ],
      files: [],
    },
    {
      id: 'node-creator',
      type: 'agent',
      label: 'Conteúdo Social',
      agentName: 'Phoenix',
      squadType: 'creator',
      status: 'idle',
      position: { x: 780, y: 300 },
      progress: 0,
      request: 'Criar pacote de conteúdo para redes sociais: 5 posts para Instagram, 3 para LinkedIn, e 2 vídeos curtos para Reels/TikTok.',
      tools: AGENT_TOOLS.creator,
      tokens: { input: 0, output: 0, total: 0 },
      estimatedDuration: 360,
      todos: [
        { id: 't1', text: 'Aguardar assets de design', status: 'pending' },
        { id: 't2', text: 'Criar 5 posts para Instagram', status: 'pending' },
        { id: 't3', text: 'Criar 3 posts para LinkedIn', status: 'pending' },
        { id: 't4', text: 'Desenvolver roteiro vídeo #1', status: 'pending' },
        { id: 't5', text: 'Desenvolver roteiro vídeo #2', status: 'pending' },
      ],
      files: [],
    },
    {
      id: 'node-review',
      type: 'checkpoint',
      label: 'Revisão Final',
      status: 'idle',
      position: { x: 920, y: 300 },
      request: 'Ponto de revisão para aprovação de todos os materiais antes da entrega final.',
      todos: [
        { id: 't1', text: 'Revisar todos os materiais', status: 'pending' },
        { id: 't2', text: 'Verificar consistência de marca', status: 'pending' },
        { id: 't3', text: 'Aprovar ou solicitar ajustes', status: 'pending' },
      ],
    },
    {
      id: 'node-end',
      type: 'end',
      label: 'Concluído',
      status: 'idle',
      position: { x: 1050, y: 300 },
    },
  ],
  edges: [
    { id: 'edge-1', source: 'node-start', target: 'node-orchestrator', status: 'completed' },
    { id: 'edge-2', source: 'node-orchestrator', target: 'node-copy-1', status: 'active', animated: true },
    { id: 'edge-3', source: 'node-orchestrator', target: 'node-copy-2', status: 'active', animated: true },
    { id: 'edge-4', source: 'node-copy-1', target: 'node-design', status: 'idle' },
    { id: 'edge-5', source: 'node-copy-2', target: 'node-design', status: 'idle' },
    { id: 'edge-6', source: 'node-design', target: 'node-creator', status: 'idle' },
    { id: 'edge-7', source: 'node-creator', target: 'node-review', status: 'idle' },
    { id: 'edge-8', source: 'node-review', target: 'node-end', status: 'idle' },
  ],
  agents: [
    { id: 'agent-1', name: 'Orion', squadType: 'orchestrator', role: 'Orchestrator Chief', status: 'completed', currentTask: 'Distribuição concluída' },
    { id: 'agent-2', name: 'Luna', squadType: 'copywriting', role: 'Creative Writer', status: 'working', currentTask: 'Criando headlines' },
    { id: 'agent-3', name: 'Atlas', squadType: 'copywriting', role: 'Content Strategist', status: 'waiting', currentTask: 'Aguardando' },
    { id: 'agent-4', name: 'Maya', squadType: 'design', role: 'Visual Designer', status: 'waiting', currentTask: 'Aguardando copy' },
    { id: 'agent-5', name: 'Phoenix', squadType: 'creator', role: 'Content Creator', status: 'waiting', currentTask: 'Aguardando assets' },
  ],
});

// Complex multi-squad workflow
const createComplexMission = (): WorkflowMission => ({
  id: 'mission-002',
  name: 'Lançamento de Produto Completo',
  description: 'Estratégia integrada de lançamento com múltiplos squads: pesquisa de mercado, branding, conteúdo multiplataforma, automação de marketing e análise de performance.',
  status: 'in-progress',
  startedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  progress: 35,
  currentNode: 'node-research',
  tokens: { input: 45200, output: 32100, total: 77300 },
  estimatedTimeRemaining: 1800, // 30 minutes
  nodes: [
    // Start
    { id: 'node-start', type: 'start', label: 'Início', status: 'completed', position: { x: 50, y: 350 } },

    // Phase 1: Orchestration & Research (Row 1)
    {
      id: 'node-orchestrator-main',
      type: 'agent',
      label: 'Orquestração Principal',
      agentName: 'Orion',
      squadType: 'orchestrator',
      status: 'completed',
      position: { x: 180, y: 350 },
      progress: 100,
      tools: AGENT_TOOLS.orchestrator,
      tokens: { input: 4500, output: 3200, total: 7700 },
      estimatedDuration: 120,
      request: 'Coordenar lançamento completo do produto, gerenciando 4 squads e 12 agents simultaneamente.',
      output: 'Plano de execução definido com 4 fases e 15 entregas.',
      todos: [
        { id: 't1', text: 'Mapear todas as dependências', status: 'completed' },
        { id: 't2', text: 'Alocar agents por especialidade', status: 'completed' },
        { id: 't3', text: 'Definir checkpoints de revisão', status: 'completed' },
      ],
      files: [
        { id: 'f1', name: 'master-plan.md', type: 'markdown', size: '4.2 KB', createdAt: new Date(Date.now() - 14 * 60 * 1000).toISOString() },
      ],
    },

    // Phase 2: Research & Strategy (Parallel branch 1)
    {
      id: 'node-research',
      type: 'agent',
      label: 'Pesquisa de Mercado',
      agentName: 'Nova',
      squadType: 'copywriting',
      status: 'active',
      position: { x: 350, y: 150 },
      progress: 70,
      tools: [
        { id: 'web-search', name: 'Web Search', connected: true },
        { id: 'web-scraper', name: 'Web Scraper', connected: true },
        { id: 'analytics', name: 'Analytics', connected: true },
        { id: 'sheets', name: 'Sheets', connected: true },
      ],
      tokens: { input: 8200, output: 5400, total: 13600 },
      estimatedDuration: 300,
      currentAction: 'Analisando dados de concorrentes...',
      request: 'Realizar pesquisa completa de mercado, análise de concorrentes e identificação de oportunidades.',
      todos: [
        { id: 't1', text: 'Mapear concorrentes diretos', status: 'completed' },
        { id: 't2', text: 'Analisar posicionamento de preço', status: 'completed' },
        { id: 't3', text: 'Identificar gaps de mercado', status: 'in-progress' },
        { id: 't4', text: 'Compilar relatório final', status: 'pending' },
      ],
      files: [
        { id: 'f1', name: 'competitor-analysis.xlsx', type: 'code', size: '156 KB', createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
      ],
    },
    {
      id: 'node-persona',
      type: 'agent',
      label: 'Personas & ICP',
      agentName: 'Atlas',
      squadType: 'copywriting',
      status: 'active',
      position: { x: 350, y: 300 },
      progress: 55,
      tools: AGENT_TOOLS.copywriting,
      tokens: { input: 5600, output: 4100, total: 9700 },
      estimatedDuration: 240,
      currentAction: 'Definindo buyer personas...',
      request: 'Criar personas detalhadas e definir ICP (Ideal Customer Profile) baseado em dados.',
      todos: [
        { id: 't1', text: 'Analisar dados demográficos', status: 'completed' },
        { id: 't2', text: 'Criar persona primária', status: 'completed' },
        { id: 't3', text: 'Criar persona secundária', status: 'in-progress' },
        { id: 't4', text: 'Documentar jornada do cliente', status: 'pending' },
      ],
      files: [
        { id: 'f1', name: 'persona-primaria.md', type: 'markdown', size: '2.8 KB', createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString() },
      ],
    },

    // Phase 2: Brand & Visual (Parallel branch 2)
    {
      id: 'node-brand-strategy',
      type: 'agent',
      label: 'Estratégia de Marca',
      agentName: 'Luna',
      squadType: 'copywriting',
      status: 'active',
      position: { x: 350, y: 450 },
      progress: 80,
      tools: AGENT_TOOLS.copywriting,
      tokens: { input: 6800, output: 5200, total: 12000 },
      estimatedDuration: 180,
      currentAction: 'Finalizando tom de voz...',
      request: 'Desenvolver estratégia de marca, posicionamento e tom de voz.',
      todos: [
        { id: 't1', text: 'Definir proposta de valor', status: 'completed' },
        { id: 't2', text: 'Criar manifesto da marca', status: 'completed' },
        { id: 't3', text: 'Definir tom de voz', status: 'in-progress' },
        { id: 't4', text: 'Guidelines de comunicação', status: 'pending' },
      ],
      files: [
        { id: 'f1', name: 'brand-manifesto.md', type: 'markdown', size: '3.5 KB', createdAt: new Date(Date.now() - 7 * 60 * 1000).toISOString() },
        { id: 'f2', name: 'value-proposition.md', type: 'markdown', size: '1.2 KB', createdAt: new Date(Date.now() - 9 * 60 * 1000).toISOString() },
      ],
    },
    {
      id: 'node-visual-identity',
      type: 'agent',
      label: 'Identidade Visual',
      agentName: 'Maya',
      squadType: 'design',
      status: 'waiting',
      position: { x: 350, y: 600 },
      progress: 0,
      tools: AGENT_TOOLS.design,
      tokens: { input: 0, output: 0, total: 0 },
      estimatedDuration: 360,
      currentAction: 'Aguardando estratégia de marca...',
      request: 'Criar identidade visual completa alinhada com a estratégia de marca.',
      todos: [
        { id: 't1', text: 'Aguardar brand strategy', status: 'in-progress' },
        { id: 't2', text: 'Desenvolver moodboard', status: 'pending' },
        { id: 't3', text: 'Criar paleta de cores', status: 'pending' },
        { id: 't4', text: 'Definir tipografia', status: 'pending' },
        { id: 't5', text: 'Criar elementos gráficos', status: 'pending' },
      ],
      files: [],
    },

    // Checkpoint 1
    {
      id: 'node-checkpoint-1',
      type: 'checkpoint',
      label: 'Review: Estratégia',
      status: 'idle',
      position: { x: 520, y: 350 },
      request: 'Validar pesquisa, personas, estratégia de marca e identidade visual antes de prosseguir.',
    },

    // Phase 3: Content Creation (Multiple parallel tracks)
    {
      id: 'node-copy-landing',
      type: 'agent',
      label: 'Copy Landing Page',
      agentName: 'Luna',
      squadType: 'copywriting',
      status: 'idle',
      position: { x: 680, y: 100 },
      progress: 0,
      tools: AGENT_TOOLS.copywriting,
      request: 'Criar todo o copy da landing page de lançamento.',
    },
    {
      id: 'node-copy-email',
      type: 'agent',
      label: 'Sequência de Emails',
      agentName: 'Atlas',
      squadType: 'copywriting',
      status: 'idle',
      position: { x: 680, y: 250 },
      progress: 0,
      tools: [
        ...AGENT_TOOLS.copywriting,
        { id: 'email', name: 'Email', description: 'Automação de emails', connected: true },
      ],
      request: 'Criar sequência de 7 emails para nutrição e conversão.',
    },
    {
      id: 'node-design-landing',
      type: 'agent',
      label: 'Design Landing Page',
      agentName: 'Maya',
      squadType: 'design',
      status: 'idle',
      position: { x: 680, y: 400 },
      progress: 0,
      tools: AGENT_TOOLS.design,
      request: 'Criar design completo da landing page (desktop e mobile).',
    },
    {
      id: 'node-design-ads',
      type: 'agent',
      label: 'Criativos de Ads',
      agentName: 'Zara',
      squadType: 'design',
      status: 'idle',
      position: { x: 680, y: 550 },
      progress: 0,
      tools: AGENT_TOOLS.design,
      request: 'Criar pack de criativos para Meta Ads e Google Ads.',
    },
    {
      id: 'node-social-content',
      type: 'agent',
      label: 'Conteúdo Social',
      agentName: 'Phoenix',
      squadType: 'creator',
      status: 'idle',
      position: { x: 850, y: 175 },
      progress: 0,
      tools: AGENT_TOOLS.creator,
      request: 'Criar calendário de 30 dias de conteúdo para Instagram, LinkedIn e TikTok.',
    },
    {
      id: 'node-video-scripts',
      type: 'agent',
      label: 'Roteiros de Vídeo',
      agentName: 'Echo',
      squadType: 'creator',
      status: 'idle',
      position: { x: 850, y: 325 },
      progress: 0,
      tools: [
        ...AGENT_TOOLS.creator,
        { id: 'code-interpreter', name: 'Code', description: 'Formatação de roteiros', connected: true },
      ],
      request: 'Criar roteiros para vídeo de lançamento, demo e depoimentos.',
    },

    // Checkpoint 2
    {
      id: 'node-checkpoint-2',
      type: 'checkpoint',
      label: 'Review: Conteúdo',
      status: 'idle',
      position: { x: 1000, y: 350 },
      request: 'Revisar todos os materiais de conteúdo antes da implementação.',
    },

    // Phase 4: Integration & Launch
    {
      id: 'node-integration',
      type: 'agent',
      label: 'Integração & Setup',
      agentName: 'Orion',
      squadType: 'orchestrator',
      status: 'idle',
      position: { x: 1150, y: 250 },
      progress: 0,
      tools: [
        ...AGENT_TOOLS.orchestrator,
        { id: 'api', name: 'API', description: 'Integrações', connected: true },
        { id: 'database', name: 'Database', description: 'Configuração de dados', connected: true },
      ],
      request: 'Configurar todas as integrações, automações e tracking.',
    },
    {
      id: 'node-qa',
      type: 'agent',
      label: 'QA & Testes',
      agentName: 'Sage',
      squadType: 'orchestrator',
      status: 'idle',
      position: { x: 1150, y: 450 },
      progress: 0,
      tools: [
        { id: 'web-scraper', name: 'Web Scraper', connected: true },
        { id: 'analytics', name: 'Analytics', connected: true },
        { id: 'api', name: 'API', connected: true },
      ],
      request: 'Testar todos os fluxos, links, automações e tracking.',
    },

    // Final
    {
      id: 'node-launch',
      type: 'checkpoint',
      label: 'Go Live',
      status: 'idle',
      position: { x: 1300, y: 350 },
      request: 'Aprovação final e ativação de todas as campanhas.',
    },
    { id: 'node-end', type: 'end', label: 'Lançado', status: 'idle', position: { x: 1420, y: 350 } },
  ],
  edges: [
    // Start to orchestrator
    { id: 'e1', source: 'node-start', target: 'node-orchestrator-main', status: 'completed' },

    // Orchestrator to Phase 2 (parallel)
    { id: 'e2', source: 'node-orchestrator-main', target: 'node-research', status: 'active', animated: true },
    { id: 'e3', source: 'node-orchestrator-main', target: 'node-persona', status: 'active', animated: true },
    { id: 'e4', source: 'node-orchestrator-main', target: 'node-brand-strategy', status: 'active', animated: true },
    { id: 'e5', source: 'node-orchestrator-main', target: 'node-visual-identity', status: 'idle' },

    // Brand strategy to visual identity
    { id: 'e6', source: 'node-brand-strategy', target: 'node-visual-identity', status: 'idle', label: 'depende' },

    // Phase 2 to Checkpoint 1
    { id: 'e7', source: 'node-research', target: 'node-checkpoint-1', status: 'idle' },
    { id: 'e8', source: 'node-persona', target: 'node-checkpoint-1', status: 'idle' },
    { id: 'e9', source: 'node-brand-strategy', target: 'node-checkpoint-1', status: 'idle' },
    { id: 'e10', source: 'node-visual-identity', target: 'node-checkpoint-1', status: 'idle' },

    // Checkpoint 1 to Phase 3
    { id: 'e11', source: 'node-checkpoint-1', target: 'node-copy-landing', status: 'idle' },
    { id: 'e12', source: 'node-checkpoint-1', target: 'node-copy-email', status: 'idle' },
    { id: 'e13', source: 'node-checkpoint-1', target: 'node-design-landing', status: 'idle' },
    { id: 'e14', source: 'node-checkpoint-1', target: 'node-design-ads', status: 'idle' },

    // Copy to social/video
    { id: 'e15', source: 'node-copy-landing', target: 'node-social-content', status: 'idle' },
    { id: 'e16', source: 'node-copy-landing', target: 'node-video-scripts', status: 'idle' },

    // Phase 3 to Checkpoint 2
    { id: 'e17', source: 'node-social-content', target: 'node-checkpoint-2', status: 'idle' },
    { id: 'e18', source: 'node-video-scripts', target: 'node-checkpoint-2', status: 'idle' },
    { id: 'e19', source: 'node-design-landing', target: 'node-checkpoint-2', status: 'idle' },
    { id: 'e20', source: 'node-design-ads', target: 'node-checkpoint-2', status: 'idle' },
    { id: 'e21', source: 'node-copy-email', target: 'node-checkpoint-2', status: 'idle' },

    // Checkpoint 2 to Phase 4
    { id: 'e22', source: 'node-checkpoint-2', target: 'node-integration', status: 'idle' },
    { id: 'e23', source: 'node-checkpoint-2', target: 'node-qa', status: 'idle' },

    // Phase 4 to Launch
    { id: 'e24', source: 'node-integration', target: 'node-launch', status: 'idle' },
    { id: 'e25', source: 'node-qa', target: 'node-launch', status: 'idle' },

    // Launch to End
    { id: 'e26', source: 'node-launch', target: 'node-end', status: 'idle' },
  ],
  agents: [
    { id: 'agent-1', name: 'Orion', squadType: 'orchestrator', role: 'Lead Orchestrator', status: 'completed', currentTask: 'Monitorando execução' },
    { id: 'agent-2', name: 'Nova', squadType: 'copywriting', role: 'Research Analyst', status: 'working', currentTask: 'Pesquisa de mercado' },
    { id: 'agent-3', name: 'Atlas', squadType: 'copywriting', role: 'Content Strategist', status: 'working', currentTask: 'Criando personas' },
    { id: 'agent-4', name: 'Luna', squadType: 'copywriting', role: 'Creative Writer', status: 'working', currentTask: 'Estratégia de marca' },
    { id: 'agent-5', name: 'Maya', squadType: 'design', role: 'Lead Designer', status: 'waiting', currentTask: 'Aguardando' },
    { id: 'agent-6', name: 'Zara', squadType: 'design', role: 'Visual Designer', status: 'waiting', currentTask: 'Aguardando' },
    { id: 'agent-7', name: 'Phoenix', squadType: 'creator', role: 'Content Creator', status: 'waiting', currentTask: 'Aguardando' },
    { id: 'agent-8', name: 'Echo', squadType: 'creator', role: 'Video Producer', status: 'waiting', currentTask: 'Aguardando' },
    { id: 'agent-9', name: 'Sage', squadType: 'orchestrator', role: 'QA Specialist', status: 'waiting', currentTask: 'Aguardando' },
  ],
});

// Factory function to get mission by type
const createMockMission = (type: 'simple' | 'complex' = 'simple'): WorkflowMission => {
  return type === 'complex' ? createComplexMission() : createSimpleMission();
};

const createMockOperations = (): WorkflowOperation[] => [
  {
    id: 'op-1',
    missionId: 'mission-001',
    agentName: 'Orion',
    squadType: 'orchestrator',
    action: 'Analisando briefing e distribuindo tarefas',
    status: 'completed',
    startedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    duration: 45,
  },
  {
    id: 'op-2',
    missionId: 'mission-001',
    agentName: 'Luna',
    squadType: 'copywriting',
    action: 'Criando headlines para landing page',
    status: 'running',
    startedAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
  },
  {
    id: 'op-3',
    missionId: 'mission-001',
    agentName: 'Atlas',
    squadType: 'copywriting',
    action: 'Aguardando headlines para iniciar body copy',
    status: 'pending',
    startedAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
  },
  {
    id: 'op-4',
    missionId: 'mission-001',
    agentName: 'Maya',
    squadType: 'design',
    action: 'Preparando templates visuais',
    status: 'pending',
    startedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
];

interface WorkflowViewProps {
  onClose: () => void;
}

export function WorkflowView({ onClose }: WorkflowViewProps) {
  // Fetch real workflows from API
  const { data: realWorkflows, isLoading: isLoadingWorkflows, refetch: refetchWorkflows } = useWorkflows();
  const { data: executions, isLoading: isLoadingExecutions } = useWorkflowExecutions({ limit: 10 });
  const createWorkflowMutation = useCreateWorkflow();
  const executeWorkflowMutation = useExecuteWorkflow();
  const { state: liveExecutionState, execute: executeLive, reset: resetLiveExecution } = useExecuteWorkflowStream();
  const { state: orchestrationState, orchestrate: startOrchestration, reset: resetOrchestration } = useSmartOrchestration();
  const [showLiveExecution, setShowLiveExecution] = useState(false);
  const [showOrchestration, setShowOrchestration] = useState(false);

  // Execution dialog state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showExecuteDialog, setShowExecuteDialog] = useState(false);
  const [pendingWorkflowId, setPendingWorkflowId] = useState<string | null>(null);
  const [demandInput, setDemandInput] = useState('');

  // Smart Orchestration dialog state
  const [showOrchestrationDialog, setShowOrchestrationDialog] = useState(false);
  const [orchestrationDemand, setOrchestrationDemand] = useState('');

  const [activeTab, setActiveTab] = useState<'list' | 'executions' | 'demo'>('list');
  const [workflowType, setWorkflowType] = useState<'simple' | 'complex'>('simple');
  const [mission, setMission] = useState<WorkflowMission>(() => createMockMission('simple'));
  const [operations, setOperations] = useState<WorkflowOperation[]>(createMockOperations);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [viewMode, setViewMode] = useState<'canvas' | 'list'>('canvas');
  const [showMissionDetail, setShowMissionDetail] = useState(false);

  // Switch workflow type
  const handleWorkflowTypeChange = (type: 'simple' | 'complex') => {
    setWorkflowType(type);
    setMission(createMockMission(type));
    setSelectedNodeId(null);
    setZoom(type === 'complex' ? 0.8 : 1); // Zoom out for complex workflow
  };

  // Handle workflow created from modal
  const handleWorkflowCreated = useCallback(async (data: {
    name: string;
    description: string;
    steps: Array<{
      id: string;
      type: string;
      name: string;
      handler: string;
      config: { squadId: string; agentId: string; role: string; message: string };
      dependsOn?: string[];
    }>;
  }) => {
    try {
      const workflow = await createWorkflowMutation.mutateAsync({
        name: data.name,
        description: data.description,
        stepCount: data.steps.length,
        steps: data.steps.map((s) => ({
          ...s,
          type: s.type as 'task',
        })),
      });
      if (workflow?.id && workflow.status !== 'active') {
        try {
          await workflowsApi.activateWorkflow(workflow.id);
        } catch (activateError) {
          console.warn('Could not activate workflow:', activateError);
        }
      }
      setShowCreateModal(false);
      refetchWorkflows();
    } catch (error) {
      console.error('Failed to create workflow:', error);
    }
  }, [createWorkflowMutation, refetchWorkflows]);

  // Activate a draft workflow
  const handleActivateWorkflow = async (workflowId: string) => {
    try {
      await workflowsApi.activateWorkflow(workflowId);
      refetchWorkflows();
    } catch (error) {
      console.error('Failed to activate workflow:', error);
    }
  };

  // Open the execute dialog
  const handleOpenExecuteDialog = (workflowId: string) => {
    setPendingWorkflowId(workflowId);
    setDemandInput('');
    setShowExecuteDialog(true);
  };

  // Execute a workflow with live streaming
  const handleExecuteWorkflow = async () => {
    if (!pendingWorkflowId || !demandInput.trim()) return;
    setShowExecuteDialog(false);
    setShowLiveExecution(true);
    executeLive(pendingWorkflowId, { demand: demandInput.trim() });
  };

  // Close live execution modal
  const handleCloseLiveExecution = () => {
    setShowLiveExecution(false);
    resetLiveExecution();
  };

  // Start smart orchestration
  const handleStartOrchestration = async () => {
    if (!orchestrationDemand.trim()) return;
    setShowOrchestrationDialog(false);
    setShowOrchestration(true);
    startOrchestration(orchestrationDemand.trim());
  };

  // Close orchestration modal
  const handleCloseOrchestration = () => {
    setShowOrchestration(false);
    resetOrchestration();
  };

  // Simulate real-time updates
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setMission((prev) => {
        const currentNode = prev.nodes.find((n) => n.id === 'node-copy-1');
        if (currentNode && currentNode.progress !== undefined && currentNode.progress < 100) {
          return {
            ...prev,
            progress: Math.min(prev.progress + 1, 100),
            nodes: prev.nodes.map((n) =>
              n.id === 'node-copy-1'
                ? { ...n, progress: Math.min((n.progress || 0) + 2, 100) }
                : n
            ),
          };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.1, 2));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.1, 0.5));
  const handleReset = () => {
    setMission(createMockMission(workflowType));
    setOperations(createMockOperations());
    setSelectedNodeId(null);
  };

  const selectedNode = selectedNodeId
    ? mission.nodes.find((n) => n.id === selectedNodeId)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Main Content */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative z-10 m-4 flex-1 flex flex-col backdrop-blur-2xl border border-white/20 rounded-3xl overflow-hidden shadow-2xl"
        style={{
          background: `
            radial-gradient(ellipse 60% 40% at 0% 100%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse 50% 60% at 100% 0%, rgba(6, 182, 212, 0.12) 0%, transparent 50%),
            radial-gradient(ellipse 80% 80% at 50% 50%, rgba(255, 255, 255, 0.03) 0%, transparent 70%),
            rgba(30, 30, 40, 0.65)
          `,
          boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.1) inset, 0 25px 50px -12px rgba(0, 0, 0, 0.4)'
        }}
      >
        {/* Top Tab Bar */}
        <div className="h-14 px-6 flex items-center justify-between border-b border-white/15 bg-white/5">
          <div className="flex items-center gap-6">
            <h2 className="text-white font-semibold">Workflows</h2>

            {/* Main Tabs */}
            <div className="flex gap-1 p-1 bg-white/8 rounded-lg border border-white/10">
              <button
                onClick={() => setActiveTab('list')}
                className={cn(
                  'px-3 py-1.5 rounded text-sm font-medium transition-all',
                  activeTab === 'list'
                    ? 'bg-white/10 text-white/90'
                    : 'text-white/50 hover:text-white/70'
                )}
              >
                Workflows
              </button>
              <button
                onClick={() => setActiveTab('executions')}
                className={cn(
                  'px-3 py-1.5 rounded text-sm font-medium transition-all',
                  activeTab === 'executions'
                    ? 'bg-white/10 text-white/90'
                    : 'text-white/50 hover:text-white/70'
                )}
              >
                Execuções
                {executions && executions.length > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-white/10 rounded-full">
                    {executions.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('demo')}
                className={cn(
                  'px-3 py-1.5 rounded text-sm font-medium transition-all',
                  activeTab === 'demo'
                    ? 'bg-white/10 text-white/90'
                    : 'text-white/50 hover:text-white/70'
                )}
              >
                Demo
              </button>
            </div>
          </div>

          <GlassButton variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <CloseIcon />
          </GlassButton>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'list' ? (
          /* Workflows List Tab */
          <div className="flex-1 overflow-auto p-6">
            {isLoadingWorkflows ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin h-8 w-8 border-2 border-white/20 border-t-white/60 rounded-full" />
              </div>
            ) : realWorkflows && realWorkflows.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <p className="text-white/70">{realWorkflows.length} workflow(s) encontrado(s)</p>
                  <div className="flex gap-2">
                    <GlassButton
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setOrchestrationDemand('');
                        setShowOrchestrationDialog(true);
                      }}
                      className="bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border-purple-500/30"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
                        <path d="M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
                      </svg>
                      Orquestrar
                    </GlassButton>
                    <GlassButton variant="ghost" size="sm" onClick={() => setShowCreateModal(true)}>
                      + Criar Workflow
                    </GlassButton>
                  </div>
                </div>
                <div className="grid gap-4">
                  {realWorkflows.map((workflow) => (
                    <div
                      key={workflow.id}
                      className="p-4 rounded-xl border border-white/15 bg-white/8 hover:bg-white/12 transition-all backdrop-blur-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-white font-medium">{workflow.name}</h3>
                          <p className="text-white/60 text-sm mt-1">{workflow.description || 'Sem descrição'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="status"
                            status={workflow.status === 'active' ? 'online' : workflow.status === 'paused' ? 'warning' : 'offline'}
                            size="sm"
                          >
                            {workflow.status}
                          </Badge>
                          {workflow.status === 'draft' && (
                            <GlassButton
                              variant="ghost"
                              size="sm"
                              onClick={() => handleActivateWorkflow(workflow.id)}
                              className="ml-2"
                            >
                              Ativar
                            </GlassButton>
                          )}
                          {workflow.status === 'active' && (
                            <GlassButton
                              variant="primary"
                              size="sm"
                              onClick={() => handleOpenExecuteDialog(workflow.id)}
                              disabled={executeWorkflowMutation.isPending}
                              className="ml-2"
                            >
                              <PlayIcon />
                              <span className="ml-1">Executar</span>
                            </GlassButton>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-xs text-white/50">
                        <span>{workflow.stepCount} steps</span>
                        <span>•</span>
                        <span>Trigger: {workflow.trigger?.type || 'manual'}</span>
                        <span>•</span>
                        <span>Criado {formatRelativeTime(workflow.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-20 h-20 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center mb-6">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/60"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 16h5v5" /></svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Nenhum workflow criado</h3>
                <p className="text-white/60 mb-6 max-w-md">
                  Workflows permitem automatizar tarefas complexas coordenando múltiplos agents.
                  Crie seu primeiro workflow ou veja uma demonstração.
                </p>
                <div className="flex gap-3">
                  <GlassButton
                    variant="primary"
                    onClick={() => setShowCreateModal(true)}
                  >
                    + Criar Workflow
                  </GlassButton>
                  <GlassButton variant="ghost" onClick={() => setActiveTab('demo')}>
                    Ver Demonstração
                  </GlassButton>
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'executions' ? (
          /* Executions Tab */
          <div className="flex-1 overflow-auto p-6">
            {isLoadingExecutions ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin h-8 w-8 border-2 border-white/20 border-t-white/60 rounded-full" />
              </div>
            ) : executions && executions.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <p className="text-white/60">{executions.length} execução(ões)</p>
                  <GlassButton variant="ghost" size="sm" onClick={() => refetchWorkflows()}>
                    <RefreshIcon />
                    <span className="ml-1">Atualizar</span>
                  </GlassButton>
                </div>
                <div className="grid gap-3">
                  {executions.map((execution) => (
                    <div
                      key={execution.id}
                      className="p-4 rounded-xl border border-white/10 bg-white/5"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-white font-medium">{execution.workflowName || 'Workflow'}</h3>
                          <p className="text-white/40 text-xs mt-1 font-mono">{execution.id}</p>
                        </div>
                        <Badge
                          variant="status"
                          status={
                            execution.status === 'completed' ? 'online' :
                            execution.status === 'running' ? 'warning' :
                            execution.status === 'failed' ? 'error' : 'offline'
                          }
                          size="sm"
                        >
                          {execution.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-xs text-white/50">
                        <span>Iniciado {formatRelativeTime(execution.startedAt)}</span>
                        {execution.completedAt && (
                          <>
                            <span>•</span>
                            <span>Concluído {formatRelativeTime(execution.completedAt)}</span>
                          </>
                        )}
                        {execution.triggeredBy && (
                          <>
                            <span>•</span>
                            <span>Por: {execution.triggeredBy}</span>
                          </>
                        )}
                      </div>
                      {execution.error && (
                        <div className="mt-2 p-2 rounded bg-red-500/10 border border-red-500/20">
                          <p className="text-red-400 text-xs">{execution.error}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-20 h-20 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center mb-6">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/60"><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M12 11h4" /><path d="M12 16h4" /><path d="M8 11h.01" /><path d="M8 16h.01" /></svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Nenhuma execução</h3>
                <p className="text-white/60 mb-6 max-w-md">
                  Execute um workflow para ver o histórico de execuções aqui.
                </p>
                <GlassButton variant="ghost" onClick={() => setActiveTab('list')}>
                  Ver Workflows
                </GlassButton>
              </div>
            )}
          </div>
        ) : (
          /* Demo Tab - Original visualization */
          <div className="flex-1 flex overflow-hidden">
            {/* Left: Operations Sidebar */}
            <WorkflowSidebar
              mission={mission}
              operations={operations}
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
              onViewMission={() => setShowMissionDetail(true)}
            />

            {/* Center: Canvas */}
            <div className="flex-1 flex flex-col">
              {/* Header */}
              <div className="h-12 px-4 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-4">
                  {/* Workflow Type Selector */}
                  <div className="flex gap-1 p-1 bg-white/5 rounded-lg">
                    <button
                      onClick={() => handleWorkflowTypeChange('simple')}
                      className={cn(
                        'px-2 py-1 rounded text-xs font-medium transition-all',
                        workflowType === 'simple'
                          ? 'bg-white/10 text-white/90'
                          : 'text-white/50 hover:text-white/70'
                      )}
                    >
                      Simples
                    </button>
                    <button
                      onClick={() => handleWorkflowTypeChange('complex')}
                      className={cn(
                        'px-2 py-1 rounded text-xs font-medium transition-all',
                        workflowType === 'complex'
                          ? 'bg-white/10 text-white/90'
                          : 'text-white/50 hover:text-white/70'
                      )}
                    >
                      Multi-Squad
                    </button>
                  </div>

                  <Badge
                    variant="status"
                    status={mission.status === 'in-progress' ? 'warning' : 'success'}
                  >
                    {mission.status === 'in-progress' ? 'Em execução' : 'Concluído'}
                  </Badge>
                </div>

            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex gap-1 p-1 bg-white/5 rounded-lg">
                <GlassButton
                  variant={viewMode === 'canvas' ? 'primary' : 'ghost'}
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setViewMode('canvas')}
                >
                  <GridIcon />
                </GlassButton>
                <GlassButton
                  variant={viewMode === 'list' ? 'primary' : 'ghost'}
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setViewMode('list')}
                >
                  <ListIcon />
                </GlassButton>
              </div>

              <div className="w-px h-6 bg-white/10" />

              {/* Zoom Controls */}
              <GlassButton variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomOut}>
                <ZoomOutIcon />
              </GlassButton>
              <span className="text-xs text-white/60 w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <GlassButton variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomIn}>
                <ZoomInIcon />
              </GlassButton>

              <div className="w-px h-6 bg-white/10" />

              {/* Play/Pause */}
              <GlassButton
                variant={isPlaying ? 'primary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
              </GlassButton>

              {/* Reset */}
              <GlassButton variant="ghost" size="icon" className="h-8 w-8" onClick={handleReset}>
                <RefreshIcon />
              </GlassButton>

            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 relative overflow-hidden">
            {viewMode === 'canvas' ? (
              <WorkflowCanvas
                nodes={mission.nodes}
                edges={mission.edges}
                zoom={zoom}
                onZoomChange={setZoom}
                selectedNodeId={selectedNodeId}
                onSelectNode={setSelectedNodeId}
              />
            ) : (
              <WorkflowListView
                mission={mission}
                selectedNodeId={selectedNodeId}
                onSelectNode={setSelectedNodeId}
              />
            )}
          </div>

          {/* Bottom Stats Bar */}
          <div className="h-12 px-4 flex items-center justify-between border-t border-white/15 bg-white/5">
            <div className="flex items-center gap-6">
              <Stat label="Progresso Total" value={`${mission.progress}%`} />
              <Stat label="Agents Ativos" value={mission.agents.filter((a) => a.status === 'working').length.toString()} />
              <Stat label="Tempo Decorrido" value={formatRelativeTime(mission.startedAt || '')} />
              {mission.estimatedTimeRemaining && (
                <Stat
                  label="Tempo Restante"
                  value={formatDuration(mission.estimatedTimeRemaining)}
                  icon={<ClockIcon />}
                />
              )}
              {mission.tokens && (
                <Stat
                  label="Tokens"
                  value={formatTokens(mission.tokens.total)}
                  icon={<TokenIcon />}
                  tooltip={`Input: ${formatTokens(mission.tokens.input)} · Output: ${formatTokens(mission.tokens.output)}`}
                />
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Squad indicators instead of agent avatars */}
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500" />
                <span className="text-[10px] text-white/50">
                  {mission.agents.filter(a => a.squadType === 'copywriting').length} Copy
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
                <span className="text-[10px] text-white/50">
                  {mission.agents.filter(a => a.squadType === 'design').length} Design
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500" />
                <span className="text-[10px] text-white/50">
                  {mission.agents.filter(a => a.squadType === 'creator').length} Creator
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500" />
                <span className="text-[10px] text-white/50">
                  {mission.agents.filter(a => a.squadType === 'orchestrator').length} Orch
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Node Detail */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-white/15 overflow-hidden bg-white/5 backdrop-blur-xl"
            >
              <NodeDetailPanel
                node={selectedNode}
                onClose={() => setSelectedNodeId(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Mission Detail Modal */}
      <AnimatePresence>
        {showMissionDetail && (
          <WorkflowMissionDetail
            mission={mission}
            onClose={() => setShowMissionDetail(false)}
          />
        )}
      </AnimatePresence>

      {/* Execute Workflow Dialog */}
      <AnimatePresence>
        {showExecuteDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backdropFilter: 'blur(8px)', background: 'color-mix(in srgb, var(--palette-black) 50%, transparent)' }}
            onClick={() => setShowExecuteDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl p-6"
              style={{
                background: 'linear-gradient(135deg, rgba(30, 30, 35, 0.95) 0%, rgba(20, 20, 25, 0.98) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              }}
            >
              <h3 className="text-xl font-semibold text-white mb-2">Executar Workflow</h3>
              <p className="text-sm text-white/60 mb-4">
                Descreva o que você deseja que o workflow produza. Seja específico para melhores resultados.
              </p>
              <textarea
                value={demandInput}
                onChange={(e) => setDemandInput(e.target.value)}
                placeholder="Ex: Crie uma campanha de marketing para lançamento de um novo produto de tecnologia voltado para jovens de 18-25 anos..."
                className="w-full h-32 px-4 py-3 rounded-xl text-white placeholder-white/40 resize-none"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
                autoFocus
              />
              <div className="flex justify-end gap-3 mt-4">
                <GlassButton
                  variant="ghost"
                  onClick={() => setShowExecuteDialog(false)}
                >
                  Cancelar
                </GlassButton>
                <GlassButton
                  variant="primary"
                  onClick={handleExecuteWorkflow}
                  disabled={!demandInput.trim()}
                >
                  <PlayIcon />
                  <span className="ml-2">Iniciar Execução</span>
                </GlassButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Execution Modal */}
      <AnimatePresence>
        {showLiveExecution && liveExecutionState && (
          <WorkflowExecutionLive
            state={liveExecutionState}
            onClose={handleCloseLiveExecution}
          />
        )}
      </AnimatePresence>

      {/* Smart Orchestration Dialog */}
      <AnimatePresence>
        {showOrchestrationDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backdropFilter: 'blur(8px)', background: 'color-mix(in srgb, var(--palette-black) 50%, transparent)' }}
            onClick={() => setShowOrchestrationDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl p-6"
              style={{
                background: 'linear-gradient(135deg, rgba(30, 30, 35, 0.95) 0%, rgba(20, 20, 25, 0.98) 100%)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                boxShadow: '0 25px 50px -12px rgba(139, 92, 246, 0.2)',
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
                    <path d="M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Orquestração Inteligente</h3>
                  <p className="text-sm text-white/60">O orquestrador vai analisar e criar o workflow automaticamente</p>
                </div>
              </div>
              <textarea
                value={orchestrationDemand}
                onChange={(e) => setOrchestrationDemand(e.target.value)}
                placeholder="Descreva o que você precisa... Ex: Preciso criar uma campanha de lançamento para um novo produto de software. Quero copy persuasivo, identidade visual e conteúdo para redes sociais."
                className="w-full h-40 px-4 py-3 rounded-xl text-white placeholder-white/40 resize-none"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                }}
                autoFocus
              />
              <div className="mt-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <p className="text-xs text-purple-300">
                  <strong>Como funciona:</strong> O orquestrador vai analisar sua demanda, selecionar os squads e agentes mais adequados, criar um workflow dinâmico e executá-lo automaticamente.
                </p>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <GlassButton
                  variant="ghost"
                  onClick={() => setShowOrchestrationDialog(false)}
                >
                  Cancelar
                </GlassButton>
                <GlassButton
                  variant="primary"
                  onClick={handleStartOrchestration}
                  disabled={!orchestrationDemand.trim() || orchestrationDemand.trim().length < 10}
                  className="bg-gradient-to-r from-purple-500 to-cyan-500"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
                  </svg>
                  <span>Iniciar Orquestração</span>
                </GlassButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Smart Orchestration Live View */}
      <AnimatePresence>
        {showOrchestration && orchestrationState && (
          <WorkflowExecutionLive
            state={orchestrationState.executionState || {
              executionId: null,
              workflowId: orchestrationState.workflowId || '',
              workflowName: orchestrationState.workflowName || 'Analisando...',
              status: orchestrationState.phase === 'analyzing' || orchestrationState.phase === 'planning' ? 'connecting' : 'running',
              steps: [],
              input: { demand: orchestrationState.demand },
            }}
            onClose={handleCloseOrchestration}
            orchestrationPlan={orchestrationState.phase !== 'idle' ? {
              analysis: orchestrationState.analysis,
              expectedOutputs: orchestrationState.expectedOutputs,
              planSteps: orchestrationState.planSteps,
              phase: orchestrationState.phase,
            } : undefined}
          />
        )}
      </AnimatePresence>

      {/* Create Workflow Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateWorkflowModal
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleWorkflowCreated}
            isLoading={createWorkflowMutation.isPending}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Helper Components
function Stat({ label, value, icon, tooltip }: { label: string; value: string; icon?: React.ReactNode; tooltip?: string }) {
  return (
    <div className="flex items-center gap-2 group relative" title={tooltip}>
      {icon && <span className="text-white/40">{icon}</span>}
      <span className="text-xs text-white/50">{label}:</span>
      <span className="text-sm text-white/90 font-medium">{value}</span>
    </div>
  );
}

// Icons for NodeDetailPanel
const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const SpinnerIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
    <path d="M21 12a9 9 0 11-6.219-8.56" />
  </svg>
);

const FileIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const CodeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);

const ImageFileIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

function NodeDetailPanel({
  node,
  onClose,
}: {
  node: WorkflowMission['nodes'][0];
  onClose: () => void;
}) {
  // Get gradient color from centralized theme
  const getNodeGradient = (squadType: string | undefined): string => {
    if (!squadType) return 'from-blue-500 to-cyan-500';
    const theme = getSquadTheme(squadType as SquadType);
    return theme.gradient;
  };

  const completedTodos = node.todos?.filter((t) => t.status === 'completed').length || 0;
  const totalTodos = node.todos?.length || 0;

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageFileIcon />;
      case 'code':
      case 'json':
        return <CodeIcon />;
      default:
        return <FileIcon />;
    }
  };

  const getFileColor = (type: string) => {
    switch (type) {
      case 'markdown':
        return 'text-blue-500';
      case 'json':
      case 'code':
        return 'text-purple-500';
      case 'image':
        return 'text-green-500';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div
      className="h-full flex flex-col w-80 backdrop-blur-xl"
      style={{
        background: `
          radial-gradient(ellipse 80% 50% at 100% 100%, rgba(140, 60, 180, 0.12) 0%, transparent 50%),
          radial-gradient(ellipse 60% 80% at 0% 0%, rgba(60, 180, 200, 0.10) 0%, transparent 50%),
          rgba(15, 15, 20, 0.65)
        `
      }}
    >
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          </div>
          <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wider">Detalhes do Nó</h3>
        </div>
        <GlassButton variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <CloseIcon />
        </GlassButton>
      </div>

      <div className="flex-1 overflow-y-auto glass-scrollbar p-4 space-y-4">
        {/* Node Header */}
        <div className="flex items-center gap-3">
          {node.agentName ? (
            <Avatar
              name={node.agentName}
              size="lg"
              squadType={node.squadType}
              status={node.status === 'active' ? 'online' : node.status === 'waiting' ? 'busy' : 'offline'}
            />
          ) : (
            <div
              className={cn(
                'h-12 w-12 rounded-xl flex items-center justify-center',
                node.type === 'start' && 'bg-green-500/20 text-green-500',
                node.type === 'end' && 'bg-blue-500/20 text-blue-500',
                node.type === 'checkpoint' && 'bg-yellow-500/20 text-yellow-500'
              )}
            >
              {node.type === 'start' && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              )}
              {node.type === 'end' && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              )}
              {node.type === 'checkpoint' && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                  <line x1="4" y1="22" x2="4" y2="15" />
                </svg>
              )}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="text-white/90 font-semibold">{node.label}</h4>
            {node.agentName && (
              <p className="text-white/60 text-sm">{node.agentName}</p>
            )}
          </div>
          <Badge
            variant="status"
            status={
              node.status === 'completed'
                ? 'success'
                : node.status === 'active'
                ? 'warning'
                : node.status === 'error'
                ? 'error'
                : 'offline'
            }
            size="sm"
          >
            {node.status === 'completed' && 'Concluído'}
            {node.status === 'active' && 'Em execução'}
            {node.status === 'waiting' && 'Aguardando'}
            {node.status === 'idle' && 'Pendente'}
            {node.status === 'error' && 'Erro'}
          </Badge>
        </div>

        {/* Progress */}
        {node.progress !== undefined && (
          <div
            className="rounded-xl p-3 space-y-2"
            style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.2)'
            }}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/50">Progresso Total</span>
              <span className="text-white font-semibold">{node.progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-black/30 overflow-hidden">
              <motion.div
                className={cn(
                  'h-full rounded-full bg-gradient-to-r',
                  getNodeGradient(node.squadType)
                )}
                initial={{ width: 0 }}
                animate={{ width: `${node.progress}%` }}
                transition={{ duration: 0.5 }}
                style={{ boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)' }}
              />
            </div>
            {node.startedAt && (
              <p className="text-[10px] text-white/40">
                Iniciado {formatRelativeTime(node.startedAt)}
                {node.completedAt && ` · Concluído ${formatRelativeTime(node.completedAt)}`}
              </p>
            )}
          </div>
        )}

        {/* Request - What was asked */}
        {node.request && (
          <div
            className="rounded-xl p-3"
            style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, transparent 100%)',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="h-5 w-5 rounded-md bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Solicitação</span>
            </div>
            <p className="text-sm text-white/90 leading-relaxed">{node.request}</p>
          </div>
        )}

        {/* Current Action */}
        {node.currentAction && node.status === 'active' && (
          <div
            className="rounded-xl p-3 border-l-2 border-orange-500"
            style={{
              background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, transparent 100%)',
              border: '1px solid rgba(249, 115, 22, 0.2)',
              borderLeftWidth: '2px'
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <SpinnerIcon />
              <span className="text-xs font-semibold text-orange-400">Ação Atual</span>
            </div>
            <p className="text-sm text-white/90">{node.currentAction}</p>
          </div>
        )}

        {/* Todo List */}
        {node.todos && node.todos.length > 0 && (
          <div
            className="rounded-xl p-3"
            style={{
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, transparent 100%)',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-md bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M9 11l3 3L22 4" />
                    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Todo List</span>
              </div>
              <Badge variant="count" size="sm">
                {completedTodos}/{totalTodos}
              </Badge>
            </div>
            <div className="space-y-2">
              {node.todos.map((todo, index) => (
                <motion.div
                  key={todo.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="flex items-start gap-2"
                >
                  <div
                    className={cn(
                      'h-4 w-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5',
                      todo.status === 'completed' && 'bg-green-500/20 text-green-400',
                      todo.status === 'in-progress' && 'bg-orange-500/20 text-orange-400',
                      todo.status === 'pending' && 'bg-gray-500/20 text-gray-400'
                    )}
                  >
                    {todo.status === 'completed' && <CheckIcon />}
                    {todo.status === 'in-progress' && <SpinnerIcon />}
                  </div>
                  <span
                    className={cn(
                      'text-xs leading-relaxed',
                      todo.status === 'completed' ? 'text-white/40 line-through' : 'text-white/90'
                    )}
                  >
                    {todo.text}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Generated Files */}
        {node.files && node.files.length > 0 && (
          <div
            className="rounded-xl p-3"
            style={{
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, transparent 100%)',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-md bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Arquivos Gerados</span>
              </div>
              <Badge variant="count" size="sm">
                {node.files.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {node.files.map((file, index) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <div className={cn('flex-shrink-0', getFileColor(file.type))}>
                    {getFileIcon(file.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/90 font-medium truncate">{file.name}</p>
                    <p className="text-[10px] text-white/40">
                      {file.size} · {formatRelativeTime(file.createdAt)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Output/Result */}
        {node.output && (
          <div
            className="rounded-xl p-3 border-l-2 border-green-500"
            style={{
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, transparent 100%)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              borderLeftWidth: '2px'
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="h-5 w-5 rounded-md bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-green-400">Resultado</span>
            </div>
            <p className="text-sm text-white/90">{node.output}</p>
          </div>
        )}

        {/* Waiting Message */}
        {node.status === 'waiting' && (
          <div
            className="rounded-xl p-3 border-l-2 border-yellow-500"
            style={{
              background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.15) 0%, transparent 100%)',
              border: '1px solid rgba(234, 179, 8, 0.2)',
              borderLeftWidth: '2px'
            }}
          >
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-400">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="text-xs text-yellow-400">{node.currentAction || 'Aguardando dependências...'}</span>
            </div>
          </div>
        )}

        {/* Tools & Integrations */}
        {node.tools && node.tools.length > 0 && (
          <div className="pt-3 mt-3 border-t border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-4 w-4 rounded bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center">
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
                </svg>
              </div>
              <span className="text-[10px] font-medium text-white/50 uppercase tracking-wider">Ferramentas</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {node.tools.map((tool) => (
                <ToolBadge key={tool.id} tool={tool} />
              ))}
            </div>
          </div>
        )}

        {/* Token Usage */}
        {node.tokens && node.tokens.total > 0 && (
          <div className="pt-3 mt-3 border-t border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-4 w-4 rounded bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <TokenIcon />
              </div>
              <span className="text-[10px] font-medium text-white/50 uppercase tracking-wider">Uso de Tokens</span>
            </div>
            <div
              className="rounded-lg p-2 space-y-1.5"
              style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, transparent 100%)',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/40">Input</span>
                <span className="text-xs text-white/70 font-medium">{formatTokens(node.tokens.input)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/40">Output</span>
                <span className="text-xs text-white/70 font-medium">{formatTokens(node.tokens.output)}</span>
              </div>
              <div className="flex items-center justify-between pt-1.5 border-t border-white/10">
                <span className="text-[10px] text-white/50 font-medium">Total</span>
                <span className="text-xs text-amber-400 font-semibold">{formatTokens(node.tokens.total)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Estimated Duration */}
        {node.estimatedDuration && node.status !== 'completed' && (
          <div className="pt-2 flex items-center gap-2 text-white/40">
            <ClockIcon />
            <span className="text-[10px]">
              Duração estimada: {formatDuration(node.estimatedDuration)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Tool Badge Component
function ToolBadge({ tool }: { tool: AgentTool }) {
  const toolIcons: Record<string, React.ReactNode> = {
    'web-search': (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
    ),
    'web-scraper': (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9" />
      </svg>
    ),
    'code-interpreter': (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    'image-gen': (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
    'file-system': (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
      </svg>
    ),
    'database': (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      </svg>
    ),
    'api': (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 20V10" />
        <path d="M12 20V4" />
        <path d="M6 20v-6" />
      </svg>
    ),
    'email': (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
    'slack': (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
      </svg>
    ),
    'notion': (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
        <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952l1.448.327s0 .84-1.168.84l-3.22.186c-.094-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z" />
      </svg>
    ),
    'figma': (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5zM12 2h3.5a3.5 3.5 0 1 1 0 7H12V2zm0 9.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0zm-7 7a3.5 3.5 0 0 1 3.5-3.5H12v3.5a3.5 3.5 0 1 1-7 0zm0-7A3.5 3.5 0 0 1 8.5 8H12v7H8.5A3.5 3.5 0 0 1 5 11.5z" />
      </svg>
    ),
    'github': (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
      </svg>
    ),
    'analytics': (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    'calendar': (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    'sheets': (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="3" y1="15" x2="21" y2="15" />
        <line x1="9" y1="3" x2="9" y2="21" />
        <line x1="15" y1="3" x2="15" y2="21" />
      </svg>
    ),
    'docs': (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  };

  return (
    <div
      className={cn(
        'flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px]',
        'transition-all cursor-default',
        tool.connected
          ? 'bg-white/5 text-secondary hover:bg-white/10'
          : 'bg-white/3 text-tertiary opacity-50'
      )}
      title={tool.description || tool.name}
    >
      <span className="opacity-70">{toolIcons[tool.id] || toolIcons['api']}</span>
      <span>{tool.name}</span>
      {tool.connected && (
        <span className="h-1 w-1 rounded-full bg-green-500" />
      )}
    </div>
  );
}

function WorkflowListView({
  mission,
  selectedNodeId,
  onSelectNode,
}: {
  mission: WorkflowMission;
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
}) {
  return (
    <div className="p-6 space-y-4 overflow-y-auto h-full">
      {mission.nodes.map((node, index) => (
        <motion.div
          key={node.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => onSelectNode(node.id)}
          className={cn(
            'glass-subtle rounded-xl p-4 cursor-pointer transition-all',
            'hover:bg-white/10',
            selectedNodeId === node.id && 'ring-2 ring-blue-500'
          )}
        >
          <div className="flex items-center gap-4">
            <div
              className={cn(
                'h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold',
                node.status === 'completed' && 'bg-green-500/20 text-green-500',
                node.status === 'active' && 'bg-orange-500/20 text-orange-500',
                node.status === 'waiting' && 'bg-yellow-500/20 text-yellow-500',
                node.status === 'idle' && 'bg-gray-500/20 text-gray-500'
              )}
            >
              {index + 1}
            </div>
            <div className="flex-1">
              <p className="text-primary font-medium">{node.label}</p>
              {node.agentName && (
                <p className="text-secondary text-sm">{node.agentName}</p>
              )}
            </div>
            {node.progress !== undefined && (
              <div className="text-right">
                <p className="text-primary text-sm font-medium">{node.progress}%</p>
                <p className="text-tertiary text-xs">{node.status}</p>
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
