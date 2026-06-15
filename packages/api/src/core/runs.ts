import { db } from "@agentclave/db";
import { agentRuns } from "@agentclave/db/schema/business";
import { eq } from "drizzle-orm";
import type { RunStatus, PolicyDecision } from "@agentclave/types";

interface UpdateRunStatusInput {
	runId: string;
	status: RunStatus;
	errorMessage?: string | null;
	startedAt?: Date | null;
	completedAt?: Date | null;
	policyDecision?: PolicyDecision | null;
	agentOutput?: Record<string, unknown> | null;
	confidence?: number | null;
	totalLatencyMs?: number | null;
	totalCostCents?: number | null;
}

export async function updateRunStatus(
	input: UpdateRunStatusInput,
): Promise<void> {
	const updates: Record<string, unknown> = {
		status: input.status,
		updatedAt: new Date(),
	};

	if (input.errorMessage !== undefined) updates.errorMessage = input.errorMessage;
	if (input.startedAt !== undefined) updates.startedAt = input.startedAt;
	if (input.completedAt !== undefined) updates.completedAt = input.completedAt;
	if (input.policyDecision !== undefined) updates.policyDecision = input.policyDecision;
	if (input.agentOutput !== undefined) updates.agentOutput = input.agentOutput;
	if (input.confidence !== undefined) updates.confidence = input.confidence;
	if (input.totalLatencyMs !== undefined) updates.totalLatencyMs = input.totalLatencyMs;
	if (input.totalCostCents !== undefined) updates.totalCostCents = input.totalCostCents;

	await db
		.update(agentRuns)
		.set(updates)
		.where(eq(agentRuns.id, input.runId));
}
