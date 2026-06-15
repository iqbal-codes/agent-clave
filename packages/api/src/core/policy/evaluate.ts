import type { RiskLevel, PolicyDecision } from "@agentclave/types";

const RISK_ORDER: Record<RiskLevel, number> = {
	low: 0,
	medium: 1,
	high: 2,
	critical: 3,
};

export interface PolicyRule {
	id: string;
	agentId: string | null;
	toolId: string | null;
	toolName: string | null;
	riskLevelMin: RiskLevel | null;
	conditions: Record<string, unknown> | null;
	effect: PolicyDecision;
	priority: number;
	enabled: boolean;
}

export interface PolicyResult {
	decision: PolicyDecision;
	matchedPolicyId: string | null;
}

function specificityScore(rule: PolicyRule): number {
	let score = 0;
	if (rule.toolId) score += 4;
	if (rule.toolName) score += 3;
	if (rule.agentId) score += 2;
	if (rule.riskLevelMin) score += 1;
	return score;
}

export function evaluatePolicy(input: {
	agentId: string;
	toolId: string;
	toolName: string;
	riskLevel: RiskLevel;
	rules: PolicyRule[];
}): PolicyResult {
	const { agentId, toolId, toolName, riskLevel, rules } = input;
	const actionRisk = RISK_ORDER[riskLevel];

	// Match enabled rules only, skip non-null conditions (MVP: conditions don't match)
	const matchingRules = rules.filter((r) => {
		if (!r.enabled) return false;
		if (r.conditions !== null) return false;
		if (r.agentId && r.agentId !== agentId) return false;
		if (r.toolId && r.toolId !== toolId) return false;
		if (r.toolName && r.toolName !== toolName) return false;
		if (r.riskLevelMin && RISK_ORDER[r.riskLevelMin] > actionRisk) return false;
		return true;
	});

	if (matchingRules.length === 0) {
		return { decision: "deny", matchedPolicyId: null };
	}

	matchingRules.sort((a, b) => {
		if (b.priority !== a.priority) return b.priority - a.priority;
		return specificityScore(b) - specificityScore(a);
	});

	const best = matchingRules[0]!;
	return { decision: best.effect, matchedPolicyId: best.id };
}
