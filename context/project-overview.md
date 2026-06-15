# AgentClave Product Overview

## Product summary

AgentClave is an agentic governed agent runtime for internal operations.

The runtime core is generic: connectors, webhook endpoints, tools, tool requests, policies, approvals, executors, traces, audit, and dashboard surfaces do not assume any specific channel or integration. The first working configuration is specific: a Telegram Inventory Ops Agent receives Telegram messages, calls typed inventory tools against a demo-only external inventory API, pauses for manager approval before stock adjustment, resumes after approval, notifies staff/manager, and records the full trace/audit trail.

AgentClave is not a coding agent, multi-agent orchestrator, or replacement for similar tools. It is the governance, approval, execution-control, and observability layer between AI agents and external business tools.

## One-liner
AgentClave lets teams safely run AI agents by turning model output into governed, reviewable, auditable tool calls.

## Problem statement
Organizations want AI to reduce repetitive operational work, but direct AI mutation of production tools creates risk. Teams need to know what the agent saw, what it produced, what it wanted to do, whether policy allowed it, who approved or rejected it, what was executed, how much it cost, how long it took, and how often reviewers accepted or rejected the suggestions.

Without a control plane, AI workflow automation is hard to trust, debug, audit, and scale.

## Target users

### Primary user: Engineering Manager or Tech Lead

Needs to reduce manual triage work without giving AI uncontrolled access to GitHub. Cares about consistency, reviewer control, visible approvals, and auditability.

### Secondary user: Senior or Staff Engineer

Needs confidence that AI automation has clear system boundaries, reliable webhook handling, idempotency, policy enforcement, and observable execution. Does not want LLM output directly calling the GitHub API.

### Tertiary user: Startup CTO or Founder

Needs operational leverage from AI while keeping human control over mistakes that could affect users, customers, or public project communication.

## Core workflow

1. An admin connects a GitHub repository to AgentClave.
2. The admin enables the built-in GitHub Issue Triage Agent.
3. GitHub sends an `issues.opened` or `issues.edited` webhook.
4. AgentClave verifies the webhook signature and handles duplicate deliveries idempotently.
5. AgentClave creates an agent run and trace steps.
6. The triage agent analyzes the issue title, body, repository, and metadata.
7. The agent returns structured output: summary, labels, priority, confidence, draft comment, and reasoning summary.
8. AgentClave validates the output before using it.
9. AgentClave creates proposed actions such as `github.add_label` and `github.post_comment`.
10. The policy engine evaluates every proposed action.
11. Actions requiring approval appear in the approval queue.
12. A reviewer approves, rejects, or edits each action.
13. AgentClave executes approved actions through GitHub.
14. AgentClave records audit logs, traces, cost, latency, and evaluation samples.

## MVP scope

### In scope

- User authentication and workspace access.
- Organization membership with Admin and Viewer roles.
- GitHub repository connection.
- GitHub issue webhook receiver.
- GitHub webhook signature verification.
- Idempotent handling for duplicate GitHub delivery IDs.
- `issues.opened` and `issues.edited` event support.
- GitHub Issue Triage Agent configuration and status.
- Agent run creation and run status tracking.
- Step-level trace recording.
- Structured AI output validation.
- Proposed action creation.
- Policy evaluation for proposed actions.
- Human approval queue.
- Reviewer approve, reject, and edit flows.
- GitHub label and comment execution.
- Audit logs for system, agent, GitHub, and user actions.
- Evaluation metrics based on approvals, rejections, edits, confidence, latency, and cost.
- Dashboard, agents, agent detail, runs, run detail, approvals, audit logs, and eval surfaces.

### Out of scope

- Multi-agent orchestration.
- Agent team management.
- Autonomous coding-agent behavior.
- PR creation, PR review, auto-merge, or auto-close.
- Slack, Telegram, Jira, Linear, or other non-GitHub integrations.
- Billing.
- Complex enterprise RBAC.
- Custom policy DSL.
- Visual workflow builder.
- Browser automation.
- Full agent harness loop.

## Required product surfaces

### Dashboard

Shows active agent status, runs today, pending approvals, approval rate, rejection rate, average latency, and estimated cost today.

### Agents

Shows the GitHub Issue Triage Agent with status, risk level, runs today, approval rate, and last run timestamp.

### Agent detail

Shows overview, runs, policies, and settings for the triage agent. Admin settings include status, prompt, model, allowed labels, and daily budget.

### Runs

Shows run history with issue title, repository, status, confidence, policy decision, cost, latency, and created timestamp.

### Run detail

The primary inspection screen. Shows run status, GitHub issue metadata, normalized input, agent output, proposed actions, policy decisions, approval history, execution results, trace timeline, cost, latency, and error details.

### Approval queue

Shows pending approval cards with issue context, agent summary, suggested labels, suggested priority, draft comment, confidence, risk level, matched policy, and review actions.

### Audit logs

Shows timestamp, actor, action, target, metadata summary, and filters for actor type, action type, date range, and run ID.

### Evals

Shows approval rate, rejection rate, edited rate, average confidence, top rejection reasons, and recent evaluation samples.

## Success criteria

The MVP is complete when a user can log in, connect a GitHub repository, receive a signed issue webhook, create an idempotent agent run, generate and validate structured triage output, create proposed GitHub actions, evaluate policy, review actions in an approval queue, approve, reject, or edit actions, execute approved labels and comments back to GitHub, and inspect traces, audit logs, and evaluation metrics.

Portfolio success requires a real GitHub integration, signed webhook verification, idempotent webhook handling, async run processing, structured AI output validation, policy engine, human approval workflow, GitHub executor, audit logs, run traces, cost and latency tracking, evaluation dashboard, clear documentation, and a short demo flow.

## Confirmed constraints and preferences

- Source PRD: `prd.md`.
- Product framing is approved for discovery.
- Use the existing project stack and package setup already present in this repository.
- Treat the PRD's Next.js recommendation as non-binding because this repository is already set up around Vite React, Hono/oRPC, Drizzle/Postgres, Better Auth, and shared workspace packages.
- Keep the MVP narrow and production-like.
- Do not let model output directly execute GitHub API calls.
- Unknown actions are denied by default.
- Public-facing actions require human approval in the MVP.

## Architecture decisions (resolved)

- LLM provider: OpenRouter Chat Completions with strict JSON schema output.
- Background job mechanism: BullMQ + Redis with separate `apps/worker` process.
- GitHub integration: GitHub App semantics with installation tokens minted just-in-time.
- Credential storage: GitHub App secrets and OpenRouter key in env, not in Postgres. Installation/repository metadata in Postgres.
- UI composition: determined during Phase 7 implementation.
