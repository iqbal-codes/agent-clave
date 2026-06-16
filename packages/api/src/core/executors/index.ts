import { db } from "@agentclave/db";
import { toolRequests, tools, auditLogs, agentRuns } from "@agentclave/db/schema/business";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { executeHttpRequest } from "./http";
import { writeRunStep } from "../traces";
import { writeAudit } from "../audit";
import { publishRealtimeEvent } from "../realtime/publisher";

export async function executeToolRequest(input: { toolRequestId: string }): Promise<void> {
	const { toolRequestId } = input;

	const [toolRequest] = await db
		.select()
		.from(toolRequests)
		.where(eq(toolRequests.id, toolRequestId))
		.limit(1);

	if (!toolRequest) {
		throw new Error(`Tool request not found: ${toolRequestId}`);
	}

	const [tool] = await db.select().from(tools).where(eq(tools.id, toolRequest.toolId)).limit(1);

	if (!tool) {
		throw new Error(`Tool not found: ${toolRequest.toolId}`);
	}

	// Mark as executing
	await db
		.update(toolRequests)
		.set({
			status: "executing",
			updatedAt: new Date(),
		})
		.where(eq(toolRequests.id, toolRequestId));

	try {
		if (tool.executorType === "http") {
			await executeHttpRequest({ toolRequestId });
		} else {
			// Unknown executor type
			await db
				.update(toolRequests)
				.set({
					status: "failed",
					completedAt: new Date(),
					updatedAt: new Date(),
				})
				.where(eq(toolRequests.id, toolRequestId));

			await db.insert(auditLogs).values({
				id: randomUUID(),
				organizationId: toolRequest.organizationId,
				actorType: "system",
				actorId: "executor",
				runId: toolRequest.runId,
				targetType: "tool_request",
				targetId: toolRequestId,
				action: "tool.execution_failed",
				metadata: { reason: `Unknown executor type: ${tool.executorType}` },
			});

			await terminalizeRunIfNeeded(
				toolRequest,
				"failed",
				`Unknown executor type: ${tool.executorType}`,
			);
		}
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : "Unknown error";

		await db
			.update(toolRequests)
			.set({
				status: "failed",
				completedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(toolRequests.id, toolRequestId));

		await db.insert(auditLogs).values({
			id: randomUUID(),
			organizationId: toolRequest.organizationId,
			actorType: "system",
			actorId: "executor",
			runId: toolRequest.runId,
			targetType: "tool_request",
			targetId: toolRequestId,
			action: "tool.execution_failed",
			metadata: { error: errorMessage },
		});
		await terminalizeRunIfNeeded(toolRequest, "failed", errorMessage);
	}
}
async function terminalizeRunIfNeeded(
	toolRequest: { runId: string; organizationId: string; id: string },
	status: "completed" | "failed",
	errorMessage?: string,
): Promise<void> {
	const [run] = await db
		.select()
		.from(agentRuns)
		.where(eq(agentRuns.id, toolRequest.runId))
		.limit(1);

	if (!run || run.status !== "waiting_for_approval") return;

	await db
		.update(agentRuns)
		.set({
			status,
			...(status === "failed" && errorMessage ? { errorMessage } : {}),
			completedAt: new Date(),
			updatedAt: new Date(),
		})
		.where(eq(agentRuns.id, toolRequest.runId));

	await writeRunStep({
		runId: toolRequest.runId,
		type: status === "completed" ? "run_completed" : "run_failed",
		status,
		...(status === "completed"
			? { outputMetadata: { source: "approved_tool_execution", toolRequestId: toolRequest.id } }
			: {
					errorMetadata: {
						source: "approved_tool_execution",
						toolRequestId: toolRequest.id,
						error: errorMessage,
					},
				}),
	});

	await writeAudit({
		organizationId: toolRequest.organizationId,
		actorType: "system",
		actorId: "executor",
		runId: toolRequest.runId,
		targetType: "agent_run",
		targetId: toolRequest.runId,
		action: status === "completed" ? "run.completed_after_approval" : "run.failed_after_approval",
		metadata: { toolRequestId: toolRequest.id },
	});

	await publishRealtimeEvent({
		type: "run.updated",
		organizationId: toolRequest.organizationId,
		runId: toolRequest.runId,
		status,
	});
}

export async function executeApprovedToolRequest(input: { toolRequestId: string }): Promise<void> {
	const { toolRequestId } = input;

	const [toolRequest] = await db
		.select()
		.from(toolRequests)
		.where(eq(toolRequests.id, toolRequestId))
		.limit(1);

	if (!toolRequest) {
		throw new Error(`Tool request not found: ${toolRequestId}`);
	}

	// Only execute approved tool requests
	if (toolRequest.status !== "approved") {
		await db.insert(auditLogs).values({
			id: randomUUID(),
			organizationId: toolRequest.organizationId,
			actorType: "system",
			actorId: "executor",
			runId: toolRequest.runId,
			targetType: "tool_request",
			targetId: toolRequestId,
			action: "tool.execution_skipped",
			metadata: { status: toolRequest.status },
		});
		return;
	}

	await executeToolRequest({ toolRequestId });
}
