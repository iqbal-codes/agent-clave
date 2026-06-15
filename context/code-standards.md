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
- Product vocabulary follows the PRD and context files:
  - Action types: `github.add_label`, `github.post_comment`.
  - Policy decisions: `allow`, `require_approval`, `deny`.
  - Run statuses: `queued`, `running`, `waiting_for_approval`, `completed`, `failed`, `rejected`, `cancelled`.
  - Proposed action statuses: `pending_policy`, `pending_approval`, `approved`, `rejected`, `edited`, `executed`, `failed`, `denied_by_policy`.
- Do not keep compatibility aliases for old starter vocabulary such as `add_label` or `post_comment` once the PRD vocabulary is cut over.
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

## Database and persistence

- Use Drizzle schema definitions in `packages/db/src/schema` as the source of truth.
- Persist every durable state transition needed for auditability: run status changes, trace steps, proposed actions, policy decisions, approvals, execution results, and failures.
- Use database uniqueness for idempotency wherever possible; do not rely only on in-memory checks.
- Store GitHub App credentials and OpenRouter API key in env, not in Postgres.
- Store GitHub installation/repository metadata in Postgres.
- Mint short-lived GitHub installation tokens just in time for executor jobs.

## Auth and permissions

- Use Better Auth session context from `createContext`.
- Organization-scoped procedures must use `organizationProcedure` or equivalent middleware.
- Permission checks must guard GitHub connection, agent configuration, policy configuration, approval/rejection/edit, organization settings, audit view, and eval view.
- Viewer can inspect runs/audit/evals. Admin can configure and approve. Keep role semantics explicit.

## Worker and queue rules

- BullMQ queues are the execution boundary for triage and GitHub executor work.
- API enqueues work; worker performs LLM calls, policy side effects, and GitHub mutations.
- Approval should enqueue execution rather than synchronously mutating GitHub.
- Worker jobs must record trace/audit/failure state before throwing or marking failed.
- Job payloads should contain IDs, not full mutable domain snapshots. Load current state from Postgres inside the job.

## LLM rules

- Runtime AI calls go through OpenRouter.
- Use strict JSON schema structured output where supported.
- Validate model output with Zod even when OpenRouter schema mode is used.
- Invalid output marks the run failed and records error metadata; it must not produce proposed actions.
- Model output cannot execute tools or call GitHub directly.
- Tests should not depend on live OpenRouter responses; use deterministic provider behavior for tests.

## GitHub rules

- Implement GitHub integration with GitHub App semantics.
- Verify webhook signatures using `x-hub-signature-256`.
- Support only `issues.opened` and `issues.edited` for the MVP.
- Executor supports only approved `github.add_label` and `github.post_comment` actions for the MVP.
- Unknown or unsupported GitHub actions are denied by policy, not ignored.
- GitHub execution failures must be stored on the proposed action and visible on run detail.

## UI rules in code

- Use `@agentclave/ui` primitives before raw controls.
- Use semantic token classes. Do not hardcode raw color palette classes in product pages.
- Keep authenticated product pages inside `DashboardLayout`.
- Data fetching should go through the generated/typed oRPC client and TanStack Query patterns.
- Product pages should handle loading, empty, error, and permission-denied states intentionally.
- Forms that render product settings or edit flows must use the shared TanStack Form system in `@agentclave/ui/components/forms/tanstack-form` and the guide in `packages/ui/docs/forms.md`.
- Use `useFormFields<z.infer<typeof schema>>()` for typed `FormXxxField` names. Use `form.AppField` only for custom/specialized inputs or array fields that need `mode="array"`.
- Product forms must keep the full Zod schema on `validators: { onSubmit: schema }`; field validators/listeners are additive UX behavior, not the only validation boundary.
- Tables that render operational lists must use `@agentclave/ui/components/table` and `@agentclave/ui/hooks/use-data-table` with the guide in `packages/ui/docs/table.md`; do not implement local sorting/filtering/pagination state beside the shared nuqs pattern.
- Table columns that render toolbar filters must define `ColumnDef.meta` and `enableColumnFilter: true`; server-backed tables must pass `pageCount`, URL-safe sort parsers, matching skeletons, and `initialState.columnPinning` for action/select columns.
- Existing `packages/ui/docs/*.md` examples may still mention `@labq-modules/*`; implementation imports in this repo must use `@agentclave/ui/*`.

## Tests and verification

- Add unit tests for pure domain logic: signature verification, output validation, action building, policy evaluation, cost parsing, and status transitions.
- Add integration tests for duplicate webhook delivery and approval-to-executor enqueue behavior.
- Do not mock the behavior under test. Use deterministic provider/service seams for external systems.
- Verification claims must match the command or scenario actually run.

## Invariants

- Context first, then planning, then implementation.
- No LLM output directly mutates GitHub.
- Every GitHub mutation is backed by a proposed action, policy decision, human approval, executor result, and audit log.
- No compatibility shims or deprecated paths after vocabulary cutovers.
- Prefer existing package boundaries and shared utilities over new abstractions.
