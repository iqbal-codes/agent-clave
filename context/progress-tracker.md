# Progress Tracker

## Tool detail page fix

- [x] `/tools/:id` route added in `apps/web/src/App.tsx` rendering new `ToolDetailPage`.
- [x] `apps/web/src/pages/tool-detail.tsx` created from raw `tools.getById` payload (no backend changes).
- [x] Summary cards (status, risk, executor, default policy), configuration card, and three JSON cards (input/output schema, executor config).
- [x] `Tool not found` fallback for missing/404 tools, destructive card on fetch errors.
- [x] Project-wide `check-types` passes.
## Current status
**Phase:** Features-Based Architecture Refactor — Complete
**Last completed:** Refactored apps/web/src to features-based architecture
**Current task:** Features-based architecture refactor complete
**Next:** Continue building product features in new structure

## Progress

### AgentClave Pivot — Implementation Complete

- [x] Types and schemas updated for generic runtime vocabulary
- [x] Database schema replaced with AgentClave tables (connectors, tools, agent_tools, webhook_endpoints, webhook_deliveries, tool_requests, tool_executions, policies, approval_sessions)
- [x] Environment variables updated (CREDENTIAL_ENCRYPTION_KEY, Telegram, Demo Inventory API)
- [x] Permissions updated (connector.configure, tool.view, tool.configure, approval.review)
- [x] Queues renamed to agentclave-agent-run and agentclave-tool-execution
- [x] Worker processors updated for new queue names
- [x] JSON schema validation with Ajv for tool payloads
- [x] Credential encryption with AES-256-GCM
- [x] HTTP executor with template variable resolution
- [x] Agent runtime loop with OpenRouter tool calling
- [x] Policy evaluation updated for tool-based matching
- [x] Webhook ingress for custom endpoints with verification
- [x] Approval pause/resume workflow with Telegram integration
- [x] API routers replaced (connectors, tools, tool-requests, agents, policy, runs, organization)
- [x] Demo inventory API created (apps/demo-inventory-api)
- [x] Seed data for Inventory Ops Agent with 4 tools and policies
- [x] Frontend routes updated (Tools, Connectors pages added)
- [x] Dashboard, agents, runs, approvals, audit pages updated
- [x] GitHub-specific code removed
- [x] Context docs updated
- [x] Type checks passing
- [x] Tests passing (45/45)
- [x] Build succeeding
### Features-Based Architecture Refactor — Complete

- [x] Created `apps/web/src/features/` directory with per-feature folders
- [x] Moved all page components from `pages/` to `features/<feature>/`
- [x] Moved `auth-form-layout` from `components/auth/` into `features/auth/`
- [x] Replaced old `pages/` files with thin re-export shims
- [x] Updated `App.tsx` imports to point at `features/` paths
- [x] Fixed relative import paths (`../../hooks/`, `./auth-form-layout`)
- [x] Removed unused imports (`ExternalLink`, `CardHeader`, `CardTitle`)
- [x] Ran `vp fmt` for consistent formatting
- [x] Verified: zero new lint/typecheck errors in `apps/web/`
- [x] Updated `context/ui-registry.md` with new feature paths
- [x] Updated `context/progress-tracker.md`

### Previous Phases (RunGuard)

#### Phase 0 — Context and architecture foundation

- [x] Product discovery from `prd.md`
- [x] Architecture blueprint confirmation
- [x] All context files created

#### Phase 1 — Domain model and vocabulary cutover

- [x] Shared vocabulary cutover
- [x] Database schema completion
- [x] Seed data alignment

#### Phase 2 — Infrastructure and backend services

- [x] Redis and BullMQ infrastructure
- [x] Worker process
- [x] Core backend service modules
