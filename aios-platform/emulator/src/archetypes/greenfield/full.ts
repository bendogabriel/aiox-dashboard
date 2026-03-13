// ── Archetype: Greenfield Full ──
// Mirrors real project: ~8 squads, ~22 agents, multiple workflows.

import type { ProjectSpec } from '../../types';

export const spec: ProjectSpec = {
  name: 'greenfield-full',
  archetype: 'greenfield-full',
  description: 'Full-scale AIOS project mirroring real structure: 8 squads, ~22 agents, multiple workflows.',
  aiosCore: {
    constitution: true,
    coreAgents: [
      { id: 'architect', name: 'Architect', role: 'System Architect', description: 'System architecture and technology decisions', tier: 1, icon: 'Landmark' },
      { id: 'pm', name: 'Product Manager', role: 'Product Manager', description: 'Product requirements and roadmap management', tier: 1, icon: 'ClipboardList' },
      { id: 'po', name: 'Product Owner', role: 'Product Owner', description: 'Story validation and backlog prioritization', tier: 1, icon: 'CheckCircle' },
      { id: 'sm', name: 'Scrum Master', role: 'Scrum Master', description: 'Story creation and sprint management', tier: 1, icon: 'RefreshCw' },
      { id: 'analyst', name: 'Business Analyst', role: 'Business Analyst', description: 'Requirements analysis and documentation', tier: 1, icon: 'BarChart3' },
    ],
    workflows: [
      {
        id: 'story-development-cycle',
        name: 'Story Development Cycle',
        description: 'Full 4-phase workflow for all development work',
        phases: [
          { id: 'create', name: 'Create Story' },
          { id: 'validate', name: 'Validate Story' },
          { id: 'implement', name: 'Implement' },
          { id: 'qa-gate', name: 'QA Gate' },
        ],
      },
      {
        id: 'spec-pipeline',
        name: 'Spec Pipeline',
        description: 'Transform requirements into executable spec',
        phases: [
          { id: 'gather', name: 'Gather Requirements' },
          { id: 'assess', name: 'Assess Complexity' },
          { id: 'research', name: 'Research' },
          { id: 'write-spec', name: 'Write Spec' },
          { id: 'critique', name: 'Critique' },
          { id: 'plan', name: 'Plan' },
        ],
      },
      {
        id: 'qa-loop',
        name: 'QA Loop',
        description: 'Automated review-fix cycle after QA gate',
        phases: [
          { id: 'review', name: 'QA Review' },
          { id: 'fix', name: 'Developer Fix' },
          { id: 're-review', name: 'Re-Review' },
        ],
      },
    ],
    tasks: [
      { id: 'create-story', name: 'Create Story', description: 'Create new development story' },
      { id: 'validate-story', name: 'Validate Story', description: 'Validate story checklist' },
      { id: 'develop-story', name: 'Develop Story', description: 'Implement story tasks' },
      { id: 'qa-review', name: 'QA Review', description: 'Quality assurance gate' },
      { id: 'gather-requirements', name: 'Gather Requirements', description: 'Collect and document requirements' },
    ],
  },
  squads: [
    {
      id: 'engineering',
      name: 'engineering',
      displayName: 'Engineering Squad',
      description: 'Core development and implementation',
      domain: 'development',
      icon: 'Cog',
      agents: [
        { id: 'dev-lead', name: 'Dev Lead', role: 'Lead Software Engineer', description: 'Leads development', tier: 'orchestrator' },
        { id: 'frontend-dev', name: 'Frontend Dev', role: 'Frontend Developer', description: 'React/TypeScript', tier: 2 },
        { id: 'backend-dev', name: 'Backend Dev', role: 'Backend Developer', description: 'API development', tier: 2 },
        { id: 'qa-engineer', name: 'QA Engineer', role: 'QA Engineer', description: 'Testing', tier: 2 },
      ],
    },
    {
      id: 'design',
      name: 'design',
      displayName: 'Design System Squad',
      description: 'Design system and UI/UX',
      domain: 'design-system',
      icon: 'Palette',
      agents: [
        { id: 'design-chief', name: 'Design Chief', role: 'Design Architect', description: 'Design leadership', tier: 'orchestrator' },
        { id: 'ui-dev', name: 'UI Developer', role: 'UI Component Developer', description: 'Component library', tier: 2 },
      ],
    },
    {
      id: 'analytics',
      name: 'analytics',
      displayName: 'Analytics Squad',
      description: 'Data and metrics',
      domain: 'analytics',
      icon: 'BarChart3',
      agents: [
        { id: 'data-lead', name: 'Data Lead', role: 'Analytics Lead', description: 'Data analysis', tier: 'orchestrator' },
        { id: 'metrics-analyst', name: 'Metrics Analyst', role: 'Metrics Analyst', description: 'Metrics tracking', tier: 2 },
      ],
    },
    {
      id: 'content',
      name: 'content',
      displayName: 'Content Squad',
      description: 'Content creation and management',
      domain: 'content',
      icon: 'FileText',
      agents: [
        { id: 'content-lead', name: 'Content Lead', role: 'Content Strategist', description: 'Content strategy', tier: 'orchestrator' },
        { id: 'copywriter', name: 'Copywriter', role: 'Technical Copywriter', description: 'Technical writing', tier: 2 },
      ],
    },
    {
      id: 'marketing',
      name: 'marketing',
      displayName: 'Marketing Squad',
      description: 'Marketing and growth',
      domain: 'marketing',
      icon: 'Megaphone',
      agents: [
        { id: 'marketing-lead', name: 'Marketing Lead', role: 'Marketing Strategist', description: 'Marketing strategy', tier: 'orchestrator' },
      ],
    },
    {
      id: 'devops',
      name: 'devops',
      displayName: 'DevOps Squad',
      description: 'Infrastructure and deployment',
      domain: 'infrastructure',
      icon: 'Rocket',
      agents: [
        { id: 'devops-lead', name: 'DevOps Lead', role: 'DevOps Engineer', description: 'CI/CD and infrastructure', tier: 'orchestrator' },
        { id: 'sre', name: 'SRE', role: 'Site Reliability Engineer', description: 'Reliability and monitoring', tier: 2 },
      ],
    },
    {
      id: 'advisory',
      name: 'advisory',
      displayName: 'Advisory Squad',
      description: 'Strategic advisory and consulting',
      domain: 'advisory',
      icon: 'Brain',
      agents: [
        { id: 'advisor', name: 'Advisor', role: 'Strategic Advisor', description: 'Strategic guidance', tier: 1 },
      ],
    },
    {
      id: 'creator',
      name: 'creator',
      displayName: 'Creator Squad',
      description: 'Creative content and media production',
      domain: 'creative',
      icon: 'Sparkles',
      agents: [
        { id: 'creative-director', name: 'Creative Director', role: 'Creative Director', description: 'Creative direction', tier: 'orchestrator' },
        { id: 'media-producer', name: 'Media Producer', role: 'Media Producer', description: 'Media production', tier: 2 },
      ],
    },
  ],
  expectations: {
    hasAiosCore: true,
    squadCount: 8,
    agentCount: 21, // 5 core + 4+2+2+2+1+2+1+2 = 16 squad
    workflowCount: 3,
    taskCount: 5,
    engineStarts: true,
  },
};
