# Product Pivot Document

# From RunGuard GitHub Agent Control Plane to AgentClave Internal Ops Agent Runtime

## 1. Background

The initial PRD defined **RunGuard** as a human-in-the-loop AI agent control plane for GitHub issue triage.

The original MVP focused on:

- GitHub issue webhook
- AI issue triage agent
- Suggested labels and comments
- Policy evaluation
- Human approval
- GitHub action execution
- Audit logs and evaluation metrics

This was a strong engineering portfolio idea because it demonstrated webhook handling, async jobs, AI output validation, policy enforcement, approval workflow, and auditability.

However, after further product exploration, the direction has shifted.

The stronger opportunity is not only engineering workflow governance, but **internal business operations**: helping companies safely give AI agents access to internal tools, while keeping actions controlled, approved, and auditable.

The product should evolve from:

> AI governance for GitHub workflows

Into:

> A governed AI agent runtime for internal business operations

---

## 2. Pivot Summary

## Previous Direction

**RunGuard**
A human-in-the-loop control plane for safely running AI agents on GitHub workflows.

## New Direction

**AgentClave** — working name
A governed agent runtime that lets businesses give AI agents controlled access to internal tools through typed tools, policies, approvals, guardrails, execution control, and audit trails.

## New One-liner

**AgentClave helps businesses move from AI that only answers questions to AI agents that can safely get work done inside internal operations.**

## Short Description

AgentClave allows a business owner or admin to define:

- What an AI agent is responsible for
- What tools the agent can access
- What actions the agent can perform
- Which actions require approval
- Who should approve risky actions
- What guardrails the agent must follow
- How every step should be traced and audited

The agent receives natural-language requests from channels such as Telegram or custom webhooks, decides what steps to take at runtime, uses approved tools, pauses when approval is required, resumes after approval, executes actions through internal APIs, and records every step.

---

## 3. Why Pivot?

The GitHub issue triage MVP is useful for demonstrating engineering capability, but it is narrow and engineering-centric.

The new direction is more aligned with **LabQ’s broader positioning**:

> LabQ helps businesses clean up messy internal operations through software, automation, and AI-assisted workflows.

Internal business operations often become chaotic because teams rely on:

- Chat messages
- Manual spreadsheets
- Informal approvals
- Repeated admin work
- Fragmented internal tools
- Untracked operational decisions

AI agents can help, but businesses cannot safely allow agents to directly mutate internal systems without control.

This creates a stronger product thesis:

> Businesses do not just need AI chatbots. They need a safe way for AI agents to operate internal tools.

---

## 4. Core Insight

Most companies start their AI adoption with:

- Internal knowledge Q&A
- Document search
- Meeting summaries
- Report drafting
- Customer support AI
- Sales assistants

But the next step is more valuable:

> AI agents that can safely perform operational work.

However, action-taking agents introduce risk:

- Wrong data updates
- Unauthorized actions
- Incorrect API calls
- Missing approval
- No audit trail
- No accountability
- No visibility into what the agent did

AgentClave addresses this gap by acting as the controlled runtime between AI agents and internal tools.

---

## 5. Updated Product Category

AgentClave should not be positioned as:

- A chatbot
- A workflow builder
- An n8n competitor
- A generic automation tool
- A LangGraph competitor
- A Claude Code competitor
- A multi-agent orchestration platform

AgentClave should be positioned as:

> **A governed agent runtime for internal operations.**

Alternative category names:

- AI Agent Control Layer
- Agentic Operations Layer
- Governed Agent Runtime
- AI Action Governance Layer
- Internal Ops Agent Runtime

Recommended positioning:

> **AgentClave is a governed agent runtime that lets businesses safely give AI agents access to internal tools through typed tools, approval policies, guardrails, and audit logs.**

---

## 6. Difference from n8n

n8n is a workflow automation builder.

In n8n, the user maps the workflow upfront:

```txt
Telegram Trigger
↓
AI Node
↓
IF Node
↓
HTTP Request
↓
Telegram Reply
```

AgentClave works differently.

In AgentClave, the admin maps capabilities and constraints upfront:

```txt
Agent role
Allowed tools
Guardrails
Approval policies
Action schemas
Credentialed executors
```

Then the agent decides the workflow at runtime based on the request.

Example:

```txt
User request:
"Stok Bakso Solo beda. Hasil opname ada 120 pack, tapi di sistem masih 80. Ada 10 pack rusak karena freezer mati."

Agent decides:
1. Search product
2. Get current stock
3. Interpret discrepancy
4. Prepare stock adjustment
5. Prepare damage note
6. Request manager approval
7. Execute approved action
8. Notify stakeholders
```

Core distinction:

> n8n maps the workflow upfront. AgentClave maps the tools, policies, and constraints upfront. The agent decides the workflow at runtime.

---

## 7. Updated Product Thesis

The old thesis:

> AI agents need governance before acting on GitHub workflows.

The new thesis:

> Businesses need a safe runtime for AI agents to operate internal tools without giving them uncontrolled access.

AgentClave exists because businesses need to move beyond read-only AI assistants into action-taking AI agents, but they need:

- Tool access control
- Approval checkpoints
- Guardrails
- Typed actions
- Execution safety
- Audit trails
- Observability
- Cost tracking

---

## 8. Updated Target Users

## Primary User: Business Owner / Operations Manager

They manage messy internal operations and want AI to reduce manual admin work without losing control.

Pain points:

- Operational requests happen through chat.
- Staff often submit incomplete or messy requests.
- Internal tools are underused because chat is faster.
- Approvals are informal.
- Changes are not properly logged.
- Manual follow-up wastes time.
- They want AI assistance but do not trust fully autonomous actions.

---

## Secondary User: Internal Tools Builder / Software Engineer

They build internal systems and want to add AI capabilities safely.

Pain points:

- Need to connect AI to internal APIs.
- Need approval workflow before write actions.
- Need audit logs.
- Need typed tool definitions.
- Need to prevent LLMs from calling arbitrary endpoints.
- Need traceability for every action.

---

## Tertiary User: LabQ Client

Small to mid-sized businesses whose operations are becoming chaotic and need internal systems plus AI-assisted workflows.

Examples:

- Frozen food business
- F&B production business
- Distributor
- Small warehouse operation
- Service business
- Admin-heavy company
- Sales/ops team working from chat

---

## 9. Updated MVP

## MVP Name

**AgentClave** — working name

## MVP Use Case

**Telegram Inventory Ops Agent**

## MVP Scenario

A warehouse staff member sends a natural-language message to a Telegram bot:

```txt
"Stok Bakso Solo beda. Hasil opname hari ini 120 pack, tapi di sistem masih 80. Ada 10 pack rusak karena freezer mati semalam. Tolong beresin."
```

AgentClave should:

1. Receive the Telegram webhook.
2. Create an agent run.
3. Understand the user request.
4. Search the product.
5. Check current stock.
6. Identify the requested stock correction.
7. Identify the damage note.
8. Prepare proposed actions.
9. Check policy.
10. Pause for manager approval.
11. Send approval request to manager via Telegram.
12. Resume after manager approval.
13. Execute approved action through internal inventory API.
14. Notify staff and manager.
15. Record trace, audit log, cost, latency, approval record, and execution result.

---

## 10. Updated MVP Flow

```txt
Telegram message received
↓
AgentClave inbound connector receives webhook
↓
Agent run created
↓
Inventory Ops Agent interprets request
↓
Agent requests tool: inventory.search_product
↓
Policy check: allow
↓
Tool executed
↓
Agent requests tool: inventory.get_stock
↓
Policy check: allow
↓
Tool executed
↓
Agent prepares proposed action: inventory.create_stock_adjustment
↓
Policy check: require_manager_approval
↓
Run paused
↓
Approval request sent to manager via Telegram
↓
Manager replies approve
↓
Approval webhook received
↓
Approval session verified
↓
Run resumed
↓
Executor calls internal inventory API
↓
Execution result stored
↓
Notification sent to staff and manager
↓
Audit log and run trace completed
```

---

## 11. Updated Core Concepts

## 11.1 Workspace

A workspace represents one business or client.

Workspace contains:

- Agents
- Connectors
- Tools
- Policies
- Approvers
- Audit logs
- Runs

---

## 11.2 Agent

An agent is a domain-specific AI worker.

MVP agent:

```txt
Inventory Ops Agent
```

Agent configuration:

- Name
- Role
- Purpose
- System prompt
- Model
- Allowed tools
- Guardrails
- Approval policies
- Owner
- Risk level
- Budget limit

Example:

```txt
You are an Inventory Ops Agent.
You help warehouse staff handle inventory-related requests through Telegram.
You may search products, check stock, create proposed stock adjustments, request approval, and notify stakeholders.
You must never update stock without manager approval.
You must never guess SKU.
If product identity is ambiguous, ask a clarification question.
Every stock adjustment must include a reason.
```

---

## 11.3 Connector

A connector is a controlled integration point.

Connector types:

```txt
Inbound Connector
Approval Connector
Action Connector
Notification Connector
```

For MVP:

```txt
Telegram Connector
Internal Inventory API Connector
```

Telegram can be used for:

- Receiving staff requests
- Sending approval requests
- Receiving manager approval
- Sending notifications

Internal Inventory API is used for:

- Searching products
- Reading stock
- Creating stock adjustment

---

## 11.4 Tool

A tool is an action or query the agent can request.

Tools must be explicitly defined by the owner/admin.

MVP tools:

```txt
inventory.search_product
inventory.get_stock
inventory.create_stock_adjustment
approval.request
telegram.send_message
```

The agent cannot call arbitrary APIs. It can only request approved tools.

Each tool should define:

- Name
- Description
- Input schema
- Output schema
- Risk level
- Executor
- Required permission
- Default policy

Example:

```json
{
	"name": "inventory.create_stock_adjustment",
	"description": "Create a stock adjustment request for a product SKU",
	"inputSchema": {
		"sku": "string",
		"newQuantity": "number",
		"reason": "string",
		"notes": "string"
	},
	"riskLevel": "high",
	"defaultPolicy": "require_manager_approval"
}
```

---

## 11.5 Policy

Policy decides whether a tool request can be executed.

Policy decisions:

```txt
allow
require_approval
deny
```

MVP policies:

```txt
inventory.search_product → allow
inventory.get_stock → allow
inventory.create_stock_adjustment → require_manager_approval
inventory.delete_product → deny
telegram.send_message → allow
unknown_tool → deny
```

Policy must be enforced outside the LLM.

Prompt instructions are not enough. The system must block unsafe tool calls at runtime.

---

## 11.6 Approval Session

When a tool request requires approval, AgentClave pauses the run.

Approval session contains:

- Run ID
- Tool request ID
- Proposed action payload
- Required approver
- Approval channel
- Expiration time
- Status
- Decision
- Decision timestamp

Approval statuses:

```txt
pending
approved
rejected
expired
cancelled
```

---

## 11.7 Executor

Executor is responsible for performing approved tool calls.

The AI agent does not directly execute internal APIs.

Flow:

```txt
Agent requests tool
↓
Policy allows or requires approval
↓
Executor validates payload
↓
Executor uses stored credential
↓
Executor calls internal API
↓
Result is returned to agent/runtime
↓
Trace and audit log are recorded
```

---

## 11.8 Agent Run

An agent run is one task instance created from an inbound request.

Run statuses:

```txt
queued
running
waiting_for_approval
completed
failed
rejected
cancelled
expired
```

Agent run stores:

- Agent ID
- Workspace ID
- Trigger source
- Requester
- Input message
- Normalized intent
- Status
- Total latency
- Total cost
- Started at
- Completed at

---

## 11.9 Agent Run Step

Every step should be recorded.

Step types:

```txt
message_received
agent_run_created
intent_parsed
tool_requested
policy_evaluated
tool_executed
approval_requested
approval_received
run_resumed
execution_completed
notification_sent
run_completed
run_failed
```

---

## 11.10 Audit Log

Audit log records important events.

Audit events:

- Agent received request
- Tool requested
- Policy evaluated
- Approval requested
- Approval approved/rejected
- Internal API executed
- Notification sent
- Agent completed run
- Agent failed run
- Agent configuration changed
- Tool configuration changed
- Policy changed

---

## 12. Updated Non-goals

The MVP will not include:

- n8n-style visual workflow builder
- Drag-and-drop automation canvas
- Multiple agents
- Multi-agent orchestration
- Full inventory management system
- WhatsApp integration
- Slack integration
- GitHub integration
- Billing
- Complex role-based access control
- Advanced policy DSL
- Autonomous actions without approval
- Complex memory system
- Voice interface
- Human replacement positioning

The product should stay focused on:

> One agent, one channel, one internal tool domain, one approval flow.

---

## 13. Updated MVP Feature Scope

## Must-have

1. Workspace setup
2. Telegram inbound webhook
3. Telegram outbound message
4. Inventory Ops Agent
5. Tool registry
6. Tool schemas
7. Internal inventory API connector
8. Agent run loop
9. Policy engine
10. Approval session
11. Telegram approval flow
12. Internal API executor
13. Run trace
14. Audit log
15. Cost and latency tracking
16. Basic dashboard

---

## Should-have

1. Agent configuration screen
2. Tool configuration screen
3. Policy configuration screen
4. Approval queue dashboard
5. Manual run testing
6. Mock mode for internal API
7. Retry failed execution
8. Rejection reason tracking

---

## Nice-to-have

1. Eval dashboard
2. Policy simulation
3. Custom webhook connector
4. Generic HTTP action connector
5. Multi-channel notification
6. Role-based approver rules
7. Tool execution replay
8. Run export

---

## 14. Updated Main Screens

## 14.1 Dashboard

Shows:

- Runs today
- Pending approvals
- Completed runs
- Failed runs
- Average latency
- Estimated cost today
- Top requested tools
- Approval rate

---

## 14.2 Agents Page

Shows:

- Agent name
- Status
- Connected channel
- Allowed tools
- Risk level
- Runs today
- Last run

MVP has one agent:

```txt
Inventory Ops Agent
```

---

## 14.3 Agent Detail Page

Tabs:

```txt
Overview
Prompt
Tools
Policies
Runs
Settings
```

---

## 14.4 Tools Page

Shows available tools:

```txt
inventory.search_product
inventory.get_stock
inventory.create_stock_adjustment
approval.request
telegram.send_message
```

Each tool page shows:

- Description
- Input schema
- Output schema
- Risk level
- Executor type
- Default policy
- Recent executions

---

## 14.5 Runs Page

Shows:

- Run ID
- Requester
- Input summary
- Agent
- Status
- Current step
- Cost
- Latency
- Created at

---

## 14.6 Run Detail Page

Most important page.

Shows:

- Original Telegram message
- Parsed intent
- Tool calls
- Policy decisions
- Approval session
- Execution result
- Notifications sent
- Trace timeline
- Cost and latency
- Error details

---

## 14.7 Approval Queue

Shows pending approvals.

Approval card includes:

- Requester
- Original message
- Proposed action
- Current data
- New data
- Reason
- Risk level
- Required approver
- Approve button
- Reject button

---

## 14.8 Audit Logs Page

Shows:

- Timestamp
- Actor
- Action
- Target
- Metadata
- Run link

---

## 15. Updated Data Model

## workspaces

- id
- name
- slug
- created_at

## users

- id
- name
- email
- role
- created_at

## workspace_memberships

- id
- workspace_id
- user_id
- role
- created_at

## agents

- id
- workspace_id
- name
- description
- status
- system_prompt
- model_provider
- model_name
- risk_level
- budget_limit_cents
- created_at
- updated_at

## connectors

- id
- workspace_id
- type
- name
- provider
- config
- encrypted_credentials
- status
- created_at
- updated_at

## tools

- id
- workspace_id
- name
- description
- input_schema
- output_schema
- risk_level
- executor_type
- executor_config
- default_policy
- created_at
- updated_at

## agent_tools

- id
- agent_id
- tool_id
- enabled
- created_at

## policies

- id
- workspace_id
- agent_id
- tool_id
- effect
- conditions
- approver_role
- created_at
- updated_at

## agent_runs

- id
- workspace_id
- agent_id
- trigger_source
- requester_id
- requester_metadata
- input_message
- parsed_intent
- status
- total_cost_cents
- total_latency_ms
- created_at
- completed_at

## agent_run_steps

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

## tool_requests

- id
- run_id
- tool_id
- tool_name
- payload
- status
- policy_decision
- risk_level
- created_at
- completed_at

## tool_executions

- id
- tool_request_id
- executor_type
- request_payload
- response_payload
- status
- latency_ms
- error_metadata
- created_at

## approval_sessions

- id
- run_id
- tool_request_id
- status
- approval_channel
- approver_user_id
- approver_metadata
- request_message
- decision
- decision_note
- expires_at
- created_at
- decided_at

## audit_logs

- id
- workspace_id
- actor_type
- actor_id
- action
- target_type
- target_id
- metadata
- created_at

---

## 16. Updated Technical Architecture

```txt
Telegram Bot
  ↓ webhook
AgentClave API
  ↓
Webhook Verification
  ↓
Agent Run Created
  ↓
Agent Runtime Loop
  ↓
Tool Request
  ↓
Policy Engine
  ↓
Decision:
  - allow → Executor
  - require approval → Approval Session
  - deny → Block
  ↓
Telegram Approval Message
  ↓
Manager Approval Webhook
  ↓
Resume Run
  ↓
Internal Inventory API Executor
  ↓
Execution Result
  ↓
Notification
  ↓
Trace + Audit Log
```

---

## 17. Updated Technical Requirements

## 17.1 Agent Runtime Loop

The runtime should support multiple tool calls within one run.

Basic loop:

```txt
Agent observes input/context
↓
Agent decides next tool request
↓
Runtime validates request
↓
Policy engine evaluates request
↓
Runtime executes, pauses, or denies
↓
Tool result is returned to agent
↓
Agent continues or completes
```

The MVP does not need advanced planning, but it should support more than one tool call per run.

---

## 17.2 Tool Call Safety

Every tool request must be:

- Schema validated
- Checked against agent’s allowed tools
- Evaluated by policy engine
- Logged
- Executed only by the runtime executor

---

## 17.3 Approval Pause and Resume

The system must support pausing an agent run when approval is required.

Requirements:

- Store pending tool request
- Store approval session
- Notify approver
- Resume run after approval
- Reject or cancel run if approval is rejected or expired

---

## 17.4 Credential Safety

The agent must not see raw credentials.

The executor owns credentials.

Requirements:

- Store connector credentials securely
- Never expose credentials to LLM prompt
- Executor injects credentials only when making API calls
- Audit every credentialed action

---

## 17.5 Idempotency

The system should avoid duplicate execution.

Examples:

- Duplicate Telegram webhook
- Manager replies approve twice
- Internal API retry happens after timeout

Suggested approach:

- Store message IDs
- Store approval session IDs
- Store tool request execution status
- Use idempotency keys when calling internal API

---

## 18. Updated Success Metrics

## Product Metrics

- Number of operational requests handled
- Number of tool requests created
- Number of approved actions
- Number of rejected actions
- Average approval time
- Number of successful internal API executions
- Number of clarification questions asked
- Number of failed or blocked actions

## Technical Metrics

- Agent run latency
- Tool execution latency
- Approval wait time
- LLM cost per run
- Invalid tool request rate
- Policy denial rate
- Duplicate webhook handling rate
- Internal API execution failure rate

## Portfolio Metrics

The project should demonstrate:

- Agent runtime loop
- Telegram integration
- Natural-language request parsing
- Tool registry
- Typed tool schemas
- Policy enforcement
- Human-in-the-loop approval
- Pause and resume execution
- Credentialed internal API executor
- Run trace
- Audit log
- Cost and latency tracking
- Clean architecture documentation
- Demo video under 3 minutes

---

## 19. Updated Acceptance Criteria

MVP is complete when:

1. Admin can configure an Inventory Ops Agent.
2. Admin can define tools available to the agent.
3. Admin can define policy for each tool.
4. Telegram bot can receive staff messages.
5. Telegram webhook can create an agent run.
6. Agent can parse an inventory-related request.
7. Agent can request `inventory.search_product`.
8. Agent can request `inventory.get_stock`.
9. Agent can propose `inventory.create_stock_adjustment`.
10. Runtime validates all tool requests.
11. Policy engine allows read-only tools.
12. Policy engine requires manager approval for stock adjustment.
13. Runtime pauses the run while waiting for approval.
14. Manager receives approval request via Telegram.
15. Manager can approve or reject via Telegram.
16. Runtime resumes approved runs.
17. Executor calls internal inventory API.
18. Staff and manager receive success/failure notification.
19. Run detail shows all steps.
20. Audit logs show all important actions.
21. Duplicate approval does not execute the same action twice.
22. Credentials are never exposed to the agent prompt.
23. The project has README, technical design, and demo script.

---

## 20. Updated Demo Script

1. Open AgentClave dashboard.
2. Show Inventory Ops Agent.
3. Show tools:
   - search product
   - get stock
   - create stock adjustment
   - request approval
   - send Telegram message

4. Show policy:
   - read tools allowed
   - stock adjustment requires manager approval

5. Staff sends Telegram message:

```txt
"Stok Bakso Solo beda. Hasil opname hari ini 120 pack, di sistem masih 80. Ada 10 pack rusak karena freezer mati semalam. Tolong beresin."
```

6. Open AgentClave run detail.
7. Show trace:
   - message received
   - intent parsed
   - product searched
   - current stock checked
   - proposed adjustment created
   - approval required

8. Manager receives Telegram approval request.
9. Manager replies approve.
10. Run resumes.
11. Executor calls internal inventory API.
12. Staff and manager receive success notification.
13. Dashboard shows completed run.
14. Audit log shows full trail.

---

## 21. What Happens to GitHub MVP?

The GitHub issue triage use case should not be discarded.

It becomes a future integration or portfolio extension.

New roadmap:

## Phase 1

Telegram Inventory Ops Agent

## Phase 2

Custom webhook connector and generic HTTP action connector

## Phase 3

GitHub Issue Triage Agent

## Phase 4

Finance Ops Agent

## Phase 5

Support Ops Agent

## Phase 6

Multi-agent support and policy simulation

This keeps GitHub as a valid use case, but no longer makes it the core MVP.

---

## 22. Updated Final Positioning

AgentClave should be positioned as:

> **A governed agent runtime for internal business operations.**

Longer version:

> **AgentClave lets businesses give AI agents controlled access to internal tools. Owners define tools, policies, approval rules, and guardrails. Agents decide the workflow at runtime, while AgentClave validates tool requests, pauses for approval, executes safe actions, and records every step through traces and audit logs.**

Business-facing version:

> **AgentClave helps internal teams handle messy operational requests from chat, turn them into safe actions, get approval when needed, and update internal systems with a complete audit trail.**

Engineering-facing version:

> **AgentClave is a step-based agent runtime with typed tools, policy enforcement, human-in-the-loop approval, credentialed executors, observability, and audit logs.**

---

## 23. Key Pivot Decision

The product should no longer be described as:

> A GitHub AI agent control plane.

It should now be described as:

> A governed AI agent runtime for internal operations, starting with Telegram-based inventory operations.

This pivot better aligns with LabQ’s mission, creates a clearer business use case, and differentiates the product from both n8n-style workflow builders and generic customer-facing AI agents.
