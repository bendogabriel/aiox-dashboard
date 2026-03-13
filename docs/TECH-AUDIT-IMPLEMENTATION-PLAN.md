# Plano de Implementação — Auditoria Técnica AIOS Platform v0.5.0

**Autor:** Dex, Full-Stack Developer | **Data:** 2026-03-11
**Base:** Auditoria do Architect (Aria) | **Branch:** `feat/glass-ui-design-system-v2`
**Complexidade:** 20/25 (COMPLEX) — 4 fases, ciclo de revisão

---

## Resumo Executivo

| Severidade | Findings | Esforço Estimado |
|------------|----------|-----------------|
| CRITICAL | 5 | Sprint 1 (semana 1) |
| HIGH | 8 | Sprint 1-2 (semanas 1-2) |
| MEDIUM | 10 | Sprint 2-3 (semanas 2-4) |
| LOW | 5 | Backlog contínuo |

---

## Fase 1 — CRITICAL Security Fixes (Semana 1)

### 1.1 Auth Middleware Global na Engine

**Problema:** Nenhuma rota da engine possui autenticação. Qualquer cliente na rede pode executar agentes, ler secrets, manipular jobs.

**Arquivos a criar:**
- `engine/src/middleware/auth.ts` — middleware de autenticação Bearer token + API key

**Arquivos a modificar:**
- `engine/src/index.ts` — registrar middleware global antes de todas as rotas
- `engine/engine.config.yaml` — adicionar `auth.api_keys[]` e `auth.require_auth: true`
- `engine/src/lib/config.ts` — parsear novas configs de auth

**Implementação:**
```
1. Criar middleware Hono que valida:
   - Header `Authorization: Bearer <token>` contra config
   - Header `X-API-Key: <key>` contra lista de API keys
   - Bypass para /health e /auth/google/callback (rotas públicas)
2. Usar timing-safe comparison (crypto.timingSafeEqual) para evitar timing attacks
3. Retornar 401 com corpo genérico { error: "Unauthorized" }
4. Registrar em index.ts ANTES do CORS middleware
```

**Testes:**
- Requisição sem header → 401
- Requisição com token inválido → 401
- Requisição com token válido → 200
- /health sem auth → 200 (bypass)
- Timing attack: tempo de resposta constante para tokens válidos/inválidos

---

### 1.2 ENGINE_SECRET — Rejeitar Default Inseguro

**Problema:** `ENGINE_SECRET=aios-dev-secret-change-in-production` usado como fallback. Vault inteiro comprometido se não alterado.

**Arquivos a modificar:**
- `engine/src/lib/secrets.ts:15` — rejeitar default, exigir env var
- `engine/src/lib/config.ts` — validação de startup

**Implementação:**
```
1. Em secrets.ts, remover fallback hardcoded:
   - const secret = process.env.ENGINE_SECRET;
   - if (!secret || secret === 'aios-dev-secret-change-in-production') {
   -   throw new Error('ENGINE_SECRET must be set to a secure value');
   - }
2. Em config.ts, adicionar validação de startup:
   - Checar ENGINE_SECRET length >= 32 chars
   - Checar não é o valor default
   - Log warning se salt é hardcoded (fase 2: salt aleatório)
3. Adicionar startup check em index.ts que aborta se validação falha
```

**Testes:**
- Startup sem ENGINE_SECRET → process.exit(1) com mensagem clara
- Startup com default value → process.exit(1)
- Startup com secret válido (32+ chars) → boot normal
- Encrypt/decrypt roundtrip com secret customizado

---

### 1.3 Secret Preview Endpoint — Informação Vazada

**Problema:** `GET /integrations/secrets/:key` retorna preview (4 primeiros + 4 últimos chars) sem autenticação.

**Arquivos a modificar:**
- `engine/src/routes/integrations.ts:109-119` — remover preview, retornar apenas existência

**Implementação:**
```
1. Remover slice do valor decriptado
2. Retornar apenas: { key, exists: true } (sem preview)
3. Adicionar rate limiting neste endpoint (10 req/min)
4. Adicionar audit log de acesso a secrets
```

**Testes:**
- GET /secrets/existing-key → `{ key: "...", exists: true }` (sem preview)
- GET /secrets/nonexistent → 404
- 11 requests em 1 minuto → 429 no 11º

---

### 1.4 RLS Policies — Supabase Tables Abertas

**Problema:** `roadmap_features`, `vault_workspaces`, `vault_documents`, `user_settings`, `team_config_profiles` permitem CRUD anônimo.

**Arquivos a criar:**
- `supabase/migrations/20260316_fix_rls_policies.sql`

**Implementação:**
```sql
-- Revogar políticas permissivas
DROP POLICY IF EXISTS "Anyone can read roadmap features" ON roadmap_features;
DROP POLICY IF EXISTS "Anyone can insert roadmap features" ON roadmap_features;
DROP POLICY IF EXISTS "Anyone can update roadmap features" ON roadmap_features;
DROP POLICY IF EXISTS "Anyone can delete roadmap features" ON roadmap_features;
-- (repetir para vault_workspaces, vault_documents, user_settings, team_config_profiles)

-- Criar políticas baseadas em auth
CREATE POLICY "Authenticated read" ON roadmap_features
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated insert" ON roadmap_features
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated update" ON roadmap_features
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated delete" ON roadmap_features
  FOR DELETE USING (auth.role() = 'authenticated');
-- (repetir pattern para todas as 5 tabelas)
```

**Testes:**
- Query anônima → permission denied
- Query autenticada → success
- Validar que dashboard continua funcional com auth

---

### 1.5 OAuth CSRF — State Validation Incompleta

**Problema:** `google-auth.ts:116-123` aceita default se state é missing/malformado. Redirect URI é user-provided sem whitelist.

**Arquivos a modificar:**
- `engine/src/routes/google-auth.ts` — state validation + redirect whitelist

**Implementação:**
```
1. Gerar state com: { service, nonce: crypto.randomUUID(), timestamp: Date.now() }
2. Armazenar state em DB temporário (TTL 10 min)
3. No callback, validar:
   - state existe no DB
   - timestamp < 10 min
   - nonce não foi usado antes (replay protection)
4. Whitelist de redirect_uri:
   - Mover para config: auth.allowed_redirect_uris[]
   - Rejeitar qualquer URI fora da whitelist
5. Remover fallback de service default
```

**Testes:**
- Callback sem state → 400
- Callback com state expirado (>10min) → 400
- Callback com state válido → success
- Callback com redirect_uri fora da whitelist → 400
- Replay do mesmo state → 400

---

## Fase 2 — HIGH Priority Fixes (Semanas 1-2)

### 2.1 Rate Limiting Global

**Problema:** Rate limiting existe apenas em webhooks (in-memory, 10/min). Demais endpoints sem proteção.

**Arquivos a criar:**
- `engine/src/middleware/rate-limit.ts` — rate limiter configurável por rota

**Arquivos a modificar:**
- `engine/src/index.ts` — registrar rate limiter global
- `engine/src/routes/integrations.ts` — rate limit específico para secrets
- `engine/engine.config.yaml` — configuração de rate limits

**Implementação:**
```
1. Rate limiter com sliding window em SQLite (persistente entre restarts):
   - Tabela: rate_limits(ip TEXT, endpoint TEXT, window_start INTEGER, count INTEGER)
   - Cleanup automático a cada 5 min
2. Tiers de rate limit:
   - /health: sem limite
   - /execute/*: 30/min (heavy operations)
   - /integrations/secrets/*: 10/min (sensitive)
   - /webhook/*: 10/min (existente, migrar para novo sistema)
   - default: 60/min
3. Headers de resposta: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
4. IP resolution: x-forwarded-for com validação de trusted proxies
```

**Testes:**
- Exceder limite → 429 com headers corretos
- Dentro do limite → 200 com headers
- Diferentes endpoints com limites diferentes
- Reset após window expirar

---

### 2.2 Input Validation Layer

**Problema:** Endpoints aceitam payloads sem validação de formato, tamanho ou tipo.

**Arquivos a criar:**
- `engine/src/middleware/validate.ts` — middleware de validação com schemas

**Arquivos a modificar:**
- `engine/src/routes/integrations.ts` — validar integration ID, config size, message length
- `engine/src/routes/execute.ts` — validar agent_id, squad_id, input format
- `engine/src/routes/stream.ts` — validar body antes de enqueue

**Implementação:**
```
1. Request size limit global: 5MB (via middleware)
2. Validação por endpoint:
   - PUT /integrations/:id → id: /^[a-z0-9_-]+$/, config: max 100KB, message: max 500 chars
   - POST /execute/agent → agent_id: required string, squad_id: required string
   - POST /stream/agent → mesmos + input.task: required, max 10KB
3. JSON.parse com try/catch em todos os pontos (integrations.ts:23, :49)
4. Retornar 400 com detalhes específicos do campo inválido
```

**Testes:**
- Payload > 5MB → 413
- Integration ID com chars especiais → 400
- Config > 100KB → 400
- JSON malformado no DB → fallback graceful (não crash)

---

### 2.3 Security Headers

**Problema:** Engine não envia security headers (CSP, HSTS, X-Content-Type-Options, etc.)

**Arquivos a modificar:**
- `engine/src/index.ts` — adicionar secureHeaders middleware do Hono

**Implementação:**
```
1. Usar hono/secure-headers:
   - X-Content-Type-Options: nosniff
   - X-Frame-Options: DENY
   - X-XSS-Protection: 0 (deprecated, mas harmless)
   - Strict-Transport-Security: max-age=31536000 (quando HTTPS)
   - Content-Security-Policy: default-src 'self'
2. Remover Server header (information disclosure)
```

---

### 2.4 Audit Log Persistente

**Problema:** Authority enforcer mantém audit log in-memory (max 1000 entries), perdido no restart.

**Arquivos a criar:**
- `engine/migrations/007_audit_log.sql`

**Arquivos a modificar:**
- `engine/src/core/authority-enforcer.ts` — persistir audit entries no DB

**Implementação:**
```sql
-- 007_audit_log.sql
CREATE TABLE IF NOT EXISTS audit_log (
  id          TEXT PRIMARY KEY,
  timestamp   TEXT NOT NULL DEFAULT (datetime('now')),
  agent_id    TEXT NOT NULL,
  squad_id    TEXT,
  operation   TEXT NOT NULL,
  allowed     INTEGER NOT NULL, -- 0 or 1
  reason      TEXT,
  ip_address  TEXT,
  metadata    TEXT -- JSON
);

CREATE INDEX idx_audit_timestamp ON audit_log(timestamp DESC);
CREATE INDEX idx_audit_agent ON audit_log(agent_id, timestamp DESC);
```

```
1. Dual-write: in-memory (para queries rápidas) + SQLite (persistência)
2. Cleanup: manter 90 dias no DB, 1000 mais recentes in-memory
3. Endpoint GET /audit/log com filtros (agent, date range, allowed/blocked)
```

**Testes:**
- Authority check → entry no DB
- Restart engine → audit log preservado
- Query por agent_id → resultados filtrados
- Cleanup de entries > 90 dias

---

### 2.5 Webhook Auth Obrigatório

**Problema:** `webhook_token` vazio = sem autenticação. `webhooks.ts:102` faz `if (!token) return next()`.

**Arquivos a modificar:**
- `engine/src/routes/webhooks.ts:100-111` — tornar token obrigatório
- `engine/engine.config.yaml` — documentar obrigatoriedade

**Implementação:**
```
1. Se webhook_token não configurado, rejeitar todas as requests (503)
2. Usar crypto.timingSafeEqual para comparação
3. Log de tentativas de auth falhadas
```

---

### 2.6 Missing Database Indexes

**Problema:** Queries frequentes sem índices — O(n) scans em tabelas que crescem.

**Arquivos a criar:**
- `engine/migrations/008_performance_indexes.sql`

**Implementação:**
```sql
-- Engine SQLite
CREATE INDEX IF NOT EXISTS idx_jobs_agent_status ON jobs(agent_id, status);
CREATE INDEX IF NOT EXISTS idx_jobs_squad_created ON jobs(squad_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memory_scope_stored ON memory_log(scope, stored_at DESC);
CREATE INDEX IF NOT EXISTS idx_executions_agent_created ON executions(agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cron_next_run ON cron_jobs(next_run_at) WHERE active = 1;
CREATE INDEX IF NOT EXISTS idx_workflow_status ON workflow_state(status, updated_at DESC);
```

---

### 2.7 Scrypt Salt Randomizado

**Problema:** `secrets.ts:16` usa salt fixo `'aios-salt'`. Todas as keys derivadas identicamente.

**Arquivos a modificar:**
- `engine/src/lib/secrets.ts` — salt por instalação

**Implementação:**
```
1. Na primeira execução, gerar salt aleatório (32 bytes)
2. Armazenar em data/engine.salt (gitignored)
3. Em boots subsequentes, ler do arquivo
4. Se salt muda, secrets existentes ficam ilegíveis → migration de re-encrypt
5. Adicionar data/engine.salt ao .gitignore
```

---

### 2.8 Bind Address Seguro

**Problema:** `host: 0.0.0.0` expõe engine a toda a rede por default.

**Arquivos a modificar:**
- `engine/engine.config.yaml` — default para `127.0.0.1`
- `engine/src/lib/config.ts` — default seguro

---

## Fase 3 — MEDIUM Priority (Semanas 2-4)

### 3.1 Supabase Anon Key no Git

**Arquivos a modificar:**
- `.env.development` — remover key hardcoded, usar placeholder
- `.gitignore` — adicionar `.env.development`, `.env.local`, `.env.*.local`
- `vite.config.ts:10-27` — filtrar apenas VITE_* vars, validar valores

### 3.2 Memory Route SQL Injection

**Problema:** `memory.ts:31-37` constrói WHERE com string interpolation para scopes.

**Arquivos a modificar:**
- `engine/src/routes/memory.ts` — full parameterized queries

### 3.3 XSS em Markdown Rendering

**Problema:** `rehype-raw` permite HTML arbitrário no markdown rendering.

**Arquivos a modificar:**
- `package.json` — adicionar `rehype-sanitize`
- Component que usa `react-markdown` — adicionar rehype-sanitize plugin

### 3.4 PWA Cache de API Responses

**Problema:** Service worker cacheia `/api/*` por 5 min, incluindo dados sensíveis.

**Arquivos a modificar:**
- `vite.config.ts:108-118` — excluir rotas sensíveis do cache (`/auth/*`, `/secrets/*`)

### 3.5 Financial Calculations com REAL

**Problema:** `programs.estimated_cost REAL` causa erros de floating-point.

**Arquivos a criar:**
- `engine/migrations/009_fix_cost_type.sql` — migrar para INTEGER (centavos)

### 3.6 Execution Log Retention

**Problema:** Tabela `executions` cresce sem limite.

**Arquivos a modificar:**
- `engine/src/core/cron-scheduler.ts` — adicionar cleanup job (90 dias)

### 3.7 Request ID Tracing

**Arquivos a criar:**
- `engine/src/middleware/request-id.ts` — gerar X-Request-Id por request

**Arquivos a modificar:**
- `engine/src/lib/logger.ts` — incluir request ID em todos os logs
- `engine/src/index.ts` — registrar middleware

### 3.8 CORS Environment-Aware

**Arquivos a modificar:**
- `engine/engine.config.yaml` — separar cors por env
- `engine/src/lib/config.ts` — carregar cors baseado em NODE_ENV

### 3.9 Marketplace Seed Hardcoded

**Arquivos a modificar:**
- `supabase/migrations/20260314_seed_marketplace_data.sql` — isolar seed accounts com domínio `@seed.local`

### 3.10 localStorage JSON Deserialization

**Arquivos a modificar:**
- `src/main.tsx:7-32` — adicionar validação de schema no parse do localStorage

---

## Fase 4 — LOW Priority (Backlog)

| # | Item | Arquivo |
|---|------|---------|
| 4.1 | WebSocket sobre TLS (WSS via reverse proxy) | Documentação de deploy |
| 4.2 | Secret rotation endpoints | `engine/src/routes/integrations.ts` |
| 4.3 | Distributed rate limiting (Redis) | Quando multi-instance |
| 4.4 | Foreign key restoration em memory_log | `engine/migrations/` |
| 4.5 | Marketplace FTS multi-idioma | Supabase migration |

---

## Arquivos Novos (Resumo)

| Arquivo | Fase | Propósito |
|---------|------|-----------|
| `engine/src/middleware/auth.ts` | 1 | Auth middleware global |
| `engine/src/middleware/rate-limit.ts` | 2 | Rate limiting persistente |
| `engine/src/middleware/validate.ts` | 2 | Input validation |
| `engine/src/middleware/request-id.ts` | 3 | Request tracing |
| `engine/migrations/007_audit_log.sql` | 2 | Audit log table |
| `engine/migrations/008_performance_indexes.sql` | 2 | Missing indexes |
| `engine/migrations/009_fix_cost_type.sql` | 3 | Float → Integer costs |
| `supabase/migrations/20260316_fix_rls_policies.sql` | 1 | Fix permissive RLS |

## Arquivos Modificados (Resumo)

| Arquivo | Fases | Mudanças |
|---------|-------|----------|
| `engine/src/index.ts` | 1,2,3 | Auth, rate limit, security headers, request-id middlewares |
| `engine/src/lib/secrets.ts` | 1,2 | Rejeitar default, salt aleatório |
| `engine/src/lib/config.ts` | 1,2,3 | Validação de startup, rate limit config, CORS por env |
| `engine/src/routes/integrations.ts` | 1,2 | Remover preview, input validation, rate limit |
| `engine/src/routes/google-auth.ts` | 1 | State validation, redirect whitelist |
| `engine/src/routes/webhooks.ts` | 2 | Auth obrigatório, timing-safe compare |
| `engine/src/routes/memory.ts` | 3 | Parameterized queries |
| `engine/src/core/authority-enforcer.ts` | 2 | Persist audit log |
| `engine/engine.config.yaml` | 1,2,3 | Auth config, rate limits, CORS, bind address |
| `vite.config.ts` | 3 | Filtro de env vars, cache exclusions |
| `src/main.tsx` | 3 | Safe localStorage deserialization |

---

## Estratégia de Testes

### Unit Tests (por fase)

| Fase | Arquivo de Teste | Cobertura |
|------|-----------------|-----------|
| 1 | `engine/src/middleware/__tests__/auth.test.ts` | Token validation, bypass routes, timing safety |
| 1 | `engine/src/lib/__tests__/secrets.test.ts` | Startup validation, encrypt/decrypt roundtrip |
| 2 | `engine/src/middleware/__tests__/rate-limit.test.ts` | Window sliding, persistence, headers |
| 2 | `engine/src/middleware/__tests__/validate.test.ts` | Size limits, format validation |
| 2 | `engine/src/core/__tests__/authority-enforcer.test.ts` | DB persistence, cleanup |

### Integration Tests

```
1. Auth flow end-to-end: request → middleware → route → response
2. Rate limit + auth combinados: auth válido mas rate limited → 429
3. OAuth flow completo: /url → redirect → /callback → token stored
4. Secret lifecycle: create → read (exists only) → delete → read (404)
5. RLS policies: anon query → denied, authenticated → success
```

### Security Tests (Checklist)

- [ ] Nenhuma rota retorna dados sem auth (exceto /health)
- [ ] Secret preview removido — apenas existence check
- [ ] ENGINE_SECRET default rejeitado no startup
- [ ] OAuth state não reutilizável (replay protection)
- [ ] Redirect URI fora da whitelist → 400
- [ ] Rate limit funcional em todos os tiers
- [ ] Payload > 5MB → 413
- [ ] SQL injection impossível (parameterized queries)
- [ ] XSS bloqueado (rehype-sanitize ativo)
- [ ] Supabase RLS bloqueia anon writes
- [ ] Security headers presentes em todas as responses

---

## Ordem de Execução

```
Semana 1 (Sprint 1):
  ├── 1.2 ENGINE_SECRET validation (quick win, blocks deploy)
  ├── 1.3 Secret preview removal (quick win)
  ├── 1.1 Auth middleware global (foundational)
  ├── 1.4 RLS policies fix (Supabase migration)
  ├── 1.5 OAuth CSRF fix
  ├── 2.3 Security headers (quick win)
  └── 2.5 Webhook auth obrigatório

Semana 2 (Sprint 2):
  ├── 2.1 Rate limiting global
  ├── 2.2 Input validation layer
  ├── 2.4 Audit log persistente
  ├── 2.6 Database indexes
  ├── 2.7 Scrypt salt
  └── 2.8 Bind address

Semanas 3-4 (Sprint 3):
  ├── 3.1-3.10 Medium priority items
  └── Security test suite completo

Backlog contínuo:
  └── 4.1-4.5 Low priority items
```

---

*Plano gerado por Dex (@dev) com base na auditoria de Aria (@architect) — 2026-03-11*
