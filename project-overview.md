Berikut **Project Overview MVP** untuk portfolio kamu.

# Project Overview — AgentClave

## 1. Product Name

**AgentClave**

## 2. One-liner

**AgentClave is a human-in-the-loop control plane for safely running AI agents on GitHub workflows.**

Dalam bahasa simpel:

> AgentClave membantu engineering team memakai AI agent untuk triage GitHub issue, tapi tetap aman karena semua action penting melewati policy, approval, trace, dan audit log.

---

# 3. Problem

AI agent makin sering dipakai untuk membantu engineering workflow seperti membaca issue, membuat summary, memberi label, atau menyarankan next action.

Masalahnya, agent tidak boleh langsung diberi akses bebas untuk melakukan action di tool produksi seperti GitHub.

Engineering team butuh cara untuk menjawab:

```txt
Apa yang agent lakukan?
Kenapa agent menyarankan action itu?
Action apa yang boleh dilakukan?
Action mana yang harus approval?
Siapa yang approve?
Apakah output agent akurat?
Berapa cost dan latency tiap run?
```

Tanpa governance layer, AI agent rawan:

```txt
Salah memberi label
Salah memberi prioritas
Mengirim komentar yang tidak sesuai
Mengubah issue tanpa review
Tidak ada audit trail
Tidak bisa dievaluasi kualitasnya
```

---

# 4. Solution

**AgentClave** menyediakan control layer antara GitHub dan AI agent.

Flow-nya:

```txt
GitHub Issue Created
        ↓
AgentClave receives webhook
        ↓
AI agent analyzes issue
        ↓
Agent proposes actions
        ↓
Policy engine evaluates actions
        ↓
Human approves/rejects/edits
        ↓
AgentClave executes approved actions on GitHub
        ↓
Audit log + evaluation metrics stored
```

Intinya:

> Agent boleh berpikir dan menyarankan. Tapi AgentClave yang memutuskan apakah action boleh dieksekusi.

---

# 5. Target Users

## Primary User

**Engineering Manager / Tech Lead**

Mereka ingin memakai AI untuk mengurangi kerja manual issue triage, tapi tetap butuh safety dan visibility.

## Secondary User

**Senior/Staff Engineer**

Mereka peduli pada architecture, auditability, policy enforcement, dan integration quality.

## Tertiary User

**Startup CTO / Founder**

Mereka ingin automasi engineering workflow tanpa langsung mengambil risiko besar.

---

# 6. MVP Scope

MVP fokus pada satu workflow utama:

## GitHub Issue Triage Agent

Ketika issue baru dibuat di GitHub, AgentClave akan:

```txt
1. Menerima GitHub webhook
2. Menyimpan event sebagai agent run
3. Memanggil AI agent untuk menganalisis issue
4. Menghasilkan suggested labels, priority, dan draft comment
5. Mengevaluasi proposed actions menggunakan policy engine
6. Mengirim action berisiko ke approval queue
7. Setelah approval, apply label/comment ke GitHub
8. Menyimpan audit log dan evaluation data
```

---

# 7. Main Use Case

## Use Case: Auto-triage GitHub Issue with Human Approval

Contoh issue:

```txt
Title:
Checkout button does not work on Safari

Body:
Users on Safari 17 cannot click the checkout button after adding items to cart.
This blocks payment completion.
```

AI agent menghasilkan:

```json
{
	"summary": "Safari users are unable to click the checkout button, blocking payment completion.",
	"labels": ["bug", "frontend"],
	"priority": "P1",
	"confidence": 0.91,
	"draftComment": "Thanks for reporting this. We are triaging the Safari checkout issue and will investigate the frontend checkout flow."
}
```

AgentClave mengubah output itu menjadi proposed actions:

```txt
Add label: bug
Add label: frontend
Add label: P1
Post GitHub comment
```

Policy engine menentukan:

```txt
Adding labels = require approval
Posting comment = require approval
Closing issue = denied
```

Reviewer melihat action di approval queue, lalu bisa:

```txt
Approve
Reject
Edit before approval
```

Setelah approved, AgentClave menjalankan action ke GitHub.

---

# 8. Core Features

## 8.1 Authentication & Organization

User bisa login dan masuk ke organization workspace.

MVP entities:

```txt
User
Organization
Membership
Role
```

Roles awal:

```txt
Owner
Admin
Reviewer
Viewer
```

Untuk MVP, role bisa sederhana:

```txt
Admin = bisa configure agent dan approve action
Viewer = hanya bisa melihat runs/audit logs
```

---

## 8.2 GitHub Integration

AgentClave bisa connect ke GitHub repo.

MVP capabilities:

```txt
Receive GitHub issue webhook
Verify webhook signature
Store issue event
Read issue title/body
Apply labels
Post comment
```

MVP GitHub events:

```txt
issues.opened
issues.edited
```

MVP GitHub actions:

```txt
github.add_label
github.post_comment
```

---

## 8.3 Agent Registry

User bisa melihat dan configure agent.

Untuk MVP hanya ada satu agent:

```txt
GitHub Issue Triage Agent
```

Agent config:

```txt
Name
Description
Model
System prompt
Allowed labels
Risk level
Daily budget
Status: active/paused
```

---

## 8.4 Agent Run

Setiap webhook/manual trigger membuat satu **agent run**.

Run memiliki status:

```txt
queued
running
waiting_for_approval
completed
failed
rejected
cancelled
```

Run menyimpan:

```txt
Input payload
Normalized issue data
AI output
Confidence
Latency
Estimated cost
Policy decision
Trace events
```

---

## 8.5 Proposed Actions

AI tidak langsung melakukan action.

AI hanya menghasilkan proposed action.

Contoh:

```txt
github.add_label → "bug"
github.add_label → "frontend"
github.post_comment → "Thanks for reporting..."
```

Setiap proposed action punya status:

```txt
pending_approval
approved
rejected
executed
failed
denied_by_policy
```

Ini penting banget untuk menunjukkan maturity sistem.

---

## 8.6 Policy Engine

Policy engine menentukan apakah action boleh dieksekusi.

MVP policy decision:

```txt
allow
require_approval
deny
```

Policy awal:

```txt
github.add_label = require_approval
github.post_comment = require_approval
github.close_issue = deny
unknown_action = deny
```

Contoh rule:

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

---

## 8.7 Approval Queue

Reviewer bisa melihat semua action yang menunggu approval.

Approval card menampilkan:

```txt
Issue title
Issue body summary
Agent suggestion
Proposed labels
Draft comment
Confidence score
Risk level
Policy matched
Cost estimate
Trace link
```

Reviewer bisa:

```txt
Approve
Reject
Edit action payload
Add rejection reason
```

---

## 8.8 Run Trace

Setiap run punya timeline.

Contoh:

```txt
10:31:02 Webhook received
10:31:03 Webhook signature verified
10:31:04 Issue payload normalized
10:31:05 Agent run created
10:31:06 LLM call started
10:31:08 LLM output validated
10:31:09 Proposed actions created
10:31:10 Policy evaluated
10:31:11 Waiting for approval
10:35:22 Reviewer approved actions
10:35:23 GitHub labels applied
10:35:24 GitHub comment posted
10:35:25 Audit log written
```

Ini salah satu bagian paling penting untuk portfolio.

---

## 8.9 Audit Log

Audit log mencatat aktivitas penting.

Contoh:

```txt
Agent run created
Policy evaluated
Action approved
Action rejected
GitHub label applied
GitHub comment posted
Agent configuration changed
Integration connected
```

Audit log harus menyimpan:

```txt
Actor
Action
Target
Timestamp
Metadata
```

Contoh:

```txt
Muhammad approved github.add_label for Issue #42
AgentClave executed github.post_comment on Issue #42
```

---

## 8.10 Evaluation Dashboard

Eval dashboard menunjukkan kualitas agent.

MVP metrics:

```txt
Total runs
Approval rate
Rejection rate
Edited-before-approval rate
Average confidence
Average latency
Average cost per run
Top rejection reasons
```

Setiap reject/edit menjadi feedback sample.

Contoh rejection reason:

```txt
Wrong priority
Wrong label
Comment too generic
Missing context
Low confidence
```

---

# 9. Non-Goals untuk MVP

Supaya project tidak melebar, MVP **tidak akan membangun**:

```txt
Multi-agent orchestration
Visual workflow builder
Slack integration
Telegram integration
Linear/Jira integration
Billing
Complex RBAC
Custom policy DSL
Autonomous PR creation
Auto-close issue
Auto-merge PR
Browser automation
```

Ini penting. Kamu ingin project yang sempit tapi dalam.

---

# 10. Key Screens

## 10.1 Dashboard

Menampilkan overview:

```txt
Runs today
Pending approvals
Approval rate
Rejection rate
Average latency
Estimated cost today
Active agent status
```

---

## 10.2 Agents

List agent.

Untuk MVP:

```txt
GitHub Issue Triage Agent
Status: Active
Risk: Medium
Runs today: 12
Approval rate: 78%
```

---

## 10.3 Agent Detail

Tabs:

```txt
Overview
Runs
Policies
Settings
```

---

## 10.4 Runs

Table semua agent runs:

```txt
Run ID
Issue
Status
Confidence
Policy decision
Cost
Created at
```

---

## 10.5 Run Detail

Halaman paling penting.

Berisi:

```txt
Issue input
Agent output
Proposed actions
Policy decision
Trace timeline
Cost/latency
Approval history
Audit events
```

---

## 10.6 Approval Queue

Halaman untuk reviewer.

Berisi pending action cards:

```txt
Issue
Suggested labels
Draft comment
Confidence
Risk
Approve / Edit / Reject
```

---

## 10.7 Audit Logs

Table aktivitas:

```txt
Timestamp
Actor
Action
Target
Metadata
```

---

## 10.8 Evals

Dashboard kualitas agent:

```txt
Approval rate
Rejection rate
Edited rate
Top rejection reason
Recent eval samples
```

---

# 11. System Architecture

## High-level Architecture

```txt
GitHub
  ↓ webhook
Next.js API Route / Hono API
  ↓
Webhook Verification
  ↓
PostgreSQL
  ↓
Queue Worker
  ↓
LLM Provider
  ↓
Zod Validation
  ↓
Policy Engine
  ↓
Approval Queue
  ↓
GitHub Action Executor
  ↓
Audit Log + Metrics
```

---

# 12. Recommended Tech Stack

## Frontend

```txt
Next.js App Router
React
TypeScript
Tailwind CSS
shadcn/ui
TanStack Table
React Hook Form
Zod
```

## Backend

```txt
Next.js Route Handlers or Hono
TypeScript
Prisma or Drizzle
PostgreSQL
BullMQ + Redis
```

## AI

```txt
Provider-agnostic LLM adapter
OpenAI or Anthropic
Mock LLM provider for tests
Zod schema validation for output
```

## Integration

```txt
GitHub App
GitHub Webhooks
GitHub REST API or Octokit
```

## Infra

```txt
Docker Compose
PostgreSQL
Redis
Vercel/Railway/Fly.io/Render
```

## Testing

```txt
Vitest
Playwright optional
MSW optional
```

---

# 13. Core Data Model

Minimal tables:

```txt
users
organizations
memberships
github_integrations
agents
agent_runs
run_events
proposed_actions
approvals
audit_logs
eval_samples
```

Paling penting:

```txt
agent_runs
proposed_actions
approvals
audit_logs
```

Karena empat table ini membuktikan sistem kamu bukan cuma AI wrapper.

---

# 14. API Overview

## GitHub Webhook

```txt
POST /api/webhooks/github
```

Tugas:

```txt
Verify signature
Parse issue event
Create agent run
Enqueue job
```

---

## Agent Runs

```txt
GET /api/runs
GET /api/runs/:id
POST /api/runs/:id/retry
```

---

## Approvals

```txt
GET /api/approvals
POST /api/approvals/:id/approve
POST /api/approvals/:id/reject
POST /api/approvals/:id/edit
```

---

## Agent Settings

```txt
GET /api/agents
GET /api/agents/:id
PATCH /api/agents/:id
```

---

## Audit Logs

```txt
GET /api/audit-logs
```

---

## Evals

```txt
GET /api/evals/summary
GET /api/evals/samples
```

---

# 15. Main Engineering Challenges

Ini bagian yang harus kamu highlight di portfolio.

## 15.1 Webhook Verification

Pastikan webhook benar-benar dari GitHub.

Portfolio value:

```txt
Security awareness
Integration correctness
Production mindset
```

---

## 15.2 Idempotent Webhook Processing

GitHub bisa mengirim event lebih dari sekali.

Sistem harus mencegah duplicate runs.

Portfolio value:

```txt
Distributed systems awareness
Reliability
Real-world backend thinking
```

---

## 15.3 Async Agent Execution

Webhook tidak boleh menunggu LLM terlalu lama.

Flow yang benar:

```txt
Webhook received
Save event
Return 200
Process agent run in background job
```

Portfolio value:

```txt
Queue architecture
Latency control
Resilience
```

---

## 15.4 Strict AI Output Validation

LLM output harus divalidasi.

```txt
LLM output → Zod schema → proposed actions
```

Kalau invalid:

```txt
Mark run as failed
Log error
Allow retry
```

Portfolio value:

```txt
AI reliability
Defensive programming
```

---

## 15.5 Policy Enforcement

Agent tidak boleh langsung execute GitHub API.

Flow yang benar:

```txt
AI output
  ↓
Proposed action
  ↓
Policy engine
  ↓
Approval
  ↓
Executor
```

Portfolio value:

```txt
Security
Governance
Separation of concerns
```

---

## 15.6 Auditability

Semua keputusan penting harus tercatat.

Portfolio value:

```txt
Enterprise readiness
Compliance mindset
Debuggability
```

---

# 16. Success Metrics

## Product Metrics

```txt
Issue triage time reduced
Approval rate
Rejection rate
Edited-before-approval rate
Number of runs completed
Number of actions executed
```

## Technical Metrics

```txt
Webhook processing latency
Agent execution latency
LLM failure rate
Policy denial rate
Average cost per run
Job retry count
```

## Portfolio Metrics

```txt
End-to-end GitHub integration works
Readable architecture doc
Clean database schema
Tested policy engine
Demo video under 3 minutes
Production-like README
```

---

# 17. Demo Scenario

Demo flow terbaik:

```txt
1. Open AgentClave dashboard.
2. Show active GitHub Issue Triage Agent.
3. Create new GitHub issue: “Checkout button broken on Safari.”
4. GitHub sends webhook to AgentClave.
5. Run appears in AgentClave as “waiting for approval.”
6. Open run detail.
7. Show trace timeline.
8. Show AI suggestion: labels, priority, draft comment.
9. Show policy decision: require approval.
10. Approve action.
11. Go back to GitHub.
12. Labels and comment are applied.
13. Return to AgentClave.
14. Show audit log and eval metrics.
```

Ini cukup untuk bikin interviewer paham value-nya dalam 3 menit.

---

# 18. Project Pitch untuk README

Bisa kamu pakai langsung:

```md
# AgentClave

AgentClave is a human-in-the-loop control plane for safely running AI agents on GitHub workflows.

The MVP focuses on GitHub issue triage. When a new issue is created, AgentClave receives a GitHub webhook, runs an AI triage agent, validates the output, evaluates proposed actions against policies, routes risky actions to human approval, and executes approved labels/comments back to GitHub.

## Why this exists

AI agents can move fast, but production workflows require visibility, control, and accountability. AgentClave adds the missing governance layer: policy enforcement, approval workflows, execution traces, audit logs, and evaluation metrics.

## Core Features

- GitHub App integration
- Signed webhook verification
- Async agent execution
- Strict AI output validation
- Proposed actions instead of direct execution
- Policy engine
- Human approval queue
- GitHub label/comment executor
- Run trace timeline
- Audit logs
- Evaluation dashboard
```

---

# 19. Final MVP Definition

Versi paling tajam:

> **AgentClave MVP is a GitHub-integrated AI agent governance platform that receives issue webhooks, runs an AI triage agent, converts model output into proposed actions, evaluates those actions with a policy engine, requires human approval, executes approved GitHub actions, and records every step in trace, audit, and evaluation logs.**

Itu project yang legit.

Ini bukan “AI app.”
Ini adalah **production-style AI workflow system**.
