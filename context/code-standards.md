# Code Standards

## Language and typing

- TypeScript is strict across the workspace through `packages/config/tsconfig.base.json`.
- `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`, `isolatedModules`, and `verbatimModuleSyntax` are enabled. Code must satisfy these without suppression.
- Prefer explicit shared literal unions in `packages/types` and runtime validation in `packages/schemas`.
- Use Zod for external input, API input, LLM output, webhook payload normalization, and settings payloads.
- Do not use `any` for domain data. Use `unknown` at boundaries, validate, then narrow.

## Formatting and linting

- vite-plus formatting uses tabs and double quotes.
- Do not manually reformat unrelated code. Let `vp check --fix` handle formatting when verification requires it.
- Keep imports type-only where appropriate.
- Do not silence lint/type errors to make a check pass.

## Naming

- Workspace packages use `@agentclave/*`.
- Product vocabulary follows the AgentClave domain model:
  - Policy decisions: `allow`, `require_approval`, `deny`.
  - Run statuses: `queued`, `running`, `waiting_for_approval`, `completed`, `failed`, `rejected`, `cancelled`, `expired`.
  - Tool request statuses: `pending_policy`, `pending_approval`, `approved`, `executing`, `executed`, `rejected`, `failed`, `denied_by_policy`, `cancelled`.
  - Resource statuses: `active`, `paused`.
- Do not keep compatibility aliases for old vocabulary once the domain model is settled.
- React components use PascalCase. Hooks use `useName`. Backend service functions use verb-first names such as `verifyGitHubSignature`, `evaluatePolicy`, `writeAudit`.

## Imports and package boundaries

- Apps may import from packages. Packages must not import from apps.
- `apps/web` imports UI primitives from `@agentclave/ui`, API clients from `@agentclave/api-client`, and shared types/schemas from packages.
- `apps/web` must not import `@agentclave/db`, server env, GitHub clients, OpenRouter clients, or worker code.
- `apps/api` owns HTTP wiring only. Domain logic should live in `packages/api/src/core` or a focused backend service module.
- `apps/worker` should import shared worker/domain services from packages; do not duplicate webhook, policy, OpenRouter, or GitHub executor logic there.
- `packages/db` owns schema/migrations and should not import API/router code.
- `packages/schemas` should stay side-effect free.

## API and backend boundaries

- oRPC procedures live in `packages/api/src/routers` and should be thin: validate input, enforce auth/org/permission boundaries, call services, return typed results.
- Hono routes in `apps/api` are for process-level HTTP concerns: Better Auth, oRPC handlers, webhook ingress, CORS, logger, and error boundary.
- Long-running work must go through BullMQ jobs, not request handlers.
- Webhook route must verify signature against raw body before trusting JSON payload.
- Duplicate GitHub delivery IDs must be handled idempotently.
- API responses should not expose secrets, private keys, webhook secrets, or installation tokens.

## Pagination and list response

- All paginated list procedures must return `{ items: T[], total: number }` — never a bare array.
- Use the `paginatedListSchema` helper from `packages/schemas` for response type derivation, or construct the shape inline as `{ items: rows, total: Number(total) }`.
- Compute `total` using `db.select({ total: count() }).from(table).where(and(...conditions))` before the data query. Always handle the potential `undefined` from the count result: `Number(countResult?.total ?? 0)`.
- Create route-specific query schemas in `packages/schemas/src/index.ts` using `tableQuerySchema.extend(...)` when the list endpoint has filters beyond pagination. Name them `<entity>ListQuerySchema` (e.g., `toolListQuerySchema`, `connectorListQuerySchema`).
- Array-valued filter fields must use the same name as the column they filter (`riskLevel`, `status`, `type`, etc.) so URL state and API payload share names. Empty arrays mean "no filter", not "match nothing".
- Sort fields must be whitelisted as a Zod enum in the route-specific schema. The `sort` and `order` fields from `tableQuerySchema` remain the base; extend only when needed.
- For client-side DataTable consumers: read URL state with `useQueryStates` from nuqs, map `name` to API `search`, collapse the sort array to the first entry, and send the validated filter payload in the POST body.

## Database and persistence

- Use Drizzle schema definitions in `packages/db/src/schema` as the source of truth.
- Persist every durable state transition needed for auditability: run status changes, trace steps, tool requests, policy decisions, approvals, execution results, and failures.
- Use database uniqueness for idempotency wherever possible; do not rely only on in-memory checks.
- Store sensitive credentials (CREDENTIAL_ENCRYPTION_KEY, OpenRouter API key) in env, not in Postgres.
- Connector credentials are encrypted with AES-256-GCM before storage.

## Auth and permissions

- Use Better Auth session context from `createContext`.
- Organization-scoped procedures must use `organizationProcedure` or equivalent middleware.
- Permission checks must guard connector configuration, agent configuration, policy configuration, approval/rejection, organization settings, and audit view.
- Viewer can inspect runs and audit. Admin can configure and approve. Keep role semantics explicit.

## Worker and queue rules

- BullMQ queues are the execution boundary for agent runs and tool execution.
- API enqueues work; worker performs LLM calls, policy side effects, and tool execution.
- Approval should enqueue execution rather than synchronously mutating external systems.
- Worker jobs must record trace/audit/failure state before throwing or marking failed.
- Job payloads should contain IDs, not full mutable domain snapshots. Load current state from Postgres inside the job.

## Runtime and executor rules

- Tool execution goes through BullMQ jobs via `enqueueToolExecutionJob`.
- HTTP executor supports template variable resolution for webhook-based tools.
- Executor failures must be stored on the tool request and visible on run detail.
- Unknown or unsupported executor types are denied by policy, not ignored.
- Audit logs must record every significant state transition (run status changes, tool requests, policy decisions, approvals).

## UI rules in code

- Use `@agentclave/ui` primitives before raw controls.
- Use semantic token classes. Do not hardcode raw color palette classes in product pages.
- Keep authenticated product pages inside `DashboardLayout`.
- Data fetching should go through the generated/typed oRPC client (`@agentclave/api-client`) and TanStack Query patterns (`useQuery(orpc.x.queryOptions(input))`, `useMutation(orpc.x.mutationOptions(...))`). Do not call `fetch("/api/...")` directly in product code.
- Product pages should handle loading, empty, error, and permission-denied states intentionally.
- Forms that render product settings or edit flows must use the shared TanStack Form system in `@agentclave/ui/components/forms/tanstack-form` and the guide in `packages/ui/docs/forms.md`.
- Use `useFormFields<z.infer<typeof schema>>()` for typed `FormXxxField` names. Use `form.AppField` only for custom/specialized inputs or array fields that need `mode="array"`.
- Product forms must keep the full Zod schema on `validators: { onSubmit: schema }`; field validators/listeners are additive UX behavior, not the only validation boundary.
- Tables that render operational lists must use `@agentclave/ui/components/table` and `@agentclave/ui/hooks/use-data-table` with the guide in `packages/ui/docs/table.md`; do not implement local sorting/filtering/pagination state beside the shared nuqs pattern.
- Table columns that render toolbar filters must define `ColumnDef.meta` and `enableColumnFilter: true`; server-backed tables must pass `pageCount`, URL-safe sort parsers, matching skeletons, and `initialState.columnPinning` for action/select columns.
- Existing `packages/ui/docs/*.md` examples may still mention `@labq-modules/*`; implementation imports in this repo must use `@agentclave/ui/*`.

## Realtime rules

- Realtime fanout uses the oRPC `EventPublisher` with `IORedisPublisher` (`@orpc/experimental-publisher/ioredis`). Two `ioredis` connections are required: one for `PUBLISH` (commander) and one for `SUBSCRIBE` (listener). The listener connection stays in subscribe mode and cannot be reused for normal commands.
- The singleton publisher lives at `packages/api/src/core/realtime/publisher.ts`. The event types are declared via TypeScript generics on the publisher; only declared events can be published.
- Server-side, the `realtime.subscribe` oRPC procedure filters events by `context.activeOrganization.id` and `context.session.user.id` before yielding them to the client. Do not rely on the client to filter; the server-side filter is the security boundary.
- Client-side, `useSubscription` from `@orpc/tanstack-query` opens the SSE/event-iterator connection. Always call `queryClient.invalidateQueries` (or `setQueryData` for the run detail page) in `onData` to refresh the matching cache keys.
- The connection-state badge in the sticky header subscribes to the same hook's lifecycle and renders `Live` / `Reconnecting` / `Offline`. Do not render the badge without a real subscription; do not render it with stale state.
- Publish at every meaningful state transition: run status changes, tool request status changes, approval session created / decided / expired. Do not publish on every DB write; only on transitions that should appear in the operator's view.

## Tests and verification

- Add unit tests for pure domain logic: policy evaluation, JSON schema validation, credentials round-trip, template variable resolution, cost parsing, and status transitions.
- Add integration tests for duplicate custom webhook delivery, approval-to-executor enqueue, and the runtime loop's allow / require_approval / deny paths.
- Do not mock the behavior under test. Use deterministic provider/service seams for external systems (OpenRouter, Telegram, internal HTTP APIs).
- Verification claims must match the command or scenario actually run.

## Invariants

- Context first, then planning, then implementation.
- No LLM output directly mutates external systems.
- Every tool execution is backed by a tool request, policy decision, human approval (if required), executor result, and audit log.
- No compatibility shims or deprecated paths after vocabulary cutovers.
- Prefer existing package boundaries and shared utilities over new abstractions.
