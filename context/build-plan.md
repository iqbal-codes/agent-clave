# Build Plan

## Core principle

Build the control plane in dependency order: domain vocabulary and persistence first, then webhook ingress, then worker pipeline, then approval/executor behavior, then product UI, then documentation/demo polish. Every phase must preserve the invariant that LLM output never mutates GitHub directly.

## Phase 0 — Context and architecture foundation

### 00.1 Context backbone

**Deliverable:** Project overview, architecture, UI tokens/rules/registry, code standards, library docs, build plan, and progress tracker exist and match the repo.

**Status:** Complete.

### 00.2 Agent wiring repair

**Deliverable:** `AGENTS.md` reflects AgentClave rather than stale template/internal-tools language.

**Status:** Complete.

## Phase 1 — Domain model and vocabulary cutover

### 01.1 Shared vocabulary

**Logic / Behavior:**

- Update `packages/types` and `packages/schemas` to PRD action/status vocabulary.
- Use `github.add_label` and `github.post_comment` as supported action types.
- Use PRD proposed-action statuses.
- Remove old starter action vocabulary, with no compatibility aliases.

**Verification:** Typecheck packages that consume shared types/schemas.

**Status:** Complete.

### 01.2 Database schema completion

**Logic / Behavior:**

- Update Drizzle enums/tables for PRD vocabulary.
- Add webhook delivery/idempotency storage.
- Add `agent_run_steps`.
- Add `approvals`.
- Add `eval_samples`.
- Expand `agent_runs`, `proposed_actions`, and `audit_logs` fields as needed for PRD behavior.

**Verification:** Drizzle schema generation/push path succeeds in local dev setup.

**Status:** Complete.

### 01.3 Seed data alignment

**Logic / Behavior:**

- Seed GitHub Issue Triage Agent with allowed labels including priority labels `P1`, `P2`, `P3`.
- Seed default policies:
  - `github.add_label` → `require_approval`.
  - `github.post_comment` → `require_approval`.
  - unknown action → `deny` by engine fallback.

**Verification:** New workspace seed creates the agent/settings/policies expected by UI and worker.

**Status:** Complete.

## Phase 2 — Infrastructure and backend services

### 02.1 Redis and BullMQ infrastructure

**Logic / Behavior:**

- Add Redis to `docker-compose.yml`.
- Add BullMQ dependencies.
- Add Redis env validation and `.env.example` entries.
- Add queue names and shared job payload schemas.

**Verification:** Worker can connect to Redis locally.

**Status:** Complete.

### 02.2 Worker app

**Logic / Behavior:**

- Add `apps/worker` package.
- Start BullMQ workers for triage and GitHub executor queues.
- Keep job handlers in shared backend service modules, not inline in process startup.
  **Verification:** Worker starts without processing jobs and can register processors.

**Status:** Complete.

### 02.3 Core service modules

**Logic / Behavior:**

Add backend services under `packages/api/src/core` or focused subfolders:

- GitHub signature verifier.
- GitHub App token/client factory.
- GitHub issue normalizer.
- OpenRouter triage client.
- Triage output validator.
- Proposed action builder.
- Policy evaluator.
- Trace writer.
- Audit writer.
- Eval sample writer.
- Run status transition helper.
  **Verification:** Unit tests cover pure services.

**Status:** Complete.

## Phase 3 — GitHub webhook ingress

### 03.1 Webhook route

**API / Surface:**

- Add `POST /api/webhooks/github` to Hono API.

**Logic / Behavior:**

- Read raw body.
- Verify `x-hub-signature-256`.
- Parse event and action.
- Accept only `issues.opened` and `issues.edited`.
- Persist delivery ID idempotently.
- Create/reuse agent run.
- Record trace/audit entries.
- Enqueue triage job.
- Return success without waiting for LLM.

**Verification:** Integration test proves duplicate delivery does not create duplicate runs.

### 03.2 GitHub installation and repository support

**API / Surface:**

- Complete GitHub installation/repository endpoints enough for configured repos.

**Logic / Behavior:**

- Store installation and repository metadata.
- Do not store long-lived GitHub access tokens.

**Verification:** API can resolve an installation/repository for a webhook issue event.

## Phase 4 — Triage worker pipeline

### 04.1 OpenRouter structured triage call

**Logic / Behavior:**

- Use OpenRouter Chat Completions.
- Request strict JSON schema output for summary, labels, priority, confidence, draft comment, and reasoning summary.
- Track model name, latency, token counts when available, and estimated cost.

**Verification:** Unit/integration seam can run with deterministic test provider; runtime provider path is typed and validated.

### 04.2 Output validation and proposed actions

**Logic / Behavior:**

- Validate JSON with Zod and product rules.
- Deny labels outside allowed list.
- Require non-empty safe draft comment when comment action is produced.
- Convert labels/priority/comment into proposed actions.
- Invalid output marks run failed and records trace/audit error.

**Verification:** Unit tests cover invalid JSON, disallowed labels, bad confidence, empty comment, and valid output.

### 04.3 Policy evaluation

**Logic / Behavior:**

- Evaluate every proposed action deterministically.
- Deny unknown actions by default.
- Deny disallowed labels.
- Require approval for public-facing actions.
- Store policy decision and matched rule.

**Verification:** Unit tests cover allow, require approval, deny, unknown action, disallowed label.

## Phase 5 — Approval and executor workflow

### 05.1 Approval APIs

**API / Surface:**

- List pending approvals.
- Approve an action.
- Reject an action with reason/note.
- Edit payload before approval.

**Logic / Behavior:**

- Enforce reviewer/admin permissions.
- Write approval records.
- Write eval samples.
- Write audit logs.
- Enqueue executor job for approved/edited actions.

**Verification:** Integration test proves approval enqueues executor work without inline GitHub mutation.

### 05.2 GitHub executor worker

**Logic / Behavior:**

- Confirm action is approved.
- Mint GitHub installation token from env GitHub App credentials.
- Execute `github.add_label` or `github.post_comment` through GitHub REST.
- Mark action `executed` or `failed`.
- Store execution result/error.
- Update run status when all actions are terminal.
- Write trace and audit logs.

**Verification:** Unit tests cover payload validation and status transitions; integration seam covers executor job behavior.

## Phase 6 — Product API completion

### 06.1 Runs and traces

**API / Surface:**

- Runs list.
- Run detail with normalized input, agent output, proposed actions, policy decisions, approvals, execution results, trace steps, audit snippets, cost, latency, errors.
- Retry failed run if safe.

### 06.2 Agents and policies

**API / Surface:**

- Agent list/detail/settings.
- Agent status toggle.
- Policy list/update.

### 06.3 Audit and evals

**API / Surface:**

- Audit log list with filters.
- Eval summary metrics.
- Eval sample list.

## Phase 7 — Web app surfaces

### 07.1 Dashboard

**UI / Surface:**

- Active agent status.
- Runs today.
- Pending approvals.
- Approval rate.
- Rejection rate.
- Average latency.
- Estimated cost today.

### 07.2 Agents and agent detail

**UI / Surface:**

- Agents list with the GitHub Issue Triage Agent.
- Agent detail tabs: Overview, Runs, Policies, Settings.
- Admin settings for status, prompt, model, allowed labels, daily budget.

### 07.3 Runs and run detail

**UI / Surface:**

- Runs table.
- Run detail as primary inspection screen with trace timeline, issue metadata, normalized input, agent output, proposed actions, policy decisions, approvals, execution results, cost/latency, and errors.

### 07.4 Approval queue

**UI / Surface:**

- Pending approval cards.
- Approve/reject/edit controls.
- Rejection reason and reviewer note.

### 07.5 Audit logs and evals

**UI / Surface:**

- Audit table with filters.
- Evals summary and recent samples.

## Phase 8 — Verification, docs, and demo flow

### 08.1 Test coverage

- Unit tests for signature verification, output validation, action building, policy evaluation.
- Integration tests for duplicate webhook delivery and approval-to-executor enqueue.
- UI smoke path for approval flow if dev services are runnable.

### 08.2 Final docs/demo

- Update context/progress files after each feature.
- Keep architecture and library docs synced with actual implementation.
- Produce README/demo flow after the working MVP path exists.

## Feature count

| Phase                                         | Feature groups |
| --------------------------------------------- | -------------: |
| Phase 0 — Context and architecture foundation |              2 |
| Phase 1 — Domain model and vocabulary cutover |              3 |
| Phase 2 — Infrastructure and backend services |              3 |
| Phase 3 — GitHub webhook ingress              |              2 |
| Phase 4 — Triage worker pipeline              |              3 |
| Phase 5 — Approval and executor workflow      |              2 |
| Phase 6 — Product API completion              |              3 |
| Phase 7 — Web app surfaces                    |              5 |
| Phase 8 — Verification, docs, and demo flow   |              2 |
