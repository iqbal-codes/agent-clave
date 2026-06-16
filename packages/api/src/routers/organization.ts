import { eq, sql, count } from "drizzle-orm";
import { db } from "@agentclave/db";
import { agentRuns, toolRequests } from "@agentclave/db/schema/business";
import { organizationProcedure, publicProcedure } from "../index";
import { updateOrganizationSchema } from "@agentclave/schemas";

export const organizationRouter = {
	getContext: publicProcedure.handler(async ({ context }) => {
		return {
			session: context.session,
			activeOrganization: context.activeOrganization,
			activeMember: context.activeMember,
			permissions: context.permissions,
		};
	}),

	updateProfile: organizationProcedure
		.input(updateOrganizationSchema)
		.handler(async ({ context, input: _input }) => {
			const orgId = context.activeOrganization!.id;
			return { organizationId: orgId };
		}),

	getDashboard: organizationProcedure.handler(async ({ context }) => {
		const orgId = context.activeOrganization!.id;

		const [runCount] = await db
			.select({ value: count() })
			.from(agentRuns)
			.where(
				sql`${agentRuns.organizationId} = ${orgId} AND ${agentRuns.createdAt} >= CURRENT_DATE`,
			);

		const [pendingCount] = await db
			.select({ value: count() })
			.from(toolRequests)
			.where(
				sql`${toolRequests.organizationId} = ${orgId} AND ${toolRequests.status} = 'pending_approval'`,
			);

		const [activeAgentCount] = await db
			.select({ value: count(sql`DISTINCT ${agentRuns.agentId}`) })
			.from(agentRuns)
			.where(
				sql`${agentRuns.organizationId} = ${orgId} AND ${agentRuns.status} IN ('queued', 'running', 'waiting_for_approval')`,
			);

		const [completedCount] = await db
			.select({ value: count() })
			.from(agentRuns)
			.where(
				sql`${agentRuns.organizationId} = ${orgId} AND ${agentRuns.status} = 'completed' AND ${agentRuns.createdAt} >= CURRENT_DATE`,
			);

		const [failedCount] = await db
			.select({ value: count() })
			.from(agentRuns)
			.where(
				sql`${agentRuns.organizationId} = ${orgId} AND ${agentRuns.status} = 'failed' AND ${agentRuns.createdAt} >= CURRENT_DATE`,
			);

		const recentRuns = await db
			.select()
			.from(agentRuns)
			.where(eq(agentRuns.organizationId, orgId))
			.orderBy(sql`${agentRuns.createdAt} DESC`)
			.limit(10);

		return {
			totalRunsToday: Number(runCount?.value ?? 0),
			pendingApprovals: Number(pendingCount?.value ?? 0),
			activeAgents: Number(activeAgentCount?.value ?? 0),
			completedRunsToday: Number(completedCount?.value ?? 0),
			failedRunsToday: Number(failedCount?.value ?? 0),
			averageLatencyMs: 0,
			estimatedCostToday: 0,
			recentRuns,
			topTools: [],
			approvalRate: 0,
		};
	}),
};
