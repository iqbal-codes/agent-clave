# AgentClave Product Overview

## Product summary

AgentClave is an agentic governed agent runtime for internal operations.

The runtime core is generic. Connectors, webhook endpoints, tools, tool requests, policies, approvals, executors, traces, audit, and dashboard surfaces do not assume any specific channel or integration. The first working configuration is specific: a Telegram Inventory Ops Agent receives Telegram messages, calls typed inventory tools against a demo-only external inventory API, pauses for manager approval before stock adjustment, resumes after approval, notifies staff and manager, and records the full trace and audit trail.

AgentClave is not a coding agent, a multi-agent orchestrator, or a replacement for tools like n8n. It is the governance, approval, execution-control, and observability layer between AI agents and external business tools.

## One-liner

AgentClave lets teams safely run AI agents by turning model output into governed, reviewable, auditable tool calls.

## Problem statement

Organizations want AI to reduce repetitive operational work, but direct AI mutation of production tools creates risk. Teams need to know what the agent saw, what it produced, what it wanted to do, whether policy allowed it, who approved or rejected it, what was executed, how much it cost, how long it took, and how often reviewers accepted or rejected the suggestions.

Without a control plane, AI workflow automation is hard to trust, debug, audit, and scale.

## Target users

### Primary user: Business Owner / Operations Manager

Manages messy internal operations and wants AI to reduce manual admin work without losing control. Pain points: chat-driven requests, informal approvals, fragmented internal tools, untracked operational decisions, distrust of fully autonomous actions.

### Secondary user: Internal Tools Builder / Software Engineer

Builds internal systems and wants to add AI capabilities safely. Pain points: connecting AI to internal APIs, gating write actions behind approval, typed tool definitions, preventing LLMs from calling arbitrary endpoints, full traceability.

### Tertiary user: LabQ Client

Small to mid-sized businesses with operational chaos — frozen food, F&B, distributors, small warehouses, service businesses, sales/ops teams working from chat. These users see AgentClave through the primary user.

## Core workflow

1. An admin opens a workspace and seeds (or creates) an Inventory Ops Agent.
2. The admin configures the Telegram and Demo Inventory connectors, plus the four seed tools and policies. (Or accepts the seeded default and runs the loop immediately.)
3. A staff member sends a natural-language Telegram message to the bot.
4. The Telegram webhook hits AgentClave. The ingress verifies the secret, deduplicates by Telegram `update_id` (or by the developer-supplied `x-agentclave-delivery-id` header for non-Telegram webhooks), creates an agent run, writes a trace, and enqueues the `agentclave-agent-run` job.
5. The runtime calls OpenRouter with the agent's system prompt and the parsed message. The agent decides which tools to call.
6. For each tool request, AgentClave validates the payload against the tool's input schema, evaluates the policy (allow, require_approval, deny), and either executes (HTTP executor with credentialed template variables), pauses for approval, or blocks.
7. When approval is required, a Telegram approval message is sent to the manager. The manager replies `APPROVE <code>` or `REJECT <code>`; AgentClave matches the code to the pending approval session and resumes or cancels the run.
8. Approved tool requests are enqueued on `agentclave-tool-execution` and the worker executes them through the connector's credentials.
9. Every step writes a `agent_run_steps` row; every state change writes an `audit_logs` row. The web app's run detail page shows the full timeline, tool requests, approval sessions, and audit log.
10. Realtime `run.updated` and `approval.pending` events are published over Redis pub/sub. The web app's `useSubscription` hook invalidates the matching TanStack Query caches so the approvals list, runs list, and run detail update without a refresh.

## MVP scope

### In scope

- User authentication and workspace access.
- Organization membership with Admin and Viewer roles.
- Connector registry: create, list, edit, pause, activate, delete.
- Webhook endpoint registry: create, list, delete, rotate secret under a connector.
- Telegram inbound webhook (verification by header secret, idempotency by `update_id`).
- Custom inbound webhook (verification by header secret, idempotency by `x-agentclave-delivery-id`).
- Tool registry: create, list, edit, delete, bind/unbind to agent.
- Tool input/output JSON schema validation with Ajv.
- Agent registry: create, list, edit, pause, activate, delete.
- Agent run creation (from webhook or from a developer "Test run" trigger) and lifecycle through `queued → running → waiting_for_approval → completed/failed/rejected/cancelled/expired`.
- OpenRouter Chat Completions with strict JSON schema structured output.
- Policy engine with `allow`, `require_approval`, `deny` decisions over tool name, risk level, and agent scope.
- Approval sessions with status `pending → approved/rejected/expired/cancelled`.
- HTTP executor with `{{input.x}}` / `{{connector.config.x}}` / `{{credentials.x}}` template variable resolution, idempotency header, timeout, and credential redaction in stored request metadata.
- AES-256-GCM credential encryption for connector credentials and webhook secrets.
- Telegram approval flow: notify manager, parse `APPROVE/REJECT <code>` reply, resume or cancel the run.
- Step-level trace (`agent_run_steps`).
- Audit logs with actor/target model and jsonb metadata.
- Realtime pipeline over Redis pub/sub (oRPC `EventPublisher` with `IORedisPublisher`).
- "Test run" trigger on agent detail to drive the loop without a real Telegram bot.
- Dashboard, agents, agent detail, tools, tool detail, runs, run detail, settings (organization, connectors) surfaces.
- Connection-state badge in the sticky header showing the realtime subscription lifecycle.

### Out of scope

- Multi-agent orchestration.
- Agent team management.
- Autonomous coding-agent behavior.
- n8n-style visual workflow builder.
- Slack, WhatsApp, GitHub, Linear, Jira integrations (Phase 2+).
- Billing.
- Complex enterprise RBAC.
- Custom policy DSL.
- Browser automation.
- Audit page filtering UI (the router supports it, the page is flat in MVP).
- Real-time dashboard metrics.
- Eval samples page.
- Edit a proposed payload before approval.
- Connector credential rotation through the UI (read back is unsafe; re-create instead).

## Required product surfaces

### Dashboard

Navigation hub. Each card links to an operational surface. Real metrics (runs today, approval rate, cost today) are deferred.

### Agents

List of agents with name, status, risk, model, and description. Each row links to the agent detail page.

### Agent detail

Tabs (or sections, in MVP): overview card with status and metadata, run history, bound tools (with bind/unbind), and a "Test run" card that posts a message to the runtime without a real webhook. The agent detail page also opens the edit sheet.

### Tools

`DataTable` over the tool registry, with server-side filters for name, risk level, executor type, default policy, and status. The page opens the create route and the tool detail page.

### Tool detail

Read-only summary cards (status, risk, executor, default policy) plus the input schema, output schema, and executor config as JSON. Edit sheet opens from the page header.

### Runs

`DataTable` with two views: "All runs" and "Pending review" (status filter). Realtime subscription updates the list as new runs arrive.

### Run detail

The primary inspection screen. Shows: run status, input message, final response, the step timeline, the tool requests table, the **pending review requests** card (with Approve / Reject inline), the **approval sessions** card (history with approver, decision, note, and approval code), the **audit log** snippet, and the error block.

### Settings — Organization

Workspace profile (name, id). Single edit form. Toast on success.

### Settings — Connectors

`DataTable` of connectors. Each row links to the connector detail. Connector detail shows: configuration card (config JSON, redacted credentials), the **webhook endpoints** list, "New endpoint" sheet, "Rotate secret" alert dialog, "Delete" alert dialog. Edit connector sheet opens from the page header.

### Header chrome

Sticky translucent header. Contains `SidebarTrigger`, the separator, the **realtime connection-state badge** (Live / Reconnecting / Offline), and the theme toggler. Header is utility chrome; page titles live in route content.

## Success criteria

The MVP is complete when a user can sign in, see the seeded Inventory Ops Agent and its tools, run a "Test run" from the agent detail page, watch the run transition live to `waiting_for_approval`, see the pending review request on the run detail page, approve it inline, watch the run resume live, see the audit log grow with every state change, and (optionally, with a real Telegram bot configured) do the same flow from a real Telegram message.

Portfolio success requires typed tools, policy enforcement, human-in-the-loop approval, credentialed HTTP executor, run traces, audit logs, cost and latency tracking, idempotent webhook handling, async run processing, structured AI output validation, and a clean demo flow.

## Confirmed constraints and preferences

- Source PRD: `prd.md`. Source pivot doc: `pivot-document.md` (Telegram Inventory Ops Agent).
- Use the existing project stack: Vite React, Hono/oRPC, Drizzle/Postgres, Better Auth, BullMQ/Redis, shared workspace packages.
- Keep the MVP narrow and production-like.
- Do not let model output directly execute tools. Tool calls are validated, policy-checked, and (when required) human-approved before the executor runs them.
- Unknown tools and unknown policy outcomes are denied by default.
- Public-mutating tools require human approval in the MVP.
- Connectors carry credentials; the LLM never sees them. The executor is the only place credentials are loaded.

## Architecture decisions (resolved)

- LLM provider: OpenRouter Chat Completions with strict JSON schema output.
- Background job mechanism: BullMQ + Redis with separate `apps/worker` process.
- Connector credential storage: AES-256-GCM-encrypted in Postgres, env not used as the source of truth at runtime.
- Realtime fanout: oRPC `EventPublisher` with `IORedisPublisher`, riding the existing Redis instance.
- UI composition: TanStack Table + shared form system + `@agentclave/ui` primitives. Sheets for edits, alert dialogs for destructive confirms, dedicated routes for create flows.
- Headers and rate-limit headers in API responses: out of scope for MVP.
