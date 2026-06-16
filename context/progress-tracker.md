# Progress Tracker

## Current status

**Phase:** MVP UI surface completion + realtime — In progress (Phase 9)
**Last completed:** Compact navigation, paginated lists, approval-on-run-detail, features-based architecture
**Current task:** Close the gap between the runtime (which is complete) and the dashboard surfaces (which need create/edit forms, inline approve/reject, a test-run trigger, and realtime updates)
**Next:** Implement Phase 9 per `context/build-plan.md`

## Tool detail page fix

- [x] `/tools/:id` route added in `apps/web/src/App.tsx` rendering new `ToolDetailPage`.
- [x] `apps/web/src/pages/tool-detail.tsx` created from raw `tools.getById` payload (no backend changes).
- [x] Summary cards (status, risk, executor, default policy), configuration card, and three JSON cards (input/output schema, executor config).
- [x] `Tool not found` fallback for missing/404 tools, destructive card on fetch errors.
- [x] Project-wide `check-types` passes.

## Progress

### AgentClave pivot — Implementation complete

- [x] Types and schemas updated for generic runtime vocabulary.
- [x] Database schema replaced with AgentClave tables (`connectors`, `tools`, `agent_tools`, `webhook_endpoints`, `webhook_deliveries`, `tool_requests`, `tool_executions`, `policies`, `approval_sessions`, `audit_logs`, `agent_run_steps`).
- [x] Environment variables updated (`CREDENTIAL_ENCRYPTION_KEY`, Telegram, Demo Inventory API).
- [x] Permissions updated (`connector.configure`, `tool.view`, `tool.configure`, `approval.review`).
- [x] Queues renamed to `agentclave-agent-run` and `agentclave-tool-execution`.
- [x] Worker processors updated for the new queue names.
- [x] JSON schema validation with Ajv for tool payloads.
- [x] Credential encryption with AES-256-GCM.
- [x] HTTP executor with template variable resolution.
- [x] Agent runtime loop with OpenRouter tool calling.
- [x] Policy evaluation updated for tool-based matching.
- [x] Webhook ingress for custom endpoints with verification.
- [x] Approval pause/resume workflow with Telegram integration.
- [x] API routers replaced (`connectors`, `tools`, `tool-requests`, `agents`, `policy`, `runs`, `organization`).
- [x] Demo inventory API created (`apps/demo-inventory-api`).
- [x] Seed data for Inventory Ops Agent with four tools and policies.
- [x] Frontend routes updated (Tools page, Connectors page added).
- [x] Dashboard, agents, runs, run-detail pages updated.
- [x] GitHub-specific code removed.
- [x] Context docs updated.
- [x] Type checks passing.
- [x] Tests passing.
- [x] Build succeeding.

### Features-based architecture refactor — Complete

- [x] Created `apps/web/src/features/` directory with per-feature folders.
- [x] Moved all page components from `pages/` to `features/<feature>/`.
- [x] Moved `auth-form-layout` from `components/auth/` into `features/auth/`.
- [x] Replaced old `pages/` files with thin re-export shims.
- [x] Updated `App.tsx` imports to point at `features/` paths.
- [x] Fixed relative import paths (`../../hooks/`, `./auth-form-layout`).
- [x] Removed unused imports.
- [x] Ran `vp fmt` for consistent formatting.
- [x] Verified: zero new lint/typecheck errors in `apps/web/`.
- [x] Updated `context/ui-registry.md` with new feature paths.
- [x] Updated `context/progress-tracker.md`.

### Compact navigation, paginated lists, approval-on-run-detail — Complete

- [x] Added `paginatedListSchema` helper and route-specific query schemas (`runListQuerySchema`, `toolListQuerySchema`, `connectorListQuerySchema`) to `packages/schemas/src/index.ts`.
- [x] Updated all list procedures to return `{ items, total }` with proper `count()` queries (agents, runs, tools, connectors, policy, connectors listEndpoints, connectors listDeliveries, runs listByAgentId).
- [x] Applied pagination to `policy.ts:list` (was returning all rows).
- [x] Updated `runs.list` to accept an optional `status` filter via `runListQuerySchema`.
- [x] Updated `tools.list` with full server-side filtering: search (name+description), riskLevel, executorType, defaultPolicy, status; sorted columns.
- [x] Updated `connectors.list` with full server-side filtering: search (name), type, provider, status; sorted columns.
- [x] Removed `runs.listPendingApproval` and `toolRequests.listPendingApproval` (dead code after filter changes).
- [x] Sidebar compacted to five items: Dashboard, Agents, Tools, Runs, Settings.
- [x] Created `SettingsLayout` with tabs for Organization and Connectors.
- [x] Moved Connectors from `/connectors` to `/settings/connectors` under Settings tabs.
- [x] Removed standalone Approvals and Audit pages and their routes.
- [x] Updated Runs page with `All runs` / `Pending review` toggle backed by `useSearchParams`.
- [x] Run Detail page absorbs audit logs (`auditLogs` section) and pending-review requests (`pendingReviewRequests` section).
- [x] Created `tools-columns.tsx` and `connectors-columns.tsx` for `DataTable`.
- [x] Migrated Tools and Connectors pages from card-grid to `DataTable` with `DataTableToolbar`.
- [x] Updated `agents.tsx` to consume the new `{ items, total }` response shape (kept card UI).
- [x] Added `@tanstack/react-table` dependency to `apps/web`.
- [x] All web callers updated for the paginated response shape.
- [x] Project-wide `check-types` passes.

### Context sync (this update)

- [x] Rewrote `context/project-overview.md` for the AgentClave flow (Telegram Inventory Ops, generic runtime, realtime pipeline).
- [x] Rewrote `context/architecture.md` to describe the AgentClave stack, the new routers, the realtime pipeline, and the storage model.
- [x] Rewrote `context/library-docs.md` to remove the GitHub-era sections, add oRPC publisher + Redis, and update version notes.
- [x] Rewrote `context/ui-rules.md` to add the create-route / edit-sheet / alert-dialog pattern, inline approve/reject, and the realtime badge rule.
- [x] Rewrote `context/build-plan.md` to reframe the pre-pivot phases and add Phase 9.
- [x] Reconciled `context/ui-registry.md` to match the current feature tree (no `approvals/`, no `audit/`, no `connectors/` outside settings; column files in feature folders).
- [x] Updated `context/progress-tracker.md` to match the current state and queue Phase 9.

### Phase 9 — MVP UI surface completion + realtime (planned)

- [ ] Add `@orpc/experimental-publisher` to the workspace catalog.
- [ ] Add `packages/api/src/core/realtime/publisher.ts` (singleton `RedisPublisher`).
- [ ] Add `packages/api/src/routers/realtime.ts` exposing `realtime.subscribe`.
- [ ] Publish `run.updated` from runtime, worker, and `reviewApproval` paths.
- [ ] Publish `approval.pending` from runtime and worker.
- [ ] Add `agents.testRun({ agentId, message })` oRPC procedure.
- [ ] Migrate read pages (`agents`, `tools`, `connectors`, `agent-detail`, `tool-detail`, `runs`, `run-detail`, `audit`) to the typed `orpc` client.
- [ ] Add `/agents/new`, `/tools/new`, `/connectors/new` create routes with shared Zod schemas.
- [ ] Add edit sheets on `/agents/:id`, `/tools/:id`, `/connectors/:id`.
- [ ] Add connector detail at `/settings/connectors/:id` with webhook endpoints list, "New endpoint" sheet, "Rotate secret" and "Delete" alert dialogs.
- [ ] Add "Test run" card on `/agents/:id`.
- [ ] Add "Tools" tab (bind/unbind) and "Policies" tab (read-only) on `/agents/:id`.
- [ ] Add inline Approve / Reject on the run detail's pending review requests card.
- [ ] Add `useRealtimeSubscription` hook and connection-state badge in the sticky header.
- [ ] Subscribe on `RunsPage`, the run detail's pending review block, and `RunDetailPage`.
- [ ] Make the seed guard on `TELEGRAM_BOT_TOKEN`.
- [ ] Project-wide `check-types` passes.
- [ ] End-to-end smoke: sign in → Test run → live status updates → inline Approve → run completes → audit log grows.

### Previous phases (RunGuard, pre-pivot)

#### Phase 0 — Context and architecture foundation

- [x] Product discovery from `prd.md`.
- [x] Architecture blueprint confirmation.
- [x] All context files created.

#### Phase 1 — Domain model and vocabulary cutover (pre-pivot)

- [x] Shared vocabulary cutover.
- [x] Database schema completion.
- [x] Seed data alignment.

#### Phase 2 — Infrastructure and backend services (pre-pivot, superseded by AgentClave Phase 2)

- [x] Redis and BullMQ infrastructure.
- [x] Worker process.
- [x] Core backend service modules.
