# Architecture

## Current stack

| Layer             | Tooling                                    | Purpose                                                                                                       |
| ----------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Package manager   | pnpm workspace                             | Owns `apps/*` and `packages/*` workspaces.                                                                    |
| Task runner       | vite-plus (`vp`)                           | Build, typecheck, format/lint, and workspace dev orchestration.                                               |
| Frontend          | Vite + React 19 + React Router 7           | Dashboard app in `apps/web`.                                                                                  |
| API server        | Hono + oRPC                                | HTTP server in `apps/api`; type-safe API routers in `packages/api`.                                           |
| Auth              | Better Auth + Organization plugin          | Email/password auth, OAuth providers, organizations, members, roles.                                          |
| Database          | PostgreSQL + Drizzle ORM                   | Domain and auth persistence in `packages/db`.                                                                 |
| UI package        | `@agentclave/ui`                           | Shared shadcn/Base UI-derived primitives, styles, forms, tables.                                              |
| Background jobs   | BullMQ + Redis                             | Target queue system for agent runs (`agentclave-agent-run`) and tool execution (`agentclave-tool-execution`). |
| AI provider       | OpenRouter Chat Completions                | Target provider for structured agent output using JSON schema responses.                                      |
| Realtime          | oRPC `EventPublisher` + `IORedisPublisher` | Redis pub/sub fanout consumed by `@orpc/tanstack-query` `useSubscription` in the web app.                     |
| Demo integrations | Telegram Bot API + Demo Inventory API      | First working connector pair; runtime is generic over both.                                                   |

## Repository structure

```text
/
├── apps/
│   ├── api/                 # Hono server: auth routes, oRPC handlers, webhook ingress
│   ├── web/                 # Vite React dashboard
│   ├── worker/              # BullMQ worker process: agent-run and tool-execution queues
│   └── demo-inventory-api/  # Demo external HTTP API used by the seed inventory tools
├── packages/
│   ├── api/                 # oRPC routers and backend domain services
│   ├── api-client/          # Client factory for oRPC/React Query integration
│   ├── auth/                # Better Auth configuration, permissions, workspace seeding
│   ├── config/              # Shared TypeScript/vite-plus config
│   ├── db/                  # Drizzle schema, migrations, db instance
│   ├── email/               # Email client/templates (present, unused by MVP)
│   ├── env/                 # Server and web env validation
│   ├── schemas/             # Shared Zod input/output schemas
│   ├── types/               # Shared literal unions and permission mappings
│   └── ui/                  # Shared UI primitives, table/form systems, global CSS
├── context/                 # Project operating context for agent sessions
├── scripts/                 # Dev/db setup helpers
└── docker-compose.yml       # Local Postgres, MinIO, and Redis (Postgres + Redis required by MVP)
```

## System boundaries

| Boundary                   | Owns                                                                                                                 | Must not own                                                                |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `apps/api`                 | HTTP process wiring, Hono middleware, Better Auth handler, custom webhook route mounting, oRPC handler mounting.     | Domain business logic that should be reusable by worker/tests.              |
| `apps/web`                 | React routes, dashboard layout, user-facing product surfaces, client data fetching, realtime subscriptions.          | Direct database access, connector credentials, LLM calls, policy decisions. |
| `apps/worker`              | BullMQ worker startup and job registration.                                                                          | HTTP request handling or UI logic.                                          |
| `packages/api/src/routers` | Authenticated oRPC procedures and API contracts.                                                                     | Long-running work or direct external mutations without domain services.     |
| `packages/api/src/core`    | Shared backend services: realtime publisher, audit, credentials, executors, runtime loop, policy, json-schema, jobs. | UI-specific formatting.                                                     |
| `packages/db`              | Drizzle tables, enums, migrations, and DB exports.                                                                   | Business workflows beyond persistence shape.                                |
| `packages/auth`            | Better Auth setup, organization plugin, role/permission wiring, initial workspace seed data.                         | Product workflow execution.                                                 |
| `packages/schemas`         | Zod schemas for API input/output and validation.                                                                     | Database access or side effects.                                            |
| `packages/types`           | Shared literal values, permission keys, and type unions.                                                             | Runtime validation that belongs in `packages/schemas`.                      |
| `packages/ui`              | Shared components and styling primitives.                                                                            | Product-specific data fetching or domain logic.                             |

## Current implemented state

- `apps/api/src/index.ts` starts a Hono server on port 4000, mounts Better Auth at `/api/auth/*`, oRPC RPC at `/rpc/*`, OpenAPI handler at `/api/*`, the custom webhook ingress at `/api/webhooks/custom/:publicToken`, and a health root route.
- `packages/api/src/index.ts` defines public, protected, and organization-scoped procedures. The `organizationProcedure` resolves `activeOrganization`, `activeMember`, and `permissions` from Better Auth.
- `packages/api/src/context.ts` resolves Better Auth session, active organization, active member, and permissions from request headers.
- Routers in `packages/api/src/routers/`: `agents` (list, getById, create, update, delete, pause, activate, listTools, testRun), `tools` (list, getById, create, update, delete, bindToAgent, unbindFromAgent), `connectors` (list, getById, create, update, delete, listEndpoints, createEndpoint, rotateSecret, deleteEndpoint, listDeliveries), `runs` (list, getById, listByAgentId, listPending, cancel), `toolRequests` (listByRunId, listPending, getApprovalSession, reviewApproval), `policy` (list, getById, create, update, delete), `auditLogs` (list), `organization` (getContext, updateProfile), `realtime` (subscribe).
- `packages/db/src/schema/business.ts` has connectors, webhook_endpoints, webhook_deliveries, tools, agent_tools, agents, agent_runs, agent_run_steps, tool_requests, tool_executions, policies, approval_sessions, and audit_logs. Migrations live in `packages/db/src/migrations/`.
- `packages/auth/src/seed.ts` seeds an Inventory Ops Agent, a Telegram connector (conditional on `TELEGRAM_BOT_TOKEN`), a Demo Inventory connector, a webhook endpoint (conditional on `TELEGRAM_BOT_TOKEN`), four tools (`inventory.search_product`, `inventory.get_stock`, `inventory.create_stock_adjustment`, `telegram.send_message` — the last is conditional), and four policies.
- `apps/web/src/App.tsx` has routes for auth, dashboard, agents, agent detail, tools, tool detail, runs, run detail, and settings (organization, connectors). Standalone `/approvals` and `/audit` routes were removed; their content lives on run detail.
- `packages/api/src/core/webhooks/ingest.ts` is the custom webhook ingress: verifies header-secret against the encrypted webhook secret, deduplicates by `telegram:<update_id>` or `x-agentclave-delivery-id` or body SHA-256, recognizes Telegram approval-reply patterns, creates an agent run, and enqueues the agent-run job.
- `packages/api/src/core/runtime/process-agent-run.ts` is the runtime loop. Up to 8 model iterations; per iteration it calls OpenRouter with the agent's system prompt and the parsed message, validates tool call payloads against the tool's input schema, evaluates the policy, executes (allow), pauses for approval (require_approval), or blocks (deny), and writes trace + audit rows.
- `packages/api/src/core/executors/http.ts` is the HTTP executor. It resolves `{{input.x}}` / `{{connector.config.x}}` / `{{credentials.x}}` templates, decrypts connector credentials on the way in, redacts secrets in stored request metadata, supports an idempotency header (defaults to `Idempotency-Key` keyed by the tool request id), and writes a `tool_executions` row plus updates the `tool_request` status on success or failure.
- `packages/api/src/core/credentials.ts` provides AES-256-GCM `encryptSecret` / `decryptSecret` helpers keyed by `CREDENTIAL_ENCRYPTION_KEY`.
- `packages/api/src/core/policy/evaluate.ts` evaluates a tool request against workspace policies. Rules can match on `toolId`, `toolName`, `agentId`, or `riskLevelMin`. Decisions are `allow`, `require_approval`, or `deny`. Unknown tools and unmatched rules return `deny`.
- `packages/api/src/core/json-schema/validate.ts` validates a JSON payload against a JSON schema using Ajv.
- `packages/api/src/core/realtime/publisher.ts` exposes a singleton `RedisPublisher` for two event types: `run.updated` (runId, organizationId, status) and `approval.pending` (approvalId, organizationId, runId, toolName).
- `packages/api/src/routers/realtime.ts` exposes a single `realtime.subscribe` oRPC procedure that returns an `async function*` generator subscribed to the publisher, filtered by `context.activeOrganization.id` and `context.session.user.id`.
- `apps/worker/src/index.ts` starts BullMQ workers for `agentclave-agent-run` and `agentclave-tool-execution` queues. Job payloads carry IDs; workers load current state from Postgres.
- `apps/demo-inventory-api/src/index.ts` is a minimal Hono server exposing `/products/search`, `/stock/:sku`, and `/stock-adjustments` for the seed tools.

## Target MVP data flow

### Inbound webhook (Telegram or custom)

1. A webhook hits `POST /api/webhooks/custom/:publicToken`.
2. Hono reads the raw body and looks up the `webhook_endpoints` row by `publicToken`.
3. The header secret is verified against the stored (encrypted) value. Telegram secret headers (`X-Telegram-Bot-Api-Secret-Token`) are recognized.
4. The payload is dedup-hashed: `telegram:<update_id>` for Telegram, `<header-name>:<header-value>` for explicit `x-agentclave-delivery-id`, body SHA-256 fallback otherwise. Duplicate delivery IDs short-circuit with a 200.
5. If the body contains a Telegram approval pattern (`APPROVE <code>` / `REJECT <code>`), the matching approval session is updated, the run is resumed or cancelled, an audit row is written, and a 200 is returned.
6. Otherwise, an `agent_runs` row is created, the initial step is written, and the `agentclave-agent-run` job is enqueued. The webhook returns 202 without waiting for LLM completion.

### Agent run loop

1. `apps/worker` consumes an agent-run job from Redis through BullMQ.
2. The worker loads the run, agent settings, organization settings, the agent's bound tools, the workspace's policies, and the connector credentials referenced by those tools.
3. The worker calls OpenRouter Chat Completions with the agent's system prompt, the parsed message, and the tools (as OpenRouter tool descriptors). The response is parsed and tool calls are extracted.
4. Each tool call is validated against the tool's input schema (Ajv). Invalid payloads mark the run failed and the iteration ends.
5. Each valid tool request goes through the policy engine. `allow` → enqueue execution; `require_approval` → create approval session, send Telegram notification to the manager, pause; `deny` → block.
6. The iteration ends when the model returns no tool calls (run completes), a tool fails validation, an approval is pending, or the iteration cap is hit.
7. Step rows and audit rows are written at every state change. `publisher.publish('run.updated', { ... })` is called on every status change.

### Approval and execution

1. Reviewer opens run detail; the **Pending review requests** card shows tool requests in `pending_approval` status with their payloads and matched policies.
2. The reviewer clicks Approve or Reject. The web app calls `toolRequests.reviewApproval({ approvalId, decision, note })`.
3. The API updates the approval session and the matching `tool_request`. On approve, the `agentclave-tool-execution` job is enqueued.
4. The worker loads the tool, decrypts the connector's credentials, resolves the executor config templates, performs the HTTP call, stores a `tool_executions` row (with redacted request metadata), and updates the `tool_request` status.
5. If the run was paused waiting for approval, the worker resumes the agent run from where it left off, passing the tool's result back to OpenRouter.
6. `publisher.publish('run.updated', { ... })` is called at every step so subscribed clients update live.

### Realtime pipeline

1. The runtime, the worker, and the approval handlers publish events to a singleton `RedisPublisher` (`packages/api/src/core/realtime/publisher.ts`).
2. The `realtime.subscribe` oRPC procedure returns an `async function*` generator that subscribes to the publisher and filters events by `organizationId` from the caller's session.
3. The web app's `useSubscription` hook (from `@orpc/tanstack-query`) opens an SSE/event-iterator connection. The hook's `onData` callback calls `queryClient.invalidateQueries` on the matching keys (or `setQueryData` for the run detail page).
4. The connection-state badge in the sticky header subscribes to the same hook's lifecycle and renders `Live` / `Reconnecting` / `Offline`.

## External systems

- PostgreSQL — source of truth for auth, organizations, connectors, webhook endpoints, deliveries, tools, agents, runs, steps, tool requests, executions, policies, approvals, and audit logs.
- Redis — BullMQ queue backend and the realtime pub/sub channel.
- OpenRouter — OpenAI-compatible chat completions endpoint with strict JSON schema structured output.
- Telegram — first working inbound channel and approval channel.
- Demo Inventory API — first working outbound integration; runtime is generic over it.
- MinIO/S3-compatible storage — present in local infra and env, but not required by the MVP.

## Storage model

Current tables:

- Auth: `user`, `session`, `account`, `verification`, `organization`, `member`, `invitation`.
- Business: `connectors`, `webhook_endpoints`, `webhook_deliveries`, `tools`, `agent_tools`, `agents`, `agent_runs`, `agent_run_steps`, `tool_requests`, `tool_executions`, `policies`, `approval_sessions`, `audit_logs`.

Enums:

- `run_status`: `queued`, `running`, `waiting_for_approval`, `completed`, `failed`, `rejected`, `cancelled`, `expired`.
- `tool_request_status`: `pending_policy`, `pending_approval`, `approved`, `rejected`, `executing`, `executed`, `failed`, `denied_by_policy`, `cancelled`.
- `tool_executor_type`: `http` (only one implemented).
- `risk_level`: `low`, `medium`, `high`, `critical`.
- `policy_decision`: `allow`, `require_approval`, `deny`.
- `agent_status`: `active`, `paused`.
- `approval_session_status`: `pending`, `approved`, `rejected`, `expired`, `cancelled`.
- `connector_type` / `webhook_verification_type`: free text in MVP, with `telegram` and `http` recognized for the seed; the runtime accepts any string and rejects mismatched usage at the tool layer.
- `audit_actor_type`: `system`, `user`, `executor`, `runtime`.

## Authentication and authorization

- Better Auth handles sessions and organization membership.
- `createContext` resolves session, active organization, active member, and permissions for oRPC procedures.
- Organization procedures require an active organization.
- Permission checks must gate connector configuration, tool configuration, agent configuration, policy configuration, approval review, audit view, and org settings.
- Viewer users can inspect runs, traces, audit logs, and connectors but cannot approve actions or change settings.
- Admin users can configure connectors, tools, agents, and policies, and can approve or reject pending reviews.

## Operational invariants

- LLM output never calls a tool directly. Tool calls go through schema validation, policy evaluation, and (when required) human approval before the executor runs them.
- Every external mutation is represented first as a tool request.
- Unknown tools and unmatched policy rules are denied by default.
- Public-mutating tools require human approval in the MVP.
- Duplicate webhook deliveries must not create duplicate runs.
- Webhook requests must return after verification, persistence, and queueing; they must not wait for LLM or tool execution completion.
- Every meaningful state transition writes a trace step or audit log.
- Reviewer approval does not execute the tool inline; execution is a background job.
- Connector credentials are encrypted at rest with AES-256-GCM. The LLM never sees them; the executor is the only place they are loaded.
- Realtime subscriptions are scoped to the caller's `organizationId` server-side; the client cannot subscribe to another org's events.
- Use the existing `@agentclave/*` package boundaries before adding new packages or abstractions.
