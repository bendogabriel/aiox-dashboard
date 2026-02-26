# Plano de Migração: AIOS Platform → Glass UI Storybook

> **Objetivo:** Migrar 100% dos componentes do `aios-platform/` para o Storybook do `glass-ui/`
> **Estimativa:** ~100 componentes em 8 categorias
> **Branch:** `feat/glass-ui-design-system`

---

## 📊 Inventário de Componentes

### Fase 1: UI Base (Fundação) - 18 componentes
Prioridade: **CRÍTICA** - Base do design system

| # | Componente | Origem | Story Existe? | Complexidade |
|---|------------|--------|---------------|--------------|
| 1 | GlassCard | ui/GlassCard.tsx | ❌ | Baixa |
| 2 | GlassButton | ui/GlassButton.tsx | ❌ | Baixa |
| 3 | GlassInput | ui/GlassInput.tsx | ❌ | Média |
| 4 | Avatar | ui/Avatar.tsx | ✅ (básico) | Baixa |
| 5 | Badge | ui/Badge.tsx | ✅ (básico) | Baixa |
| 6 | Dialog | ui/Dialog.tsx | ✅ (básico) | Média |
| 7 | Toast | ui/Toast.tsx | ✅ (básico) | Média |
| 8 | ProgressBar | ui/ProgressBar.tsx | ❌ | Baixa |
| 9 | StatusDot | ui/StatusDot.tsx | ❌ | Baixa |
| 10 | Skeleton | ui/Skeleton.tsx | ❌ | Baixa |
| 11 | EmptyState | ui/EmptyState.tsx | ❌ | Média |
| 12 | ContextMenu | ui/ContextMenu.tsx | ❌ | Alta |
| 13 | ThemeToggle | ui/ThemeToggle.tsx | ❌ | Baixa |
| 14 | SectionLabel | ui/SectionLabel.tsx | ❌ | Baixa |
| 15 | Ripple | ui/Ripple.tsx | ❌ | Média |
| 16 | PageLoader | ui/PageLoader.tsx | ❌ | Baixa |
| 17 | NetworkStatus | ui/NetworkStatus.tsx | ❌ | Média |
| 18 | SuccessFeedback | ui/SuccessFeedback.tsx | ❌ | Baixa |

### Fase 2: Layout - 6 componentes
Prioridade: **ALTA** - Estrutura da aplicação

| # | Componente | Origem | Complexidade |
|---|------------|--------|--------------|
| 19 | AppLayout | layout/AppLayout.tsx | Alta |
| 20 | Header | layout/Header.tsx | Média |
| 21 | Sidebar | layout/Sidebar.tsx | Alta |
| 22 | MobileNav | layout/MobileNav.tsx | Média |
| 23 | ActivityPanel | layout/ActivityPanel.tsx | Média |
| 24 | ExecutionLogPanel | layout/ExecutionLogPanel.tsx | Média |

### Fase 3: Agents - 8 componentes
Prioridade: **ALTA** - Core da aplicação

| # | Componente | Origem | Complexidade |
|---|------------|--------|--------------|
| 25 | AgentCard | agents/AgentCard.tsx | Média |
| 26 | AgentProfile | agents/AgentProfile.tsx | Média |
| 27 | AgentProfileExpanded | agents/AgentProfileExpanded.tsx | Alta |
| 28 | AgentProfileModal | agents/AgentProfileModal.tsx | Alta |
| 29 | AgentExplorer | agents/AgentExplorer.tsx | Alta |
| 30 | AgentList | agents/AgentList.tsx | Média |
| 31 | AgentSkills | agents/AgentSkills.tsx | Baixa |
| 32 | FavoritesRecents | agents/FavoritesRecents.tsx | Média |

### Fase 4: World/Isometric (Visual Principal) - 15 componentes
Prioridade: **ALTA** - Interface diferenciada

| # | Componente | Origem | Complexidade |
|---|------------|--------|--------------|
| 33 | GatherWorld | world/GatherWorld.tsx | Alta |
| 34 | WorldMap | world/WorldMap.tsx | Alta |
| 35 | IsometricTile | world/IsometricTile.tsx | Média |
| 36 | AgentSprite | world/AgentSprite.tsx | Média |
| 37 | SpeechBubble | world/SpeechBubble.tsx | Baixa |
| 38 | InteractionLine | world/InteractionLine.tsx | Média |
| 39 | RoomView | world/RoomView.tsx | Alta |
| 40 | RoomEnvironment | world/RoomEnvironment.tsx | Alta |
| 41 | RoomFurniture | world/RoomFurniture.tsx | Média |
| 42 | InteractiveFurniture | world/InteractiveFurniture.tsx | Média |
| 43 | EmbeddedScreen | world/EmbeddedScreen.tsx | Média |
| 44 | AmbientParticles | world/AmbientParticles.tsx | Média |
| 45 | WorldMinimap | world/WorldMinimap.tsx | Média |
| 46 | WorldNotifications | world/WorldNotifications.tsx | Baixa |
| 47 | AgentEmotes | world/AgentEmotes.tsx | Baixa |

### Fase 5: Squads - 3 componentes
Prioridade: **ALTA**

| # | Componente | Origem | Complexidade |
|---|------------|--------|--------------|
| 48 | SquadsView | squads-view/SquadsView.tsx | Alta |
| 49 | SquadCard | squads/SquadCard.tsx | Média |
| 50 | SquadSelector | squads/SquadSelector.tsx | Média |

### Fase 6: Chat - 8 componentes
Prioridade: **MÉDIA**

| # | Componente | Origem | Complexidade |
|---|------------|--------|--------------|
| 51 | ChatContainer | chat/ChatContainer.tsx | Alta |
| 52 | ChatInput | chat/ChatInput.tsx | Média |
| 53 | MessageBubble | chat/MessageBubble.tsx | Média |
| 54 | MarkdownRenderer | chat/MarkdownRenderer.tsx | Média |
| 55 | ConversationHistory | chat/ConversationHistory.tsx | Média |
| 56 | VirtualizedMessageList | chat/VirtualizedMessageList.tsx | Alta |
| 57 | ExportChat | chat/ExportChat.tsx | Baixa |

### Fase 7: Kanban - 5 componentes
Prioridade: **MÉDIA**

| # | Componente | Origem | Complexidade |
|---|------------|--------|--------------|
| 58 | KanbanBoard | kanban/KanbanBoard.tsx | Alta |
| 59 | KanbanColumn | kanban/KanbanColumn.tsx | Média |
| 60 | StoryCard | kanban/StoryCard.tsx | Média |
| 61 | StoryDetailModal | kanban/StoryDetailModal.tsx | Alta |
| 62 | StoryCreateModal | kanban/StoryCreateModal.tsx | Alta |

### Fase 8: Workflow - 5 componentes
Prioridade: **MÉDIA**

| # | Componente | Origem | Complexidade |
|---|------------|--------|--------------|
| 63 | WorkflowView | workflow/WorkflowView.tsx | Alta |
| 64 | WorkflowCanvas | workflow/WorkflowCanvas.tsx | Alta |
| 65 | WorkflowSidebar | workflow/WorkflowSidebar.tsx | Média |
| 66 | WorkflowMissionDetail | workflow/WorkflowMissionDetail.tsx | Média |
| 67 | WorkflowExecutionLive | workflow/WorkflowExecutionLive.tsx | Alta |

### Fase 9: Dashboard & Features - 18 componentes
Prioridade: **MÉDIA-BAIXA**

| # | Componente | Origem | Complexidade |
|---|------------|--------|--------------|
| 68 | DashboardOverview | dashboard/DashboardOverview.tsx | Alta |
| 69 | Charts | dashboard/Charts.tsx | Média |
| 70 | GitHubView | github/GitHubView.tsx | Alta |
| 71 | LiveMonitor | monitor/LiveMonitor.tsx | Alta |
| 72 | AgentsMonitor | agents-monitor/AgentsMonitor.tsx | Alta |
| 73 | AgentMonitorCard | agents-monitor/AgentMonitorCard.tsx | Média |
| 74 | TerminalsView | terminals/TerminalsView.tsx | Alta |
| 75 | TerminalCard | terminals/TerminalCard.tsx | Média |
| 76 | SettingsPage | settings/SettingsPage.tsx | Alta |
| 77 | MemoryManager | settings/MemoryManager.tsx | Alta |
| 78 | CategoryManager | settings/CategoryManager.tsx | Média |
| 79 | WorkflowManager | settings/WorkflowManager.tsx | Alta |
| 80 | InsightsView | insights/InsightsView.tsx | Média |
| 81 | ContextView | context/ContextView.tsx | Média |
| 82 | RoadmapView | roadmap/RoadmapView.tsx | Média |
| 83 | QAMetrics | qa/QAMetrics.tsx | Média |
| 84 | BobOrchestration | bob/BobOrchestration.tsx | Alta |

### Fase 10: Utilities & Misc - 9 componentes
Prioridade: **BAIXA**

| # | Componente | Origem | Complexidade |
|---|------------|--------|--------------|
| 85 | GlobalSearch | search/GlobalSearch.tsx | Alta |
| 86 | StatusBar | status-bar/StatusBar.tsx | Média |
| 87 | ProjectTabs | project-tabs/ProjectTabs.tsx | Média |
| 88 | TaskOrchestrator | orchestration/TaskOrchestrator.tsx | Alta |
| 89 | OnboardingTour | onboarding/OnboardingTour.tsx | Média |
| 90 | WorldWorkflowPanel | world/WorldWorkflowPanel.tsx | Média |
| 91 | AgentInteractionPanel | world/AgentInteractionPanel.tsx | Média |
| 92 | ErrorBoundary | ui/ErrorBoundary.tsx | Baixa |
| 93 | SkipLinks | ui/SkipLinks.tsx | Baixa |
| 94 | KeyboardShortcuts | ui/KeyboardShortcuts.tsx | Média |
| 95 | PWAUpdatePrompt | ui/PWAUpdatePrompt.tsx | Baixa |

---

## 🔧 Ferramentas Necessárias

### Existentes no AIOS
- `*build-component` - Para criar componentes individuais com testes + stories

### A CRIAR (Nova Task)
Precisamos de uma task especializada: `*migrate-components-to-storybook`

```yaml
task: migrateComponentsToStorybook()
responsável: @ux-design-expert
atomic_layer: workflow

Entrada:
  - source_dir: Path to source components (aios-platform/src/components)
  - target_dir: Path to glass-ui (glass-ui/)
  - batch_size: Number of components per batch (default: 5)
  - dry_run: Preview mode

Saída:
  - migrated_components: List of successfully migrated
  - stories_created: List of new .stories.tsx files
  - report: Migration report with issues
```

---

## 📋 Workflow de Migração por Componente

### Para cada componente:

1. **Análise**
   - [ ] Ler componente original
   - [ ] Identificar dependências internas
   - [ ] Identificar tokens/estilos usados
   - [ ] Mapear props e variantes

2. **Adaptação**
   - [ ] Copiar/adaptar para glass-ui/src/components/
   - [ ] Substituir imports por caminhos do glass-ui
   - [ ] Aplicar tokens do Glass Design System
   - [ ] Usar padrão cva() para variantes

3. **Story**
   - [ ] Criar {Component}.stories.tsx
   - [ ] Documentar todas as variantes
   - [ ] Adicionar controls interativos
   - [ ] Incluir exemplos de uso

4. **Testes**
   - [ ] Criar {Component}.test.tsx
   - [ ] Testar acessibilidade (jest-axe)
   - [ ] Testar variantes
   - [ ] Cobertura > 80%

5. **Validação**
   - [ ] Verificar no Storybook
   - [ ] Validar design tokens
   - [ ] Review de acessibilidade

---

## 📅 Cronograma Sugerido

| Fase | Componentes | Prioridade |
|------|-------------|------------|
| 1 | UI Base (18) | Sprint 1 |
| 2-3 | Layout + Agents (14) | Sprint 1 |
| 4-5 | World + Squads (18) | Sprint 2 |
| 6-7 | Chat + Kanban (13) | Sprint 2 |
| 8-10 | Workflow + Dashboard + Misc (32) | Sprint 3 |

**Total: ~95 componentes em 3 sprints**

---

## 🎯 Próximos Passos Imediatos

1. **Criar task `migrate-components-to-storybook.md`** no AIOS
2. **Começar pela Fase 1** (UI Base) - fundação do sistema
3. **Configurar glass-ui** para receber os novos componentes
4. **Definir tokens** que serão compartilhados

---

## ⚠️ Dependências Críticas

### Glass-UI precisa ter:
- [ ] Tokens de cores (glass, blur, shadows)
- [ ] Tokens de spacing
- [ ] Tokens de typography
- [ ] Configuração Tailwind alinhada
- [ ] Utilitário `cn()` disponível

### Stories precisam:
- [ ] Configuração do Storybook para Dark Mode
- [ ] Addon de acessibilidade configurado
- [ ] Backgrounds customizados (glass effect)

---

*Documento gerado em: 2026-02-25*
*Autor: @architect + @ux-design-expert*
