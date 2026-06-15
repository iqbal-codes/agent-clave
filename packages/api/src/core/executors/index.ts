import { db } from "@agentclave/db";
import { toolRequests, tools, auditLogs } from "@agentclave/db/schema/business";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { executeHttpRequest } from "./http";

export async function executeToolRequest(input: {
	toolRequestId: string;
}): Promise<void> {
	const { toolRequestId } = input;

	const [toolRequest] = await db
		.select()
		.from(toolRequests)
		.where(eq(toolRequests.id, toolRequestId))
		.limit(1);

	if (!toolRequest) {
		throw new Error(`Tool request not found: ${toolRequestId}`);
	}

	const [tool] = await db
		.select()
		.from(tools)
		.where(eq(tools.id, toolRequest.toolId))
		.limit(1);

	if (!tool) {
		throw new Error(`Tool not found: ${toolRequest.toolId}`);
	}

	// Mark as executing
	await db.update(toolRequests).set({
		status: "executing",
		updatedAt: new Date(),
	}).where(eq(toolRequests.id, toolRequestId));

	try {
		if (tool.executorType === "http") {
			await executeHttpRequest({ toolRequestId });
		} else {
			// Unknown executor type
			await db.update(toolRequests).set({
				status: "failed",
				completedAt: new Date(),
				updatedAt: new Date(),
			}).where(eq(toolRequests.id, toolRequestId));

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
		}
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : "Unknown error";

		await db.update(toolRequests).set({
			status: "failed",
			completedAt: new Date(),
			updatedAt: new Date(),
		}).where(eq(toolRequests.id, toolRequestId));

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
	}
}

export async function executeApprovedToolRequest(input: {
	toolRequestId: string;
}): Promise<void> {
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
