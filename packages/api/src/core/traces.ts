import { db } from "@agentclave/db";
import { agentRunSteps } from "@agentclave/db/schema/business";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "node:crypto";

interface RunStepInput {
	runId: string;
	type: string;
	status: string;
	inputMetadata?: Record<string, unknown> | null;
	outputMetadata?: Record<string, unknown> | null;
	errorMetadata?: Record<string, unknown> | null;
	costCents?: number | null;
	latencyMs?: number | null;
}

export async function writeRunStep(input: RunStepInput): Promise<void> {
	const lastStep = await db.query.agentRunSteps.findFirst({
		where: eq(agentRunSteps.runId, input.runId),
		orderBy: desc(agentRunSteps.stepIndex),
	});

	const nextIndex = (lastStep?.stepIndex ?? -1) + 1;

	await db.insert(agentRunSteps).values({
		id: randomUUID(),
		runId: input.runId,
		stepIndex: nextIndex,
		type: input.type,
		status: input.status,
		inputMetadata: input.inputMetadata ?? null,
		outputMetadata: input.outputMetadata ?? null,
		errorMetadata: input.errorMetadata ?? null,
		costCents: input.costCents ?? null,
		latencyMs: input.latencyMs ?? null,
	});
}
