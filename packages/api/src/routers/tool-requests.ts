import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { db } from "@agentclave/db";
import { toolRequests, approvalSessions, auditLogs } from "@agentclave/db/schema/business";
import { organizationProcedure } from "../index";
import { throwNotFound } from "../core/errors";
import { reviewApprovalSchema } from "@agentclave/schemas";
import { enqueueToolExecutionJob } from "../core/queues";
import { publishRealtimeEvent } from "../core/realtime/publisher";

export const toolRequestsRouter = {
	listByRunId: organizationProcedure
		.input(z.object({ runId: z.string() }))
		.handler(async ({ context, input }) => {
			const orgId = context.activeOrganization!.id;
			return await db
				.select()
				.from(toolRequests)
				.where(and(eq(toolRequests.organizationId, orgId), eq(toolRequests.runId, input.runId)))
				.orderBy(toolRequests.createdAt);
		}),

	getApprovalSession: organizationProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ context, input }) => {
			const orgId = context.activeOrganization!.id;
			const [session] = await db
				.select()
				.from(approvalSessions)
				.where(eq(approvalSessions.id, input.id))
				.limit(1);
			if (!session || session.organizationId !== orgId) {
				throwNotFound("Approval session");
			}
			return session;
		}),

	reviewApproval: organizationProcedure
		.input(reviewApprovalSchema)
		.handler(async ({ context, input }) => {
			const orgId = context.activeOrganization!.id;
			const userId = context.session!.user.id;

			const [session] = await db
				.select()
				.from(approvalSessions)
				.where(eq(approvalSessions.id, input.approvalId))
				.limit(1);

			if (!session || session.organizationId !== orgId) {
				throwNotFound("Approval session");
			}

			// Ignore duplicate decisions if already terminal
			if (
				session.status === "approved" ||
				session.status === "rejected" ||
				session.status === "expired" ||
				session.status === "cancelled"
			) {
				await db.insert(auditLogs).values({
					id: randomUUID(),
					organizationId: orgId,
					actorType: "user",
					actorId: userId,
					runId: session.runId,
					targetType: "approval_session",
					targetId: session.id,
					action: "approval.duplicate_ignored",
					metadata: { existingStatus: session.status },
				});
				return { status: session.status, ignored: true };
			}

			const newStatus = input.decision === "approved" ? "approved" : "rejected";

			await db
				.update(approvalSessions)
				.set({
					status: newStatus,
					approverUserId: userId,
					decisionNote: input.note ?? null,
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

			await db.insert(auditLogs).values({
				id: randomUUID(),
				organizationId: orgId,
				actorType: "user",
				actorId: userId,
				runId: session.runId,
				targetType: "approval_session",
				targetId: session.id,
				action: input.decision === "approved" ? "approval.approved" : "approval.rejected",
				metadata: { note: input.note },
			});
			await publishRealtimeEvent({
				type: "approval.decided",
				organizationId: orgId,
				runId: session.runId,
				approvalId: session.id,
				toolRequestId: session.toolRequestId,
				status: newStatus as "approved" | "rejected",
			});

			if (input.decision === "approved") {
				await enqueueToolExecutionJob({ toolRequestId: session.toolRequestId });
			}

			return { status: newStatus };
		}),
};
