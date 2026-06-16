# Architecture

## Current stack

| Layer              | Tooling                           | Purpose                                                                             |
| ------------------ | --------------------------------- | ----------------------------------------------------------------------------------- |
| Package manager    | pnpm workspace                    | Owns `apps/*` and `packages/*` workspaces.                                          |
| Task runner        | vite-plus (`vp`)                  | Build, typecheck, format/lint, and workspace dev orchestration.                     |
| Frontend           | Vite + React 19 + React Router    | Dashboard app in `apps/web`.                                                        |
| API server         | Hono + oRPC                       | HTTP server in `apps/api`; type-safe API routers in `packages/api`.                 |
| Auth               | Better Auth + Organization plugin | Email/password auth, OAuth providers, organizations, members, roles.                |
| Database           | PostgreSQL + Drizzle ORM          | Domain and auth persistence in `packages/db`.                                       |
| UI package         | `@agentclave/ui`                  | Shared shadcn/Base UI-derived primitives, styles, forms, tables.                    |
| Background jobs    | BullMQ + Redis                    | Target queue system for webhook-triggered agent execution and GitHub executor jobs. |
| AI provider        | OpenRouter Chat Completions       | Target provider for structured triage output using JSON schema responses.           |
| GitHub integration | GitHub App + webhooks + REST API  | Target integration for issue events and approved label/comment execution.           |

## Repository structure

```text
/
├── apps/
│   ├── api/                 # Hono server: auth routes, oRPC/OpenAPI handlers, webhook ingress
│   ├── web/                 # Vite React dashboard
│   └── worker/              # BullMQ worker process: triage and GitHub executor queues
├── packages/
│   ├── api/                 # oRPC routers and backend domain services
│   ├── api-client/          # Client factory for oRPC/React Query integration
│   ├── auth/                # Better Auth configuration, permissions, workspace seeding
│   ├── config/              # Shared TypeScript/vite-plus config
│   ├── db/                  # Drizzle schema, migrations, db instance
│   ├── email/               # Email client/templates
│   ├── env/                 # Server and web env validation
│   ├── schemas/             # Shared Zod input/output schemas
│   ├── types/               # Shared literal unions and permission mappings
│   └── ui/                  # Shared UI primitives, table/form systems, global CSS
├── context/                 # Project operating context for agent sessions
├── scripts/                 # Dev/db setup helpers
└── docker-compose.yml       # Local Postgres, MinIO, and Redis for BullMQ
```

## System boundaries

| Boundary                   | Owns                                                                                                              | Must not own                                                            |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `apps/api`                 | HTTP process wiring, Hono middleware, Better Auth handler, webhook route mounting, oRPC/OpenAPI handler mounting. | Domain business logic that should be reusable by worker/tests.          |
| `apps/web`                 | React routes, dashboard layout, user-facing product surfaces, client data fetching.                               | Direct database access, GitHub secrets, LLM calls, policy decisions.    |
| `apps/worker`              | BullMQ worker startup and job registration.                                                                       | HTTP request handling or UI logic.                                      |
| `packages/api/src/routers` | Authenticated oRPC procedures and API contracts.                                                                  | Long-running work or direct external mutations without domain services. |
| `packages/api/src/core`    | Shared backend services: auditing, permissions, errors, RLS helpers, and new agent/GitHub/policy/job services.    | UI-specific formatting.                                                 |
| `packages/db`              | Drizzle tables, enums, migrations, and DB exports.                                                                | Business workflows beyond persistence shape.                            |
| `packages/auth`            | Better Auth setup, organization plugin, role/permission wiring, initial workspace seed data.                      | Product workflow execution.                                             |
| `packages/schemas`         | Zod schemas for API input/output and validation.                                                                  | Database access or side effects.                                        |
| `packages/types`           | Shared literal values, permission keys, and type unions.                                                          | Runtime validation that belongs in `packages/schemas`.                  |
| `packages/ui`              | Shared components and styling primitives.                                                                         | Product-specific data fetching or domain logic.                         |

## Current implemented state

- `apps/api/src/index.ts` starts a Hono server on port 4000, mounts Better Auth at `/api/auth/*`, oRPC RPC at `/rpc/*`, OpenAPI handler at `/api/*`, and a health root route.
- `packages/api/src/index.ts` defines public, protected, and organization-scoped procedures.
- `packages/api/src/context.ts` resolves Better Auth session, active organization, active member, and permissions from request headers.
- Existing routers cover organizations, agents, runs, actions, policy, and GitHub installations/repositories, but they are CRUD/read scaffolding rather than the full webhook/worker pipeline.
- `packages/db/src/schema/business.ts` has organization settings, GitHub installations, repositories, agents, agent runs, proposed actions, policy rules, audit logs, and the four Phase 1 tables: `github_webhook_deliveries`, `agent_run_steps`, `approvals`, `eval_samples`.
- `packages/auth/src/seed.ts` seeds a default GitHub Issue Triage Agent with `P1`/`P2`/`P3` labels and two policy rules (`github.add_label` and `github.post_comment` with `require_approval`).
- `apps/web/src/App.tsx` has routes for auth, dashboard, agents, agent detail, runs, run detail, approvals, audit, and organization settings.
- `packages/ui` includes shared TanStack Form components under `packages/ui/src/components/forms`, a TanStack Table/nuqs data table system under `packages/ui/src/components/table`, and docs in `packages/ui/docs/forms.md` and `packages/ui/docs/table.md`; product forms and tables should reuse these systems.
- Product pages beyond dashboard are placeholders and must be replaced in place.
- Phase 1 vocabulary cutover is complete: all enums, schemas, routers, and seed data use PRD names.
- `packages/schemas/src/index.ts` exports `actionTypeSchema`, `actionStatusSchema`, `rejectionReasonSchema`, `reviewActionSchema` (discriminated union), `batchReviewSchema`, and `agentOutputSchema` with `reasoningSummary`.
- `packages/api/src/routers/actions.ts` implements `listByRunId`, `listPending` (filters `pending_approval`), and `batchReview` (inserts `approvals` records).
- `packages/api/src/core/audit.ts` uses actor/target model with jsonb metadata.
- `apps/worker/src/index.ts` starts BullMQ workers for `runguard-triage` and `runguard-github-executor` queues with concurrency 1.
- `packages/api/src/core/queues.ts` provides shared Redis connection, queue producers, and `enqueueTriageJob`/`enqueueGithubExecutorJob` helpers.
- `packages/api/src/core/github/signature.ts` provides HMAC SHA-256 webhook signature verification.
- `packages/api/src/core/github/app.ts` provides `getInstallationOctokit` using the official octokit `App` client.
- `packages/api/src/core/github/normalize-issue.ts` normalizes GitHub issue payloads into `NormalizedGitHubIssueEvent`.
- `packages/api/src/core/triage/openrouter.ts` calls OpenRouter Chat Completions with strict JSON schema output.
- `packages/api/src/core/triage/validate-output.ts` validates triage output against Zod schema and allowed labels.
- `packages/api/src/core/triage/build-actions.ts` converts validated output into `github.add_label` and `github.post_comment` proposed actions.
- `packages/api/src/core/policy/evaluate.ts` evaluates proposed actions against policy rules with priority and specificity ordering.
- `packages/schemas/src/index.ts` exports `actionTypeSchema`, `actionStatusSchema`, `rejectionReasonSchema`, `reviewActionSchema` (discriminated union), `batchReviewSchema`, `agentOutputSchema` with `reasoningSummary`, `triageJobPayloadSchema`, and `githubExecutorJobPayloadSchema`.
- `packages/api/src/core/traces.ts` provides `writeRunStep` helper with auto-incrementing step index.
- `packages/api/src/core/evals.ts` provides `writeEvalSample` helper.
- `packages/api/src/core/jobs/process-triage.ts` and `process-github-executor.ts` are orchestration seams that load and validate records.

## Target MVP data flow

### GitHub issue webhook

1. GitHub sends `issues.opened` or `issues.edited` to `POST /api/webhooks/github`.
2. Hono reads the raw body and verifies `x-hub-signature-256` using `GITHUB_WEBHOOK_SECRET`.
3. API rejects unsupported events and invalid signatures before persistence.
4. API persists the GitHub delivery ID and normalized event idempotently.
5. API creates or reuses the agent run for that delivery.
6. API records trace steps for webhook receipt, verification, input normalization, and run creation.
7. API enqueues a BullMQ triage job and returns success without waiting for LLM completion.

### Triage worker

1. `apps/worker` consumes triage jobs from Redis through BullMQ.
2. Worker loads the run, agent settings, organization settings, policy rules, repository metadata, and normalized issue input.
3. Worker records `llm_call_started` and calls OpenRouter Chat Completions with strict JSON schema response format.
4. Worker validates the parsed output with Zod and product safety rules.
5. Worker converts valid output into PRD action types: `github.add_label` and `github.post_comment`.
6. Worker evaluates every proposed action through deterministic policy logic.
7. Worker stores proposed actions with status `pending_approval`, `approved`, or `denied_by_policy` based on policy decision.
8. Worker marks the run `waiting_for_approval`, `completed`, or `failed` based on resulting action states.
9. Worker records traces, audit logs, cost, latency, and errors.

### Approval and execution

1. Reviewer uses the approval queue in the web app.
2. API validates organization membership and permissions before approve/reject/edit.
3. Approval writes an approval record, audit log, and eval sample.
4. Approved or edited actions are marked `approved` and enqueue a BullMQ executor job.
5. Executor worker mints a short-lived GitHub installation token from env GitHub App credentials.
6. Executor performs the GitHub REST mutation.
7. Executor marks the action `executed` or `failed`, records execution result, writes audit logs, and updates run status when all actions have terminal states.

## External systems

- PostgreSQL — source of truth for auth, organizations, integrations, runs, actions, approvals, audit logs, eval samples, and idempotency records.
- Redis — BullMQ queue backend for triage and executor jobs.
- OpenRouter — OpenAI-compatible chat completions endpoint for structured AI triage output.
- GitHub — webhook source and execution target through GitHub App installation tokens.
- MinIO/S3-compatible storage — present in local infra and env, but not required by the issue triage MVP flow yet.

## Storage model

Current tables:

- Auth: `user`, `session`, `account`, `verification`, `organization`, `member`, `invitation`.
- Business: `organization_settings`, `github_installations`, `repositories`, `agents`, `agent_runs`, `proposed_actions`, `policy_rules`, `audit_logs`, `github_webhook_deliveries`, `agent_run_steps`, `approvals`, `eval_samples`.

Enums:

- `run_status`: `queued`, `running`, `waiting_for_approval`, `completed`, `failed`, `rejected`, `cancelled`.
- `action_type`: `github.add_label`, `github.post_comment`.
- `action_status`: `pending_policy`, `pending_approval`, `approved`, `rejected`, `edited`, `executed`, `failed`, `denied_by_policy`.
- `risk_level`: `low`, `medium`, `high`, `critical`.
- `policy_decision`: `allow`, `require_approval`, `deny`.
- `agent_status`: `active`, `paused`.
- `approval_status`: `approved`, `rejected`, `edited` (used by both `approvals.status` and `eval_samples.reviewer_decision`).

Key schema changes from Phase 1:

- `agent_runs`: renamed columns (`trigger_type`, `input_payload`, `total_latency_ms`, `total_cost_cents`), added `github_delivery_id`, `normalized_input`, `trigger_source`; `confidence` is `real`.
- `proposed_actions`: `payload` replaces `params`, removed `reasoning` and review columns, added `matched_policy_rule_id`, default `pending_policy`.
- `audit_logs`: actor/target model (`actor_type`, `actor_id`, `target_type`, `target_id`) with jsonb `metadata`.
- GitHub App secrets and OpenRouter API key are stored in env, not in Postgres.

## Authentication and authorization

- Better Auth handles sessions and organization membership.
- `createContext` resolves session, active organization, active member, and permissions for oRPC procedures.
- Organization procedures require an active organization.
- Permission checks must gate GitHub connection, agent configuration, policy configuration, approval/rejection, audit view, and org settings.
- Viewer users can inspect runs, traces, audit logs, and evals but cannot approve actions or change settings.
- Admin users can configure the agent, connect GitHub, configure policies, and approve/reject/edit actions.

## Operational invariants

- LLM output never calls GitHub directly.
- Every external mutation is represented first as a proposed action.
- Unknown action types are denied by default.
- Public-facing GitHub actions require human approval in the MVP.
- Duplicate GitHub webhook deliveries must not create duplicate runs.
- Webhook requests must return after verification, persistence, and queueing; they must not wait for LLM or GitHub executor completion.
- Every meaningful state transition writes a trace step or audit log.
- Reviewer approval does not execute GitHub inline; execution is a background job.
- GitHub installation tokens are minted just-in-time from env GitHub App credentials.
- No long-lived GitHub access tokens are stored in the database for the MVP.
- Use the existing `@agentclave/*` package boundaries before adding new packages or abstractions.
