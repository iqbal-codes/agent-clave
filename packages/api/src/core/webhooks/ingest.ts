import { db } from "@agentclave/db";
import {
	webhookEndpoints,
	webhookDeliveries,
	agentRuns,
	approvalSessions,
	toolRequests,
	auditLogs,
} from "@agentclave/db/schema/business";
import { eq, and } from "drizzle-orm";
import { randomUUID, createHash } from "node:crypto";
import { verifyWebhookRequest } from "./verify";
import { enqueueAgentRunJob, enqueueToolExecutionJob } from "../queues";
import { publishRealtimeEvent } from "../realtime/publisher";

interface IngestResult {
	status: number;
	body: Record<string, unknown>;
}

interface TelegramMessage {
	update_id: number;
	message?: {
		text?: string;
		chat?: { id: number };
		from?: { id: number; username?: string };
	};
}

export async function ingestWebhook(input: {
	publicToken: string;
	method: string;
	headers: Headers;
	rawBody: string;
}): Promise<IngestResult> {
	const { publicToken, method, headers, rawBody } = input;

	// Load endpoint
	const [endpoint] = await db
		.select()
		.from(webhookEndpoints)
		.where(
			and(eq(webhookEndpoints.publicToken, publicToken), eq(webhookEndpoints.status, "active")),
		)
		.limit(1);

	if (!endpoint) {
		return { status: 404, body: { error: "Endpoint not found or inactive" } };
	}

	// Check method
	if (endpoint.expectedMethod && method !== endpoint.expectedMethod) {
		return { status: 405, body: { error: "Method not allowed" } };
	}

	// Verify request
	if (!verifyWebhookRequest({ endpoint, rawBody, headers })) {
		return { status: 401, body: { error: "Invalid signature" } };
	}

	// Parse JSON body
	let payload: Record<string, unknown>;
	try {
		payload = JSON.parse(rawBody) as Record<string, unknown>;
	} catch {
		return { status: 400, body: { error: "Invalid JSON" } };
	}

	// Compute idempotency key
	let idempotencyKey: string;
	const telegramPayload = payload as unknown as TelegramMessage;
	if (telegramPayload.update_id) {
		idempotencyKey = `telegram:${telegramPayload.update_id}`;
	} else {
		const deliveryId = headers.get("x-agentclave-delivery-id");
		if (deliveryId) {
			idempotencyKey = deliveryId;
		} else {
			idempotencyKey = createHash("sha256").update(rawBody).digest("hex");
		}
	}

	// Check for duplicate delivery
	const [existingDelivery] = await db
		.select()
		.from(webhookDeliveries)
		.where(
			and(
				eq(webhookDeliveries.endpointId, endpoint.id),
				eq(webhookDeliveries.idempotencyKey, idempotencyKey),
			),
		)
		.limit(1);

	if (existingDelivery) {
		return {
			status: endpoint.responseStatus,
			body: endpoint.responseBody as Record<string, unknown>,
		};
	}

	// Store delivery
	const deliveryId = randomUUID();
	await db.insert(webhookDeliveries).values({
		id: deliveryId,
		organizationId: endpoint.organizationId,
		endpointId: endpoint.id,
		idempotencyKey,
		headers: Object.fromEntries(headers.entries()),
		payload,
		status: "received",
	});

	// Check if this is an approval reply
	if (telegramPayload.message?.text) {
		const text = telegramPayload.message.text.trim().toUpperCase();
		const approveMatch = text.match(/^APPROVE\s+([A-Z0-9]{6})$/);
		const rejectMatch = text.match(/^REJECT\s+([A-Z0-9]{6})\s*(.*)$/);

		if (approveMatch || rejectMatch) {
			const code = approveMatch?.[1] ?? rejectMatch?.[1];
			const note = rejectMatch?.[2]?.trim() ?? null;

			const [session] = await db
				.select()
				.from(approvalSessions)
				.where(eq(approvalSessions.approvalCode, code!))
				.limit(1);

			if (!session || session.status !== "pending") {
				return {
					status: endpoint.responseStatus,
					body: endpoint.responseBody as Record<string, unknown>,
				};
			}

			// Check expiry
			if (new Date() > session.expiresAt) {
				await db
					.update(approvalSessions)
					.set({
						status: "expired",
						decidedAt: new Date(),
					})
					.where(eq(approvalSessions.id, session.id));
				await publishRealtimeEvent({
					type: "approval.decided",
					organizationId: endpoint.organizationId,
					runId: session.runId,
					approvalId: session.id,
					toolRequestId: session.toolRequestId,
					status: "expired",
				});

				return {
					status: endpoint.responseStatus,
					body: endpoint.responseBody as Record<string, unknown>,
				};
			}

			const isApproval = Boolean(approveMatch);
			const newStatus = isApproval ? "approved" : "rejected";

			await db
				.update(approvalSessions)
				.set({
					status: newStatus,
					approverMetadata: {
						userId: telegramPayload.message.from?.id,
						username: telegramPayload.message.from?.username,
						chatId: telegramPayload.message.chat?.id,
					},
					decisionNote: note,
					decidedAt: new Date(),
				})
				.where(eq(approvalSessions.id, session.id));

			await db
				.update(toolRequests)
				.set({
					status: newStatus,
					updatedAt: new Date(),
				})
				.where(eq(toolRequests.id, session.toolRequestId));
			await publishRealtimeEvent({
				type: "approval.decided",
				organizationId: endpoint.organizationId,
				runId: session.runId,
				approvalId: session.id,
				toolRequestId: session.toolRequestId,
				status: newStatus as "approved" | "rejected",
			});

			await db.insert(auditLogs).values({
				id: randomUUID(),
				organizationId: endpoint.organizationId,
				actorType: "telegram_user",
				actorId: String(telegramPayload.message.from?.id ?? "unknown"),
				runId: session.runId,
				targetType: "approval_session",
				targetId: session.id,
				action: isApproval ? "approval.approved" : "approval.rejected",
				metadata: { approvalCode: code, note },
			});

			if (isApproval) {
				// Enqueue tool execution
				await enqueueToolExecutionJob({ toolRequestId: session.toolRequestId });
			} else {
				// Mark run as rejected
				await db
					.update(agentRuns)
					.set({
						status: "rejected",
						errorMessage: note ?? "Approval rejected by manager",
						completedAt: new Date(),
						updatedAt: new Date(),
					})
					.where(eq(agentRuns.id, session.runId));
				await publishRealtimeEvent({
					type: "run.updated",
					organizationId: endpoint.organizationId,
					runId: session.runId,
					status: "rejected",
				});
			}

			// Mark delivery as processed
			await db
				.update(webhookDeliveries)
				.set({
					status: "processed",
					runId: session.runId,
					processedAt: new Date(),
				})
				.where(eq(webhookDeliveries.id, deliveryId));

			return {
				status: endpoint.responseStatus,
				body: endpoint.responseBody as Record<string, unknown>,
			};
		}
	}

	// Create agent run
	const runId = randomUUID();
	const inputMessage = telegramPayload.message?.text ?? null;
	const requesterMetadata = telegramPayload.message
		? {
				chatId: telegramPayload.message.chat?.id,
				userId: telegramPayload.message.from?.id,
				username: telegramPayload.message.from?.username,
			}
		: null;

	await db.insert(agentRuns).values({
		id: runId,
		organizationId: endpoint.organizationId,
		agentId: endpoint.agentId!,
		status: "queued",
		triggerSource: `webhook:${endpoint.id}`,
		requesterId: telegramPayload.message?.from?.id ? String(telegramPayload.message.from.id) : null,
		requesterMetadata,
		inputMessage,
		inputPayload: payload,
	});
	await publishRealtimeEvent({
		type: "run.updated",
		organizationId: endpoint.organizationId,
		runId,
		status: "queued",
	});

	// Mark delivery with run
	await db
		.update(webhookDeliveries)
		.set({
			status: "queued",
			runId,
			processedAt: new Date(),
		})
		.where(eq(webhookDeliveries.id, deliveryId));

	// Enqueue processing
	await enqueueAgentRunJob({ runId });

	return {
		status: endpoint.responseStatus,
		body: endpoint.responseBody as Record<string, unknown>,
	};
}
