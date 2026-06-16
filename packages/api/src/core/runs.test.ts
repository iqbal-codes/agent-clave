import { describe, it, expect } from "vitest";
import type { RunStatus, PolicyDecision } from "@agentclave/types";

describe("run status helper behavior", () => {
	it("defines valid run statuses", () => {
		const validStatuses: RunStatus[] = [
			"queued",
			"running",
			"waiting_for_approval",
			"completed",
			"failed",
			"rejected",
			"cancelled",
			"expired",
		];
		expect(validStatuses).toHaveLength(8);
	});

	it("defines valid policy decisions", () => {
		const validDecisions: PolicyDecision[] = ["allow", "require_approval", "deny"];
		expect(validDecisions).toHaveLength(3);
	});

	it("type-checks that all run statuses are valid", () => {
		const status: RunStatus = "queued";
		expect([
			"queued",
			"running",
			"waiting_for_approval",
			"completed",
			"failed",
			"rejected",
			"cancelled",
			"expired",
		]).toContain(status);
	});

	it("type-checks that policy decisions include require_approval", () => {
		const decision: PolicyDecision = "require_approval";
		expect(["allow", "require_approval", "deny"]).toContain(decision);
	});
});
