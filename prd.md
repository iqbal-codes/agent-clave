# Product Requirements Document

# RunGuard MVP — AI Agent Control Plane for GitHub Issue Triage

## 1. Product Summary

**RunGuard** is a human-in-the-loop AI agent control plane that helps teams safely run AI agents on operational workflows.

The MVP focuses on **GitHub issue triage**. When a new GitHub issue is created, RunGuard receives the webhook, creates an agent run, uses an AI agent to analyze the issue, converts the model output into proposed actions, evaluates those actions against policies, routes risky actions to human approval, executes approved actions back to GitHub, and records every step through traces, audit logs, and evaluation metrics.

RunGuard is not positioned as a replacement for Claude Code, GitHub Copilot, LangGraph, or multi-agent orchestrators. Instead, RunGuard is the **governance, approval, execution-control, and observability layer** between AI agents and external business tools.

---

## 2. One-liner

**RunGuard is a human-in-the-loop control plane that lets teams safely run AI agents on GitHub workflows, starting with issue triage.**

---

## 3. Product Vision

AI agents are becoming capable of performing real work across engineering and business systems. However, businesses need control before allowing agents to act on production tools.

RunGuard enables teams to safely operationalize AI agents by providing:

- Policy enforcement
- Human approval workflows
- Guardrails
- Proposed-action validation
- Execution control
- Run traces
- Audit logs
- Cost and latency tracking
- Evaluation metrics

The MVP demonstrates this vision through GitHub issue triage.

---

## 4. Problem Statement

Engineering teams increasingly use AI to summarize issues, classify bugs, suggest next actions, and automate repetitive workflows. However, allowing AI agents to directly mutate production tools like GitHub creates risks.

Teams need answers to the following questions:

- What did the agent do?
- What input did the agent receive?
- What output did the agent produce?
- What action did the agent want to take?
- Was the action allowed, denied, or routed to approval?
- Who approved or rejected it?
- What was executed in GitHub?
- How much did the run cost?
- How long did it take?
- How often are the agent’s suggestions accepted or rejected?

Without a control plane, AI workflows become hard to trust, debug, audit, and scale.

---

## 5. Target Users

### 5.1 Primary Persona: Engineering Manager / Tech Lead

**Goal:** Reduce manual engineering triage work without giving AI agents uncontrolled access to GitHub.

**Pain points:**

- Issue triage is repetitive.
- Labels and priorities are inconsistent.
- AI suggestions are useful but need review.
- There is no easy way to audit AI-generated actions.
- Managers want automation but need control.

---

### 5.2 Secondary Persona: Senior / Staff Engineer

**Goal:** Evaluate whether AI automation can be safely integrated into engineering workflows.

**Pain points:**

- Needs clear system boundaries.
- Needs webhook reliability.
- Needs idempotency.
- Needs policy enforcement.
- Needs observability and auditability.
- Does not want “LLM output directly calls GitHub API.”

---

### 5.3 Tertiary Persona: Startup CTO / Founder

**Goal:** Use AI to improve engineering operations while keeping human control over risky decisions.

**Pain points:**

- Small team has limited bandwidth.
- AI can speed up ops, but mistakes are costly.
- Needs a visible approval and audit process.

---

## 6. MVP Scope

The MVP focuses on one primary workflow:

## GitHub Issue Triage Agent

When a GitHub issue is opened or edited, RunGuard should:

1. Receive the GitHub webhook.
2. Verify the webhook signature.
3. Normalize the issue payload.
4. Create an agent run.
5. Execute the GitHub Issue Triage Agent.
6. Generate structured AI output.
7. Validate the AI output.
8. Convert the output into proposed actions.
9. Evaluate proposed actions using the policy engine.
10. Route actions requiring approval to the approval queue.
11. Allow a human reviewer to approve, reject, or edit actions.
12. Execute approved actions back to GitHub.
13. Record traces, audit logs, latency, cost, and evaluation data.

---

## 7. Non-goals

The MVP will not include:

- Multi-agent orchestration
- Agent team management
- Autonomous coding agent behavior
- PR creation
- PR review
- Auto-merge
- Auto-close issue
- Slack integration
- Telegram integration
- Jira or Linear integration
- Billing
- Complex enterprise RBAC
- Custom policy DSL
- Visual workflow builder
- Browser automation
- Full agent harness loop

The MVP should remain narrow and production-like.

---

## 8. Core Concept

RunGuard is built around this execution model:

```txt
Trigger
↓
Agent Run
↓
Agent Step
↓
Proposed Action
↓
Policy Decision
↓
Human Approval
↓
Executor
↓
Audit Log + Evaluation
```

The MVP follows a mostly linear workflow, but the internal data model should be step-based so the platform can later evolve into a more agentic harness loop.

---

## 9. Primary User Flow

### Flow: GitHub Issue Triage with Human Approval

1. Admin connects a GitHub repository to RunGuard.
2. Admin enables the built-in **GitHub Issue Triage Agent**.
3. A new issue is created in GitHub.
4. GitHub sends an `issues.opened` webhook to RunGuard.
5. RunGuard verifies the webhook signature.
6. RunGuard creates an agent run.
7. The agent analyzes the issue title and body.
8. The agent returns structured output:

```json
{
	"summary": "Safari users cannot click the checkout button, blocking payment completion.",
	"labels": ["bug", "frontend"],
	"priority": "P1",
	"confidence": 0.91,
	"draftComment": "Thanks for reporting this. We are triaging the Safari checkout issue and will investigate the frontend checkout flow."
}
```

9. RunGuard validates the output.
10. RunGuard creates proposed actions:

```txt
github.add_label: bug
github.add_label: frontend
github.add_label: P1
github.post_comment: draft comment
```

11. The policy engine evaluates each proposed action.
12. Actions requiring approval appear in the approval queue.
13. Reviewer approves, rejects, or edits the actions.
14. RunGuard executes approved actions through the GitHub API.
15. RunGuard records audit logs and evaluation metrics.

---

## 10. Functional Requirements

## 10.1 Authentication and Workspace

### Requirement

Users must be able to log in and access a workspace.

### MVP details

- Support user authentication.
- Support one or more organizations.
- Support membership roles.

### Roles

MVP roles:

- **Admin**
  - Can configure agent.
  - Can connect GitHub.
  - Can approve or reject actions.

- **Viewer**
  - Can view runs, traces, audit logs, and evals.
  - Cannot approve actions or change settings.

---

## 10.2 GitHub Integration

### Requirement

RunGuard must integrate with GitHub to receive issue events and execute approved actions.

### MVP capabilities

RunGuard must support:

- GitHub App or OAuth-based connection.
- GitHub webhook receiver.
- GitHub webhook signature verification.
- Receiving `issues.opened` events.
- Receiving `issues.edited` events.
- Reading issue metadata.
- Adding labels to issues.
- Posting comments on issues.

### Supported GitHub events

```txt
issues.opened
issues.edited
```

### Supported GitHub actions

```txt
github.add_label
github.post_comment
```

---

## 10.3 Agent Registry

### Requirement

RunGuard must allow the user to view and configure the GitHub Issue Triage Agent.

### MVP Agent

```txt
Name: GitHub Issue Triage Agent
Purpose: Analyze GitHub issues and propose labels, priority, and draft comment.
Mode: Human-in-the-loop
Status: Active / Paused
Risk level: Medium
```

### Agent settings

The agent should support:

- Name
- Description
- Status
- Model provider
- Model name
- System prompt
- Allowed labels
- Daily budget
- Risk level

---

## 10.4 Agent Run

### Requirement

Each GitHub webhook event should create an agent run.

### Agent run statuses

```txt
queued
running
waiting_for_approval
completed
failed
rejected
cancelled
```

### Agent run should store

- Agent ID
- Organization ID
- Trigger type
- GitHub repository
- GitHub issue number
- Input payload
- Normalized issue data
- Agent output
- Status
- Confidence score
- Estimated cost
- Latency
- Created timestamp
- Completed timestamp

---

## 10.5 Agent Run Steps

### Requirement

RunGuard should record step-level execution traces.

### Step types

```txt
webhook_received
webhook_verified
input_normalized
agent_run_created
llm_call_started
llm_call_completed
llm_output_validated
proposed_actions_created
policy_evaluated
approval_requested
approval_received
action_executed
audit_log_written
run_completed
run_failed
```

### Step should store

- Run ID
- Step index
- Step type
- Status
- Input metadata
- Output metadata
- Error metadata
- Latency
- Cost, if applicable
- Timestamp

---

## 10.6 AI Output Validation

### Requirement

AI output must be validated before proposed actions are created.

The LLM must return structured JSON.

### Required output schema

```json
{
	"summary": "string",
	"labels": ["string"],
	"priority": "P1 | P2 | P3 | none",
	"confidence": "number between 0 and 1",
	"draftComment": "string",
	"reasoningSummary": "string"
}
```

### Validation rules

- Output must be valid JSON.
- Labels must be in the allowed label list.
- Priority must be one of `P1`, `P2`, `P3`, or `none`.
- Confidence must be between `0` and `1`.
- Draft comment must not be empty if `github.post_comment` is proposed.
- Draft comment must pass basic safety checks.
- Invalid output should mark the run as failed and allow retry.

---

## 10.7 Proposed Actions

### Requirement

The agent must not directly execute GitHub actions.

Instead, AI output must be converted into proposed actions.

### Proposed action examples

```txt
github.add_label
github.post_comment
```

### Proposed action statuses

```txt
pending_policy
pending_approval
approved
rejected
edited
executed
failed
denied_by_policy
```

### Proposed action should store

- Run ID
- Action type
- Payload
- Status
- Policy decision
- Risk level
- Created timestamp
- Executed timestamp

---

## 10.8 Policy Engine

### Requirement

RunGuard must evaluate proposed actions against configured policies.

### Policy decisions

```txt
allow
require_approval
deny
```

### MVP default policies

```txt
github.add_label → require_approval
github.post_comment → require_approval
github.close_issue → deny
unknown_action → deny
```

### Policy rules

The MVP can use simple JSON-based rules.

Example:

```json
{
	"action": "github.add_label",
	"effect": "require_approval",
	"conditions": {
		"allowedLabels": [
			"bug",
			"frontend",
			"backend",
			"documentation",
			"needs-triage",
			"P1",
			"P2",
			"P3"
		]
	}
}
```

### Policy engine must

- Evaluate every proposed action.
- Deny unknown actions by default.
- Deny disallowed labels.
- Require approval for public-facing actions.
- Store the policy decision.
- Store the matched policy rule.

---

## 10.9 Approval Queue

### Requirement

Actions requiring human approval must appear in the approval queue.

### Approval card should show

- GitHub issue title
- GitHub issue body summary
- Agent summary
- Suggested labels
- Suggested priority
- Draft comment
- Confidence score
- Risk level
- Policy decision
- Matched policy rule
- Cost estimate
- Link to run trace

### Reviewer actions

Reviewer can:

- Approve action
- Reject action
- Edit action payload before approval
- Add rejection reason

### Rejection reasons

MVP rejection reasons:

```txt
wrong_label
wrong_priority
comment_too_generic
comment_inaccurate
low_confidence
unsafe_action
other
```

---

## 10.10 GitHub Executor

### Requirement

RunGuard must execute approved actions through the GitHub API.

### Executor responsibilities

- Confirm action is approved.
- Confirm user has permission to approve.
- Confirm action payload is valid.
- Execute GitHub API call.
- Store execution result.
- Mark action as executed or failed.
- Write audit log.

### Supported executions

```txt
Add label to GitHub issue
Post comment to GitHub issue
```

---

## 10.11 Audit Logs

### Requirement

RunGuard must record all important system and user actions.

### Events to audit

- GitHub integration connected
- Agent settings changed
- Webhook received
- Agent run created
- LLM output generated
- Proposed action created
- Policy evaluated
- Action approved
- Action rejected
- Action edited
- GitHub action executed
- GitHub action failed
- Run completed
- Run failed

### Audit log should store

- Organization ID
- Actor type
- Actor ID
- Action
- Target type
- Target ID
- Metadata
- Timestamp

### Actor types

```txt
user
agent
system
github
```

---

## 10.12 Evaluation Dashboard

### Requirement

RunGuard must provide basic evaluation metrics for agent quality.

### MVP metrics

- Total runs
- Completed runs
- Failed runs
- Approval rate
- Rejection rate
- Edited-before-approval rate
- Average confidence
- Average latency
- Average estimated cost per run
- Top rejection reasons

### Eval samples

Each approval, rejection, or edit should produce an evaluation sample.

Eval sample should store:

- Run ID
- Proposed action ID
- Agent output
- Final approved or edited payload
- Reviewer decision
- Rejection reason
- Reviewer note
- Timestamp

---

## 11. UX Requirements

## 11.1 Dashboard

Dashboard should show:

- Active agent status
- Runs today
- Pending approvals
- Approval rate
- Rejection rate
- Average latency
- Estimated cost today

---

## 11.2 Agents Page

Agents page should show:

- Agent name
- Status
- Risk level
- Runs today
- Approval rate
- Last run timestamp

MVP may only show one agent: GitHub Issue Triage Agent.

---

## 11.3 Agent Detail Page

Agent detail page should include tabs:

```txt
Overview
Runs
Policies
Settings
```

### Overview tab

Show:

- Agent description
- Status
- Risk level
- Model
- Daily budget
- Recent runs

### Runs tab

Show table of runs.

### Policies tab

Show policy rules.

### Settings tab

Allow admin to edit:

- Agent status
- Prompt
- Model
- Allowed labels
- Daily budget

---

## 11.4 Runs Page

Runs page should show a table with:

- Run ID
- Issue title
- Repository
- Status
- Confidence
- Policy decision
- Cost
- Latency
- Created timestamp

---

## 11.5 Run Detail Page

Run detail page is the most important screen.

It should show:

- Run status
- GitHub issue metadata
- Normalized issue input
- Agent output
- Proposed actions
- Policy decisions
- Approval history
- Execution results
- Trace timeline
- Cost and latency
- Error details, if failed

---

## 11.6 Approval Queue

Approval queue should show pending approval cards.

Each card should include:

- Issue title
- Issue summary
- Proposed labels
- Proposed priority
- Draft comment
- Confidence
- Risk level
- Policy matched
- Approve button
- Reject button
- Edit action button

---

## 11.7 Audit Logs Page

Audit logs page should show:

- Timestamp
- Actor
- Action
- Target
- Metadata summary

Filters:

- Actor type
- Action type
- Date range
- Run ID

---

## 11.8 Evals Page

Evals page should show:

- Approval rate
- Rejection rate
- Edited rate
- Average confidence
- Top rejection reasons
- Recent evaluation samples

---

## 12. System Requirements

## 12.1 Reliability

RunGuard should handle duplicate GitHub webhook deliveries idempotently.

### Requirement

If GitHub sends the same event multiple times, RunGuard should not create duplicate agent runs.

### Suggested approach

Store GitHub delivery ID and enforce uniqueness.

---

## 12.2 Async Processing

Webhook requests should not wait for LLM completion.

### Requirement

Webhook receiver should:

1. Verify request.
2. Store event.
3. Create or enqueue run.
4. Return `200 OK`.

Agent execution should happen in a background worker.

---

## 12.3 Security

RunGuard must:

- Verify GitHub webhook signatures.
- Store credentials securely.
- Deny unknown actions by default.
- Prevent agent from directly executing GitHub API calls.
- Require approval for public-facing actions.
- Record audit logs for all important events.

---

## 12.4 Observability

RunGuard should track:

- Webhook received time
- Queue wait time
- LLM latency
- Policy evaluation time
- Approval wait time
- GitHub execution latency
- Error rate
- Estimated LLM cost

---

## 12.5 Cost Tracking

RunGuard should estimate cost per run.

MVP should store:

- Model name
- Input token count, if available
- Output token count, if available
- Estimated cost
- Total cost per run
- Cost per day

---

## 13. Technical Assumptions

Recommended stack:

### Frontend

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Table
- React Hook Form
- Zod

### Backend

- Next.js Route Handlers or Hono
- TypeScript
- PostgreSQL
- Prisma or Drizzle
- BullMQ + Redis or Inngest

### AI

- Provider-agnostic LLM adapter
- OpenAI or Anthropic adapter
- Mock LLM provider for tests
- Zod validation for structured output

### Integration

- GitHub App
- GitHub Webhooks
- GitHub REST API via Octokit

### Testing

- Vitest
- Unit tests for policy engine
- Unit tests for output validation
- Integration test for webhook processing
- Optional Playwright test for approval flow

---

## 14. Data Model

### users

- id
- name
- email
- created_at

### organizations

- id
- name
- slug
- created_at

### memberships

- id
- user_id
- organization_id
- role
- created_at

### github_integrations

- id
- organization_id
- installation_id
- repository_owner
- repository_name
- encrypted_credentials
- webhook_secret_hash
- status
- created_at
- updated_at

### agents

- id
- organization_id
- name
- description
- status
- risk_level
- model_provider
- model_name
- system_prompt
- allowed_labels
- daily_budget_cents
- created_at
- updated_at

### agent_runs

- id
- organization_id
- agent_id
- trigger_type
- trigger_source
- github_delivery_id
- github_repository
- github_issue_number
- status
- input_payload
- normalized_input
- agent_output
- confidence
- total_cost_cents
- total_latency_ms
- created_at
- completed_at

### agent_run_steps

- id
- run_id
- step_index
- type
- status
- input_metadata
- output_metadata
- error_metadata
- cost_cents
- latency_ms
- created_at

### proposed_actions

- id
- run_id
- action_type
- payload
- status
- policy_decision
- matched_policy_rule
- risk_level
- created_at
- executed_at

### approvals

- id
- proposed_action_id
- reviewer_user_id
- status
- original_payload
- edited_payload
- rejection_reason
- reviewer_note
- created_at
- decided_at

### audit_logs

- id
- organization_id
- actor_type
- actor_id
- action
- target_type
- target_id
- metadata
- created_at

### eval_samples

- id
- run_id
- proposed_action_id
- reviewer_decision
- original_agent_output
- final_payload
- rejection_reason
- reviewer_note
- created_at

---

## 15. API Requirements

## 15.1 GitHub Webhook

```txt
POST /api/webhooks/github
```

Responsibilities:

- Verify GitHub signature.
- Parse event.
- Check event type.
- Store delivery ID.
- Create agent run.
- Enqueue background job.
- Return success response.

---

## 15.2 Runs

```txt
GET /api/runs
GET /api/runs/:id
POST /api/runs/:id/retry
```

---

## 15.3 Approvals

```txt
GET /api/approvals
POST /api/approvals/:id/approve
POST /api/approvals/:id/reject
POST /api/approvals/:id/edit
```

---

## 15.4 Agents

```txt
GET /api/agents
GET /api/agents/:id
PATCH /api/agents/:id
```

---

## 15.5 Policies

```txt
GET /api/agents/:id/policies
PATCH /api/agents/:id/policies
```

---

## 15.6 Audit Logs

```txt
GET /api/audit-logs
```

---

## 15.7 Evals

```txt
GET /api/evals/summary
GET /api/evals/samples
```

---

## 16. Success Metrics

## 16.1 Product Metrics

- Number of GitHub issues processed
- Number of proposed actions created
- Approval rate
- Rejection rate
- Edited-before-approval rate
- Average time from issue creation to proposed action
- Average time from proposed action to approval
- Number of executed GitHub actions

---

## 16.2 Technical Metrics

- Webhook processing latency
- Queue processing latency
- LLM execution latency
- GitHub API execution latency
- LLM failure rate
- Invalid AI output rate
- Policy denial rate
- Job retry count
- Average cost per run

---

## 16.3 Portfolio Success Metrics

The project should demonstrate:

- Real GitHub integration
- Signed webhook verification
- Idempotent webhook handling
- Async job processing
- Structured AI output validation
- Policy engine
- Human approval workflow
- GitHub action executor
- Audit logs
- Run traces
- Cost and latency tracking
- Evaluation dashboard
- Clean README
- Architecture documentation
- Demo video under 3 minutes

---

## 17. MVP Acceptance Criteria

The MVP is considered complete when:

1. A user can log in.
2. A user can connect a GitHub repository.
3. RunGuard can receive a GitHub issue webhook.
4. RunGuard verifies the webhook signature.
5. RunGuard creates an agent run from the issue event.
6. The agent generates structured triage output.
7. The output is validated before use.
8. RunGuard creates proposed GitHub actions.
9. Policy engine evaluates each proposed action.
10. Actions requiring approval appear in the approval queue.
11. Reviewer can approve, reject, or edit proposed actions.
12. Approved actions are executed back to GitHub.
13. GitHub issue receives approved labels and comments.
14. RunGuard records trace events for the run.
15. RunGuard records audit logs.
16. RunGuard shows basic evaluation metrics.
17. Duplicate GitHub webhook deliveries do not create duplicate runs.
18. The project has a README, architecture doc, and demo flow.

---

## 18. Demo Script

1. Open RunGuard dashboard.
2. Show GitHub Issue Triage Agent is active.
3. Create a new GitHub issue:

```txt
Title: Checkout button broken on Safari

Body: Users on Safari 17 cannot click the checkout button after adding items to cart. This blocks payment completion.
```

4. GitHub sends webhook to RunGuard.
5. RunGuard creates a new agent run.
6. Open run detail.
7. Show trace timeline.
8. Show AI output:
   - Summary
   - Labels
   - Priority
   - Draft comment
   - Confidence

9. Show proposed actions.
10. Show policy decision: approval required.
11. Approve labels and comment.
12. Return to GitHub.
13. Confirm labels and comment were applied.
14. Return to RunGuard.
15. Show audit log and eval dashboard.

---

## 19. Future Roadmap

### Phase 2: Custom Webhooks

Support generic inbound webhooks so other systems can trigger RunGuard agents.

### Phase 3: Generic HTTP Actions

Support outbound HTTP actions so approved actions can call external SaaS/internal APIs.

### Phase 4: Additional Integrations

Potential integrations:

- Slack
- Linear
- Jira
- Telegram
- Zendesk
- Intercom
- HubSpot
- Internal admin tools

### Phase 5: Agent Harness Mode

Support multi-step agent execution where each tool call is checked by policy, optionally approved, executed, observed, and fed back to the agent.

### Phase 6: Policy Simulation

Allow users to simulate agent behavior and policy decisions before enabling an agent in production.

---

## 20. Final MVP Positioning

RunGuard MVP should be described as:

**A GitHub-integrated AI agent control plane that receives issue webhooks, runs an AI triage agent, converts model output into proposed actions, evaluates those actions with a policy engine, requires human approval, executes approved GitHub actions, and records every step through traces, audit logs, cost tracking, and evaluation metrics.**

The GitHub issue triage workflow is the first use case. The underlying product direction is broader: RunGuard can become an AI agent enablement layer for internal operations, where businesses can safely let AI agents propose and execute work under human and policy control.
