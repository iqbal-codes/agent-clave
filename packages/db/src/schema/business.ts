import {
	pgTable,
	text,
	timestamp,
	boolean,
	index,
	integer,
	jsonb,
	unique,
	pgEnum,
} from "drizzle-orm/pg-core";

// ── Enums ──────────────────────────────────────────────────────

export const runStatusEnum = pgEnum("run_status", [
	"queued",
	"running",
	"waiting_for_approval",
	"completed",
	"failed",
	"rejected",
	"cancelled",
	"expired",
]);

export const toolRequestStatusEnum = pgEnum("tool_request_status", [
	"pending_policy",
	"pending_approval",
	"approved",
	"executing",
	"executed",
	"rejected",
	"failed",
	"denied_by_policy",
	"cancelled",
]);

export const resourceStatusEnum = pgEnum("resource_status", [
	"active",
	"paused",
]);

export const policyDecisionEnum = pgEnum("policy_decision", [
	"allow",
	"require_approval",
	"deny",
]);

export const agentStatusEnum = pgEnum("agent_status", [
	"active",
	"paused",
]);

export const riskLevelEnum = pgEnum("risk_level", [
	"low",
	"medium",
	"high",
	"critical",
]);

export const approvalStatusEnum = pgEnum("approval_status", [
	"pending",
	"approved",
	"rejected",
	"expired",
	"cancelled",
]);

// ── Organization Settings ──────────────────────────────────────

export const organizationSettings = pgTable(
	"organization_settings",
	{
		id: text("id").primaryKey(),
		organizationId: text("organization_id").notNull(),
		defaultAgentId: text("default_agent_id"),
		maxDailyRuns: integer("max_daily_runs").default(100).notNull(),
		defaultApprovalTimeoutMinutes: integer("default_approval_timeout_minutes").default(1440).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [index("org_settings_orgId_idx").on(table.organizationId)],
);

// ── Agents ─────────────────────────────────────────────────────

export const agents = pgTable(
	"agents",
	{
		id: text("id").primaryKey(),
		organizationId: text("organization_id").notNull(),
		name: text("name").notNull(),
		description: text("description"),
		role: text("role"),
		purpose: text("purpose"),
		model: text("model").default("gpt-4o").notNull(),
		systemPrompt: text("system_prompt"),
		guardrails: jsonb("guardrails").$type<string[]>().default([]),
		riskLevel: riskLevelEnum("risk_level").default("medium").notNull(),
		dailyBudget: integer("daily_budget"),
		status: agentStatusEnum("status").default("paused").notNull(),
		createdBy: text("created_by"),
		ownerUserId: text("owner_user_id"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("agents_orgId_idx").on(table.organizationId),
		index("agents_status_idx").on(table.status),
	],
);

// ── Connectors ────────────────────────────────────────────────

export const connectors = pgTable(
	"connectors",
	{
		id: text("id").primaryKey(),
		organizationId: text("organization_id").notNull(),
		type: text("type").notNull(),
		provider: text("provider").notNull(),
		name: text("name").notNull(),
		config: jsonb("config").$type<Record<string, unknown>>().default({}).notNull(),
		encryptedCredentials: text("encrypted_credentials"),
		status: resourceStatusEnum("status").default("paused").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("connectors_orgId_idx").on(table.organizationId),
		unique("connectors_org_name_unique").on(table.organizationId, table.name),
	],
);

// ── Webhook Endpoints ────────────────────────────────────────

export const webhookEndpoints = pgTable(
	"webhook_endpoints",
	{
		id: text("id").primaryKey(),
		organizationId: text("organization_id").notNull(),
		connectorId: text("connector_id").references(() => connectors.id, { onDelete: "set null" }),
		agentId: text("agent_id").references(() => agents.id, { onDelete: "set null" }),
		name: text("name").notNull(),
		publicToken: text("public_token").notNull().unique(),
		verificationType: text("verification_type").default("none").notNull(),
		secretHeaderName: text("secret_header_name"),
		encryptedSecret: text("encrypted_secret"),
		expectedMethod: text("expected_method").default("POST").notNull(),
		responseStatus: integer("response_status").default(202).notNull(),
		responseBody: jsonb("response_body").$type<Record<string, unknown>>().default({ ok: true }).notNull(),
		status: resourceStatusEnum("status").default("paused").notNull(),
		lastSamplePayload: jsonb("last_sample_payload").$type<Record<string, unknown> | null>(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("webhook_endpoints_orgId_idx").on(table.organizationId),
	],
);

// ── Webhook Deliveries ────────────────────────────────────────

export const webhookDeliveries = pgTable(
	"webhook_deliveries",
	{
		id: text("id").primaryKey(),
		organizationId: text("organization_id").notNull(),
		endpointId: text("endpoint_id")
			.notNull()
			.references(() => webhookEndpoints.id, { onDelete: "cascade" }),
		runId: text("run_id").references(() => agentRuns.id, { onDelete: "set null" }),
		idempotencyKey: text("idempotency_key").notNull(),
		headers: jsonb("headers").$type<Record<string, unknown>>().notNull(),
		payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
		status: text("status").notNull(),
		errorMessage: text("error_message"),
		receivedAt: timestamp("received_at").defaultNow().notNull(),
		processedAt: timestamp("processed_at"),
	},
	(table) => [
		unique("webhook_deliveries_endpoint_idempotency_unique").on(table.endpointId, table.idempotencyKey),
		index("webhook_deliveries_orgId_idx").on(table.organizationId),
		index("webhook_deliveries_runId_idx").on(table.runId),
	],
);

// ── Tools ─────────────────────────────────────────────────────

export const tools = pgTable(
	"tools",
	{
		id: text("id").primaryKey(),
		organizationId: text("organization_id").notNull(),
		connectorId: text("connector_id").references(() => connectors.id, { onDelete: "set null" }),
		name: text("name").notNull(),
		description: text("description"),
		inputSchema: jsonb("input_schema").$type<Record<string, unknown>>().notNull(),
		outputSchema: jsonb("output_schema").$type<Record<string, unknown>>().notNull(),
		riskLevel: riskLevelEnum("risk_level").default("medium").notNull(),
		executorType: text("executor_type").notNull(),
		executorConfig: jsonb("executor_config").$type<Record<string, unknown>>().default({}).notNull(),
		defaultPolicy: policyDecisionEnum("default_policy").default("deny").notNull(),
		status: resourceStatusEnum("status").default("active").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("tools_orgId_idx").on(table.organizationId),
		unique("tools_org_name_unique").on(table.organizationId, table.name),
	],
);

// ── Agent Tools (binding) ─────────────────────────────────────

export const agentTools = pgTable(
	"agent_tools",
	{
		id: text("id").primaryKey(),
		agentId: text("agent_id")
			.notNull()
			.references(() => agents.id, { onDelete: "cascade" }),
		toolId: text("tool_id")
			.notNull()
			.references(() => tools.id, { onDelete: "cascade" }),
		enabled: boolean("enabled").default(true).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		unique("agent_tools_agent_tool_unique").on(table.agentId, table.toolId),
	],
);

// ── Agent Runs ────────────────────────────────────────────────

export const agentRuns = pgTable(
	"agent_runs",
	{
		id: text("id").primaryKey(),
		organizationId: text("organization_id").notNull(),
		agentId: text("agent_id")
			.notNull()
			.references(() => agents.id, { onDelete: "cascade" }),
		status: runStatusEnum("status").default("queued").notNull(),
		triggerSource: text("trigger_source"),
		requesterId: text("requester_id"),
		requesterMetadata: jsonb("requester_metadata").$type<Record<string, unknown> | null>(),
		inputMessage: text("input_message"),
		inputPayload: jsonb("input_payload").$type<Record<string, unknown> | null>(),
		parsedIntent: jsonb("parsed_intent").$type<Record<string, unknown> | null>(),
		finalResponse: text("final_response"),
		totalLatencyMs: integer("total_latency_ms"),
		totalCostCents: integer("total_cost_cents"),
		errorMessage: text("error_message"),
		startedAt: timestamp("started_at"),
		completedAt: timestamp("completed_at"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("runs_orgId_idx").on(table.organizationId),
		index("runs_agentId_idx").on(table.agentId),
		index("runs_status_idx").on(table.status),
		index("runs_createdAt_idx").on(table.createdAt),
	],
);

// ── Tool Requests ─────────────────────────────────────────────

export const toolRequests = pgTable(
	"tool_requests",
	{
		id: text("id").primaryKey(),
		runId: text("run_id")
			.notNull()
			.references(() => agentRuns.id, { onDelete: "cascade" }),
		organizationId: text("organization_id").notNull(),
		toolId: text("tool_id")
			.notNull()
			.references(() => tools.id, { onDelete: "cascade" }),
		toolName: text("tool_name").notNull(),
		payload: jsonb("payload").$type<Record<string, unknown>>().default({}).notNull(),
		riskLevel: riskLevelEnum("risk_level").default("medium").notNull(),
		status: toolRequestStatusEnum("status").default("pending_policy").notNull(),
		policyDecision: policyDecisionEnum("policy_decision"),
		matchedPolicyId: text("matched_policy_id").references(() => policies.id, { onDelete: "set null" }),
		completedAt: timestamp("completed_at"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("tool_requests_runId_idx").on(table.runId),
		index("tool_requests_orgId_idx").on(table.organizationId),
		index("tool_requests_status_idx").on(table.status),
	],
);

// ── Tool Executions ───────────────────────────────────────────

export const toolExecutions = pgTable(
	"tool_executions",
	{
		id: text("id").primaryKey(),
		toolRequestId: text("tool_request_id")
			.notNull()
			.references(() => toolRequests.id, { onDelete: "cascade" }),
		executorType: text("executor_type").notNull(),
		requestPayload: jsonb("request_payload").$type<Record<string, unknown>>(),
		responsePayload: jsonb("response_payload").$type<Record<string, unknown> | null>(),
		status: text("status").notNull(),
		latencyMs: integer("latency_ms"),
		errorMetadata: jsonb("error_metadata").$type<Record<string, unknown> | null>(),
		idempotencyKey: text("idempotency_key"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("tool_executions_toolRequestId_idx").on(table.toolRequestId),
	],
);

// ── Policies ──────────────────────────────────────────────────

export const policies = pgTable(
	"policies",
	{
		id: text("id").primaryKey(),
		organizationId: text("organization_id").notNull(),
		agentId: text("agent_id").references(() => agents.id, { onDelete: "cascade" }),
		toolId: text("tool_id").references(() => tools.id, { onDelete: "cascade" }),
		toolName: text("tool_name"),
		effect: policyDecisionEnum("effect").notNull(),
		conditions: jsonb("conditions").$type<Record<string, unknown> | null>(),
		approverRole: text("approver_role"),
		priority: integer("priority").default(0).notNull(),
		enabled: boolean("enabled").default(true).notNull(),
		createdBy: text("created_by"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("policies_orgId_idx").on(table.organizationId),
		index("policies_enabled_idx").on(table.enabled),
	],
);

// ── Audit Logs ────────────────────────────────────────────────

export const auditLogs = pgTable(
	"audit_logs",
	{
		id: text("id").primaryKey(),
		organizationId: text("organization_id").notNull(),
		actorType: text("actor_type").notNull(),
		actorId: text("actor_id").notNull(),
		runId: text("run_id").references(() => agentRuns.id, { onDelete: "set null" }),
		targetType: text("target_type").notNull(),
		targetId: text("target_id").notNull(),
		action: text("action").notNull(),
		metadata: jsonb("metadata").$type<Record<string, unknown> | null>(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [index("audit_logs_orgId_idx").on(table.organizationId)],
);

// ── Agent Run Steps ────────────────────────────────────────

export const agentRunSteps = pgTable(
	"agent_run_steps",
	{
		id: text("id").primaryKey(),
		runId: text("run_id")
			.notNull()
			.references(() => agentRuns.id, { onDelete: "cascade" }),
		stepIndex: integer("step_index").notNull(),
		type: text("type").notNull(),
		status: text("status").notNull(),
		inputMetadata: jsonb("input_metadata").$type<Record<string, unknown> | null>(),
		outputMetadata: jsonb("output_metadata").$type<Record<string, unknown> | null>(),
		errorMetadata: jsonb("error_metadata").$type<Record<string, unknown> | null>(),
		costCents: integer("cost_cents"),
		latencyMs: integer("latency_ms"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		unique("agent_run_steps_run_step_unique").on(table.runId, table.stepIndex),
		index("agent_run_steps_run_idx").on(table.runId),
	],
);

// ── Approval Sessions ──────────────────────────────────────

export const approvalSessions = pgTable(
	"approval_sessions",
	{
		id: text("id").primaryKey(),
		organizationId: text("organization_id").notNull(),
		runId: text("run_id")
			.notNull()
			.references(() => agentRuns.id, { onDelete: "cascade" }),
		toolRequestId: text("tool_request_id")
			.notNull()
			.references(() => toolRequests.id, { onDelete: "cascade" }),
		status: approvalStatusEnum("status").default("pending").notNull(),
		approvalChannel: text("approval_channel"),
		approverUserId: text("approver_user_id"),
		approverMetadata: jsonb("approver_metadata").$type<Record<string, unknown> | null>(),
		approvalCode: text("approval_code").notNull().unique(),
		requestMessage: text("request_message").notNull(),
		decisionNote: text("decision_note"),
		expiresAt: timestamp("expires_at").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		decidedAt: timestamp("decided_at"),
	},
	(table) => [
		index("approval_sessions_orgId_idx").on(table.organizationId),
		index("approval_sessions_runId_idx").on(table.runId),
		index("approval_sessions_status_idx").on(table.status),
	],
);
