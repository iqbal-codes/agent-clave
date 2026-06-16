# Build Plan

## Core principle

Build the governed agent runtime in dependency order: domain vocabulary and persistence first, then webhook ingress, then worker pipeline, then approval and executor behavior, then product UI, then realtime and operational polish. Every phase must preserve the invariant that LLM output never executes a tool directly.

The current product direction is **AgentClave**: a governed agent runtime for internal operations. The first working configuration is the Telegram Inventory Ops Agent. The runtime is generic over channels and integrations; the seed is specific.

## Phase 0 — Context and architecture foundation

### 00.1 Context backbone

**Deliverable:** Project overview, architecture, UI tokens/rules/registry, code standards, library docs, build plan, and progress tracker exist and match the repo.

**Status:** Complete.

### 00.2 Agent wiring repair

**Deliverable:** `AGENTS.md` reflects AgentClave rather than stale template/internal-tools language.

**Status:** Complete.

## Phase 1 — Domain model and vocabulary cutover (pre-pivot)

### 01.1 Shared vocabulary (pre-pivot)

**Deliverable:** `packages/types` and `packages/schemas` updated for the original RunGuard PRD; `github.add_label` and `github.post_comment` as action types, PRD run/action statuses, no compatibility aliases.

**Status:** Complete. Subsequently superseded by the AgentClave cutover (Phase 2.1).

### 01.2 Database schema completion (pre-pivot)

**Deliverable:** Drizzle enums/tables for `proposed_actions`, `policy_rules`, `github_webhook_deliveries`, `agent_run_steps`, `approvals`, `eval_samples`.

**Status:** Complete. The AgentClave pivot replaced `proposed_actions` → `tool_requests`, `policy_rules` → `policies`, `approvals` → `approval_sessions`, and added `connectors`, `webhook_endpoints`, `webhook_deliveries`, `tools`, `agent_tools`, `tool_executions`. The pre-pivot tables do not exist in the current `packages/db/src/schema/business.ts`.

### 01.3 Seed data alignment (pre-pivot)

**Deliverable:** RunGuard seed for the GitHub Issue Triage Agent and two policy rules.

**Status:** Complete. Superseded by the AgentClave seed in `packages/auth/src/seed.ts`.

## Phase 2 — AgentClave pivot: domain, infrastructure, services

### 02.1 Domain model and vocabulary cutover

**Deliverable:**

- `packages/db/src/schema/business.ts` rewritten for the AgentClave vocabulary: `connectors`, `webhook_endpoints`, `webhook_deliveries`, `tools`, `agent_tools`, `agents`, `agent_runs`, `agent_run_steps`, `tool_requests`, `tool_executions`, `policies`, `approval_sessions`, `audit_logs`. Enums: `run_status`, `tool_request_status`, `risk_level`, `policy_decision`, `agent_status`, `approval_session_status`, `tool_executor_type`. Migrations updated to match.
- `packages/types` and `packages/schemas` updated for the new vocabulary.
- GitHub-era `proposed_actions` / `policy_rules` / `github.*` types removed; no compatibility aliases.
- `apps/api/src/routers/{tools,connectors,tool-requests,policy,agents,runs,auditLogs}.ts` rewritten to operate on the new tables.

**Verification:** Project-wide `vp check-types` passes; all routers, runtime, and worker load against the new schema.

**Status:** Complete.

### 02.2 Redis and BullMQ infrastructure

**Deliverable:**

- Redis in `docker-compose.yml` (image `redis:7-alpine`, port 6379, healthcheck via `redis-cli ping`).
- Queue names: `agentclave-agent-run` and `agentclave-tool-execution` (constants in `packages/types`).
- Job payload schemas: `agentRunJobPayloadSchema` (`{ runId: string }`), `toolExecutionJobPayloadSchema` (`{ toolRequestId: string }`).
- `packages/api/src/core/queues.ts` provides `createRedisConnection()` (IORedis with `maxRetriesPerRequest: null`) and lazy queue producers.
- `apps/worker` package with two BullMQ workers.

**Verification:** Worker can connect to Redis locally and register processors.

**Status:** Complete.

### 02.3 Core service modules

**Deliverable:** Services under `packages/api/src/core`:

- `credentials.ts` — AES-256-GCM `encryptSecret` / `decryptSecret` keyed by `CREDENTIAL_ENCRYPTION_KEY`.
- `json-schema/validate.ts` — Ajv-based input/output schema validation.
- `policy/evaluate.ts` — policy engine that returns `allow` / `require_approval` / `deny` from a list of `PolicyRule`s.
- `executors/http.ts` — HTTP executor with `{{input.x}}` / `{{connector.config.x}}` / `{{credentials.x}}` template variable resolution, idempotency header, timeout, credential redaction in stored request metadata.
- `webhooks/ingest.ts` — custom webhook ingress with header-secret verification, dedup, Telegram approval-reply recognition, and run creation.
- `runtime/process-agent-run.ts` — runtime loop with OpenRouter tool calling, schema validation, policy evaluation, allow / require_approval / deny, and audit/trace writes.
- `jobs/process-agent-run.ts` and `jobs/process-tool-execution.ts` — worker entry points.

**Verification:** Unit tests cover pure services; the runtime loop produces a run trace and tool requests end-to-end in the worker.

**Status:** Complete.

### 02.4 Demo Inventory API

**Deliverable:** `apps/demo-inventory-api` Hono server exposing `/products/search`, `/stock/:sku`, and `/stock-adjustments` for the seed inventory tools.

**Verification:** `pnpm dev` in the package starts the server on port 4301; the seed tools resolve against it.

**Status:** Complete.

## Phase 3 — Web app surfaces (AgentClave)

### 03.1 Dashboard

**UI / Surface:**

- `apps/web/src/features/dashboard/dashboard.tsx` as a navigation hub.
- Real metrics (runs today, approval rate, cost today) deferred; cards are placeholders.

**Status:** Complete.

### 03.2 Agents and agent detail

**UI / Surface:**

- `apps/web/src/features/agents/agents.tsx` lists agents.
- `apps/web/src/features/agents/agent-detail.tsx` shows overview cards.
- Edit/create forms and bind/unbind tools deferred to Phase 9.

**Status:** Complete (read-only).

### 03.3 Tools and tool detail

**UI / Surface:**

- `apps/web/src/features/tools/tools.tsx` lists tools as a card grid (later migrated to `DataTable` in Phase 8).
- `apps/web/src/features/tools/tool-detail.tsx` shows the read-only summary (status, risk, executor, default policy, configuration, input/output schema, executor config).
- Edit/create forms deferred to Phase 9.

**Status:** Complete (read-only).

### 03.4 Runs and run detail

**UI / Surface:**

- `apps/web/src/features/runs/runs.tsx` lists runs as a card grid (later migrated to a `DataTable` in Phase 8).
- `apps/web/src/features/runs/run-detail.tsx` shows the read-only primary inspection screen: status, input, final response, step timeline, tool requests, **pending review requests** (placeholder, no Approve/Reject yet), **approval sessions** history, **audit log** snippet, and error block.

**Status:** Complete (read-only).

### 03.5 Settings — Organization and Connectors

**UI / Surface:**

- `apps/web/src/components/layout/settings-layout.tsx` introduces the settings shell with `Tabs` (Organization / Connectors).
- `apps/web/src/features/settings/organization.tsx` shows the workspace profile with a single edit form.
- `apps/web/src/features/settings/connectors.tsx` lists connectors (later migrated to `DataTable` in Phase 8).
- Connector detail page and webhook endpoint management deferred to Phase 9.

**Status:** Complete (organization edit form only; connectors are read-only).

## Phase 4 — Features-based architecture refactor

**Deliverable:**

- `apps/web/src/features/` directory with per-feature folders.
- `pages/` reduced to thin re-export shims.
- `auth-form-layout` moved from `components/auth/` to `features/auth/`.
- All imports updated; `vp fmt` applied; `check-types` passes.

**Verification:** Zero new lint/type errors in `apps/web/`.

**Status:** Complete.

## Phase 5 — Compact navigation, paginated lists, and approval-on-run-detail

**Deliverable:**

- `paginatedListSchema` helper and route-specific query schemas in `packages/schemas` (`runListQuerySchema`, `toolListQuerySchema`, `connectorListQuerySchema`).
- All list procedures return `{ items, total }` with `count()` queries.
- Server-side filtering on tools (`search`, `riskLevel`, `executorType`, `defaultPolicy`, `status`), connectors (`search`, `type`, `provider`, `status`), and runs (`status`).
- Sidebar compacted to five items: Dashboard, Agents, Tools, Runs, Settings.
- `SettingsLayout` with tabs for Organization and Connectors.
- Connectors moved to `/settings/connectors`.
- Standalone `/approvals` and `/audit` routes removed; their content lives on run detail.
- Run detail absorbs the approval history card, the pending review requests block, and the audit log snippet.
- `tools-columns.tsx` and `connectors-columns.tsx` introduced; Tools and Connectors pages migrated to `DataTable`.
- Runs page gains an "All runs" / "Pending review" toggle.

**Verification:** Project-wide `check-types` passes; all callers updated for the paginated response shape.

**Status:** Complete.

## Phase 6 — API and runtime gaps

**Deliverable (planned):**

- 06.1 Connector detail and webhook endpoint management (routers exist; UI deferred to Phase 9).
- 06.2 Approval session history is read-only on run detail; inline Approve / Reject deferred to Phase 9.
- 06.3 Agent / tool / connector create and edit routers exist; UI deferred to Phase 9.
- 06.4 `agents.testRun` and `realtime.subscribe` procedures (Phase 9).

**Status:** In progress (routers complete; UI is Phase 9).

## Phase 7 — Realtime pipeline and connection state

**Deliverable:**

- 07.1 Add `@orpc/experimental-publisher` to the workspace catalog.
- 07.2 `packages/api/src/core/realtime/publisher.ts` exposes a singleton `RedisPublisher<RunEvents, ApprovalEvents>` with two ioredis connections (commander + listener).
- 07.3 Publish `run.updated` at every status change in the runtime and worker; publish `approval.pending` whenever a tool request requires approval.
- 07.4 `packages/api/src/routers/realtime.ts` exposes a `realtime.subscribe` oRPC procedure that returns an `async function*` generator filtered by `context.activeOrganization.id`.
- 07.5 `apps/web/src/components/realtime/{use-realtime.ts,connection-badge.tsx}` exposes a `useRealtimeSubscription` hook and a header badge.
- 07.6 `RunsPage`, `ApprovalsPage` (on run detail), and `RunDetailPage` consume the subscription; `RunDetailPage` uses `setQueryData` to merge status in place; the others invalidate the matching query keys.

**Verification:** Manually drive a run with `agents.testRun` and watch the badge go green, the runs list update on status change, and the run detail page merge the new step without a refetch flicker.

**Status:** Phase 9 in the merged sequence below.

## Phase 8 — Web app mutation surfaces and Test run trigger

**Deliverable:**

- 08.1 Migration of all read pages to the typed `orpc` client (deferred from Phase 6).
- 08.2 Create flows for agents, tools, and connectors on dedicated routes (`/agents/new`, `/tools/new`, `/connectors/new`).
- 08.3 Edit sheets on `/agents/:id`, `/tools/:id`, `/connectors/:id` for the same records.
- 08.4 Connector detail at `/settings/connectors/:id` with a webhook endpoints list, "New endpoint" sheet, "Rotate secret" and "Delete" alert dialogs.
- 08.5 "Test run" card on the agent detail page calling `agents.testRun` and navigating to the new run detail.
- 08.6 "Tools" tab on the agent detail page (bind/unbind) backed by `agents.listTools`, `tools.bindToAgent`, and `tools.unbindFromAgent`.
- 08.7 "Policies" tab on the agent detail page (read-only, joined from `policy.list`).
- 08.8 Inline Approve / Reject on the run detail page's **pending review requests** card calling `toolRequests.reviewApproval`.

**Verification:** End-to-end: sign in → open Inventory Ops Agent → Test run with a message → run goes to `waiting_for_approval` → Approve inline → run completes → audit log grows.

**Status:** Phase 9 in the merged sequence below.

## Phase 9 — MVP UI surface completion + realtime (this round)

This phase bundles Phases 7 and 8 above and the deferred work from Phase 6 into a single delivery. It is the gap-closing round described in `context/progress-tracker.md`.

**Deliverable (full list):**

- Add `@orpc/experimental-publisher` to the catalog and wire a singleton `RedisPublisher` in `packages/api/src/core/realtime/publisher.ts`.
- Add `realtime.subscribe` oRPC procedure in `packages/api/src/routers/realtime.ts` filtered by `organizationId`.
- Publish `run.updated` and `approval.pending` from the runtime loop, the worker, the `reviewApproval` handler, and the `agents.testRun` handler.
- Add `agents.testRun({ agentId, message })` in `packages/api/src/routers/agents.ts`.
- Migrate read pages (`agents`, `tools`, `connectors`, `agent-detail`, `tool-detail`, `runs`, `run-detail`, `audit`) to the typed `orpc` client.
- Add `/agents/new`, `/tools/new`, `/connectors/new` routes with `useAppForm` + shared Zod schemas.
- Add edit sheets on `/agents/:id`, `/tools/:id`, `/connectors/:id`.
- Add `/settings/connectors/:id` with the webhook endpoints list, "New endpoint" sheet, "Rotate secret" and "Delete" alert dialogs.
- Add the "Test run" card on `/agents/:id`.
- Add the "Tools" tab (bind/unbind) and the "Policies" tab (read-only) on `/agents/:id`.
- Add inline Approve / Reject on the run detail page's pending review requests card.
- Add a `useRealtimeSubscription` hook in `apps/web/src/components/realtime/` and a connection-state badge in the sticky header.
- Subscribe on `RunsPage`, the run detail's pending review block, and `RunDetailPage`.
- Make the seed guard on `TELEGRAM_BOT_TOKEN`: when the env var is empty, the Telegram connector, the `telegram.send_message` tool, and the inbound webhook endpoint are not inserted.

**Verification:**

- Project-wide `vp check-types` passes.
- End-to-end: sign in → agent detail → Test run → live status changes visible in the runs list and the run detail page → inline Approve on the run detail page → run completes → audit log grows.
- The `Live` badge in the header reads `Live` while subscribed and `Reconnecting`/`Offline` when the SSE is closed.

**Status:** This round.

## Feature count

| Phase                                                                 | Feature groups |
| --------------------------------------------------------------------- | -------------: |
| Phase 0 — Context and architecture foundation                         |              2 |
| Phase 1 — Domain model and vocabulary cutover (pre-pivot)             |              3 |
| Phase 2 — AgentClave pivot: domain, infrastructure, services          |              4 |
| Phase 3 — Web app surfaces (AgentClave)                               |              5 |
| Phase 4 — Features-based architecture refactor                        |              1 |
| Phase 5 — Compact navigation, paginated lists, approval on run detail |              3 |
| Phase 9 — MVP UI surface completion + realtime (this round)           |              6 |
