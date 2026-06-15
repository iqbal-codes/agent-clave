import { describe, it, expect } from "vitest";
import {
	createAgentSchema,
	createToolSchema,
	createConnectorSchema,
	reviewApprovalSchema,
	toolRequestStatusSchema,
	createPolicyRuleSchema,
	jsonObjectSchema,
} from "./index";

describe("createAgentSchema", () => {
	it("accepts valid agent with required fields", () => {
		const result = createAgentSchema.parse({ name: "Test Agent" });
		expect(result.name).toBe("Test Agent");
		expect(result.model).toBe("gpt-4o");
		expect(result.riskLevel).toBe("medium");
	});

	it("rejects empty name", () => {
		expect(() => createAgentSchema.parse({ name: "" })).toThrow();
	});

	it("accepts optional fields", () => {
		const result = createAgentSchema.parse({
			name: "Agent",
			role: "ops",
			purpose: "Handle inventory",
			guardrails: ["rule1"],
		});
		expect(result.role).toBe("ops");
		expect(result.guardrails).toEqual(["rule1"]);
	});
});

describe("createToolSchema", () => {
	it("accepts valid tool with schemas", () => {
		const result = createToolSchema.parse({
			name: "inventory.search",
			inputSchema: { type: "object", properties: { q: { type: "string" } } },
			outputSchema: { type: "object" },
			executorType: "http",
		});
		expect(result.name).toBe("inventory.search");
		expect(result.riskLevel).toBe("medium");
		expect(result.defaultPolicy).toBe("deny");
	});

	it("rejects missing executorType", () => {
		expect(() => createToolSchema.parse({
			name: "test",
			inputSchema: {},
			outputSchema: {},
		})).toThrow();
	});
});

describe("createConnectorSchema", () => {
	it("accepts valid connector", () => {
		const result = createConnectorSchema.parse({
			name: "Telegram Bot",
			type: "telegram",
			provider: "telegram",
		});
		expect(result.name).toBe("Telegram Bot");
		expect(result.status).toBe("paused");
	});
});

describe("reviewApprovalSchema", () => {
	it("accepts approved decision", () => {
		const result = reviewApprovalSchema.parse({
			approvalId: "test-id",
			decision: "approved",
		});
		expect(result.decision).toBe("approved");
	});

	it("accepts rejected decision with note", () => {
		const result = reviewApprovalSchema.parse({
			approvalId: "test-id",
			decision: "rejected",
			note: "Not ready",
		});
		expect(result.note).toBe("Not ready");
	});

	it("rejects invalid decision", () => {
		expect(() => reviewApprovalSchema.parse({
			approvalId: "test-id",
			decision: "edited",
		})).toThrow();
	});
});

describe("toolRequestStatusSchema", () => {
	it("accepts valid statuses", () => {
		expect(toolRequestStatusSchema.parse("pending_approval")).toBe("pending_approval");
		expect(toolRequestStatusSchema.parse("executed")).toBe("executed");
		expect(toolRequestStatusSchema.parse("denied_by_policy")).toBe("denied_by_policy");
	});

	it("rejects old 'edited' status", () => {
		expect(() => toolRequestStatusSchema.parse("edited")).toThrow();
	});
});

describe("createPolicyRuleSchema", () => {
	it("accepts valid policy", () => {
		const result = createPolicyRuleSchema.parse({
			name: "Inventory approval",
			toolName: "inventory.create_stock_adjustment",
			effect: "require_approval",
			approverRole: "manager",
		});
		expect(result.effect).toBe("require_approval");
		expect(result.approverRole).toBe("manager");
	});

	it("rejects invalid effect", () => {
		expect(() => createPolicyRuleSchema.parse({
			name: "test",
			effect: "approve",
		})).toThrow();
	});
});

describe("jsonObjectSchema", () => {
	it("accepts arbitrary objects", () => {
		const result = jsonObjectSchema.parse({ foo: "bar", num: 42 });
		expect(result.foo).toBe("bar");
		expect(result.num).toBe(42);
	});

	it("accepts empty objects", () => {
		const result = jsonObjectSchema.parse({});
		expect(result).toEqual({});
	});
});
