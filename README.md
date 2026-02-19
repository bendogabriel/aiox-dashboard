# AIOS Dashboard: Observability Extension

[![Synkra AIOS](https://img.shields.io/badge/Synkra-AIOS-blue.svg)](https://github.com/SynkraAI/aios-core)
[![Licença: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Status](https://img.shields.io/badge/status-early%20development-orange.svg)]()
[![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg)](https://github.com/SynkraAI/aios-dashboard/issues)

**Interface visual para observar seu projeto AIOS em tempo real.**

> 🚧 **FASE INICIAL DE DESENVOLVIMENTO**
>
> Este projeto está em construção ativa. Funcionalidades podem mudar, quebrar ou estar incompletas.
> **Colaborações são muito bem-vindas!** Veja as [issues abertas](https://github.com/SynkraAI/aios-dashboard/issues) ou abra uma nova para sugerir melhorias.

> ⚠️ **Este projeto é uma extensão OPCIONAL.** O [Synkra AIOS](https://github.com/SynkraAI/aios-core) funciona 100% sem ele. O Dashboard existe apenas para **observar** o que acontece na CLI — ele nunca controla.

---

## O que é o AIOS Dashboard?

O AIOS Dashboard é uma **interface web** que permite visualizar em tempo real tudo que acontece no seu projeto AIOS:

- 📋 **Stories** no formato Kanban (arrastar e soltar)
- 🤖 **Agentes** ativos e inativos
- 📡 **Eventos em tempo real** do Claude Code (qual tool está executando, prompts, etc)
- 🔧 **Squads** instalados com seus agentes, tasks e workflows
- 📊 **Insights** e estatísticas do projeto

### Screenshot das Funcionalidades

```
┌─────────────────────────────────────────────────────────────────┐
│  AIOS Dashboard                                    [Settings]   │
├─────────┬───────────────────────────────────────────────────────┤
│         │                                                       │
│ Kanban  │   ┌─────────┐  ┌─────────┐  ┌─────────┐              │
│ Monitor │   │ Backlog │  │ Doing   │  │  Done   │              │
│ Agents  │   ├─────────┤  ├─────────┤  ├─────────┤              │
│ Squads  │   │ Story 1 │  │ Story 3 │  │ Story 5 │              │
│ Bob     │   │ Story 2 │  │ Story 4 │  │ Story 6 │              │
│ ...     │   └─────────┘  └─────────┘  └─────────┘              │
│         │                                                       │
└─────────┴───────────────────────────────────────────────────────┘
```

---

## Funcionalidades

| View | O que faz |
|------|-----------|
| **Kanban** | Board de stories com drag-and-drop entre colunas (Backlog, Doing, Done) |
| **Monitor** | Feed em tempo real de eventos do Claude Code (tools, prompts, erros) |
| **Agents** | Lista de agentes AIOS (@dev, @qa, @architect, etc) — ativos e em standby |
| **Squads** | Organograma visual dos squads instalados com drill-down para agentes e tasks |
| **Bob** | Acompanha execução do Bob Orchestrator (pipeline de desenvolvimento autônomo) |
| **Roadmap** | Visualização de features planejadas |
| **GitHub** | Integração com GitHub (PRs, issues) |
| **Insights** | Estatísticas e métricas do projeto |
| **Terminals** | Grid de múltiplos terminais |
| **Settings** | Configurações do dashboard |

---

## Requisito: Projeto com AIOS Instalado

O Dashboard **precisa estar dentro de um projeto com AIOS instalado** porque ele lê os documentos do framework.

```
meu-projeto/                      # ← Você executa comandos daqui
├── .aios-core/                   # Core do framework (OBRIGATÓRIO)
│   └── development/
│       ├── agents/               # Agentes que aparecem na view "Agents"
│       ├── tasks/                # Tasks dos squads
│       └── templates/
├── docs/
│   └── stories/                  # Stories que aparecem no "Kanban"
│       ├── active/
│       └── completed/
├── squads/                       # Squads que aparecem na view "Squads"
│   ├── meu-squad/
│   └── outro-squad/
├── apps/
│   └── dashboard/                # ← Dashboard instalado aqui
└── package.json
```

**Sem o AIOS instalado, o dashboard mostrará telas vazias.**

---

## Instalação Passo a Passo

> **IMPORTANTE:** Todos os comandos são executados a partir da **raiz do seu projeto** (`meu-projeto/`).

### Pré-requisitos

Antes de começar, você precisa ter:

- ✅ [Node.js](https://nodejs.org/) versão 18 ou superior
- ✅ [Bun](https://bun.sh/) (para o servidor de eventos)
- ✅ [Synkra AIOS](https://github.com/SynkraAI/aios-core) instalado no projeto

### Passo 1: Instale o AIOS (se ainda não tiver)

```bash
# Opção A: Criar novo projeto com AIOS
npx aios-core init meu-projeto
cd meu-projeto

# Opção B: Instalar em projeto existente
cd meu-projeto
npx aios-core install
```

### Passo 2: Clone o Dashboard

```bash
# Cria a pasta apps/ e clona o dashboard
mkdir -p apps
git clone https://github.com/SynkraAI/aios-dashboard.git apps/dashboard
```

### Passo 3: Instale as dependências

```bash
# Dependências do Dashboard (Next.js)
npm install --prefix apps/dashboard

# Dependências do Server (Bun)
cd apps/dashboard/server
bun install
cd ../../..
```

### Passo 4: Inicie o Server de Eventos

O server captura eventos em tempo real do Claude Code.

```bash
cd apps/dashboard/server
bun run dev
```

Você verá:
```
🚀 Monitor Server running on http://localhost:4001
```

> **Deixe este terminal aberto** e abra um novo para o próximo passo.

### Passo 5: Inicie o Dashboard

Em um **novo terminal**:

```bash
npm run dev --prefix apps/dashboard
```

Você verá:
```
▲ Next.js 14.x.x
- Local: http://localhost:3000
```

### Passo 6: Acesse o Dashboard

Abra no navegador: **http://localhost:3000**

🎉 **Pronto!** Você verá o dashboard com suas stories, squads e agentes.

---

## Passo Extra: Eventos em Tempo Real

Para ver eventos do Claude Code em tempo real (qual ferramenta está executando, prompts, etc), instale os hooks:

```bash
apps/dashboard/scripts/install-hooks.sh
```

Isso instala hooks em `~/.claude/hooks/` que enviam eventos para o dashboard.

**Eventos capturados:**
- `PreToolUse` — Antes de executar uma ferramenta
- `PostToolUse` — Após executar (com resultado)
- `UserPromptSubmit` — Quando você envia um prompt
- `Stop` — Quando Claude para
- `SubagentStop` — Quando um subagent (Task) termina

---

## Comandos Rápidos

Cole estes comandos no terminal (execute da raiz do projeto):

```bash
# ===== INSTALAÇÃO =====
mkdir -p apps
git clone https://github.com/SynkraAI/aios-dashboard.git apps/dashboard
npm install --prefix apps/dashboard
cd apps/dashboard/server && bun install && cd ../../..

# ===== INICIAR (2 terminais) =====

# Terminal 1: Server de eventos
cd apps/dashboard/server && bun run dev

# Terminal 2: Dashboard
npm run dev --prefix apps/dashboard

# ===== EXTRAS =====

# Instalar hooks para eventos em tempo real
apps/dashboard/scripts/install-hooks.sh

# Verificar se server está rodando
curl http://localhost:4001/health
```

---

## Estrutura do Projeto

```
apps/dashboard/
├── src/
│   ├── app/                # Páginas Next.js
│   ├── components/
│   │   ├── kanban/         # Board de stories
│   │   ├── monitor/        # Feed de eventos em tempo real
│   │   ├── agents/         # Visualização de agentes
│   │   ├── squads/         # Organograma de squads
│   │   ├── bob/            # Orquestração Bob
│   │   └── ui/             # Componentes de UI
│   ├── hooks/              # React hooks customizados
│   ├── stores/             # Estado global (Zustand)
│   └── lib/                # Utilitários
├── server/                 # Servidor de eventos (Bun)
│   ├── server.ts           # Servidor principal
│   ├── db.ts               # Banco SQLite
│   └── types.ts            # Tipos TypeScript
└── scripts/
    └── install-hooks.sh    # Instalador de hooks
```

---

## Posição na Arquitetura AIOS

O Synkra AIOS segue uma hierarquia clara:

```
CLI First → Observability Second → UI Third
```

| Camada            | Prioridade | O que faz                                           |
| ----------------- | ---------- | --------------------------------------------------- |
| **CLI**           | Máxima     | Onde a inteligência vive. Toda execução e decisões. |
| **Observability** | Secundária | Observar o que acontece no CLI em tempo real.       |
| **UI**            | Terciária  | Visualizações e gestão pontual.                     |

**Este Dashboard opera na camada de Observability.** Ele observa, mas nunca controla.

---

## API do Server

O server expõe endpoints para o dashboard consumir:

| Endpoint                   | Método    | Descrição                       |
| -------------------------- | --------- | ------------------------------- |
| `POST /events`             | POST      | Recebe eventos dos hooks        |
| `GET /events/recent`       | GET       | Últimos eventos                 |
| `GET /sessions`            | GET       | Lista sessões do Claude Code    |
| `GET /stats`               | GET       | Estatísticas agregadas          |
| `WS /stream`               | WebSocket | Stream de eventos em tempo real |
| `GET /health`              | GET       | Verifica se server está ok      |

---

## Configuração

Crie o arquivo `apps/dashboard/.env.local`:

```bash
# Porta do server de eventos
MONITOR_PORT=4001

# Onde salvar o banco SQLite
MONITOR_DB=~/.aios/monitor/events.db

# URL do WebSocket (usado pelo dashboard)
NEXT_PUBLIC_MONITOR_WS_URL=ws://localhost:4001/stream
```

---

## Troubleshooting

### "Dashboard mostra telas vazias"

O AIOS não está instalado. Verifique:

```bash
ls -la .aios-core/     # Deve existir
ls -la docs/stories/   # Deve ter arquivos
ls -la squads/         # Deve ter squads
```

Se não existir, instale o AIOS: `npx aios-core install`

### "Monitor não mostra eventos"

1. Server está rodando?
   ```bash
   curl http://localhost:4001/health
   # Deve retornar: {"status":"ok"}
   ```

2. Hooks estão instalados?
   ```bash
   ls ~/.claude/hooks/
   # Deve ter arquivos .py
   ```

3. Reinstale os hooks:
   ```bash
   apps/dashboard/scripts/install-hooks.sh
   ```

### "Erro ao iniciar o server"

Bun não está instalado. Instale em: https://bun.sh

```bash
curl -fsSL https://bun.sh/install | bash
```

### "Porta 3000/4001 em uso"

Encerre o processo que está usando a porta:

```bash
# Descobrir qual processo
lsof -i :3000
lsof -i :4001

# Matar o processo (substitua PID)
kill -9 <PID>
```

---

## Contribuindo

Contribuições são muito bem-vindas! Veja as [issues abertas](https://github.com/SynkraAI/aios-dashboard/issues).

**Como contribuir:**

1. Fork o repositório
2. Crie uma branch: `git checkout -b minha-feature`
3. Faça suas alterações
4. Teste localmente
5. Abra um Pull Request

---

## Licença

MIT

---

<sub>Parte do ecossistema [Synkra AIOS](https://github.com/SynkraAI/aios-core) — CLI First, Observability Second, UI Third</sub>
