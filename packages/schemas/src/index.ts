import { z } from "zod";

// ── Common ───────────────────────────────────────────────────
export const tableQuerySchema = z.object({
	page: z.coerce.number().int().positive().default(1),
	pageSize: z.coerce.number().int().positive().max(100).default(20),
	sort: z.string().optional(),
	order: z.enum(["asc", "desc"]).default("desc"),
	search: z.string().optional(),
});
export type TableQueryInput = z.infer<typeof tableQuerySchema>;

// ── JSON Object ──────────────────────────────────────────────
export const jsonObjectSchema = z.record(z.string(), z.unknown());

// ── Agent ────────────────────────────────────────────────────
export const createAgentSchema = z.object({
	name: z.string().min(1).max(100),
	description: z.string().optional(),
	role: z.string().optional(),
	purpose: z.string().optional(),
	model: z.string().optional().default("gpt-4o"),
	systemPrompt: z.string().optional(),
	guardrails: z.array(z.string()).optional(),
	riskLevel: z.enum(["low", "medium", "high", "critical"]).default("medium"),
	dailyBudget: z.coerce.number().int().positive().optional(),
	ownerUserId: z.string().optional(),
});

export const updateAgentSchema = createAgentSchema.partial().extend({
	id: z.string(),
	status: z.enum(["active", "paused"]).optional(),
});

// ── Agent Run ────────────────────────────────────────────────
export const runStatusSchema = z.enum([
	"queued",
	"running",
	"waiting_for_approval",
	"completed",
	"failed",
	"rejected",
	"cancelled",
	"expired",
]);

// ── Connector ────────────────────────────────────────────────
export const createConnectorSchema = z.object({
	name: z.string().min(1).max(100),
	type: z.string().min(1),
	provider: z.string().min(1),
	config: jsonObjectSchema.default({}),
	credentials: z.record(z.string(), z.unknown()).optional(),
	status: z.enum(["active", "paused"]).default("paused"),
});

export const updateConnectorSchema = createConnectorSchema.partial().extend({
	id: z.string(),
});

// ── Webhook Endpoint ────────────────────────────────────────
export const createWebhookEndpointSchema = z.object({
	name: z.string().min(1).max(100),
	connectorId: z.string().optional(),
	agentId: z.string().optional(),
	verificationType: z.enum(["none", "header_secret", "hmac_sha256"]).default("none"),
	secretHeaderName: z.string().optional(),
	secret: z.string().optional(),
	responseStatus: z.number().int().default(202),
	responseBody: jsonObjectSchema.default({ ok: true }),
	status: z.enum(["active", "paused"]).default("paused"),
});

// ── Tool ─────────────────────────────────────────────────────
export const createToolSchema = z.object({
	name: z.string().min(1).max(200),
	description: z.string().optional(),
	connectorId: z.string().optional(),
	inputSchema: jsonObjectSchema,
	outputSchema: jsonObjectSchema,
	riskLevel: z.enum(["low", "medium", "high", "critical"]).default("medium"),
	executorType: z.string().min(1),
	executorConfig: jsonObjectSchema.default({}),
	defaultPolicy: z.enum(["allow", "require_approval", "deny"]).default("deny"),
	status: z.enum(["active", "paused"]).default("active"),
});

export const updateToolSchema = createToolSchema.partial().extend({
	id: z.string(),
});

// ── Agent Tool Binding ──────────────────────────────────────
export const bindAgentToolSchema = z.object({
	agentId: z.string(),
	toolId: z.string(),
	enabled: z.boolean().default(true),
});

// ── Tool Request Status ─────────────────────────────────────
export const toolRequestStatusSchema = z.enum([
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

// ── Approval ─────────────────────────────────────────────────
export const reviewApprovalSchema = z.object({
	approvalId: z.string(),
	decision: z.enum(["approved", "rejected"]),
	note: z.string().optional(),
});

// ── Policy Rule ─────────────────────────────────────────────
export const policyDecisionSchema = z.enum(["allow", "require_approval", "deny"]);

export const createPolicyRuleSchema = z.object({
	name: z.string().min(1).max(100),
	description: z.string().optional(),
	agentId: z.string().optional(),
	toolId: z.string().optional(),
	toolName: z.string().optional(),
	effect: policyDecisionSchema,
	conditions: jsonObjectSchema.nullable().optional(),
	approverRole: z.string().optional(),
	priority: z.coerce.number().int().default(0),
});

export const updatePolicyRuleSchema = createPolicyRuleSchema.partial().extend({
	id: z.string(),
	enabled: z.boolean().optional(),
});

// ── Organization ─────────────────────────────────────────────
export const updateOrganizationSchema = z.object({
	name: z.string().min(1),
});

// ── Dashboard ────────────────────────────────────────────────
export const dashboardSummarySchema = z.object({
	totalRunsToday: z.number(),
	pendingApprovals: z.number(),
	activeAgents: z.number(),
	completedRunsToday: z.number(),
	failedRunsToday: z.number(),
	averageLatencyMs: z.number(),
	estimatedCostToday: z.number(),
	recentRuns: z.array(z.unknown()),
	topTools: z.array(z.object({ name: z.string(), count: z.number() })),
	approvalRate: z.number(),
});

// ── Queue Job Payloads ─────────────────────────────────────
export const agentRunJobPayloadSchema = z.object({
	runId: z.string(),
});

export const toolExecutionJobPayloadSchema = z.object({
	toolRequestId: z.string(),
});
