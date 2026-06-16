# Memory — AgentClave Pivot Complete

Last updated: 2026-06-15 23:30

## What was built

Full pivot from RunGuard (GitHub issue triage) to AgentClave (governed agent runtime for internal operations).

**New core runtime:**

- `packages/api/src/core/runtime/process-agent-run.ts` — Agent loop with OpenRouter tool calling, max 8 iterations
- `packages/api/src/core/executors/http.ts` — HTTP executor with nested template resolution (`{{connector.config.baseUrl}}`, `{{credentials.apiKey}}`, `{{input.query}}`)
- `packages/api/src/core/executors/index.ts` — Executor dispatcher by `executorType`
- `packages/api/src/core/webhooks/ingest.ts` — Generic webhook ingress with Telegram approval reply parsing
- `packages/api/src/core/webhooks/verify.ts` — Webhook verification (none, header_secret, hmac_sha256)
- `packages/api/src/core/json-schema/validate.ts` — Ajv-based JSON Schema validation for tool payloads
- `packages/api/src/core/credentials.ts` — AES-256-GCM credential encryption (re-exports from `@agentclave/env/credentials`)
- `packages/env/src/credentials.ts` — Shared encryption/decryption functions

**New database schema** (`packages/db/src/schema/business.ts`):

- `connectors`, `webhook_endpoints`, `webhook_deliveries`, `tools`, `agent_tools`, `tool_requests`, `tool_executions`, `policies`, `approval_sessions`
- Removed: `githubInstallations`, `repositories`, `proposedActions`, `evalSamples`, `policyRules`

**New API routers:**

- `packages/api/src/routers/connectors.ts` — CRUD + webhook endpoints + deliveries
- `packages/api/src/routers/tools.ts` — CRUD + bindToAgent/unbindFromAgent
- `packages/api/src/routers/tool-requests.ts` — listByRunId, listPendingApproval, reviewApproval
- Updated: `agents.ts`, `policy.ts`, `runs.ts`, `organization.ts`

**New apps:**

- `apps/demo-inventory-api/` — Hono app with product search, stock lookup, idempotent stock adjustments (port 4301)

**Seed data** (`packages/auth/src/seed.ts`):

- Inventory Ops Agent with `xiaomi/mimo-v2.5` model
- 4 tools: `inventory.search_product`, `inventory.get_stock`, `inventory.create_stock_adjustment`, `telegram.send_message`
- 4 policies matching the tools
- Telegram Bot connector, Demo Inventory API connector
- Telegram webhook endpoint (token: `8cd410acb07c4370b99bc93facd9c944`)

**Frontend pages:**

- New: Tools, Connectors pages
- Updated: Dashboard, Agents, Runs, Approvals, Audit, Run Detail, Agent Detail

## Decisions made

- **Package scope renamed from `@runguard/*` to `@agentclave/*`** across all packages and apps
- **Root package name**: `agentclave` (was `runguard`)
- **apps/api** keeps name `@agentclave/api-server` (distinct from `packages/api` which is `@agentclave/api`)
- **Default model**: `xiaomi/mimo-v2.5` (was `gpt-4o`)
- **Template resolver** flattens nested objects for `{{connector.config.baseUrl}}` style resolution
- **OpenRouter request** sends only `model`, `messages`, `tools`, `tool_choice` — no `parallel_tool_calls` or `provider: { require_parameters: true }` (causes 404 with some models)
- **Credential encryption** lives in `@agentclave/env/credentials` (shared between auth seed and API runtime)
- **`@runguard/*` package scope** fully replaced with `@agentclave/*` — zero remaining references

## Problems solved

1. **OpenRouter 404 "No endpoints found"** — Caused by `parallel_tool_calls: false` + `provider: { require_parameters: true }`. Fixed by removing both params from the request body.
2. **Template placeholder `{{connector.config.baseUrl}}` unresolved** — The template resolver only did flat key matching. Fixed by flattening nested objects into dot-path keys before replacement.
3. **Package name collision** — `apps/api` and `packages/api` both became `@agentclave/api`. Fixed by restoring `apps/api` to `@agentclave/api-server`.
4. **Credentials circular dependency** — Auth seed needed `@agentclave/api/core/credentials` but auth doesn't depend on api. Fixed by moving encryption to `@agentclave/env/credentials`.

## Current state

**Working:**

- Type checks pass (13/13 packages)
- Tests pass (45/45)
- Build succeeds
- Demo inventory API responds correctly
- Webhook endpoint accepts Telegram-shaped payloads
- Agent run creates and attempts OpenRouter call

**Needs verification (after server restart):**

- End-to-end agent run with tool calling
- Approval flow for `inventory.create_stock_adjustment`
- Telegram notification after approval

**Known issues:**

- Dev server must be restarted after code changes (no hot reload for worker)
- Auth seed test requires live database (skipped in CI)

## Next session starts with

1. Restart dev server: `pkill -f "tsx src/index.ts" && pnpm dev`
2. Send test webhook:

```bash
curl -X POST http://localhost:4000/api/webhooks/custom/8cd410acb07c4370b99bc93facd9c944 \
  -H "Content-Type: application/json" \
  -H "X-Telegram-Bot-Api-Secret-Token: dev-telegram-secret" \
  -d '{"update_id": 5, "message": {"text": "Cek stok Bakso Solo", "chat": {"id": 123}, "from": {"id": 456, "username": "staff"}}}'
```

3. Check `/runs` page for the run with tool calls
4. If approval flow triggers, test approve/reject via webhook reply

## Open questions

- Does `xiaomi/mimo-v2.5` reliably make tool calls with the seeded tool schemas?
- Should we add WebSocket/SSE for live dashboard updates?
- The `prd.md` and `pivot-document.md` still reference old RunGuard GitHub-specific content — historical docs, may want to archive or update
