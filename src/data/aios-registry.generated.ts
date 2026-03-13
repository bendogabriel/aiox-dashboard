// AUTO-GENERATED — do not edit manually
// Run: npx tsx scripts/generate-aios-registry.ts
// Generated: 2026-03-09T11:54:38.617Z

import type { AIOSRegistry } from './registry-types';

export const aiosRegistry: AIOSRegistry = {
  "agents": [
    {
      "id": "aios-master",
      "name": "Orion",
      "title": "AIOS Master Orchestrator & Framework Developer",
      "icon": "Crown",
      "archetype": "Orchestrator",
      "zodiac": "♌ Leo",
      "role": "Master Orchestrator, Framework Developer & AIOS Method Expert",
      "tone": "commanding",
      "whenToUse": "Use when you need comprehensive expertise across all domains, framework component creation/modification, workflow orchestration, or running tasks that don't require a specialized persona.",
      "commands": [
        {
          "name": "help",
          "description": "Show all available commands with descriptions",
          "visibility": []
        },
        {
          "name": "kb",
          "description": "Toggle KB mode (loads AIOS Method knowledge)",
          "visibility": []
        },
        {
          "name": "status",
          "description": "Show current context and progress",
          "visibility": []
        },
        {
          "name": "guide",
          "description": "Show comprehensive usage guide for this agent",
          "visibility": []
        },
        {
          "name": "yolo",
          "description": "Toggle permission mode (cycle: ask > auto > explore)",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "exit",
          "description": "Exit agent mode",
          "visibility": []
        },
        {
          "name": "create",
          "description": "Create new AIOS component (agent, task, workflow, template, checklist)",
          "visibility": []
        },
        {
          "name": "modify",
          "description": "Modify existing AIOS component",
          "visibility": []
        },
        {
          "name": "update-manifest",
          "description": "Update team manifest",
          "visibility": []
        },
        {
          "name": "validate-component",
          "description": "Validate component security and standards",
          "visibility": []
        },
        {
          "name": "deprecate-component",
          "description": "Deprecate component with migration path",
          "visibility": []
        },
        {
          "name": "propose-modification",
          "description": "Propose framework modifications",
          "visibility": []
        },
        {
          "name": "undo-last",
          "description": "Undo last framework modification",
          "visibility": []
        },
        {
          "name": "validate-workflow",
          "description": "Validate workflow YAML structure, agents, artifacts, and logic",
          "visibility": [
            "full"
          ],
          "args": "{name|path} [--strict] [--all]"
        },
        {
          "name": "run-workflow",
          "description": "Workflow execution: guided (persona-switch) or engine (real subagent spawning)",
          "visibility": [
            "full"
          ],
          "args": "{name} [start|continue|status|skip|abort] [--mode=guided|engine]"
        },
        {
          "name": "analyze-framework",
          "description": "Analyze framework structure and patterns",
          "visibility": []
        },
        {
          "name": "list-components",
          "description": "List all framework components",
          "visibility": []
        },
        {
          "name": "test-memory",
          "description": "Test memory layer connection",
          "visibility": []
        },
        {
          "name": "task",
          "description": "Execute specific task (or list available)",
          "visibility": []
        },
        {
          "name": "execute-checklist",
          "description": "Run checklist (or list available)",
          "visibility": [],
          "args": "{checklist}"
        },
        {
          "name": "workflow",
          "description": "Start workflow (guided=manual, engine=real subagent spawning)",
          "visibility": [],
          "args": "{name} [--mode=guided|engine]"
        },
        {
          "name": "plan",
          "description": "Workflow planning (default: create)",
          "visibility": [],
          "args": "[create|status|update] [id]"
        },
        {
          "name": "create-doc",
          "description": "Create document (or list templates)",
          "visibility": [],
          "args": "{template}"
        },
        {
          "name": "doc-out",
          "description": "Output complete document",
          "visibility": []
        },
        {
          "name": "shard-doc",
          "description": "Break document into parts",
          "visibility": [],
          "args": "{document} {destination}"
        },
        {
          "name": "document-project",
          "description": "Generate project documentation",
          "visibility": []
        },
        {
          "name": "add-tech-doc",
          "description": "Create tech-preset from documentation file",
          "visibility": [],
          "args": "{file-path} [preset-name]"
        },
        {
          "name": "create-next-story",
          "description": "Create next user story",
          "visibility": []
        },
        {
          "name": "advanced-elicitation",
          "description": "Execute advanced elicitation",
          "visibility": []
        },
        {
          "name": "chat-mode",
          "description": "Start conversational assistance",
          "visibility": []
        },
        {
          "name": "agent",
          "description": "Get info about specialized agent (use @ to transform)",
          "visibility": [],
          "args": "{name}"
        },
        {
          "name": "validate-agents",
          "description": "Validate all agent definitions (YAML parse, required fields, dependencies, pipeline reference)",
          "visibility": []
        },
        {
          "name": "correct-course",
          "description": "Analyze and correct process/quality deviations",
          "visibility": []
        },
        {
          "name": "index-docs",
          "description": "Index documentation for search",
          "visibility": []
        },
        {
          "name": "update-source-tree",
          "description": "Validate data file governance (owners, fill rules, existence)",
          "visibility": []
        },
        {
          "name": "ids check",
          "description": "Pre-check registry for REUSE/ADAPT/CREATE recommendations (advisory)",
          "visibility": [],
          "args": "{intent} [--type {type}]"
        },
        {
          "name": "ids impact",
          "description": "Impact analysis — direct/indirect consumers via usedBy BFS traversal",
          "visibility": [],
          "args": "{entity-id}"
        },
        {
          "name": "ids register",
          "description": "Register new entity in registry after creation",
          "visibility": [],
          "args": "{file-path} [--type {type}] [--agent {agent}]"
        },
        {
          "name": "ids health",
          "description": "Registry health check (graceful fallback if RegistryHealer unavailable)",
          "visibility": []
        },
        {
          "name": "ids stats",
          "description": "Registry statistics (entity count by type, categories, health score)",
          "visibility": []
        },
        {
          "name": "sync-registry-intel",
          "description": "Enrich entity registry with code intelligence data (usedBy, dependencies, codeIntelMetadata). Use --full to force full resync.",
          "visibility": [],
          "args": "[--full]"
        }
      ],
      "tools": [],
      "exclusiveOps": [],
      "delegatesTo": [],
      "receivesFrom": [],
      "dependencyTasks": [
        "add-tech-doc.md",
        "advanced-elicitation.md",
        "analyze-framework.md",
        "correct-course.md",
        "create-agent.md",
        "create-deep-research-prompt.md",
        "create-doc.md",
        "create-next-story.md",
        "create-task.md",
        "create-workflow.md",
        "deprecate-component.md",
        "document-project.md",
        "execute-checklist.md",
        "improve-self.md",
        "index-docs.md",
        "kb-mode-interaction.md",
        "modify-agent.md",
        "modify-task.md",
        "modify-workflow.md",
        "propose-modification.md",
        "shard-doc.md",
        "undo-last.md",
        "update-manifest.md",
        "update-source-tree.md",
        "validate-agents.md",
        "validate-workflow.md",
        "run-workflow.md",
        "run-workflow-engine.md",
        "ids-governor.md",
        "sync-registry-intel.md"
      ],
      "dependencyTemplates": [
        "agent-template.yaml",
        "architecture-tmpl.yaml",
        "brownfield-architecture-tmpl.yaml",
        "brownfield-prd-tmpl.yaml",
        "competitor-analysis-tmpl.yaml",
        "front-end-architecture-tmpl.yaml",
        "front-end-spec-tmpl.yaml",
        "fullstack-architecture-tmpl.yaml",
        "market-research-tmpl.yaml",
        "prd-tmpl.yaml",
        "project-brief-tmpl.yaml",
        "story-tmpl.yaml",
        "task-template.md",
        "workflow-template.yaml",
        "subagent-step-prompt.md"
      ],
      "dependencyChecklists": [
        "architect-checklist.md",
        "change-checklist.md",
        "pm-checklist.md",
        "po-master-checklist.md",
        "story-dod-checklist.md",
        "story-draft-checklist.md"
      ]
    },
    {
      "id": "analyst",
      "name": "Atlas",
      "title": "Business Analyst",
      "icon": "Search",
      "archetype": "Decoder",
      "zodiac": "♏ Scorpio",
      "role": "Insightful Analyst & Strategic Ideation Partner",
      "tone": "analytical",
      "whenToUse": "Use for market research, competitive analysis, user research, brainstorming session facilitation, structured ideation workshops, feasibility studies, industry trends analysis, project discovery (brownfield documentation), and research report creation. NOT for: PRD creation or product strategy → Use @pm. Technical architecture decisions or technology selection → Use @architect. Story creation or sprint planning → Use @sm.",
      "commands": [
        {
          "name": "help",
          "description": "Show all available commands with descriptions",
          "visibility": [
            "full",
            "quick",
            "key"
          ]
        },
        {
          "name": "create-project-brief",
          "description": "Create project brief document",
          "visibility": [
            "full",
            "quick"
          ]
        },
        {
          "name": "perform-market-research",
          "description": "Create market research analysis",
          "visibility": [
            "full",
            "quick"
          ]
        },
        {
          "name": "create-competitor-analysis",
          "description": "Create competitive analysis",
          "visibility": [
            "full",
            "quick"
          ]
        },
        {
          "name": "research-prompt",
          "description": "Generate deep research prompt",
          "visibility": [
            "full"
          ],
          "args": "{topic}"
        },
        {
          "name": "brainstorm",
          "description": "Facilitate structured brainstorming",
          "visibility": [
            "full",
            "quick",
            "key"
          ],
          "args": "{topic}"
        },
        {
          "name": "elicit",
          "description": "Run advanced elicitation session",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "research-deps",
          "description": "Research dependencies and technical constraints for story",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "extract-patterns",
          "description": "Extract and document code patterns from codebase",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "doc-out",
          "description": "Output complete document",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "session-info",
          "description": "Show current session details (agent history, commands)",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "guide",
          "description": "Show comprehensive usage guide for this agent",
          "visibility": [
            "full",
            "quick"
          ]
        },
        {
          "name": "yolo",
          "description": "Toggle permission mode (cycle: ask > auto > explore)",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "exit",
          "description": "Exit analyst mode",
          "visibility": [
            "full"
          ]
        }
      ],
      "tools": [
        "google-workspace",
        "exa",
        "context7"
      ],
      "exclusiveOps": [],
      "delegatesTo": [],
      "receivesFrom": [
        "pm",
        "po"
      ],
      "dependencyTasks": [
        "facilitate-brainstorming-session.md",
        "create-deep-research-prompt.md",
        "create-doc.md",
        "advanced-elicitation.md",
        "document-project.md",
        "spec-research-dependencies.md"
      ],
      "dependencyTemplates": [
        "project-brief-tmpl.yaml",
        "market-research-tmpl.yaml",
        "competitor-analysis-tmpl.yaml",
        "brainstorming-output-tmpl.yaml"
      ],
      "dependencyChecklists": []
    },
    {
      "id": "architect",
      "name": "Aria",
      "title": "Architect",
      "icon": "Landmark",
      "archetype": "Visionary",
      "zodiac": "♐ Sagittarius",
      "role": "Holistic System Architect & Full-Stack Technical Leader",
      "tone": "conceptual",
      "whenToUse": "Use for system architecture (fullstack, backend, frontend, infrastructure), technology stack selection (technical evaluation), API design (REST/GraphQL/tRPC/WebSocket), security architecture, performance optimization, deployment strategy, and cross-cutting concerns (logging, monitoring, error handling). NOT for: Market research or competitive analysis → Use @analyst. PRD creation or product strategy → Use @pm. Database schema design or query optimization → Use @data-engineer.",
      "commands": [
        {
          "name": "help",
          "description": "Show all available commands with descriptions",
          "visibility": [
            "full",
            "quick",
            "key"
          ]
        },
        {
          "name": "create-full-stack-architecture",
          "description": "Complete system architecture",
          "visibility": [
            "full",
            "quick",
            "key"
          ]
        },
        {
          "name": "create-backend-architecture",
          "description": "Backend architecture design",
          "visibility": [
            "full",
            "quick"
          ]
        },
        {
          "name": "create-front-end-architecture",
          "description": "Frontend architecture design",
          "visibility": [
            "full",
            "quick"
          ]
        },
        {
          "name": "create-brownfield-architecture",
          "description": "Architecture for existing projects",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "document-project",
          "description": "Generate project documentation",
          "visibility": [
            "full",
            "quick"
          ]
        },
        {
          "name": "execute-checklist",
          "description": "Run architecture checklist",
          "visibility": [
            "full"
          ],
          "args": "{checklist}"
        },
        {
          "name": "research",
          "description": "Generate deep research prompt",
          "visibility": [
            "full",
            "quick"
          ],
          "args": "{topic}"
        },
        {
          "name": "analyze-project-structure",
          "description": "Analyze project for new feature implementation (WIS-15)",
          "visibility": [
            "full",
            "quick",
            "key"
          ]
        },
        {
          "name": "validate-tech-preset",
          "description": "Validate tech preset structure (--fix to create story)",
          "visibility": [
            "full"
          ],
          "args": "{name}"
        },
        {
          "name": "validate-tech-preset-all",
          "description": "Validate all tech presets",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "assess-complexity",
          "description": "Assess story complexity and estimate effort",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "create-plan",
          "description": "Create implementation plan with phases and subtasks",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "create-context",
          "description": "Generate project and files context for story",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "map-codebase",
          "description": "Generate codebase map (structure, services, patterns, conventions)",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "doc-out",
          "description": "Output complete document",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "shard-prd",
          "description": "Break architecture into smaller parts",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "session-info",
          "description": "Show current session details (agent history, commands)",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "guide",
          "description": "Show comprehensive usage guide for this agent",
          "visibility": [
            "full",
            "quick"
          ]
        },
        {
          "name": "yolo",
          "description": "Toggle permission mode (cycle: ask > auto > explore)",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "exit",
          "description": "Exit architect mode",
          "visibility": [
            "full"
          ]
        }
      ],
      "tools": [
        "exa",
        "context7",
        "git",
        "supabase-cli",
        "railway-cli",
        "coderabbit"
      ],
      "exclusiveOps": [
        "git push",
        "git push --force",
        "gh pr create"
      ],
      "delegatesTo": [
        "github-devops"
      ],
      "receivesFrom": [
        "data-engineer",
        "ux-design-expert",
        "pm",
        "github-devops"
      ],
      "dependencyTasks": [
        "analyze-project-structure.md",
        "architect-analyze-impact.md",
        "collaborative-edit.md",
        "create-deep-research-prompt.md",
        "create-doc.md",
        "document-project.md",
        "execute-checklist.md",
        "validate-tech-preset.md",
        "spec-assess-complexity.md",
        "plan-create-implementation.md",
        "plan-create-context.md"
      ],
      "dependencyTemplates": [
        "architecture-tmpl.yaml",
        "front-end-architecture-tmpl.yaml",
        "fullstack-architecture-tmpl.yaml",
        "brownfield-architecture-tmpl.yaml"
      ],
      "dependencyChecklists": [
        "architect-checklist.md"
      ]
    },
    {
      "id": "data-engineer",
      "name": "Dara",
      "title": "Database Architect & Operations Engineer",
      "icon": "BarChart3",
      "archetype": "Sage",
      "zodiac": "♊ Gemini",
      "role": "Master Database Architect & Reliability Engineer",
      "tone": "technical",
      "whenToUse": "Use for database design, schema architecture, Supabase configuration, RLS policies, migrations, query optimization, data modeling, operations, and monitoring",
      "commands": [
        {
          "name": "help",
          "description": "Show all available commands with descriptions",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "guide",
          "description": "Show comprehensive usage guide for this agent",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "yolo",
          "description": "Toggle permission mode (cycle: ask > auto > explore)",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "exit",
          "description": "Exit data-engineer mode",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "doc-out",
          "description": "Output complete document",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "execute-checklist",
          "description": "Run DBA checklist",
          "visibility": [
            "full"
          ],
          "args": "{checklist}"
        },
        {
          "name": "create-schema",
          "description": "Design database schema",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "create-rls-policies",
          "description": "Design RLS policies",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "create-migration-plan",
          "description": "Create migration strategy",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "design-indexes",
          "description": "Design indexing strategy",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "model-domain",
          "description": "Domain modeling session",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "env-check",
          "description": "Validate database environment variables",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "bootstrap",
          "description": "Scaffold database project structure",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "apply-migration",
          "description": "Run migration with safety snapshot",
          "visibility": [
            "full"
          ],
          "args": "{path}"
        },
        {
          "name": "dry-run",
          "description": "Test migration without committing",
          "visibility": [
            "full"
          ],
          "args": "{path}"
        },
        {
          "name": "seed",
          "description": "Apply seed data safely (idempotent)",
          "visibility": [
            "full"
          ],
          "args": "{path}"
        },
        {
          "name": "snapshot",
          "description": "Create schema snapshot",
          "visibility": [
            "full"
          ],
          "args": "{label}"
        },
        {
          "name": "rollback",
          "description": "Restore snapshot or run rollback",
          "visibility": [
            "full"
          ],
          "args": "{snapshot_or_file}"
        },
        {
          "name": "smoke-test",
          "description": "Run comprehensive database tests",
          "visibility": [
            "full"
          ],
          "args": "{version}"
        },
        {
          "name": "security-audit",
          "description": "Database security and quality audit (rls, schema, full)",
          "visibility": [
            "full"
          ],
          "args": "{scope}"
        },
        {
          "name": "test-as-user",
          "description": "Emulate user for RLS testing",
          "visibility": [
            "full"
          ],
          "args": "{user_id}"
        },
        {
          "name": "verify-order",
          "description": "Lint DDL ordering for dependencies",
          "visibility": [
            "full"
          ],
          "args": "{path}"
        },
        {
          "name": "run-sql",
          "description": "Execute raw SQL with transaction",
          "visibility": [
            "full"
          ],
          "args": "{file_or_inline}"
        },
        {
          "name": "research",
          "description": "Generate deep research prompt for technical DB topics",
          "visibility": [
            "full"
          ],
          "args": "{topic}"
        }
      ],
      "tools": [
        "supabase-cli",
        "psql",
        "pg_dump",
        "postgres-explain-analyzer",
        "coderabbit"
      ],
      "exclusiveOps": [],
      "delegatesTo": [],
      "receivesFrom": [
        "architect",
        "dev",
        "data-engineer"
      ],
      "dependencyTasks": [
        "create-doc.md",
        "db-domain-modeling.md",
        "setup-database.md",
        "db-env-check.md",
        "db-bootstrap.md",
        "db-apply-migration.md",
        "db-dry-run.md",
        "db-seed.md",
        "db-snapshot.md",
        "db-rollback.md",
        "db-smoke-test.md",
        "security-audit.md",
        "analyze-performance.md",
        "db-policy-apply.md",
        "test-as-user.md",
        "db-verify-order.md",
        "db-load-csv.md",
        "db-run-sql.md",
        "execute-checklist.md",
        "create-deep-research-prompt.md"
      ],
      "dependencyTemplates": [
        "schema-design-tmpl.yaml",
        "rls-policies-tmpl.yaml",
        "migration-plan-tmpl.yaml",
        "index-strategy-tmpl.yaml",
        "tmpl-migration-script.sql",
        "tmpl-rollback-script.sql",
        "tmpl-smoke-test.sql",
        "tmpl-rls-kiss-policy.sql",
        "tmpl-rls-granular-policies.sql",
        "tmpl-staging-copy-merge.sql",
        "tmpl-seed-data.sql",
        "tmpl-comment-on-examples.sql"
      ],
      "dependencyChecklists": [
        "dba-predeploy-checklist.md",
        "dba-rollback-checklist.md",
        "database-design-checklist.md"
      ]
    },
    {
      "id": "dev",
      "name": "Dex",
      "title": "Full Stack Developer",
      "icon": "Laptop",
      "archetype": "Builder",
      "zodiac": "♒ Aquarius",
      "role": "Expert Senior Software Engineer & Implementation Specialist",
      "tone": "pragmatic",
      "whenToUse": "Use for code implementation, debugging, refactoring, and development best practices",
      "commands": [
        {
          "name": "help",
          "description": "Show all available commands with descriptions",
          "visibility": [
            "full",
            "quick",
            "key"
          ]
        },
        {
          "name": "develop",
          "description": "Implement story tasks (modes: yolo, interactive, preflight)",
          "visibility": [
            "full",
            "quick"
          ]
        },
        {
          "name": "develop-yolo",
          "description": "Autonomous development mode",
          "visibility": [
            "full",
            "quick"
          ]
        },
        {
          "name": "develop-interactive",
          "description": "Interactive development mode (default)",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "develop-preflight",
          "description": "Planning mode before implementation",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "execute-subtask",
          "description": "Execute a single subtask from implementation.yaml (13-step Coder Agent workflow)",
          "visibility": [
            "full",
            "quick"
          ]
        },
        {
          "name": "verify-subtask",
          "description": "Verify subtask completion using configured verification (command, api, browser, e2e)",
          "visibility": [
            "full",
            "quick"
          ]
        },
        {
          "name": "track-attempt",
          "description": "Track implementation attempt for a subtask (registers in recovery/attempts.json)",
          "visibility": [
            "full",
            "quick"
          ]
        },
        {
          "name": "rollback",
          "description": "Rollback to last good state for a subtask (--hard to skip confirmation)",
          "visibility": [
            "full",
            "quick"
          ]
        },
        {
          "name": "build-resume",
          "description": "Resume autonomous build from last checkpoint",
          "visibility": [
            "full",
            "quick"
          ]
        },
        {
          "name": "build-status",
          "description": "Show build status (--all for all builds)",
          "visibility": [
            "full",
            "quick"
          ]
        },
        {
          "name": "build-log",
          "description": "View build attempt log for debugging",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "build-cleanup",
          "description": "Cleanup abandoned build state files",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "build-autonomous",
          "description": "Start autonomous build loop for a story (Coder Agent Loop with retries)",
          "visibility": [
            "full",
            "quick"
          ]
        },
        {
          "name": "build",
          "description": "Complete autonomous build: worktree → plan → execute → verify → merge (*build {story-id})",
          "visibility": [
            "full",
            "quick"
          ]
        },
        {
          "name": "gotcha",
          "description": "Add a gotcha manually (*gotcha {title} - {description})",
          "visibility": [
            "full",
            "quick"
          ]
        },
        {
          "name": "gotchas",
          "description": "List and search gotchas (*gotchas [--category X] [--severity Y])",
          "visibility": [
            "full",
            "quick"
          ]
        },
        {
          "name": "gotcha-context",
          "description": "Get relevant gotchas for current task context",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "worktree-create",
          "description": "Create isolated worktree for story (*worktree-create {story-id})",
          "visibility": [
            "full",
            "quick"
          ]
        },
        {
          "name": "worktree-list",
          "description": "List active worktrees with status",
          "visibility": [
            "full",
            "quick"
          ]
        },
        {
          "name": "worktree-cleanup",
          "description": "Remove completed/stale worktrees",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "worktree-merge",
          "description": "Merge worktree branch back to base (*worktree-merge {story-id})",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "create-service",
          "description": "Create new service from Handlebars template (api-integration, utility, agent-tool)",
          "visibility": [
            "full",
            "quick"
          ]
        },
        {
          "name": "waves",
          "description": "Analyze workflow for parallel execution opportunities (--visual for ASCII art)",
          "visibility": [
            "full",
            "quick"
          ]
        },
        {
          "name": "apply-qa-fixes",
          "description": "Apply QA feedback and fixes",
          "visibility": [
            "quick",
            "key"
          ]
        },
        {
          "name": "fix-qa-issues",
          "description": "Fix QA issues from QA_FIX_REQUEST.md (8-phase workflow)",
          "visibility": [
            "full",
            "quick"
          ]
        },
        {
          "name": "run-tests",
          "description": "Execute linting and all tests",
          "visibility": [
            "quick",
            "key"
          ]
        },
        {
          "name": "backlog-debt",
          "description": "Register technical debt item (prompts for details)",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "load-full",
          "description": "Load complete file from devLoadAlwaysFiles (bypasses cache/summary)",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "clear-cache",
          "description": "Clear dev context cache to force fresh file load",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "session-info",
          "description": "Show current session details (agent history, commands)",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "explain",
          "description": "Explain what I just did in teaching detail",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "guide",
          "description": "Show comprehensive usage guide for this agent",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "yolo",
          "description": "Toggle permission mode (cycle: ask > auto > explore)",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "exit",
          "description": "Exit developer mode",
          "visibility": [
            "full",
            "quick",
            "key"
          ]
        },
        {
          "name": "dev_pre_commit_uncommitted",
          "description": "wsl bash -c 'cd ${PROJECT_ROOT} && ~/.local/bin/coderabbit --prompt-only -t uncommitted",
          "visibility": [
            "full"
          ]
        }
      ],
      "tools": [
        "coderabbit",
        "git",
        "context7",
        "supabase",
        "n8n",
        "browser",
        "ffmpeg"
      ],
      "exclusiveOps": [
        "git push",
        "git push --force",
        "gh pr create",
        "gh pr merge"
      ],
      "delegatesTo": [
        "github-devops"
      ],
      "receivesFrom": [
        "qa",
        "sm",
        "github-devops"
      ],
      "dependencyTasks": [
        "apply-qa-fixes.md",
        "qa-fix-issues.md",
        "create-service.md",
        "dev-develop-story.md",
        "execute-checklist.md",
        "plan-execute-subtask.md",
        "verify-subtask.md",
        "dev-improve-code-quality.md",
        "po-manage-story-backlog.md",
        "dev-optimize-performance.md",
        "dev-suggest-refactoring.md",
        "sync-documentation.md",
        "validate-next-story.md",
        "waves.md",
        "build-resume.md",
        "build-status.md",
        "build-autonomous.md",
        "gotcha.md",
        "gotchas.md",
        "create-worktree.md",
        "list-worktrees.md",
        "remove-worktree.md"
      ],
      "dependencyTemplates": [],
      "dependencyChecklists": [
        "story-dod-checklist.md",
        "self-critique-checklist.md"
      ]
    },
    {
      "id": "devops",
      "name": "Gage",
      "title": "GitHub Repository Manager & DevOps Specialist",
      "icon": "Zap",
      "archetype": "Operator",
      "zodiac": "♈ Aries",
      "role": "GitHub Repository Guardian & Release Manager",
      "tone": "decisive",
      "whenToUse": "Use for repository operations, version management, CI/CD, quality gates, and GitHub push operations. ONLY agent authorized to push to remote repository.",
      "commands": [
        {
          "name": "help",
          "description": "Show all available commands with descriptions",
          "visibility": [
            "full",
            "quick",
            "key"
          ]
        },
        {
          "name": "detect-repo",
          "description": "Detect repository context (framework-dev vs project-dev)",
          "visibility": [
            "full",
            "quick",
            "key"
          ]
        },
        {
          "name": "version-check",
          "description": "Analyze version and recommend next",
          "visibility": [
            "full",
            "quick",
            "key"
          ]
        },
        {
          "name": "pre-push",
          "description": "Run all quality checks before push",
          "visibility": [
            "full",
            "quick",
            "key"
          ]
        },
        {
          "name": "push",
          "description": "Execute git push after quality gates pass",
          "visibility": [
            "full",
            "quick",
            "key"
          ]
        },
        {
          "name": "create-pr",
          "description": "Create pull request from current branch",
          "visibility": [
            "full",
            "quick",
            "key"
          ]
        },
        {
          "name": "configure-ci",
          "description": "Setup/update GitHub Actions workflows",
          "visibility": [
            "full",
            "quick"
          ]
        },
        {
          "name": "release",
          "description": "Create versioned release with changelog",
          "visibility": [
            "full",
            "quick"
          ]
        },
        {
          "name": "cleanup",
          "description": "Identify and remove stale branches/files",
          "visibility": [
            "full",
            "quick"
          ]
        },
        {
          "name": "triage-issues",
          "description": "Analyze open GitHub issues, classify, prioritize, recommend next",
          "visibility": [
            "full",
            "quick",
            "key"
          ]
        },
        {
          "name": "resolve-issue",
          "description": "Investigate and resolve a GitHub issue end-to-end",
          "visibility": [
            "full",
            "quick",
            "key"
          ],
          "args": "{issue_number}"
        },
        {
          "name": "init-project-status",
          "description": "Initialize dynamic project status tracking (Story 6.1.2.4)",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "environment-bootstrap",
          "description": "Complete environment setup for new projects (CLIs, auth, Git/GitHub)",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "setup-github",
          "description": "Configure DevOps infrastructure for user projects (workflows, CodeRabbit, branch protection, secrets) [Story 5.10]",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "search-mcp",
          "description": "Search available MCPs in Docker MCP Toolkit catalog",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "add-mcp",
          "description": "Add MCP server to Docker MCP Toolkit",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "list-mcps",
          "description": "List currently enabled MCPs and their tools",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "remove-mcp",
          "description": "Remove MCP server from Docker MCP Toolkit",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "setup-mcp-docker",
          "description": "Initial Docker MCP Toolkit configuration [Story 5.11]",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "health-check",
          "description": "Run unified health diagnostic (aios doctor --json + governance interpretation)",
          "visibility": [
            "full",
            "quick",
            "key"
          ]
        },
        {
          "name": "sync-registry",
          "description": "Sync entity registry (incremental, --full rebuild, or --heal integrity)",
          "visibility": [
            "full",
            "quick",
            "key"
          ],
          "args": "[--full] [--heal]"
        },
        {
          "name": "check-docs",
          "description": "Verify documentation links integrity (broken, incorrect markings)",
          "visibility": [
            "full",
            "quick"
          ]
        },
        {
          "name": "create-worktree",
          "description": "Create isolated worktree for story development",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "list-worktrees",
          "description": "List all active worktrees with status",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "remove-worktree",
          "description": "Remove worktree (with safety checks)",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "cleanup-worktrees",
          "description": "Remove all stale worktrees (> 30 days)",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "merge-worktree",
          "description": "Merge worktree branch back to base",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "inventory-assets",
          "description": "Generate migration inventory from V2 assets",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "analyze-paths",
          "description": "Analyze path dependencies and migration impact",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "migrate-agent",
          "description": "Migrate single agent from V2 to V3 format",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "migrate-batch",
          "description": "Batch migrate all agents with validation",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "session-info",
          "description": "Show current session details (agent history, commands)",
          "visibility": [
            "full",
            "quick"
          ]
        },
        {
          "name": "guide",
          "description": "Show comprehensive usage guide for this agent",
          "visibility": [
            "full",
            "quick",
            "key"
          ]
        },
        {
          "name": "yolo",
          "description": "Toggle permission mode (cycle: ask > auto > explore)",
          "visibility": [
            "full",
            "quick",
            "key"
          ]
        },
        {
          "name": "exit",
          "description": "Exit DevOps mode",
          "visibility": [
            "full",
            "quick",
            "key"
          ]
        },
        {
          "name": "pre_push_uncommitted",
          "description": "wsl bash -c 'cd ${PROJECT_ROOT} && ~/.local/bin/coderabbit --prompt-only -t uncommitted",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "pre_pr_against_main",
          "description": "wsl bash -c 'cd ${PROJECT_ROOT} && ~/.local/bin/coderabbit --prompt-only --base main",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "pre_commit_committed",
          "description": "wsl bash -c 'cd ${PROJECT_ROOT} && ~/.local/bin/coderabbit --prompt-only -t committed",
          "visibility": [
            "full"
          ]
        }
      ],
      "tools": [
        "coderabbit",
        "github-cli",
        "git",
        "docker-gateway"
      ],
      "exclusiveOps": [
        "git push",
        "git push --force",
        "git push origin --delete",
        "gh pr create",
        "gh pr merge",
        "gh release create"
      ],
      "delegatesTo": [],
      "receivesFrom": [
        "dev",
        "sm",
        "architect"
      ],
      "dependencyTasks": [
        "environment-bootstrap.md",
        "setup-github.md",
        "github-devops-version-management.md",
        "github-devops-pre-push-quality-gate.md",
        "github-devops-github-pr-automation.md",
        "ci-cd-configuration.md",
        "github-devops-repository-cleanup.md",
        "release-management.md",
        "search-mcp.md",
        "add-mcp.md",
        "list-mcps.md",
        "remove-mcp.md",
        "setup-mcp-docker.md",
        "health-check.yaml",
        "check-docs-links.md",
        "triage-github-issues.md",
        "resolve-github-issue.md",
        "create-worktree.md",
        "list-worktrees.md",
        "remove-worktree.md",
        "cleanup-worktrees.md",
        "merge-worktree.md"
      ],
      "dependencyTemplates": [
        "github-pr-template.md",
        "github-actions-ci.yml",
        "github-actions-cd.yml",
        "changelog-template.md"
      ],
      "dependencyChecklists": [
        "pre-push-checklist.md",
        "release-checklist.md"
      ]
    },
    {
      "id": "pm",
      "name": "Morgan",
      "title": "Product Manager",
      "icon": "ClipboardList",
      "archetype": "Strategist",
      "zodiac": "♑ Capricorn",
      "role": "Investigative Product Strategist & Market-Savvy PM",
      "tone": "strategic",
      "whenToUse": "Use for PRD creation (greenfield and brownfield), epic creation and management, product strategy and vision, feature prioritization (MoSCoW, RICE), roadmap planning, business case development, go/no-go decisions, scope definition, success metrics, and stakeholder communication. Epic/Story Delegation (Gate 1 Decision): PM creates epic structure, then delegates story creation to @sm. NOT for: Market research or competitive analysis → Use @analyst. Technical architecture design or technology selection → Use @architect. Detailed user story creation → Use @sm (PM creates epics, SM creates stories). Implementation work → Use @dev.",
      "commands": [
        {
          "name": "help",
          "description": "Show all available commands with descriptions",
          "visibility": [
            "full",
            "quick",
            "key"
          ]
        },
        {
          "name": "create-prd",
          "description": "Create product requirements document",
          "visibility": [
            "full",
            "quick",
            "key"
          ]
        },
        {
          "name": "create-brownfield-prd",
          "description": "Create PRD for existing projects",
          "visibility": [
            "full",
            "quick"
          ]
        },
        {
          "name": "create-epic",
          "description": "Create epic for brownfield",
          "visibility": [
            "full",
            "quick",
            "key"
          ]
        },
        {
          "name": "create-story",
          "description": "Create user story",
          "visibility": [
            "full",
            "quick"
          ]
        },
        {
          "name": "doc-out",
          "description": "Output complete document",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "shard-prd",
          "description": "Break PRD into smaller parts",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "research",
          "description": "Generate deep research prompt",
          "visibility": [
            "full",
            "quick"
          ],
          "args": "{topic}"
        },
        {
          "name": "execute-epic",
          "description": "Execute epic plan with wave-based parallel development",
          "visibility": [
            "full",
            "quick",
            "key"
          ],
          "args": "{execution-plan-path} [action] [--mode=interactive]"
        },
        {
          "name": "gather-requirements",
          "description": "Elicit and document requirements from stakeholders",
          "visibility": [
            "full",
            "quick"
          ]
        },
        {
          "name": "write-spec",
          "description": "Generate formal specification document from requirements",
          "visibility": [
            "full",
            "quick"
          ]
        },
        {
          "name": "toggle-profile",
          "description": "Toggle user profile between bob (assisted) and advanced modes",
          "visibility": [
            "full",
            "quick"
          ]
        },
        {
          "name": "session-info",
          "description": "Show current session details (agent history, commands)",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "guide",
          "description": "Show comprehensive usage guide for this agent",
          "visibility": [
            "full",
            "quick"
          ]
        },
        {
          "name": "yolo",
          "description": "Toggle permission mode (cycle: ask > auto > explore)",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "exit",
          "description": "Exit PM mode",
          "visibility": [
            "full"
          ]
        }
      ],
      "tools": [],
      "exclusiveOps": [],
      "delegatesTo": [],
      "receivesFrom": [
        "po",
        "sm",
        "architect"
      ],
      "dependencyTasks": [
        "create-doc.md",
        "correct-course.md",
        "create-deep-research-prompt.md",
        "brownfield-create-epic.md",
        "brownfield-create-story.md",
        "execute-checklist.md",
        "shard-doc.md",
        "spec-gather-requirements.md",
        "spec-write-spec.md",
        "session-resume.md",
        "execute-epic-plan.md"
      ],
      "dependencyTemplates": [
        "prd-tmpl.yaml",
        "brownfield-prd-tmpl.yaml"
      ],
      "dependencyChecklists": [
        "pm-checklist.md",
        "change-checklist.md"
      ]
    },
    {
      "id": "po",
      "name": "Pax",
      "title": "Product Owner",
      "icon": "Target",
      "archetype": "Balancer",
      "zodiac": "♎ Libra",
      "role": "Technical Product Owner & Process Steward",
      "tone": "collaborative",
      "whenToUse": "Use for backlog management, story refinement, acceptance criteria, sprint planning, and prioritization decisions",
      "commands": [
        {
          "name": "help",
          "description": "Show all available commands with descriptions",
          "visibility": [
            "full",
            "quick",
            "key"
          ]
        },
        {
          "name": "backlog-add",
          "description": "Add item to story backlog (follow-up/tech-debt/enhancement)",
          "visibility": [
            "full",
            "quick"
          ]
        },
        {
          "name": "backlog-review",
          "description": "Generate backlog review for sprint planning",
          "visibility": [
            "full",
            "quick"
          ]
        },
        {
          "name": "backlog-summary",
          "description": "Quick backlog status summary",
          "visibility": [
            "quick",
            "key"
          ]
        },
        {
          "name": "backlog-prioritize",
          "description": "Re-prioritize backlog item",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "backlog-schedule",
          "description": "Assign item to sprint",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "stories-index",
          "description": "Regenerate story index from docs/stories/",
          "visibility": [
            "full",
            "quick"
          ]
        },
        {
          "name": "validate-story-draft",
          "description": "Validate story quality and completeness (START of story lifecycle)",
          "visibility": [
            "full",
            "quick",
            "key"
          ]
        },
        {
          "name": "close-story",
          "description": "Close completed story, update epic/backlog, suggest next (END of story lifecycle)",
          "visibility": [
            "full",
            "quick",
            "key"
          ]
        },
        {
          "name": "sync-story",
          "description": "Sync story to PM tool (ClickUp, GitHub, Jira, local)",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "pull-story",
          "description": "Pull story updates from PM tool",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "execute-checklist-po",
          "description": "Run PO master checklist",
          "visibility": [
            "quick"
          ]
        },
        {
          "name": "shard-doc",
          "description": "Break document into smaller parts",
          "visibility": [
            "full"
          ],
          "args": "{document} {destination}"
        },
        {
          "name": "doc-out",
          "description": "Output complete document to file",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "session-info",
          "description": "Show current session details (agent history, commands)",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "guide",
          "description": "Show comprehensive usage guide for this agent",
          "visibility": [
            "full",
            "quick"
          ]
        },
        {
          "name": "yolo",
          "description": "Toggle permission mode (cycle: ask > auto > explore)",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "exit",
          "description": "Exit PO mode",
          "visibility": [
            "full"
          ]
        }
      ],
      "tools": [
        "github-cli",
        "context7"
      ],
      "exclusiveOps": [],
      "delegatesTo": [],
      "receivesFrom": [
        "sm",
        "pm"
      ],
      "dependencyTasks": [
        "correct-course.md",
        "create-brownfield-story.md",
        "execute-checklist.md",
        "po-manage-story-backlog.md",
        "po-pull-story.md",
        "shard-doc.md",
        "po-sync-story.md",
        "validate-next-story.md",
        "po-close-story.md",
        "po-sync-story-to-clickup.md",
        "po-pull-story-from-clickup.md"
      ],
      "dependencyTemplates": [
        "story-tmpl.yaml"
      ],
      "dependencyChecklists": [
        "po-master-checklist.md",
        "change-checklist.md"
      ]
    },
    {
      "id": "qa",
      "name": "Quinn",
      "title": "Test Architect & Quality Advisor",
      "icon": "CheckCircle",
      "archetype": "Guardian",
      "zodiac": "♍ Virgo",
      "role": "Test Architect with Quality Advisory Authority",
      "tone": "analytical",
      "whenToUse": "Use for comprehensive test architecture review, quality gate decisions, and code improvement. Provides thorough analysis including requirements traceability, risk assessment, and test strategy. Advisory only - teams choose their quality bar.",
      "commands": [
        {
          "name": "help",
          "description": "Show all available commands with descriptions",
          "visibility": [
            "full",
            "quick",
            "key"
          ]
        },
        {
          "name": "code-review",
          "description": "Run automated review (scope: uncommitted or committed)",
          "visibility": [
            "full",
            "quick"
          ],
          "args": "{scope}"
        },
        {
          "name": "review",
          "description": "Comprehensive story review with gate decision",
          "visibility": [
            "full",
            "quick",
            "key"
          ],
          "args": "{story}"
        },
        {
          "name": "review-build",
          "description": "10-phase structured QA review (Epic 6) - outputs qa_report.md",
          "visibility": [
            "full"
          ],
          "args": "{story}"
        },
        {
          "name": "gate",
          "description": "Create quality gate decision",
          "visibility": [
            "full",
            "quick"
          ],
          "args": "{story}"
        },
        {
          "name": "nfr-assess",
          "description": "Validate non-functional requirements",
          "visibility": [
            "full",
            "quick"
          ],
          "args": "{story}"
        },
        {
          "name": "risk-profile",
          "description": "Generate risk assessment matrix",
          "visibility": [
            "full",
            "quick"
          ],
          "args": "{story}"
        },
        {
          "name": "create-fix-request",
          "description": "Generate QA_FIX_REQUEST.md for @dev with issues to fix",
          "visibility": [
            "full"
          ],
          "args": "{story}"
        },
        {
          "name": "validate-libraries",
          "description": "Validate third-party library usage via Context7",
          "visibility": [
            "full"
          ],
          "args": "{story}"
        },
        {
          "name": "security-check",
          "description": "Run 8-point security vulnerability scan",
          "visibility": [
            "full",
            "quick"
          ],
          "args": "{story}"
        },
        {
          "name": "validate-migrations",
          "description": "Validate database migrations for schema changes",
          "visibility": [
            "full"
          ],
          "args": "{story}"
        },
        {
          "name": "evidence-check",
          "description": "Verify evidence-based QA requirements",
          "visibility": [
            "full"
          ],
          "args": "{story}"
        },
        {
          "name": "false-positive-check",
          "description": "Critical thinking verification for bug fixes",
          "visibility": [
            "full"
          ],
          "args": "{story}"
        },
        {
          "name": "console-check",
          "description": "Browser console error detection",
          "visibility": [
            "full"
          ],
          "args": "{story}"
        },
        {
          "name": "test-design",
          "description": "Create comprehensive test scenarios",
          "visibility": [
            "full",
            "quick"
          ],
          "args": "{story}"
        },
        {
          "name": "trace",
          "description": "Map requirements to tests (Given-When-Then)",
          "visibility": [
            "full",
            "quick"
          ],
          "args": "{story}"
        },
        {
          "name": "create-suite",
          "description": "Create test suite for story (Authority: QA owns test suites)",
          "visibility": [
            "full"
          ],
          "args": "{story}"
        },
        {
          "name": "critique-spec",
          "description": "Review and critique specification for completeness and clarity",
          "visibility": [
            "full"
          ],
          "args": "{story}"
        },
        {
          "name": "backlog-add",
          "description": "Add item to story backlog",
          "visibility": [
            "full"
          ],
          "args": "{story} {type} {priority} {title}"
        },
        {
          "name": "backlog-update",
          "description": "Update backlog item status",
          "visibility": [
            "full"
          ],
          "args": "{item_id} {status}"
        },
        {
          "name": "backlog-review",
          "description": "Generate backlog review for sprint planning",
          "visibility": [
            "full",
            "quick"
          ]
        },
        {
          "name": "session-info",
          "description": "Show current session details (agent history, commands)",
          "visibility": [
            "full",
            "quick"
          ]
        },
        {
          "name": "guide",
          "description": "Show comprehensive usage guide for this agent",
          "visibility": [
            "full",
            "quick",
            "key"
          ]
        },
        {
          "name": "yolo",
          "description": "Toggle permission mode (cycle: ask > auto > explore)",
          "visibility": [
            "full",
            "quick",
            "key"
          ]
        },
        {
          "name": "exit",
          "description": "Exit QA mode",
          "visibility": [
            "full",
            "quick",
            "key"
          ]
        },
        {
          "name": "qa_pre_review_uncommitted",
          "description": "wsl bash -c 'cd ${PROJECT_ROOT} && ~/.local/bin/coderabbit --prompt-only -t uncommitted",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "qa_story_review_committed",
          "description": "wsl bash -c 'cd ${PROJECT_ROOT} && ~/.local/bin/coderabbit --prompt-only -t committed --base main",
          "visibility": [
            "full"
          ]
        }
      ],
      "tools": [
        "browser",
        "coderabbit",
        "git",
        "context7",
        "supabase"
      ],
      "exclusiveOps": [
        "git push",
        "git commit",
        "gh pr create"
      ],
      "delegatesTo": [],
      "receivesFrom": [
        "dev",
        "coderabbit"
      ],
      "dependencyTasks": [
        "qa-create-fix-request.md",
        "qa-generate-tests.md",
        "manage-story-backlog.md",
        "qa-nfr-assess.md",
        "qa-gate.md",
        "qa-review-build.md",
        "qa-review-proposal.md",
        "qa-review-story.md",
        "qa-risk-profile.md",
        "qa-run-tests.md",
        "qa-test-design.md",
        "qa-trace-requirements.md",
        "create-suite.md",
        "spec-critique.md",
        "qa-library-validation.md",
        "qa-security-checklist.md",
        "qa-migration-validation.md",
        "qa-evidence-requirements.md",
        "qa-false-positive-detection.md",
        "qa-browser-console-check.md"
      ],
      "dependencyTemplates": [
        "qa-gate-tmpl.yaml",
        "story-tmpl.yaml"
      ],
      "dependencyChecklists": []
    },
    {
      "id": "sm",
      "name": "River",
      "title": "Scrum Master",
      "icon": "Activity",
      "archetype": "Facilitator",
      "zodiac": "♓ Pisces",
      "role": "Technical Scrum Master - Story Preparation Specialist",
      "tone": "empathetic",
      "whenToUse": "Use for user story creation from PRD, story validation and completeness checking, acceptance criteria definition, story refinement, sprint planning, backlog grooming, retrospectives, daily standup facilitation, and local branch management (create/switch/list/delete local branches, local merges). Epic/Story Delegation (Gate 1 Decision): PM creates epic structure, SM creates detailed user stories from that epic. NOT for: PRD creation or epic structure → Use @pm. Market research or competitive analysis → Use @analyst. Technical architecture design → Use @architect. Implementation work → Use @dev. Remote Git operations (push, create PR, merge PR, delete remote branches) → Use @github-devops.",
      "commands": [
        {
          "name": "help",
          "description": "Show all available commands with descriptions",
          "visibility": [
            "full",
            "quick",
            "key"
          ]
        },
        {
          "name": "draft",
          "description": "Create next user story",
          "visibility": [
            "full",
            "quick",
            "key"
          ]
        },
        {
          "name": "story-checklist",
          "description": "Run story draft checklist",
          "visibility": [
            "full",
            "quick"
          ]
        },
        {
          "name": "session-info",
          "description": "Show current session details (agent history, commands)",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "guide",
          "description": "Show comprehensive usage guide for this agent",
          "visibility": [
            "full",
            "quick"
          ]
        },
        {
          "name": "yolo",
          "description": "Toggle permission mode (cycle: ask > auto > explore)",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "exit",
          "description": "Exit Scrum Master mode",
          "visibility": [
            "full"
          ]
        }
      ],
      "tools": [
        "git",
        "clickup",
        "context7"
      ],
      "exclusiveOps": [
        "git push",
        "git push origin --delete",
        "gh pr create"
      ],
      "delegatesTo": [
        "github-devops"
      ],
      "receivesFrom": [
        "dev",
        "po",
        "github-devops"
      ],
      "dependencyTasks": [
        "create-next-story.md",
        "execute-checklist.md",
        "correct-course.md"
      ],
      "dependencyTemplates": [
        "story-tmpl.yaml"
      ],
      "dependencyChecklists": [
        "story-draft-checklist.md"
      ]
    },
    {
      "id": "squad-creator",
      "name": "Craft",
      "title": "Squad Creator",
      "icon": "Wrench",
      "archetype": "Builder",
      "zodiac": "♑ Capricorn",
      "role": "Squad Architect & Builder",
      "tone": "systematic",
      "whenToUse": "Use to create, validate, publish and manage squads",
      "commands": [
        {
          "name": "help",
          "description": "Show all available commands with descriptions",
          "visibility": [
            "full",
            "quick",
            "key"
          ]
        },
        {
          "name": "design-squad",
          "description": "Design squad from documentation with intelligent recommendations",
          "visibility": [
            "full",
            "quick",
            "key"
          ]
        },
        {
          "name": "create-squad",
          "description": "Create new squad following task-first architecture",
          "visibility": [
            "full",
            "quick",
            "key"
          ]
        },
        {
          "name": "validate-squad",
          "description": "Validate squad against JSON Schema and AIOS standards",
          "visibility": [
            "full",
            "quick",
            "key"
          ]
        },
        {
          "name": "list-squads",
          "description": "List all local squads in the project",
          "visibility": [
            "full",
            "quick"
          ]
        },
        {
          "name": "migrate-squad",
          "description": "Migrate legacy squad to AIOS 2.1 format",
          "visibility": [
            "full",
            "quick"
          ]
        },
        {
          "name": "task",
          "description": "squad-creator-migrate.md",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "analyze-squad",
          "description": "Analyze squad structure, coverage, and get improvement suggestions",
          "visibility": [
            "full",
            "quick",
            "key"
          ]
        },
        {
          "name": "task",
          "description": "squad-creator-analyze.md",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "extend-squad",
          "description": "Add new components (agents, tasks, templates, etc.) to existing squad",
          "visibility": [
            "full",
            "quick",
            "key"
          ]
        },
        {
          "name": "task",
          "description": "squad-creator-extend.md",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "download-squad",
          "description": "Download public squad from aios-squads repository (Sprint 8)",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "status",
          "description": "placeholder",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "publish-squad",
          "description": "Publish squad to aios-squads repository (Sprint 8)",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "status",
          "description": "placeholder",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "sync-squad-synkra",
          "description": "Sync squad to Synkra API marketplace (Sprint 8)",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "status",
          "description": "placeholder",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "guide",
          "description": "Show comprehensive usage guide for this agent",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "yolo",
          "description": "Toggle permission mode (cycle: ask > auto > explore)",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "exit",
          "description": "Exit squad-creator mode",
          "visibility": [
            "full",
            "quick",
            "key"
          ]
        }
      ],
      "tools": [
        "git",
        "context7"
      ],
      "exclusiveOps": [],
      "delegatesTo": [],
      "receivesFrom": [
        "dev",
        "qa",
        "devops"
      ],
      "dependencyTasks": [
        "squad-creator-design.md",
        "squad-creator-create.md",
        "squad-creator-validate.md",
        "squad-creator-list.md",
        "squad-creator-migrate.md",
        "squad-creator-analyze.md",
        "squad-creator-extend.md",
        "squad-creator-download.md",
        "squad-creator-publish.md",
        "squad-creator-sync-synkra.md"
      ],
      "dependencyTemplates": [],
      "dependencyChecklists": []
    },
    {
      "id": "ux-design-expert",
      "name": "Uma",
      "title": "UX/UI Designer & Design System Architect",
      "icon": "Palette",
      "archetype": "Empathizer",
      "zodiac": "♋ Cancer",
      "role": "UX/UI Designer & Design System Architect",
      "tone": "empathetic",
      "whenToUse": "Complete design workflow - user research, wireframes, design systems, token extraction, component building, and quality assurance",
      "commands": [
        {
          "name": "research",
          "description": "Conduct user research and needs analysis",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "wireframe",
          "description": "Create wireframes and interaction flows",
          "visibility": [
            "full"
          ],
          "args": "{fidelity}"
        },
        {
          "name": "generate-ui-prompt",
          "description": "Generate prompts for AI UI tools (v0, Lovable)",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "create-front-end-spec",
          "description": "Create detailed frontend specification",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "audit",
          "description": "Scan codebase for UI pattern redundancies",
          "visibility": [
            "full"
          ],
          "args": "{path}"
        },
        {
          "name": "consolidate",
          "description": "Reduce redundancy using intelligent clustering",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "shock-report",
          "description": "Generate visual HTML report showing chaos + ROI",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "tokenize",
          "description": "Extract design tokens from consolidated patterns",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "setup",
          "description": "Initialize design system structure",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "migrate",
          "description": "Generate phased migration strategy (4 phases)",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "upgrade-tailwind",
          "description": "Plan and execute Tailwind CSS v4 upgrades",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "audit-tailwind-config",
          "description": "Validate Tailwind configuration health",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "export-dtcg",
          "description": "Generate W3C Design Tokens bundles",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "bootstrap-shadcn",
          "description": "Install Shadcn/Radix component library",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "build",
          "description": "Build production-ready atomic component",
          "visibility": [
            "full"
          ],
          "args": "{component}"
        },
        {
          "name": "compose",
          "description": "Compose molecule from existing atoms",
          "visibility": [
            "full"
          ],
          "args": "{molecule}"
        },
        {
          "name": "extend",
          "description": "Add variant to existing component",
          "visibility": [
            "full"
          ],
          "args": "{component}"
        },
        {
          "name": "document",
          "description": "Generate pattern library documentation",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "calculate-roi",
          "description": "Calculate ROI and cost savings",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "scan",
          "description": "Analyze HTML/React artifact for patterns",
          "visibility": [
            "full"
          ],
          "args": "{path|url}"
        },
        {
          "name": "integrate",
          "description": "Connect with squad",
          "visibility": [
            "full"
          ],
          "args": "{squad}"
        },
        {
          "name": "help",
          "description": "Show all commands organized by phase",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "status",
          "description": "Show current workflow phase",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "guide",
          "description": "Show comprehensive usage guide for this agent",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "yolo",
          "description": "Toggle permission mode (cycle: ask > auto > explore)",
          "visibility": [
            "full"
          ]
        },
        {
          "name": "exit",
          "description": "Exit UX-Design Expert mode",
          "visibility": [
            "full"
          ]
        }
      ],
      "tools": [
        "21st-dev-magic",
        "browser"
      ],
      "exclusiveOps": [],
      "delegatesTo": [],
      "receivesFrom": [
        "architect",
        "dev"
      ],
      "dependencyTasks": [
        "ux-user-research.md",
        "ux-create-wireframe.md",
        "generate-ai-frontend-prompt.md",
        "create-doc.md",
        "audit-codebase.md",
        "consolidate-patterns.md",
        "generate-shock-report.md",
        "extract-tokens.md",
        "setup-design-system.md",
        "generate-migration-strategy.md",
        "tailwind-upgrade.md",
        "audit-tailwind-config.md",
        "export-design-tokens-dtcg.md",
        "bootstrap-shadcn-library.md",
        "build-component.md",
        "compose-molecule.md",
        "extend-pattern.md",
        "generate-documentation.md",
        "calculate-roi.md",
        "ux-ds-scan-artifact.md",
        "run-design-system-pipeline.md",
        "integrate-Squad.md",
        "execute-checklist.md"
      ],
      "dependencyTemplates": [
        "front-end-spec-tmpl.yaml",
        "tokens-schema-tmpl.yaml",
        "component-react-tmpl.tsx",
        "state-persistence-tmpl.yaml",
        "shock-report-tmpl.html",
        "migration-strategy-tmpl.md",
        "token-exports-css-tmpl.css",
        "token-exports-tailwind-tmpl.js",
        "ds-artifact-analysis.md"
      ],
      "dependencyChecklists": [
        "pattern-audit-checklist.md",
        "component-quality-checklist.md",
        "accessibility-wcag-checklist.md",
        "migration-readiness-checklist.md"
      ]
    }
  ],
  "tasks": [
    {
      "id": "add-mcp",
      "taskName": "addMcp()",
      "description": "Add MCP Server Task",
      "agent": "",
      "hasElicitation": true
    },
    {
      "id": "advanced-elicitation",
      "taskName": "advancedElicitation()",
      "description": "advanced-elicitation",
      "agent": "",
      "hasElicitation": true
    },
    {
      "id": "analyst-facilitate-brainstorming",
      "taskName": "analystFacilitateBrainstorming()",
      "description": "No checklists needed - this task facilitates brainstorming sessions, validation is through user interaction",
      "agent": "Atlas",
      "hasElicitation": true
    },
    {
      "id": "analyze-brownfield",
      "taskName": "analyzeBrownfield()",
      "description": "Analyze Brownfield Project",
      "agent": "",
      "hasElicitation": true
    },
    {
      "id": "analyze-cross-artifact",
      "taskName": "analyze-cross-artifact()",
      "description": "Cross-Artifact Analysis Task",
      "agent": "",
      "hasElicitation": false
    },
    {
      "id": "analyze-framework",
      "taskName": "analyzeFramework()",
      "description": "Task: Analyze Framework",
      "agent": "Aria",
      "hasElicitation": true
    },
    {
      "id": "analyze-performance",
      "taskName": "analyzePerformance()",
      "description": "Task: Analyze Performance",
      "agent": "Dex",
      "hasElicitation": true
    },
    {
      "id": "analyze-project-structure",
      "taskName": "analyzeProjectStructure()",
      "description": "Analyze Project Structure",
      "agent": "",
      "hasElicitation": true
    },
    {
      "id": "apply-qa-fixes",
      "taskName": "applyQaFixes()",
      "description": "Ap",
      "agent": "Dex",
      "hasElicitation": true
    },
    {
      "id": "architect-analyze-impact",
      "taskName": "architectAnalyzeImpact()",
      "description": "An",
      "agent": "Aria",
      "hasElicitation": true
    },
    {
      "id": "audit-codebase",
      "taskName": "auditCodebase()",
      "description": "Audit Codebase for UI Pattern Redundancy",
      "agent": "Quinn",
      "hasElicitation": true
    },
    {
      "id": "audit-tailwind-config",
      "taskName": "auditTailwindConfig()",
      "description": "Audit Tailwind v4 Configuration & Utility Health",
      "agent": "Uma",
      "hasElicitation": true
    },
    {
      "id": "audit-utilities",
      "taskName": "auditUtilities()",
      "description": "audit-utilities",
      "agent": "Quinn",
      "hasElicitation": true
    },
    {
      "id": "bootstrap-shadcn-library",
      "taskName": "bootstrapShadcnLibrary()",
      "description": "Bootstrap Shadcn/Radix Component Library",
      "agent": "Uma",
      "hasElicitation": true
    },
    {
      "id": "brownfield-create-epic",
      "taskName": "brownfield-create-epic()",
      "description": "Create Brownfield Epic Task",
      "agent": "",
      "hasElicitation": true
    },
    {
      "id": "brownfield-create-story",
      "taskName": "brownfieldCreateStory()",
      "description": "Create Brownfield Story Task",
      "agent": "Pax",
      "hasElicitation": true
    },
    {
      "id": "build-autonomous",
      "taskName": "build-autonomous()",
      "description": "Task: Build Autonomous",
      "agent": "",
      "hasElicitation": false
    },
    {
      "id": "build-component",
      "taskName": "buildComponent()",
      "description": "Build Production-Ready Component",
      "agent": "Uma",
      "hasElicitation": true
    },
    {
      "id": "build-resume",
      "taskName": "build-resume()",
      "description": "Task: Build Resume",
      "agent": "",
      "hasElicitation": false
    },
    {
      "id": "build-status",
      "taskName": "build-status()",
      "description": "Task: Build Status",
      "agent": "",
      "hasElicitation": false
    },
    {
      "id": "build",
      "taskName": "build()",
      "description": "Task: Build (Autonomous)",
      "agent": "",
      "hasElicitation": false
    },
    {
      "id": "calculate-roi",
      "taskName": "calculateRoi()",
      "description": "Calculate ROI and Cost Savings",
      "agent": "Morgan",
      "hasElicitation": true
    },
    {
      "id": "check-docs-links",
      "taskName": "check-docs-links()",
      "description": "check-docs-links",
      "agent": "devops",
      "hasElicitation": false
    },
    {
      "id": "ci-cd-configuration",
      "taskName": "ci-cd-configuration()",
      "description": "Configure CI/CD Pipeline",
      "agent": "",
      "hasElicitation": true
    },
    {
      "id": "cleanup-utilities",
      "taskName": "cleanupUtilities()",
      "description": "Cleanup Utilities Task",
      "agent": "Dex",
      "hasElicitation": true
    },
    {
      "id": "cleanup-worktrees",
      "taskName": "cleanup-worktrees()",
      "description": "cleanup-worktrees",
      "agent": "",
      "hasElicitation": false
    },
    {
      "id": "collaborative-edit",
      "taskName": "collaborativeEdit()",
      "description": "collaborative-edit",
      "agent": "River",
      "hasElicitation": true
    },
    {
      "id": "compose-molecule",
      "taskName": "composeMolecule()",
      "description": "Compose Molecule from Atoms",
      "agent": "Uma",
      "hasElicitation": true
    },
    {
      "id": "consolidate-patterns",
      "taskName": "consolidatePatterns()",
      "description": "Consolidate Patterns Using Intelligent Clustering",
      "agent": "Aria",
      "hasElicitation": true
    },
    {
      "id": "correct-course",
      "taskName": "correctCourse()",
      "description": "Correct Course Task",
      "agent": "Pax",
      "hasElicitation": true
    },
    {
      "id": "create-agent",
      "taskName": "create-agent()",
      "description": "Task: Create Squad Agent",
      "agent": "",
      "hasElicitation": false
    },
    {
      "id": "create-brownfield-story",
      "taskName": "createBrownfieldStory()",
      "description": "Create Brownfield Story Task",
      "agent": "Pax",
      "hasElicitation": true
    },
    {
      "id": "create-deep-research-prompt",
      "taskName": "createDeepResearchPrompt()",
      "description": "No checklists needed - this task creates research prompts, validation is built into the research methodology",
      "agent": "Atlas",
      "hasElicitation": true
    },
    {
      "id": "create-doc",
      "taskName": "createDoc()",
      "description": "Template selection determined dynamically during task execution",
      "agent": "Morgan",
      "hasElicitation": true
    },
    {
      "id": "create-next-story",
      "taskName": "createNextStory()",
      "description": "Create Next Story Task",
      "agent": "River",
      "hasElicitation": true
    },
    {
      "id": "create-service",
      "taskName": "createService()",
      "description": "Create Service",
      "agent": "Dex",
      "hasElicitation": true
    },
    {
      "id": "create-suite",
      "taskName": "createSuite()",
      "description": "TODO: Create test-suite-checklist.md for validation (follow-up story needed)",
      "agent": "Uma",
      "hasElicitation": true
    },
    {
      "id": "create-task",
      "taskName": "createTask()",
      "description": "TODO: Create task-validation-checklist.md for validation (follow-up story needed)",
      "agent": "Orion",
      "hasElicitation": true
    },
    {
      "id": "create-workflow",
      "taskName": "createWorkflow()",
      "description": "TODO: Create workflow-validation-checklist.md for validation (follow-up story needed)",
      "agent": "Orion",
      "hasElicitation": true
    },
    {
      "id": "create-worktree",
      "taskName": "createWorktree()",
      "description": "create-worktree",
      "agent": "Gage",
      "hasElicitation": true
    },
    {
      "id": "db-analyze-hotpaths",
      "taskName": "dbAnalyzeHotpaths()",
      "description": "Task: Analyze Hot Query Paths",
      "agent": "Dara",
      "hasElicitation": true
    },
    {
      "id": "db-apply-migration",
      "taskName": "dbApplyMigration()",
      "description": "Task: Apply Migration (with snapshot + advisory lock)",
      "agent": "Dara",
      "hasElicitation": true
    },
    {
      "id": "db-bootstrap",
      "taskName": "dbBootstrap()",
      "description": "Task: Bootstrap Supabase Project",
      "agent": "",
      "hasElicitation": true
    },
    {
      "id": "db-domain-modeling",
      "taskName": "dbDomainModeling()",
      "description": "Task: Domain Modeling Session",
      "agent": "Dara",
      "hasElicitation": true
    },
    {
      "id": "db-dry-run",
      "taskName": "dbDryRun()",
      "description": "Task: Migration Dry-Run",
      "agent": "Dara",
      "hasElicitation": true
    },
    {
      "id": "db-env-check",
      "taskName": "dbEnvCheck()",
      "description": "Task: DB Env Check",
      "agent": "Dara",
      "hasElicitation": true
    },
    {
      "id": "db-explain",
      "taskName": "dbExplain()",
      "description": "Task: EXPLAIN (ANALYZE, BUFFERS)",
      "agent": "Dara",
      "hasElicitation": true
    },
    {
      "id": "db-impersonate",
      "taskName": "dbImpersonate()",
      "description": "Task: Impersonate User (RLS Testing)",
      "agent": "Dara",
      "hasElicitation": true
    },
    {
      "id": "db-load-csv",
      "taskName": "dbLoadCsv()",
      "description": "Task: Load CSV Data Safely",
      "agent": "Dara",
      "hasElicitation": true
    },
    {
      "id": "db-policy-apply",
      "taskName": "dbPolicyApply()",
      "description": "Task: Apply RLS Policy Template",
      "agent": "Dara",
      "hasElicitation": true
    },
    {
      "id": "db-rls-audit",
      "taskName": "dbRlsAudit()",
      "description": "Task: RLS Audit",
      "agent": "Dara",
      "hasElicitation": true
    },
    {
      "id": "db-rollback",
      "taskName": "dbRollback()",
      "description": "Task: Rollback Database",
      "agent": "Dara",
      "hasElicitation": true
    },
    {
      "id": "db-run-sql",
      "taskName": "dbRunSql()",
      "description": "Task: Run SQL",
      "agent": "Dara",
      "hasElicitation": true
    },
    {
      "id": "db-schema-audit",
      "taskName": "dbSchemaAudit()",
      "description": "Task: Schema Audit",
      "agent": "Dara",
      "hasElicitation": true
    },
    {
      "id": "db-seed",
      "taskName": "dbSeed()",
      "description": "Task: Apply Seed Data",
      "agent": "Dara",
      "hasElicitation": true
    },
    {
      "id": "db-smoke-test",
      "taskName": "dbSmokeTest()",
      "description": "Task: DB Smoke Test",
      "agent": "Dara",
      "hasElicitation": true
    },
    {
      "id": "db-snapshot",
      "taskName": "dbSnapshot()",
      "description": "Task: Create Database Snapshot",
      "agent": "Dara",
      "hasElicitation": true
    },
    {
      "id": "db-squad-integration",
      "taskName": "dbExpansionPackIntegration()",
      "description": "Database Integration Analysis for Squad",
      "agent": "Dara",
      "hasElicitation": true
    },
    {
      "id": "db-supabase-setup",
      "taskName": "dbSupabaseSetup()",
      "description": "Task: Supabase Setup Guide",
      "agent": "Dara",
      "hasElicitation": true
    },
    {
      "id": "db-verify-order",
      "taskName": "dbVerifyOrder()",
      "description": "Task: Verify DDL Ordering",
      "agent": "Dara",
      "hasElicitation": true
    },
    {
      "id": "deprecate-component",
      "taskName": "deprecateComponent()",
      "description": "TODO: Create deprecation-checklist.md for validation (follow-up story needed)",
      "agent": "Dex",
      "hasElicitation": true
    },
    {
      "id": "dev-apply-qa-fixes",
      "taskName": "devApplyQaFixes()",
      "description": "Ap",
      "agent": "Dex",
      "hasElicitation": true
    },
    {
      "id": "dev-backlog-debt",
      "taskName": "devBacklogDebt()",
      "description": "Dev Task: Register Technical Debt",
      "agent": "Dex",
      "hasElicitation": true
    },
    {
      "id": "dev-develop-story",
      "taskName": "devDevelopStory()",
      "description": "Develop Story Task",
      "agent": "Dex",
      "hasElicitation": true
    },
    {
      "id": "dev-improve-code-quality",
      "taskName": "devImproveCodeQuality()",
      "description": "No checklists needed - this task performs automated code refactoring, validation is through linting and testing",
      "agent": "Dex",
      "hasElicitation": true
    },
    {
      "id": "dev-optimize-performance",
      "taskName": "devOptimizePerformance()",
      "description": "Optimize Performance - AIOS Developer Task",
      "agent": "Dex",
      "hasElicitation": true
    },
    {
      "id": "dev-suggest-refactoring",
      "taskName": "devSuggestRefactoring()",
      "description": "Suggest Refactoring - AIOS Developer Task",
      "agent": "Dex",
      "hasElicitation": true
    },
    {
      "id": "dev-validate-next-story",
      "taskName": "devValidateNextStory()",
      "description": "Validate Next Story Task",
      "agent": "Dex",
      "hasElicitation": true
    },
    {
      "id": "document-gotchas",
      "taskName": "documentGotchas()",
      "description": "Document Gotchas Task",
      "agent": "Dex",
      "hasElicitation": false
    },
    {
      "id": "document-project",
      "taskName": "documentProject()",
      "description": "TODO: Create project-documentation-checklist.md for validation (follow-up story needed)",
      "agent": "Morgan",
      "hasElicitation": true
    },
    {
      "id": "environment-bootstrap",
      "taskName": "environmentBootstrap()",
      "description": "environment-bootstrap",
      "agent": "Gage",
      "hasElicitation": true
    },
    {
      "id": "execute-checklist",
      "taskName": "executeChecklist()",
      "description": "No templates needed - this task executes existing checklists, doesn't create document outputs",
      "agent": "Quinn",
      "hasElicitation": true
    },
    {
      "id": "execute-epic-plan",
      "taskName": "executeEpicPlan()",
      "description": "Execute Epic Plan Task",
      "agent": "",
      "hasElicitation": true
    },
    {
      "id": "export-design-tokens-dtcg",
      "taskName": "exportDesignTokensDtcg()",
      "description": "Export Design Tokens to W3C DTCG",
      "agent": "Uma",
      "hasElicitation": true
    },
    {
      "id": "extend-pattern",
      "taskName": "extendPattern()",
      "description": "Extend Existing Pattern",
      "agent": "Uma",
      "hasElicitation": true
    },
    {
      "id": "extract-patterns",
      "taskName": "extract-patterns()",
      "description": "Extract Patterns",
      "agent": "Dex",
      "hasElicitation": false
    },
    {
      "id": "extract-tokens",
      "taskName": "extractTokens()",
      "description": "Extract Design Tokens from Consolidated Patterns",
      "agent": "Uma",
      "hasElicitation": true
    },
    {
      "id": "facilitate-brainstorming-session",
      "taskName": "facilitateBrainstormingSession()",
      "description": "Facilitate Brainstorming Session",
      "agent": "Atlas",
      "hasElicitation": true
    },
    {
      "id": "generate-ai-frontend-prompt",
      "taskName": "generateAiFrontendPrompt()",
      "description": "No checklists needed - this task generates prompts, validation is built into prompt generation methodology",
      "agent": "Uma",
      "hasElicitation": true
    },
    {
      "id": "generate-documentation",
      "taskName": "generateDocumentation()",
      "description": "Generate Pattern Library Documentation",
      "agent": "Morgan",
      "hasElicitation": true
    },
    {
      "id": "generate-migration-strategy",
      "taskName": "generateMigrationStrategy()",
      "description": "Generate Phased Migration Strategy",
      "agent": "Dara",
      "hasElicitation": true
    },
    {
      "id": "generate-shock-report",
      "taskName": "generateShockReport()",
      "description": "Generate Visual Shock Report",
      "agent": "Atlas",
      "hasElicitation": true
    },
    {
      "id": "github-devops-github-pr-automation",
      "taskName": "githubDevopsGithubPrAutomation()",
      "description": "github-pr-automation.md",
      "agent": "Gage",
      "hasElicitation": true
    },
    {
      "id": "github-devops-pre-push-quality-gate",
      "taskName": "githubDevopsPrePushQualityGate()",
      "description": "pre-push-quality-gate.md",
      "agent": "Gage",
      "hasElicitation": true
    },
    {
      "id": "github-devops-repository-cleanup",
      "taskName": "githubDevopsRepositoryCleanup()",
      "description": "repository-cleanup.md",
      "agent": "Gage",
      "hasElicitation": true
    },
    {
      "id": "github-devops-version-management",
      "taskName": "githubDevopsVersionManagement()",
      "description": "version-management.md",
      "agent": "Gage",
      "hasElicitation": true
    },
    {
      "id": "github-issue-triage",
      "taskName": "github-issue-triage()",
      "description": "GitHub Issue Triage",
      "agent": "devops",
      "hasElicitation": true
    },
    {
      "id": "gotcha",
      "taskName": "gotcha()",
      "description": "Task: Add Gotcha",
      "agent": "",
      "hasElicitation": false
    },
    {
      "id": "gotchas",
      "taskName": "gotchas()",
      "description": "Task: List Gotchas",
      "agent": "",
      "hasElicitation": false
    },
    {
      "id": "ids-governor",
      "taskName": "ids-governor()",
      "description": "Task: IDS Governor Commands",
      "agent": "",
      "hasElicitation": false
    },
    {
      "id": "ids-health",
      "taskName": "ids-health()",
      "description": "IDS Registry Health Check Task",
      "agent": "",
      "hasElicitation": false
    },
    {
      "id": "ids-query",
      "taskName": "idsQuery()",
      "description": "Basic query",
      "agent": "Any",
      "hasElicitation": false
    },
    {
      "id": "improve-self",
      "taskName": "improveSelf()",
      "description": "improve-self",
      "agent": "Orion",
      "hasElicitation": true
    },
    {
      "id": "index-docs",
      "taskName": "indexDocs()",
      "description": "No checklists needed - this task maintains documentation index, validation is through file system checks",
      "agent": "Morgan",
      "hasElicitation": true
    },
    {
      "id": "init-project-status",
      "taskName": "initProjectStatus()",
      "description": "init-project-status",
      "agent": "River",
      "hasElicitation": true
    },
    {
      "id": "integrate-squad",
      "taskName": "integrateExpansionPack()",
      "description": "Integrate with Squad",
      "agent": "Dex",
      "hasElicitation": true
    },
    {
      "id": "kb-mode-interaction",
      "taskName": "kbModeInteraction()",
      "description": "No checklists needed - interactive KB mode facilitation task, no validation workflow required",
      "agent": "Orion",
      "hasElicitation": true
    },
    {
      "id": "learn-patterns",
      "taskName": "learnPatterns()",
      "description": "learn-patterns",
      "agent": "Uma",
      "hasElicitation": true
    },
    {
      "id": "list-mcps",
      "taskName": "list-mcps()",
      "description": "list-mcps",
      "agent": "",
      "hasElicitation": false
    },
    {
      "id": "list-worktrees",
      "taskName": "listWorktrees()",
      "description": "list-worktrees",
      "agent": "Gage",
      "hasElicitation": false
    },
    {
      "id": "mcp-workflow",
      "taskName": "mcpWorkflow()",
      "description": "MCP Workflow Creation Task",
      "agent": "",
      "hasElicitation": true
    },
    {
      "id": "merge-worktree",
      "taskName": "merge-worktree()",
      "description": "merge-worktree",
      "agent": "",
      "hasElicitation": false
    },
    {
      "id": "modify-agent",
      "taskName": "modifyAgent()",
      "description": "Modify Agent Task",
      "agent": "Orion",
      "hasElicitation": true
    },
    {
      "id": "modify-task",
      "taskName": "modifyTask()",
      "description": "Modify Task Task",
      "agent": "Orion",
      "hasElicitation": true
    },
    {
      "id": "modify-workflow",
      "taskName": "modifyWorkflow()",
      "description": "Modify Workflow Task",
      "agent": "Orion",
      "hasElicitation": true
    },
    {
      "id": "next",
      "taskName": "next()",
      "description": "Next Command Suggestions",
      "agent": "Dex",
      "hasElicitation": false
    },
    {
      "id": "orchestrate-resume",
      "taskName": "orchestrate-resume()",
      "description": "\\*orchestrate-resume Command",
      "agent": "",
      "hasElicitation": false
    },
    {
      "id": "orchestrate-status",
      "taskName": "orchestrate-status()",
      "description": "\\*orchestrate-status Command",
      "agent": "",
      "hasElicitation": false
    },
    {
      "id": "orchestrate-stop",
      "taskName": "orchestrate-stop()",
      "description": "\\*orchestrate-stop Command",
      "agent": "",
      "hasElicitation": false
    },
    {
      "id": "orchestrate",
      "taskName": "orchestrate()",
      "description": "\\*orchestrate Command",
      "agent": "",
      "hasElicitation": false
    },
    {
      "id": "patterns",
      "taskName": "patterns()",
      "description": "Learned Patterns Management",
      "agent": "Dex",
      "hasElicitation": false
    },
    {
      "id": "plan-create-context",
      "taskName": "plan-create-context()",
      "description": "Plan Pipeline: Create Context",
      "agent": "",
      "hasElicitation": false
    },
    {
      "id": "plan-create-implementation",
      "taskName": "plan-create-implementation()",
      "description": "Execution Pipeline: Create Implementation Plan",
      "agent": "",
      "hasElicitation": true
    },
    {
      "id": "plan-execute-subtask",
      "taskName": "plan-execute-subtask()",
      "description": "Execute Subtask (Coder Agent)",
      "agent": "",
      "hasElicitation": false
    },
    {
      "id": "po-backlog-add",
      "taskName": "poBacklogAdd()",
      "description": "PO Task: Add Backlog Item",
      "agent": "Pax",
      "hasElicitation": true
    },
    {
      "id": "po-close-story",
      "taskName": "poCloseStory()",
      "description": "PO Task: Close Story",
      "agent": "Pax",
      "hasElicitation": true
    },
    {
      "id": "po-manage-story-backlog",
      "taskName": "po-manage-story-backlog()",
      "description": "manage-story-backlog",
      "agent": "",
      "hasElicitation": true
    },
    {
      "id": "po-pull-story-from-clickup",
      "taskName": "poPullStoryFromClickup()",
      "description": "pull-story-from-clickup",
      "agent": "Pax",
      "hasElicitation": true
    },
    {
      "id": "po-pull-story",
      "taskName": "poPullStory()",
      "description": "pull-story",
      "agent": "Pax",
      "hasElicitation": true
    },
    {
      "id": "po-stories-index",
      "taskName": "poStoriesIndex()",
      "description": "PO Task: Regenerate Story Index",
      "agent": "Pax",
      "hasElicitation": true
    },
    {
      "id": "po-sync-story-to-clickup",
      "taskName": "poSyncStoryToClickup()",
      "description": "sync-story-to-clickup",
      "agent": "Pax",
      "hasElicitation": true
    },
    {
      "id": "po-sync-story",
      "taskName": "poSyncStory()",
      "description": "sync-story",
      "agent": "Pax",
      "hasElicitation": true
    },
    {
      "id": "pr-automation",
      "taskName": "prAutomation()",
      "description": "Automate Pull Request Creation for Open-Source Contributions",
      "agent": "Gage",
      "hasElicitation": true
    },
    {
      "id": "propose-modification",
      "taskName": "proposeModification()",
      "description": "Propose Modification - AIOS Developer Task",
      "agent": "Atlas",
      "hasElicitation": true
    },
    {
      "id": "publish-npm",
      "taskName": "publish-npm()",
      "description": "npm Publishing Pipeline: Preview to Latest",
      "agent": "",
      "hasElicitation": false
    },
    {
      "id": "qa-after-creation",
      "taskName": "type:",
      "description": "Task: QA After Creation",
      "agent": "",
      "hasElicitation": false
    },
    {
      "id": "qa-backlog-add-followup",
      "taskName": "qaBacklogAddFollowup()",
      "description": "QA Task: Add Follow-up to Backlog",
      "agent": "Quinn",
      "hasElicitation": true
    },
    {
      "id": "qa-browser-console-check",
      "taskName": "qaBrowserConsoleCheck()",
      "description": "Browser Console Check Task",
      "agent": "",
      "hasElicitation": false
    },
    {
      "id": "qa-create-fix-request",
      "taskName": "qaCreateFixRequest()",
      "description": "Create Fix Request Task",
      "agent": "",
      "hasElicitation": true
    },
    {
      "id": "qa-evidence-requirements",
      "taskName": "qaEvidenceRequirements()",
      "description": "Evidence Requirements Task",
      "agent": "",
      "hasElicitation": false
    },
    {
      "id": "qa-false-positive-detection",
      "taskName": "qaFalsePositiveDetection()",
      "description": "False Positive Detection Task",
      "agent": "",
      "hasElicitation": false
    },
    {
      "id": "qa-fix-issues",
      "taskName": "qa-fix-issues()",
      "description": "QA Issue Fixer Task",
      "agent": "",
      "hasElicitation": false
    },
    {
      "id": "qa-gate",
      "taskName": "qaGate()",
      "description": "qa-gate",
      "agent": "Quinn",
      "hasElicitation": true
    },
    {
      "id": "qa-generate-tests",
      "taskName": "qaGenerateTests()",
      "description": "TODO: Create test-generation-checklist.md for validation (follow-up story needed)",
      "agent": "Quinn",
      "hasElicitation": true
    },
    {
      "id": "qa-library-validation",
      "taskName": "qaLibraryValidation()",
      "description": "Library Validation Task",
      "agent": "",
      "hasElicitation": true
    },
    {
      "id": "qa-migration-validation",
      "taskName": "qaMigrationValidation()",
      "description": "Migration Validation Task",
      "agent": "",
      "hasElicitation": true
    },
    {
      "id": "qa-nfr-assess",
      "taskName": "qa-nfr-assess()",
      "description": "nfr-assess",
      "agent": "",
      "hasElicitation": true
    },
    {
      "id": "qa-review-build",
      "taskName": "qa-review-build()",
      "description": "QA Review Build: 10-Phase Quality Assurance Review",
      "agent": "",
      "hasElicitation": false
    },
    {
      "id": "qa-review-proposal",
      "taskName": "qaReviewProposal()",
      "description": "Review Proposal - AIOS Developer Task",
      "agent": "Quinn",
      "hasElicitation": true
    },
    {
      "id": "qa-review-story",
      "taskName": "qaReviewStory()",
      "description": "review-story",
      "agent": "Quinn",
      "hasElicitation": true
    },
    {
      "id": "qa-risk-profile",
      "taskName": "qaRiskProfile()",
      "description": "risk-profile",
      "agent": "Quinn",
      "hasElicitation": true
    },
    {
      "id": "qa-run-tests",
      "taskName": "qaRunTests()",
      "description": "Run Tests (with Code Quality Gate)",
      "agent": "Quinn",
      "hasElicitation": true
    },
    {
      "id": "qa-security-checklist",
      "taskName": "qaSecurityChecklist()",
      "description": "Security Checklist Task",
      "agent": "",
      "hasElicitation": true
    },
    {
      "id": "qa-test-design",
      "taskName": "qaTestDesign()",
      "description": "test-design",
      "agent": "Quinn",
      "hasElicitation": true
    },
    {
      "id": "qa-trace-requirements",
      "taskName": "qaTraceRequirements()",
      "description": "trace-requirements",
      "agent": "Quinn",
      "hasElicitation": true
    },
    {
      "id": "release-management",
      "taskName": "releaseManagement()",
      "description": "Manage Software Releases",
      "agent": "Gage",
      "hasElicitation": true
    },
    {
      "id": "remove-mcp",
      "taskName": "remove-mcp()",
      "description": "remove-mcp",
      "agent": "",
      "hasElicitation": false
    },
    {
      "id": "remove-worktree",
      "taskName": "removeWorktree()",
      "description": "remove-worktree",
      "agent": "Gage",
      "hasElicitation": true
    },
    {
      "id": "resolve-github-issue",
      "taskName": "resolveGithubIssue()",
      "description": "resolve-github-issue.md",
      "agent": "",
      "hasElicitation": true
    },
    {
      "id": "review-contributor-pr",
      "taskName": "review-contributor-pr()",
      "description": "Task: Review External Contributor PR",
      "agent": "devops",
      "hasElicitation": true
    },
    {
      "id": "run-design-system-pipeline",
      "taskName": "run-design-system-pipeline",
      "description": "Run Design System Pipeline",
      "agent": "Brad",
      "hasElicitation": true
    },
    {
      "id": "run-workflow-engine",
      "taskName": "runWorkflowEngine()",
      "description": "Workflow Runtime Engine Task",
      "agent": "",
      "hasElicitation": true
    },
    {
      "id": "run-workflow",
      "taskName": "runWorkflow()",
      "description": "Run Workflow Task",
      "agent": "",
      "hasElicitation": true
    },
    {
      "id": "search-mcp",
      "taskName": "searchMcp()",
      "description": "Search MCP Catalog Task",
      "agent": "",
      "hasElicitation": true
    },
    {
      "id": "security-audit",
      "taskName": "securityAudit()",
      "description": "Task: Security Audit",
      "agent": "Quinn",
      "hasElicitation": true
    },
    {
      "id": "security-scan",
      "taskName": "securityScan()",
      "description": "security-scan",
      "agent": "Quinn",
      "hasElicitation": true
    },
    {
      "id": "session-resume",
      "taskName": "sessionResume",
      "description": "Session Resume Task",
      "agent": "",
      "hasElicitation": true
    },
    {
      "id": "setup-database",
      "taskName": "setupDatabase()",
      "description": "Task: Setup Database",
      "agent": "Dara",
      "hasElicitation": true
    },
    {
      "id": "setup-design-system",
      "taskName": "setupDesignSystem()",
      "description": "Setup Design System Structure",
      "agent": "Uma",
      "hasElicitation": true
    },
    {
      "id": "setup-github",
      "taskName": "setupGitHub()",
      "description": "setup-github",
      "agent": "Gage",
      "hasElicitation": true
    },
    {
      "id": "setup-llm-routing",
      "taskName": "setup-llm-routing()",
      "description": "setup-llm-routing",
      "agent": "",
      "hasElicitation": true
    },
    {
      "id": "setup-mcp-docker",
      "taskName": "setupMcpDocker()",
      "description": "Setup Docker MCP Toolkit",
      "agent": "DevOps",
      "hasElicitation": true
    },
    {
      "id": "setup-project-docs",
      "taskName": "setupProjectDocs()",
      "description": "Setup Project Documentation",
      "agent": "",
      "hasElicitation": true
    },
    {
      "id": "shard-doc",
      "taskName": "shardDoc()",
      "description": "No checklists needed - document processing task with built-in validation via md-tree tool",
      "agent": "Morgan",
      "hasElicitation": true
    },
    {
      "id": "sm-create-next-story",
      "taskName": "smCreateNextStory()",
      "description": "Create Next Story Task",
      "agent": "River",
      "hasElicitation": true
    },
    {
      "id": "spec-assess-complexity",
      "taskName": "spec-assess-complexity()",
      "description": "Spec Pipeline: Assess Complexity",
      "agent": "",
      "hasElicitation": false
    },
    {
      "id": "spec-critique",
      "taskName": "spec-critique()",
      "description": "Spec Pipeline: Critique Specification",
      "agent": "",
      "hasElicitation": false
    },
    {
      "id": "spec-gather-requirements",
      "taskName": "spec-gather-requirements()",
      "description": "Spec Pipeline: Gather Requirements",
      "agent": "",
      "hasElicitation": true
    },
    {
      "id": "spec-research-dependencies",
      "taskName": "spec-research-dependencies()",
      "description": "Spec Pipeline: Research Dependencies",
      "agent": "",
      "hasElicitation": false
    },
    {
      "id": "spec-write-spec",
      "taskName": "spec-write-spec()",
      "description": "Spec Pipeline: Write Specification",
      "agent": "",
      "hasElicitation": false
    },
    {
      "id": "squad-creator-analyze",
      "taskName": "squad-creator-analyze()",
      "description": "Analyze Squad Task",
      "agent": "",
      "hasElicitation": true
    },
    {
      "id": "squad-creator-create",
      "taskName": "squad-creator-create()",
      "description": "*create-squad",
      "agent": "",
      "hasElicitation": false
    },
    {
      "id": "squad-creator-design",
      "taskName": "squad-creator-design()",
      "description": "*design-squad",
      "agent": "agent",
      "hasElicitation": true
    },
    {
      "id": "squad-creator-download",
      "taskName": "squad-creator-download()",
      "description": "*download-squad",
      "agent": "",
      "hasElicitation": false
    },
    {
      "id": "squad-creator-extend",
      "taskName": "squad-creator-extend()",
      "description": "Extend Squad Task",
      "agent": "",
      "hasElicitation": true
    },
    {
      "id": "squad-creator-list",
      "taskName": "squad-creator-list()",
      "description": "*list-squads",
      "agent": "",
      "hasElicitation": false
    },
    {
      "id": "squad-creator-migrate",
      "taskName": "squad-creator-migrate()",
      "description": "*migrate-squad",
      "agent": "",
      "hasElicitation": false
    },
    {
      "id": "squad-creator-publish",
      "taskName": "squad-creator-publish()",
      "description": "*publish-squad",
      "agent": "",
      "hasElicitation": false
    },
    {
      "id": "squad-creator-sync-ide-command",
      "taskName": "squad-creator-sync-ide-command()",
      "description": "\\*command",
      "agent": "",
      "hasElicitation": false
    },
    {
      "id": "squad-creator-sync-synkra",
      "taskName": "squad-creator-sync-synkra()",
      "description": "*sync-squad-synkra",
      "agent": "",
      "hasElicitation": false
    },
    {
      "id": "squad-creator-validate",
      "taskName": "squad-creator-validate()",
      "description": "*validate-squad",
      "agent": "",
      "hasElicitation": false
    },
    {
      "id": "story-checkpoint",
      "taskName": "story-checkpoint()",
      "description": "Task: Story Checkpoint",
      "agent": "",
      "hasElicitation": true
    },
    {
      "id": "sync-documentation",
      "taskName": "syncDocumentation()",
      "description": "sync-documentation",
      "agent": "Morgan",
      "hasElicitation": true
    },
    {
      "id": "sync-registry-intel",
      "taskName": "sync-registry-intel()",
      "description": "Task: Sync Registry Intel",
      "agent": "",
      "hasElicitation": false
    },
    {
      "id": "tailwind-upgrade",
      "taskName": "tailwindUpgrade()",
      "description": "Tailwind CSS v4 Upgrade Playbook",
      "agent": "Uma",
      "hasElicitation": true
    },
    {
      "id": "test-as-user",
      "taskName": "testAsUser()",
      "description": "Task: Test As User (RLS Testing)",
      "agent": "Quinn",
      "hasElicitation": true
    },
    {
      "id": "test-validation-task",
      "taskName": "testValidationTask()",
      "description": "test-validation-task",
      "agent": "Dex",
      "hasElicitation": true
    },
    {
      "id": "triage-github-issues",
      "taskName": "triageGithubIssues()",
      "description": "triage-github-issues.md",
      "agent": "",
      "hasElicitation": true
    },
    {
      "id": "undo-last",
      "taskName": "undoLast()",
      "description": "No checklists needed - rollback operation with built-in transaction validation",
      "agent": "Dex",
      "hasElicitation": true
    },
    {
      "id": "update-aios",
      "taskName": "updateAIOSFramework",
      "description": "Task: Update AIOS Framework",
      "agent": "devops",
      "hasElicitation": false
    },
    {
      "id": "update-manifest",
      "taskName": "updateManifest()",
      "description": "Update Manifest",
      "agent": "Dex",
      "hasElicitation": true
    },
    {
      "id": "update-source-tree",
      "taskName": "updateSourceTree()",
      "description": "Update Source Tree Task",
      "agent": "",
      "hasElicitation": false
    },
    {
      "id": "ux-create-wireframe",
      "taskName": "uxCreateWireframe()",
      "description": "Create Wireframes & Interaction Flows",
      "agent": "Uma",
      "hasElicitation": true
    },
    {
      "id": "ux-ds-scan-artifact",
      "taskName": "uxDsScanArtifact()",
      "description": "Design System Artifact Scanner",
      "agent": "Uma",
      "hasElicitation": true
    },
    {
      "id": "ux-user-research",
      "taskName": "uxUserResearch()",
      "description": "User Research & Needs Analysis",
      "agent": "Uma",
      "hasElicitation": true
    },
    {
      "id": "validate-agents",
      "taskName": "validate-agents()",
      "description": "Validate Agents Task",
      "agent": "",
      "hasElicitation": false
    },
    {
      "id": "validate-next-story",
      "taskName": "validateNextStory()",
      "description": "Validate Next Story Task",
      "agent": "Quinn",
      "hasElicitation": true
    },
    {
      "id": "validate-tech-preset",
      "taskName": "validate-tech-preset()",
      "description": "\\*validate-tech-preset",
      "agent": "",
      "hasElicitation": false
    },
    {
      "id": "validate-workflow",
      "taskName": "validateWorkflow()",
      "description": "Validate Workflow Task",
      "agent": "",
      "hasElicitation": true
    },
    {
      "id": "verify-subtask",
      "taskName": "verify-subtask()",
      "description": "Verify Subtask",
      "agent": "",
      "hasElicitation": false
    },
    {
      "id": "waves",
      "taskName": "waves()",
      "description": "Task: `*waves` - Wave Analysis",
      "agent": "",
      "hasElicitation": false
    },
    {
      "id": "yolo-toggle",
      "taskName": "yoloToggle()",
      "description": "yolo-toggle",
      "agent": "Any",
      "hasElicitation": false
    }
  ],
  "workflows": [
    {
      "id": "auto-worktree",
      "name": "Auto-Worktree - Automatic Isolated Development Environment",
      "description": "Automatically creates and manages isolated worktrees for story development. Triggered when @dev starts working on a story, ensuring parallel development capability and clean isolation between different development tasks. Part of the Auto-Claude ADE (Autonomous Development Engine) infrastructure.",
      "type": "automation",
      "phases": [
        {
          "id": "extract_story_context",
          "name": "extract_story_context",
          "phase": "1",
          "agent": "hook:"
        }
      ],
      "agents": [
        "hook:"
      ],
      "triggers": [
        "*auto-worktree\""
      ]
    },
    {
      "id": "brownfield-discovery",
      "name": "Brownfield Discovery - Complete Technical Debt Assessment",
      "description": "Comprehensive multi-agent discovery workflow for existing projects. Includes specialist validation cycles and executive awareness report. Designed for projects migrating from Lovable, v0.dev, or legacy codebases.",
      "type": "brownfield",
      "phases": [
        {
          "id": "system_documentation",
          "name": "system_documentation",
          "phase": "1",
          "agent": "architect"
        },
        {
          "id": "database_documentation",
          "name": "database_documentation",
          "phase": "2",
          "agent": "data-engineer"
        },
        {
          "id": "frontend_documentation",
          "name": "frontend_documentation",
          "phase": "3",
          "agent": "ux-design-expert"
        },
        {
          "id": "initial_consolidation",
          "name": "initial_consolidation",
          "phase": "4",
          "agent": "architect"
        },
        {
          "id": "database_specialist_review",
          "name": "database_specialist_review",
          "phase": "5",
          "agent": "data-engineer"
        },
        {
          "id": "ux_specialist_review",
          "name": "ux_specialist_review",
          "phase": "6",
          "agent": "ux-design-expert"
        },
        {
          "id": "qa_general_review",
          "name": "qa_general_review",
          "phase": "7",
          "agent": "qa"
        },
        {
          "id": "final_assessment",
          "name": "final_assessment",
          "phase": "8",
          "agent": "architect"
        },
        {
          "id": "executive_awareness_report",
          "name": "executive_awareness_report",
          "phase": "9",
          "agent": "analyst"
        },
        {
          "id": "epic_creation",
          "name": "epic_creation",
          "phase": "10",
          "agent": "pm"
        },
        {
          "id": "story_creation",
          "name": "story_creation",
          "phase": "10",
          "agent": "pm"
        }
      ],
      "agents": [
        "architect",
        "data-engineer",
        "ux-design-expert",
        "qa",
        "analyst",
        "pm"
      ],
      "triggers": [
        "*document-project\"",
        "*db-schema-audit",
        "*create-front-end-spec\"",
        "*brownfield-create-epic"
      ]
    },
    {
      "id": "brownfield-fullstack",
      "name": "Brownfield Full-Stack Enhancement",
      "description": "Agent workflow for enhancing existing full-stack applications with new features, modernization, or significant changes. Handles existing system analysis and safe integration.",
      "type": "brownfield",
      "phases": [
        {
          "id": "phase_1",
          "name": "Enhancement Classification & Routing",
          "phase": "1",
          "agent": ""
        },
        {
          "id": "phase_2",
          "name": "Planning & Documentation",
          "phase": "2",
          "agent": ""
        },
        {
          "id": "phase_3",
          "name": "Document Sharding",
          "phase": "3",
          "agent": ""
        },
        {
          "id": "phase_4",
          "name": "Development Cycle",
          "phase": "4",
          "agent": ""
        }
      ],
      "agents": [
        "analyst",
        "pm",
        "architect",
        "po",
        "sm",
        "dev",
        "qa"
      ],
      "triggers": []
    },
    {
      "id": "brownfield-service",
      "name": "Brownfield Service/API Enhancement",
      "description": "Agent workflow for enhancing existing backend services and APIs with new features, modernization, or performance improvements. Handles existing system analysis and safe integration.",
      "type": "brownfield",
      "phases": [
        {
          "id": "phase_1",
          "name": "Service Analysis & Planning",
          "phase": "1",
          "agent": ""
        },
        {
          "id": "phase_2",
          "name": "Document Sharding",
          "phase": "2",
          "agent": ""
        },
        {
          "id": "phase_3",
          "name": "Development Cycle",
          "phase": "3",
          "agent": ""
        }
      ],
      "agents": [
        "architect",
        "pm",
        "po",
        "sm",
        "analyst",
        "dev",
        "qa"
      ],
      "triggers": []
    },
    {
      "id": "brownfield-ui",
      "name": "Brownfield UI/Frontend Enhancement",
      "description": "Agent workflow for enhancing existing frontend applications with new features, modernization, or design improvements. Handles existing UI analysis and safe integration.",
      "type": "brownfield",
      "phases": [
        {
          "id": "phase_1",
          "name": "UI Analysis & Planning",
          "phase": "1",
          "agent": ""
        },
        {
          "id": "phase_2",
          "name": "Document Sharding",
          "phase": "2",
          "agent": ""
        },
        {
          "id": "phase_3",
          "name": "Development Cycle",
          "phase": "3",
          "agent": ""
        }
      ],
      "agents": [
        "architect",
        "pm",
        "ux",
        "po",
        "sm",
        "analyst",
        "dev",
        "qa"
      ],
      "triggers": []
    },
    {
      "id": "design-system-build-quality",
      "name": "Design System Build Quality Pipeline",
      "description": "Pipeline pós-migração para Design System. Encadeia sequencialmente as etapas de build, documentação, auditoria de acessibilidade e cálculo de ROI para garantir qualidade e mensurar valor entregue.",
      "type": "brownfield",
      "phases": [
        {
          "id": "build_atomic_components",
          "name": "build_atomic_components",
          "phase": "1",
          "agent": "ux-design-expert"
        },
        {
          "id": "generate_documentation",
          "name": "generate_documentation",
          "phase": "2",
          "agent": "ux-design-expert"
        },
        {
          "id": "accessibility_audit",
          "name": "accessibility_audit",
          "phase": "3",
          "agent": "ux-design-expert"
        },
        {
          "id": "calculate_roi",
          "name": "calculate_roi",
          "phase": "4",
          "agent": "ux-design-expert"
        }
      ],
      "agents": [
        "ux-design-expert"
      ],
      "triggers": []
    },
    {
      "id": "development-cycle",
      "name": "Development Cycle (Projeto Bob)",
      "description": "Workflow orquestrado para ciclo de desenvolvimento por story. Implementa o fluxo PO → Executor → Quality Gate → DevOps → Push com suporte a executor dinâmico, self-healing e checkpoints humanos.",
      "type": "path",
      "phases": [],
      "agents": [],
      "triggers": []
    },
    {
      "id": "epic-orchestration",
      "name": "Epic Wave Orchestration",
      "description": "Reusable template for executing epics with wave-based parallel development. Stories within each wave run the full development-cycle workflow (PO → Executor → Self-Healing → Quality Gate → DevOps → Checkpoint). Wave gates validate integration before proceeding to next wave. Supports worktree isolation for conflict-free parallel development.",
      "type": "epic-orchestration",
      "phases": [],
      "agents": [
        "devops",
        "po",
        "Review"
      ],
      "triggers": []
    },
    {
      "id": "greenfield-fullstack",
      "name": "Greenfield Full-Stack Application Development",
      "description": "Agent workflow for building full-stack applications from concept to development. Supports both comprehensive planning for complex projects and rapid prototyping for simple ones. Includes Phase 0 environment bootstrap for proper tooling setup.",
      "type": "greenfield",
      "phases": [
        {
          "id": "phase_0",
          "name": "Environment Bootstrap",
          "phase": "0",
          "agent": ""
        },
        {
          "id": "phase_1",
          "name": "Discovery & Planning",
          "phase": "1",
          "agent": ""
        },
        {
          "id": "phase_2",
          "name": "Document Sharding",
          "phase": "2",
          "agent": ""
        },
        {
          "id": "phase_3",
          "name": "Development Cycle",
          "phase": "3",
          "agent": ""
        }
      ],
      "agents": [
        "devops",
        "analyst",
        "pm",
        "ux",
        "architect",
        "po",
        "sm",
        "dev",
        "qa"
      ],
      "triggers": []
    },
    {
      "id": "greenfield-service",
      "name": "Greenfield Service/API Development",
      "description": "Agent workflow for building backend services from concept to development. Supports both comprehensive planning for complex services and rapid prototyping for simple APIs.",
      "type": "greenfield",
      "phases": [
        {
          "id": "phase_1",
          "name": "Discovery & Planning",
          "phase": "1",
          "agent": ""
        },
        {
          "id": "phase_2",
          "name": "Document Sharding",
          "phase": "2",
          "agent": ""
        },
        {
          "id": "phase_3",
          "name": "Development Cycle",
          "phase": "3",
          "agent": ""
        }
      ],
      "agents": [
        "analyst",
        "pm",
        "architect",
        "po",
        "sm",
        "dev",
        "qa"
      ],
      "triggers": []
    },
    {
      "id": "greenfield-ui",
      "name": "Greenfield UI/Frontend Development",
      "description": "Agent workflow for building frontend applications from concept to development. Supports both comprehensive planning for complex UIs and rapid prototyping for simple interfaces.",
      "type": "greenfield",
      "phases": [
        {
          "id": "phase_1",
          "name": "Discovery & Planning",
          "phase": "1",
          "agent": ""
        },
        {
          "id": "phase_2",
          "name": "Document Sharding",
          "phase": "2",
          "agent": ""
        },
        {
          "id": "phase_3",
          "name": "Development Cycle",
          "phase": "3",
          "agent": ""
        }
      ],
      "agents": [
        "analyst",
        "pm",
        "ux",
        "architect",
        "po",
        "sm",
        "dev",
        "qa"
      ],
      "triggers": []
    },
    {
      "id": "qa-loop",
      "name": "QA Loop Orchestrator - Review Fix Re-review Cycle",
      "description": "Automated QA loop that orchestrates the review → fix → re-review cycle. Runs up to maxIterations (default 5), tracking each iteration's results. Escalates to human when max iterations reached or manual stop requested. Part of Epic 6 - QA Evolution: Autonomous Development Engine (ADE).",
      "type": "loop",
      "phases": [
        {
          "id": "review",
          "name": "review",
          "phase": "1",
          "agent": "qa",
          "taskFile": "qa-review-story.md"
        },
        {
          "id": "check_verdict",
          "name": "check_verdict",
          "phase": "2",
          "agent": "system"
        },
        {
          "id": "create_fix_request",
          "name": "create_fix_request",
          "phase": "3",
          "agent": "qa",
          "taskFile": "qa-create-fix-request.md"
        },
        {
          "id": "fix_issues",
          "name": "fix_issues",
          "phase": "4",
          "agent": "dev",
          "taskFile": "dev-apply-qa-fixes.md"
        },
        {
          "id": "increment_iteration",
          "name": "increment_iteration",
          "phase": "5",
          "agent": "system"
        }
      ],
      "agents": [
        "qa",
        "dev"
      ],
      "triggers": [
        "*qa-loop\"",
        "*qa-loop-review\"",
        "*qa-loop-fix\"",
        "*stop-qa-loop\"",
        "*resume-qa-loop\"",
        "*escalate-qa-loop\"",
        "*stop-qa-loop\"",
        "*resume-qa-loop\"",
        "*qa-loop"
      ]
    },
    {
      "id": "spec-pipeline",
      "name": "Spec Pipeline - Requirements to Specification",
      "description": "Pipeline completo que transforma requisitos informais em especificações executáveis. Orquestra 5 fases: Gather → Assess → Research → Write → Critique. Adapta as fases baseado na complexidade do requisito. Part of the Auto-Claude ADE (Autonomous Development Engine) infrastructure.",
      "type": "pipeline",
      "phases": [
        {
          "id": "gather",
          "name": "gather",
          "phase": "1",
          "agent": "pm",
          "taskFile": "spec-gather-requirements.md"
        },
        {
          "id": "assess",
          "name": "assess",
          "phase": "2",
          "agent": "architect",
          "taskFile": "spec-assess-complexity.md"
        },
        {
          "id": "research",
          "name": "research",
          "phase": "3",
          "agent": "analyst",
          "taskFile": "spec-research-dependencies.md"
        },
        {
          "id": "spec",
          "name": "spec",
          "phase": "4",
          "agent": "pm",
          "taskFile": "spec-write-spec.md"
        },
        {
          "id": "critique",
          "name": "critique",
          "phase": "5",
          "agent": "qa",
          "taskFile": "spec-critique.md"
        },
        {
          "id": "revise",
          "name": "revise",
          "phase": "5b",
          "agent": "pm"
        },
        {
          "id": "critique_2",
          "name": "critique_2",
          "phase": "5c",
          "agent": "qa",
          "taskFile": "spec-critique.md"
        },
        {
          "id": "plan",
          "name": "plan",
          "phase": "6",
          "agent": "architect",
          "taskFile": "plan-create-implementation.md"
        }
      ],
      "agents": [
        "pm",
        "architect",
        "analyst",
        "qa"
      ],
      "triggers": [
        "*create-spec\"",
        "*gather-requirements\"",
        "*assess-complexity\"",
        "*research-deps\"",
        "*write-spec\"",
        "*critique-spec\""
      ]
    },
    {
      "id": "story-development-cycle",
      "name": "Story Development Cycle",
      "description": "Ciclo completo de desenvolvimento de stories. Automatiza o fluxo desde a criação até a entrega com quality gate: create → validate → implement → QA review. Aplicável a projetos greenfield e brownfield.",
      "type": "generic",
      "phases": [
        {
          "id": "create_story",
          "name": "create_story",
          "phase": "1",
          "agent": "sm"
        },
        {
          "id": "validate_story",
          "name": "validate_story",
          "phase": "2",
          "agent": "po"
        },
        {
          "id": "implement_story",
          "name": "implement_story",
          "phase": "3",
          "agent": "dev"
        },
        {
          "id": "qa_review",
          "name": "qa_review",
          "phase": "4",
          "agent": "qa"
        }
      ],
      "agents": [
        "sm",
        "po",
        "dev",
        "qa"
      ],
      "triggers": []
    }
  ],
  "checklists": [
    {
      "id": "agent-quality-gate",
      "name": "Agent Quality Gate Checklist",
      "description": "Validate agent definitions meet Hybrid Loader quality standard + operational completeness",
      "itemCount": 54
    },
    {
      "id": "brownfield-compatibility-checklist",
      "name": "Brownfield Compatibility Checklist",
      "description": "",
      "itemCount": 31
    },
    {
      "id": "issue-triage-checklist",
      "name": "Issue Triage Checklist",
      "description": "",
      "itemCount": 17
    },
    {
      "id": "memory-audit-checklist",
      "name": "Memory Audit Checklist",
      "description": "",
      "itemCount": 18
    },
    {
      "id": "self-critique-checklist",
      "name": "Self-Critique Checklist",
      "description": "This checklist enables the Developer Agent to perform mandatory self-critique at two critical points during subtask execution:",
      "itemCount": 43
    }
  ],
  "meta": {
    "generatedAt": "2026-03-09T11:54:38.617Z",
    "aiosCoreRoot": "/Users/rafaelcosta/Downloads/apps/.aios-core",
    "agentCount": 12,
    "taskCount": 202,
    "workflowCount": 14,
    "checklistCount": 5
  }
} as const;

// Convenience lookups
export const agentById = new Map(aiosRegistry.agents.map(a => [a.id, a]));
export const taskById = new Map(aiosRegistry.tasks.map(t => [t.id, t]));
export const workflowById = new Map(aiosRegistry.workflows.map(w => [w.id, w]));
export const checklistById = new Map(aiosRegistry.checklists.map(c => [c.id, c]));

// Agent IDs as union type for type safety
export type AgentId = typeof aiosRegistry.agents[number]['id'];
export type WorkflowId = typeof aiosRegistry.workflows[number]['id'];
