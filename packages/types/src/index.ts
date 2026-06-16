// ── Run Statuses ────────────────────────────────────────────
export const RUN_STATUSES = [
	"queued",
	"running",
	"waiting_for_approval",
	"completed",
	"failed",
	"rejected",
	"cancelled",
	"expired",
] as const;
export type RunStatus = (typeof RUN_STATUSES)[number];

// ── Tool Request Statuses ───────────────────────────────────
export const TOOL_REQUEST_STATUSES = [
	"pending_policy",
	"pending_approval",
	"approved",
	"executing",
	"executed",
	"rejected",
	"failed",
	"denied_by_policy",
	"cancelled",
] as const;
export type ToolRequestStatus = (typeof TOOL_REQUEST_STATUSES)[number];

// ── Resource Statuses ───────────────────────────────────────
export const RESOURCE_STATUSES = ["active", "paused"] as const;
export type ResourceStatus = (typeof RESOURCE_STATUSES)[number];

// ── Risk Levels ─────────────────────────────────────────────
export const RISK_LEVELS = ["low", "medium", "high", "critical"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

// ── Policy Decisions ────────────────────────────────────────
export const POLICY_DECISIONS = ["allow", "require_approval", "deny"] as const;
export type PolicyDecision = (typeof POLICY_DECISIONS)[number];

// ── Agent Statuses ──────────────────────────────────────────
export const AGENT_STATUSES = ["active", "paused"] as const;
export type AgentStatus = (typeof AGENT_STATUSES)[number];

// ── Approval Statuses ───────────────────────────────────────
export const APPROVAL_STATUSES = [
	"pending",
	"approved",
	"rejected",
	"expired",
	"cancelled",
] as const;
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

// ── Queue Names ────────────────────────────────────────────
export const AGENTCLAVE_AGENT_RUN_QUEUE = "agentclave-agent-run" as const;
export const AGENTCLAVE_TOOL_EXECUTION_QUEUE = "agentclave-tool-execution" as const;

// ── Role Keys ───────────────────────────────────────────────
export const ROLE_KEYS = ["owner", "admin", "reviewer", "viewer"] as const;
export type RoleKey = (typeof ROLE_KEYS)[number];

// ── Permission Keys ─────────────────────────────────────────
export const PERMISSION_KEYS = [
	"agent.view",
	"agent.configure",
	"tool.view",
	"tool.configure",
	"run.view",
	"approval.review",
	"policy.view",
	"policy.configure",
	"audit.view",
	"organization.settings",
	"connector.configure",
] as const;
export type PermissionKey = (typeof PERMISSION_KEYS)[number];

// ── Error Codes ─────────────────────────────────────────────
export const ERROR_CODES = [
	"UNAUTHORIZED",
	"FORBIDDEN",
	"VALIDATION_ERROR",
	"NOT_FOUND",
	"ORGANIZATION_REQUIRED",
	"AGENT_DISABLED",
	"INTERNAL_ERROR",
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];

// ── Role Permissions ────────────────────────────────────────
export const ROLE_PERMISSION_MAP: Record<RoleKey, readonly PermissionKey[]> = {
	owner: [...PERMISSION_KEYS],
	admin: [...PERMISSION_KEYS],
	reviewer: ["run.view", "approval.review", "audit.view", "tool.view"],
	viewer: ["run.view", "audit.view", "tool.view"],
};

export function getPermissionsForRole(role: string): readonly PermissionKey[] {
	return ROLE_PERMISSION_MAP[role as RoleKey] ?? [];
}
// ── Realtime Events ───────────────────────────────────────
export type RunUpdatedEvent = {
	type: "run.updated";
	organizationId: string;
	runId: string;
	status: RunStatus;
};

export type ApprovalPendingEvent = {
	type: "approval.pending";
	organizationId: string;
	runId: string;
	approvalId: string;
	toolRequestId: string;
	toolName: string;
};

export type ApprovalDecidedEvent = {
	type: "approval.decided";
	organizationId: string;
	runId: string;
	approvalId: string;
	toolRequestId: string;
	status: ApprovalStatus;
};

export type RealtimeEvent = RunUpdatedEvent | ApprovalPendingEvent | ApprovalDecidedEvent;
