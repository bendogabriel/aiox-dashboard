import { motion } from 'framer-motion';
import type { Agent, SquadType } from '../../types';

interface AgentSkillsProps {
  agent: Agent;
  compact?: boolean;
}

// Skill definitions per squad type
const skillDefinitions: Record<SquadType, { name: string; icon: string; color: string }[]> = {
  copywriting: [
    { name: 'Persuasão', icon: '✨', color: 'orange' },
    { name: 'SEO', icon: '🎯', color: 'green' },
    { name: 'Storytelling', icon: '📖', color: 'purple' },
    { name: 'Criatividade', icon: '💡', color: 'pink' },
    { name: 'Adaptação', icon: '🔄', color: 'blue' },
  ],
  design: [
    { name: 'UI Design', icon: '🎨', color: 'purple' },
    { name: 'UX Research', icon: '🔍', color: 'blue' },
    { name: 'Prototipagem', icon: '⚡', color: 'orange' },
    { name: 'Branding', icon: '💎', color: 'pink' },
    { name: 'Sistemas', icon: '🧩', color: 'cyan' },
  ],
  creator: [
    { name: 'Roteiro', icon: '🎬', color: 'orange' },
    { name: 'Engajamento', icon: '📈', color: 'green' },
    { name: 'Edição', icon: '✂️', color: 'purple' },
    { name: 'Tendências', icon: '🔥', color: 'pink' },
    { name: 'Automação', icon: '⚙️', color: 'cyan' },
  ],
  orchestrator: [
    { name: 'Coordenação', icon: '🎯', color: 'blue' },
    { name: 'Estratégia', icon: '♟️', color: 'purple' },
    { name: 'Integração', icon: '🔗', color: 'cyan' },
    { name: 'Otimização', icon: '📊', color: 'green' },
    { name: 'Priorização', icon: '⭐', color: 'orange' },
  ],
  default: [
    { name: 'Análise', icon: '🔍', color: 'blue' },
    { name: 'Execução', icon: '⚡', color: 'orange' },
    { name: 'Comunicação', icon: '💬', color: 'green' },
  ],
};

// Color palette for dynamic skills
const dynamicColors = ['orange', 'purple', 'blue', 'green', 'pink', 'cyan'];

// Icon mapping for capability types
const capabilityIcons: Record<string, string> = {
  principle: '📐',
  skill: '⚡',
  expertise: '🎯',
  framework: '🏛️',
};

// Generate skill levels based on agent capabilities
function generateSkillLevels(agent: Agent): { name: string; icon: string; color: string; level: number }[] {
  // Priority 1: Use dynamic frameworks from agent markdown
  if ((agent as any).frameworks && (agent as any).frameworks.length > 0) {
    return (agent as any).frameworks.slice(0, 5).map((framework: string, index: number) => {
      const seed = framework.charCodeAt(0) + index * 13;
      const level = 75 + (seed % 20); // 75-95 range for frameworks
      return {
        name: framework.length > 20 ? framework.slice(0, 18) + '...' : framework,
        icon: '🏛️',
        color: dynamicColors[index % dynamicColors.length],
        level,
      };
    });
  }

  // Priority 2: Use dynamic capabilities from agent config
  if ((agent as any).capabilities && (agent as any).capabilities.length > 0) {
    return (agent as any).capabilities.slice(0, 5).map((cap: { type: string; text: string }, index: number) => {
      const text = cap.text.length > 25 ? cap.text.slice(0, 23) + '...' : cap.text;
      const seed = cap.text.charCodeAt(0) + index * 11;
      const level = 70 + (seed % 25);
      return {
        name: text,
        icon: capabilityIcons[cap.type] || '✨',
        color: dynamicColors[index % dynamicColors.length],
        level,
      };
    });
  }

  // Fallback: Use static skills based on squad type
  const skills = skillDefinitions[agent.squadType || 'default'] || skillDefinitions.default;

  return skills.map((skill: { name: string; icon: string; color: string }, index: number) => {
    // Generate pseudo-random but consistent levels based on agent name and skill
    const seed = agent.name.charCodeAt(0) + index * 17;
    const baseLevel = 60 + (seed % 35); // 60-95 range
    const variance = ((agent.executionCount || 100) / 100) % 10;
    const level = Math.min(98, Math.max(50, baseLevel + variance));

    return {
      ...skill,
      level: Math.round(level),
    };
  });
}

export function AgentSkills({ agent, compact = false }: AgentSkillsProps) {
  const skills = generateSkillLevels(agent);

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1.5 mt-2">
        {skills.slice(0, 3).map((skill, index) => (
          <motion.div
            key={skill.name}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="stat-badge"
          >
            <span>{skill.icon}</span>
            <span className="stat-badge-value">{skill.level}</span>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="agent-skills-card"
    >
      <div className="agent-skills-header">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-tertiary">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        <span className="agent-skills-title">Habilidades</span>
      </div>

      <div className="skill-bar-container">
        {skills.map((skill, index) => (
          <motion.div
            key={skill.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08, duration: 0.3 }}
            className="skill-item"
          >
            <div className="skill-icon">{skill.icon}</div>
            <div className="skill-info">
              <div className="skill-header">
                <span className="skill-name">{skill.name}</span>
                <span className="skill-level">{skill.level}%</span>
              </div>
              <div className="skill-bar">
                <motion.div
                  className={`skill-bar-fill ${skill.color}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${skill.level}%` }}
                  transition={{ delay: index * 0.08 + 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Stats summary */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-glass-border-subtle">
        <div className="flex gap-3">
          {/* Commands count - dynamic from agent */}
          {((agent as any).commands?.length > 0 || (agent as any).commandCount > 0) && (
            <div className="stat-badge">
              <span>⚡</span>
              <span className="stat-badge-value">
                {(agent as any).commands?.length || (agent as any).commandCount}
              </span>
              <span className="stat-badge-label">comandos</span>
            </div>
          )}
          {/* Frameworks count */}
          {(agent as any).frameworks?.length > 0 && (
            <div className="stat-badge">
              <span>🏛️</span>
              <span className="stat-badge-value">{(agent as any).frameworks.length}</span>
              <span className="stat-badge-label">frameworks</span>
            </div>
          )}
          {/* Fallback stats */}
          {!((agent as any).commands?.length > 0) && !((agent as any).frameworks?.length > 0) && (
            <>
              <div className="stat-badge">
                <span>🏆</span>
                <span className="stat-badge-value">{agent.executionCount?.toLocaleString() || '0'}</span>
                <span className="stat-badge-label">tasks</span>
              </div>
              <div className="stat-badge">
                <span>⚡</span>
                <span className="stat-badge-value">98%</span>
                <span className="stat-badge-label">taxa</span>
              </div>
            </>
          )}
        </div>
        <div className="text-[10px] text-tertiary uppercase tracking-wider">
          {agent.model || 'claude-3'}
        </div>
      </div>
    </motion.div>
  );
}
