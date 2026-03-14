import { useState } from 'react';
import { Calculator, Target, TrendingUp, type LucideIcon } from 'lucide-react';
import { ModuleHeader, SectionNumber } from '../shared';
import { BudgetSimulator } from './BudgetSimulator';
import { GoalCalculator } from './GoalCalculator';
import { BreakEvenVisualizer } from './BreakEvenVisualizer';

type ScenarioTab = 'budget' | 'goal' | 'breakeven';

interface TabDef {
  id: ScenarioTab;
  label: string;
  icon: LucideIcon;
}

const TABS: TabDef[] = [
  { id: 'budget', label: 'Simulador', icon: Calculator },
  { id: 'goal', label: 'Meta Reversa', icon: Target },
  { id: 'breakeven', label: 'Break-Even', icon: TrendingUp },
];

export default function ScenariosDashboard() {
  const [activeTab, setActiveTab] = useState<ScenarioTab>('budget');

  return (
    <div>
      <ModuleHeader title="Cenarios" subtitle="Simulacao e analise de cenarios">
        <div className="flex items-center gap-0" style={{ border: '1px solid rgba(156, 156, 156, 0.12)' }}>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-all"
                style={{
                  background: isActive ? 'rgba(209, 255, 0, 0.06)' : 'transparent',
                  color: isActive ? 'var(--aiox-cream)' : 'var(--aiox-gray-muted)',
                  borderRight: '1px solid rgba(156, 156, 156, 0.08)',
                }}
              >
                <Icon size={12} style={isActive ? { color: 'var(--aiox-lime)' } : undefined} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </ModuleHeader>

      <SectionNumber
        number="01"
        title={activeTab === 'budget' ? 'Simulador de Budget' : activeTab === 'goal' ? 'Calculadora de Meta' : 'Ponto de Equilibrio'}
        subtitle={
          activeTab === 'budget' ? 'Projete resultados ajustando o investimento'
            : activeTab === 'goal' ? 'Descubra o budget necessario para sua meta'
              : 'Visualize quando o investimento se paga'
        }
      />

      {activeTab === 'budget' && <BudgetSimulator />}
      {activeTab === 'goal' && <GoalCalculator />}
      {activeTab === 'breakeven' && <BreakEvenVisualizer />}
    </div>
  );
}
