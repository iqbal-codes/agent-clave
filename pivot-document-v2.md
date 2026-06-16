# AgentClave Pivot Document — Update Notes

# Session, Run, Task, Clarification, and Compound Request Model

## 1. Summary of Update

Dokumen pivot sebelumnya sudah mendefinisikan AgentClave sebagai:

> Governed agent runtime for internal business operations.

Update ini menambahkan clarification penting:

- `Conversation Session` bukan sama dengan `Run`.
- `Run` bukan workflow.
- `Run` adalah satu unit pekerjaan operasional yang bisa dilacak, di-approve, dieksekusi, gagal, di-retry, dan diaudit.
- `Task` adalah sub-pekerjaan di dalam satu run.
- `Tool Request` adalah permintaan agent untuk memakai capability/tool tertentu.
- Request ambigu tidak selalu langsung menjadi run.
- Request yang intent-nya jelas tapi field-nya belum lengkap boleh menjadi run dengan status `waiting_for_clarification`.
- User bisa punya banyak pending runs dalam satu chat session.
- Correction sebelum execution merevisi run/task yang sama.
- Correction setelah execution harus menjadi correction run/task baru.

---

## 2. Update Core Mental Model

Tambahkan section ini setelah bagian **Core Concepts**.

### Updated Hierarchy

```txt
Conversation Session
└── Agent Run
    └── Run Task
        └── Tool Request
            └── Tool Execution
```

### Definition

#### Conversation Session

Session adalah container percakapan antara user dan agent.

Session digunakan untuk:

- Chat continuity
- Message history
- Clarification
- Draft plan
- Foreground run
- Pending runs
- User context
- Channel context

User hanya melihat session sebagai chat biasa.

---

#### Agent Run

Run adalah satu unit pekerjaan operasional.

Run dibuat ketika user request sudah cukup jelas untuk dianggap sebagai pekerjaan yang perlu:

- Diproses
- Direncanakan
- Dilacak
- Di-approve
- Dieksekusi
- Diaudit

Run bukan workflow.

Run adalah instance pekerjaan nyata.

Contoh run:

```txt
Check stock for Bakso Halus
Update stock for Bakso Halus to 120
Generate 7-week inventory report
Handle order exception for Bu Rina
```

---

#### Run Task

Task adalah sub-pekerjaan/objective di dalam run.

Satu run bisa punya satu task atau banyak task.

Contoh compound request:

```txt
User:
"Tolong kurangin stok Bakso Halus 10, tambahin Bakso Urat 20, setelah itu kasih laporan 7 minggu terakhir."
```

System:

```txt
Run: compound_inventory_request
├── Task 1: stock_adjustment Bakso Halus -10
├── Task 2: stock_adjustment Bakso Urat +20
└── Task 3: inventory_report last 7 weeks
```

---

#### Tool Request

Tool Request adalah saat agent meminta menggunakan tool tertentu.

Contoh:

```txt
inventory.search_product
inventory.get_stock
inventory.create_stock_adjustment
inventory.get_stock_report
telegram.send_message
approval.request
```

Tool request harus:

- Schema validated
- Checked against allowed tools
- Evaluated by policy
- Logged
- Executed only by runtime executor

---

#### Tool Execution

Tool Execution adalah eksekusi aktual dari tool request.

Agent tidak mengeksekusi API langsung.

Executor yang melakukan call ke internal API.

---

## 3. Update: Run Is Not Workflow

Dokumen sebelumnya perlu ditegaskan:

> Run bukan workflow.

Workflow atau playbook adalah pola kerja/SOP opsional yang bisa membantu agent.

Run adalah eksekusi nyata dari satu request user.

### Correct Model

```txt
Agent = pekerja digital
Tools = kemampuan yang boleh dipakai
Policy = aturan eksekusi
Guardrail = batasan perilaku
Playbook = SOP opsional
Run = pekerjaan nyata
Session = tempat chat berlangsung
```

### n8n vs AgentClave

n8n:

```txt
User maps workflow upfront.
```

AgentClave:

```txt
Admin defines tools, policies, and guardrails.
Agent decides the runtime flow based on user request.
```

---

## 4. Add Concept: Playbook

Tambahkan konsep `Playbook`, tapi jadikan **optional**, bukan MVP blocker.

### Playbook Definition

Playbook adalah SOP ringan untuk task umum.

Contoh:

```txt
Playbook: Stock Adjustment

Goal:
Handle stock adjustment requests safely.

Required information:
- Product identity
- Target quantity or adjustment delta
- Reason

Recommended steps:
1. Search product if name is ambiguous.
2. Check current stock.
3. Ask clarification if multiple products match.
4. Require reason before adjustment.
5. Create proposed stock adjustment.
6. Request manager approval.
7. Execute only after approval.
8. Notify stakeholders.
```

### MVP Decision

Untuk MVP, playbook belum perlu jadi table sendiri.

Cukup simpan sebagai:

- Agent prompt
- Guardrail config
- Tool descriptions
- Policy rules

Future version bisa menambahkan:

```txt
playbooks
playbook_versions
agent_playbooks
```

---

## 5. Update: When to Create Run

Tambahkan section baru: **Run Creation Rules**.

### Rule

> Create run when the request is clear enough to be tracked as operational work.

### Create Run If

Buat run jika minimal salah satu benar:

- User meminta task operasional.
- Agent perlu call tool.
- Agent perlu approval.
- Agent akan menghasilkan proposed action.
- Request punya outcome yang jelas.
- Request perlu audit/trace.

Contoh create run:

```txt
"Cek stok Bakso Halus"
"Update stok Bakso Halus jadi 120"
"Buat laporan stok 7 minggu terakhir"
"Kurangi stok Bakso Halus 10 dan tambah Bakso Urat 20"
"Cek order Bu Rina"
```

### Do Not Create Run Yet If

Jangan create run jika request masih terlalu ambigu dan belum jelas pekerjaan apa yang diminta.

Contoh:

```txt
"Bro beresin stok yang kemarin dong"
"Yang itu tolong update ya"
"Kok stoknya aneh ya"
```

Untuk case ini, simpan di session sebagai `draft_plan` atau `clarification_state`.

---

## 6. Update: Pre-run Clarification vs In-run Clarification

Tambahkan section baru.

### Pre-run Clarification

Pre-run clarification terjadi ketika user request belum cukup jelas untuk dijadikan pekerjaan.

Contoh:

```txt
User:
"Bro beresin stok yang kemarin dong"
```

System:

```txt
No run created.
Session state: clarifying.
Draft plan: unknown inventory request.
```

Agent:

```txt
"Maksudnya mau cek stok, update stok, atau buat laporan? Produk yang mana?"
```

---

### In-run Clarification

In-run clarification terjadi ketika intent sudah jelas, tapi ada field yang belum lengkap.

Contoh:

```txt
User:
"Bro update stok bakso jadi 20."
```

Intent jelas:

```txt
stock_adjustment
```

Tapi product ambiguous.

Agent boleh create run:

```txt
Run type: operational_request
Task type: stock_adjustment
Status: waiting_for_clarification
Missing field: product_id
```

Agent lalu call:

```txt
inventory.search_product({ query: "bakso" })
```

Jika ditemukan 3 produk, agent tanya:

```txt
"Ada 3 produk yang cocok:
1. Bakso Halus
2. Bakso Urat
3. Bakso Solo

Yang mau diupdate jadi 20 yang mana?"
```

---

## 7. Add Concept: Draft Plan

Tambahkan ke section `Conversation Session`.

### Draft Plan

Draft plan adalah rencana sementara sebelum run dibuat.

Digunakan saat request masih belum jelas.

Contoh stored data:

```json
{
	"state": "clarifying",
	"rawRequest": "beresin stok bakso yang kemarin",
	"possibleTasks": ["check_stock", "stock_adjustment", "inventory_report"],
	"missingFields": ["task_type", "product", "quantity_or_period"]
}
```

Draft plan bukan run.

Draft plan bisa berubah menjadi run setelah user memberi informasi yang cukup.

---

## 8. Add Concept: Foreground Run and Pending Runs

Dalam satu conversation session, user bisa loncat-loncat topik.

Karena itu session perlu membedakan:

```txt
foreground_run_id
pending_run_ids
```

### Foreground Run

Run yang sedang aktif dan menunggu respons user saat ini.

Contoh:

```txt
Run #123 sedang waiting_for_clarification:
"Bakso yang mana?"
```

### Pending Run

Run yang belum selesai tapi bukan fokus percakapan saat ini.

Contoh:

```txt
User tiba-tiba tanya:
"Eh order Bu Rina udah dikirim belum?"
```

System:

```txt
Run #123 moved to pending.
Run #124 created for order_status_check.
```

Setelah Run #124 selesai, agent bisa mengingatkan:

```txt
"Order Bu Rina sudah dikirim. Btw, request update stok bakso jadi 20 tadi masih butuh pilihan produk."
```

---

## 9. Update: Do Not Auto-cancel Hanging Runs

Tambahkan aturan ini.

### Rule

> Jangan otomatis cancel run hanya karena user membahas hal lain.

Jika user tidak menjawab clarification dan pindah topik:

```txt
Run status: waiting_for_clarification
Run visibility: pending
```

Run hanya dicancel jika:

1. User eksplisit cancel.
2. Timeout.
3. Request diganti secara jelas.
4. Run sudah superseded oleh run/task baru.

### Cancellation Examples

User explicit cancel:

```txt
"Cancel aja update stok tadi."
```

Status:

```txt
cancelled_by_user
```

Timeout:

```txt
No response for 24 hours.
```

Status:

```txt
expired
```

Request replaced:

```txt
"Gak usah bakso, update pentol aja jadi 50."
```

Possible status:

```txt
superseded
```

---

## 10. Add Routing Rules for New Messages

Tambahkan section baru: **Message Routing Rules**.

Saat message baru masuk, system harus menentukan relasinya dengan session dan run yang ada.

### Routing Priority

```txt
1. If message is from approver and matches pending approval session:
   route to approval session.

2. If foreground run is waiting_for_clarification:
   determine whether message answers the active clarification.
   - If yes, attach to foreground run.
   - If no, create new run or message-only response, then move old run to pending.

3. If user explicitly refers to pending run:
   route message to pending run.

4. If message is a correction to an unexecuted run/task:
   revise same run/task.

5. If message is correction after execution:
   create correction run/task with parent reference.

6. If message is a new operational request:
   create new run.

7. If message is smalltalk:
   save as conversation message only.
```

### Message Relation Types

Optional classifier output:

```txt
answers_active_run
corrects_active_run
cancels_active_run
new_request
refers_pending_run
smalltalk
ambiguous
```

---

## 11. Add Run and Task Statuses

Update status list.

### Agent Run Status

```txt
draft
planning
resolving_context
waiting_for_clarification
waiting_for_confirmation
waiting_for_approval
pending
paused
executing
completed
failed
cancelled
expired
superseded
```

### Agent Run Task Status

```txt
draft
waiting_for_missing_info
waiting_for_clarification
waiting_for_confirmation
waiting_for_approval
queued
executing
completed
failed
cancelled
expired
superseded
```

### Tool Request Status

```txt
draft
pending_policy
allowed
denied
waiting_for_approval
approved
rejected
executing
executed
failed
cancelled
superseded
```

---

## 12. Update: Correction Rules

Tambahkan aturan koreksi.

### Main Rule

```txt
Before external execution:
→ revise same run/task.

After external execution:
→ create correction run/task with parent reference.
```

### Example Before Execution

User:

```txt
"Update stok Bakso Urat jadi 120."
```

Agent creates proposed action.

User:

```txt
"Salah bro, bukan Bakso Urat, tapi Bakso Halus."
```

If action not executed:

```txt
Same run.
Old task/action marked superseded.
New task/action created for Bakso Halus.
Old approval cancelled if already requested.
New approval created if needed.
```

### Example After Execution

If Bakso Urat already updated, then user says:

```txt
"Salah bro, harusnya Bakso Halus."
```

System creates:

```txt
Correction Run
Parent Run: previous stock adjustment run
Tasks:
- reverse Bakso Urat adjustment
- apply Bakso Halus adjustment
```

Requires approval.

---

## 13. Add Compound Request Handling

Tambahkan section baru.

### Compound Request

Satu user message bisa berisi beberapa objectives.

Example:

```txt
"Tolong kurangin stok Bakso Halus 10, tambahin Bakso Urat 20, setelah itu kasih aku laporan untuk 7 minggu terakhir."
```

Recommended structure:

```txt
1 parent run
3 child tasks
```

Example:

```txt
Run #200
Type: compound_operational_request
Summary: Adjust two products and generate 7-week report

Task #1
Type: stock_adjustment
Action: Bakso Halus -10

Task #2
Type: stock_adjustment
Action: Bakso Urat +20

Task #3
Type: inventory_report
Action: Generate 7-week report
Depends on: Task #1 and Task #2
```

### Dependency Rule

If user says:

```txt
"setelah itu"
```

Then later tasks should depend on earlier tasks.

Example:

```txt
Report should be generated after stock adjustment is completed.
```

---

## 14. Update: Task Type and Tool Type

Clarify strictness.

### Tool Type

Tool/action names must be predefined and strict.

Example:

```txt
inventory.search_product
inventory.get_stock
inventory.create_stock_adjustment
inventory.get_stock_report
telegram.send_message
approval.request
```

Agent cannot invent new tools.

Unknown tools must be denied.

### Task Type

Task type can be predefined but flexible.

Predefined examples:

```txt
check_stock
stock_adjustment
inventory_report
purchase_request
order_exception
customer_complaint
general_task
unknown
```

Task type is for observability and planning.

Safety must not rely on task type.

Safety must rely on:

```txt
tool schema
tool permissions
policy engine
approval workflow
executor
```

### Run Type

Run type can be broad.

Examples:

```txt
operational_request
compound_operational_request
general_chat
correction
```

---

## 15. Update: When No Tool Is Called

Tambahkan rules untuk message yang tidak memanggil tool.

### No Run Needed

No run needed for:

```txt
"oke"
"makasih"
"siap"
"bro?"
"bisa bantu?"
```

Save as conversation message only.

### Optional Run

Optional run for operational advice or policy answer:

```txt
"Kalau stok beda 5 pack, perlu approval nggak?"
```

Could be:

```txt
Run type: operational_advice
Tool calls: none
Status: completed
```

For MVP, recommendation:

> Create run only when there is operational request, tool call, approval, or proposed action.

---

## 16. Update Data Model

Tambahkan table `conversation_messages` dan `agent_run_tasks`.

### conversation_sessions

Add fields:

```txt
state
draft_plan
foreground_run_id
pending_run_ids
last_message_at
```

Recommended states:

```txt
idle
clarifying
plan_ready
running
waiting_for_clarification
waiting_for_approval
```

---

### conversation_messages

New table.

```txt
id
session_id
sender_type
sender_id
content
metadata
related_run_id nullable
related_task_id nullable
created_at
```

---

### agent_runs

Update fields:

```txt
id
session_id
workspace_id
agent_id
input_message_id
type
status
summary
plan
parent_run_id nullable
total_cost_cents
total_latency_ms
created_at
completed_at
```

---

### agent_run_tasks

New table.

```txt
id
run_id
task_index
task_type
title
status
plan
depends_on_task_ids
risk_level
requires_approval
created_at
completed_at
```

---

### tool_requests

Update fields:

```txt
id
run_id
task_id nullable
tool_name
payload
status
policy_decision
risk_level
created_at
completed_at
```

---

### approval_sessions

Add fields:

```txt
run_id
task_id nullable
tool_request_id
status
approval_channel
approver_user_id
expires_at
decision
decision_note
created_at
decided_at
```

---

## 17. Update Technical Architecture

Adjust runtime flow to support session-first planning.

### Updated Flow

```txt
Message received
↓
Conversation Router
↓
Determine relation:
- smalltalk
- pre-run clarification
- new run
- answer active run
- correction
- approval response
↓
If pre-run clarification:
  update session draft_plan
  ask clarification
↓
If clear operational request:
  create run
  create task(s)
  start agent runtime
↓
Agent requests tool
↓
Tool Gateway validates + policy checks
↓
Allow / require approval / deny
↓
Pause/resume if approval required
↓
Execute tools
↓
Record trace + audit
```

---

## 18. Update Acceptance Criteria

Add acceptance criteria:

1. System can keep chat seamless while creating internal runs only when needed.
2. Ambiguous request can be stored as session draft plan without creating run.
3. Clear intent with missing field creates run with `waiting_for_clarification`.
4. User clarification can resume the correct run.
5. User changing topic does not auto-cancel pending run.
6. System can create a new run while another run remains pending.
7. User can explicitly cancel a pending run.
8. Pending run can expire after timeout.
9. Correction before execution revises same run/task.
10. Correction after execution creates correction run/task.
11. Compound request can be represented as one parent run with multiple tasks.
12. Tool/action names are strictly controlled by registry.
13. Task types can fallback to `general_task` or `unknown`.
14. Message-only conversation does not always create a run.

---

## 19. Update MVP Scope

### Keep in MVP

- Conversation sessions
- Conversation messages
- Foreground run
- Pending run
- Draft plan
- Agent runs
- Agent run tasks
- Tool requests
- Approval sessions
- Run statuses
- Correction rules
- Basic message routing

### Keep Simple in MVP

- Run/task type classification
- Compound request handling
- Pending run timeout
- Correction handling
- Playbook as prompt/config, not database table

### Post-MVP

- Advanced LLM router
- Playbook versioning
- Multiple foreground runs
- Parallel task execution
- Complex dependency graph
- Semantic memory
- Run replay
- Policy simulation
- Advanced evals

---

## 20. Updated Key Product Principle

Add this principle to the document:

> Session handles understanding. Run handles execution.

Expanded version:

> Conversation sessions make the experience feel like a seamless chat. Runs exist behind the scenes to track operational work, tool calls, approvals, execution, retries, errors, cost, and audit logs.

Another useful line:

> Chat is for humans. Runs are for systems.

---

## 21. Updated Final Recommendation

The pivot document should be adjusted to clarify that AgentClave is not just a workflow runner and not just a chatbot.

It is:

> A session-based governed agent runtime for internal operations.

Final wording:

> AgentClave gives users a seamless chat experience for operational requests, while internally separating conversations, draft plans, runs, tasks, tool requests, approvals, and executions. This allows agents to behave adaptively like operational assistants, while AgentClave keeps every real action controlled, approved, traceable, and auditable.
