import { describe, it, expect } from "vitest";
import { evaluatePolicy } from "./evaluate";

describe("evaluatePolicy", () => {
	const baseRules = [
		{
			id: "rule-1",
			agentId: null,
			toolId: "tool-1",
			toolName: "inventory.search_product",
			riskLevelMin: null,
			conditions: null,
			effect: "allow" as const,
			priority: 10,
			enabled: true,
		},
		{
			id: "rule-2",
			agentId: null,
			toolId: "tool-2",
			toolName: "inventory.create_stock_adjustment",
			riskLevelMin: null,
			conditions: null,
			effect: "require_approval" as const,
			priority: 10,
			enabled: true,
		},
	];

	it("matches a toolName rule", () => {
		const result = evaluatePolicy({
			agentId: "agent-1",
			toolId: "tool-1",
			toolName: "inventory.search_product",
			riskLevel: "medium",
			rules: baseRules,
		});
		expect(result.decision).toBe("allow");
		expect(result.matchedPolicyId).toBe("rule-1");
	});

	it("denies unknown tool names", () => {
		const result = evaluatePolicy({
			agentId: "agent-1",
			toolId: "tool-unknown",
			toolName: "unknown.tool",
			riskLevel: "medium",
			rules: baseRules,
		});
		expect(result.decision).toBe("deny");
		expect(result.matchedPolicyId).toBeNull();
	});

	it("prefers higher-priority rule", () => {
		const rules = [
			{
				id: "low-pri",
				agentId: null,
				toolId: "tool-1",
				toolName: "inventory.search_product",
				riskLevelMin: null,
				conditions: null,
				effect: "allow" as const,
				priority: 5,
				enabled: true,
			},
			{
				id: "high-pri",
				agentId: null,
				toolId: "tool-1",
				toolName: "inventory.search_product",
				riskLevelMin: null,
				conditions: null,
				effect: "deny" as const,
				priority: 20,
				enabled: true,
			},
		];
		const result = evaluatePolicy({
			agentId: "agent-1",
			toolId: "tool-1",
			toolName: "inventory.search_product",
			riskLevel: "medium",
			rules,
		});
		expect(result.decision).toBe("deny");
		expect(result.matchedPolicyId).toBe("high-pri");
	});

	it("skips rules with non-null conditions", () => {
		const rules = [
			{
				id: "skipped",
				agentId: null,
				toolId: "tool-1",
				toolName: "inventory.search_product",
				riskLevelMin: null,
				conditions: { someField: true },
				effect: "allow" as const,
				priority: 100,
				enabled: true,
			},
			{
				id: "fallback",
				agentId: null,
				toolId: "tool-1",
				toolName: "inventory.search_product",
				riskLevelMin: null,
				conditions: null,
				effect: "require_approval" as const,
				priority: 10,
				enabled: true,
			},
		];
		const result = evaluatePolicy({
			agentId: "agent-1",
			toolId: "tool-1",
			toolName: "inventory.search_product",
			riskLevel: "medium",
			rules,
		});
		expect(result.decision).toBe("require_approval");
		expect(result.matchedPolicyId).toBe("fallback");
	});

	it("skips disabled rules", () => {
		const rules = [
			{
				id: "disabled",
				agentId: null,
				toolId: "tool-1",
				toolName: "inventory.search_product",
				riskLevelMin: null,
				conditions: null,
				effect: "allow" as const,
				priority: 100,
				enabled: false,
			},
		];
		const result = evaluatePolicy({
			agentId: "agent-1",
			toolId: "tool-1",
			toolName: "inventory.search_product",
			riskLevel: "medium",
			rules,
		});
		expect(result.decision).toBe("deny");
	});

	it("filters by riskLevelMin", () => {
		const rules = [
			{
				id: "high-only",
				agentId: null,
				toolId: null,
				toolName: null,
				riskLevelMin: "high" as const,
				conditions: null,
				effect: "deny" as const,
				priority: 10,
				enabled: true,
			},
		];
		const lowResult = evaluatePolicy({
			agentId: "agent-1",
			toolId: "tool-1",
			toolName: "inventory.search_product",
			riskLevel: "low",
			rules,
		});
		expect(lowResult.decision).toBe("deny");
		expect(lowResult.matchedPolicyId).toBeNull();

		const highResult = evaluatePolicy({
			agentId: "agent-1",
			toolId: "tool-1",
			toolName: "inventory.search_product",
			riskLevel: "high",
			rules,
		});
		expect(highResult.decision).toBe("deny");
		expect(highResult.matchedPolicyId).toBe("high-only");
	});

	it("denies when no rules match", () => {
		const result = evaluatePolicy({
			agentId: "agent-1",
			toolId: "tool-1",
			toolName: "inventory.search_product",
			riskLevel: "medium",
			rules: [],
		});
		expect(result.decision).toBe("deny");
	});

	it("uses specificity scoring for toolId + toolName + agentId", () => {
		const rules = [
			{
				id: "agent-specific",
				agentId: "agent-1",
				toolId: null,
				toolName: null,
				riskLevelMin: null,
				conditions: null,
				effect: "allow" as const,
				priority: 0,
				enabled: true,
			},
			{
				id: "tool-specific",
				agentId: null,
				toolId: "tool-1",
				toolName: null,
				riskLevelMin: null,
				conditions: null,
				effect: "require_approval" as const,
				priority: 0,
				enabled: true,
			},
		];
		const result = evaluatePolicy({
			agentId: "agent-1",
			toolId: "tool-1",
			toolName: "inventory.search_product",
			riskLevel: "medium",
			rules,
		});
		// toolId (+4) beats agentId (+2)
		expect(result.decision).toBe("require_approval");
		expect(result.matchedPolicyId).toBe("tool-specific");
	});
});
