import { eq, desc, and, count } from "drizzle-orm";
import { z } from "zod";
import { db } from "@agentclave/db";
import {
	agentRuns,
	agentRunSteps,
	toolRequests,
	toolExecutions,
	approvalSessions,
	auditLogs,
} from "@agentclave/db/schema/business";
import { organizationProcedure } from "../index";
import { throwNotFound } from "../core/errors";
import { runListQuerySchema, tableQuerySchema } from "@agentclave/schemas";

export const runsRouter = {
	list: organizationProcedure.input(runListQuerySchema).handler(async ({ context, input }) => {
		const orgId = context.activeOrganization!.id;
		const conditions = [eq(agentRuns.organizationId, orgId)];
		if (input.status) {
			conditions.push(eq(agentRuns.status, input.status));
		}
		const [countResult] = await db
			.select({ total: count() })
			.from(agentRuns)
			.where(and(...conditions));
		const total = Number(countResult?.total ?? 0);
		const rows = await db
			.select()
			.from(agentRuns)
			.where(and(...conditions))
			.orderBy(desc(agentRuns.createdAt))
			.limit(input.pageSize)
			.offset((input.page - 1) * input.pageSize);
		return { items: rows, total: Number(total) };
	}),

	getById: organizationProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ context, input }) => {
			const orgId = context.activeOrganization!.id;
			const [run] = await db.select().from(agentRuns).where(eq(agentRuns.id, input.id)).limit(1);
			if (!run || run.organizationId !== orgId) {
				throwNotFound("Run");
			}

			const steps = await db
				.select()
				.from(agentRunSteps)
				.where(eq(agentRunSteps.runId, input.id))
				.orderBy(agentRunSteps.stepIndex);

			const toolReqs = await db
				.select()
				.from(toolRequests)
				.where(eq(toolRequests.runId, input.id))
				.orderBy(toolRequests.createdAt);

			const toolExecs =
				toolReqs.length > 0
					? await db
							.select()
							.from(toolExecutions)
							.where(eq(toolExecutions.toolRequestId, toolReqs[0]!.id))
					: [];

			const approvals = await db
				.select()
				.from(approvalSessions)
				.where(eq(approvalSessions.runId, input.id))
				.orderBy(approvalSessions.createdAt);

			const auditEntries = await db
				.select()
				.from(auditLogs)
				.where(eq(auditLogs.runId, input.id))
				.orderBy(auditLogs.createdAt);

			return {
				...run,
				steps,
				toolRequests: toolReqs,
				toolExecutions: toolExecs,
				approvalSessions: approvals,
				auditLogs: auditEntries,
			};
		}),

	listByAgentId: organizationProcedure
		.input(z.object({ agentId: z.string() }).merge(tableQuerySchema))
		.handler(async ({ context, input }) => {
			const orgId = context.activeOrganization!.id;
			const conditions = [
				eq(agentRuns.organizationId, orgId),
				eq(agentRuns.agentId, input.agentId),
			];
			const [countResult] = await db
				.select({ total: count() })
				.from(agentRuns)
				.where(and(...conditions));
			const total = Number(countResult?.total ?? 0);
			const rows = await db
				.select()
				.from(agentRuns)
				.where(and(...conditions))
				.orderBy(desc(agentRuns.createdAt))
				.limit(input.pageSize)
				.offset((input.page - 1) * input.pageSize);
			return { items: rows, total: Number(total) };
		}),

	cancel: organizationProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ context, input }) => {
			const orgId = context.activeOrganization!.id;
			const [run] = await db.select().from(agentRuns).where(eq(agentRuns.id, input.id)).limit(1);
			if (!run || run.organizationId !== orgId) {
				throwNotFound("Run");
			}
			await db
				.update(agentRuns)
				.set({ status: "cancelled", updatedAt: new Date() })
				.where(eq(agentRuns.id, input.id));
			return { status: "cancelled" };
		}),
};
