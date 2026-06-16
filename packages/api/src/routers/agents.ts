import { randomUUID } from "node:crypto";
import { eq, and, count } from "drizzle-orm";
import { z } from "zod";
import { db } from "@agentclave/db";
import { agents, agentTools, tools, agentRuns } from "@agentclave/db/schema/business";
import { organizationProcedure } from "../index";
import { throwNotFound, throwAgentDisabled } from "../core/errors";
import {
	createAgentSchema,
	updateAgentSchema,
	tableQuerySchema,
	testRunSchema,
} from "@agentclave/schemas";
import { enqueueAgentRunJob } from "../core/queues";
import { writeAudit } from "../core/audit";
import { publishRealtimeEvent } from "../core/realtime/publisher";

export const agentsRouter = {
	list: organizationProcedure.input(tableQuerySchema).handler(async ({ context, input }) => {
		const orgId = context.activeOrganization!.id;
		const conditions = [eq(agents.organizationId, orgId)];
		const [countResult] = await db
			.select({ total: count() })
			.from(agents)
			.where(and(...conditions));
		const total = Number(countResult?.total ?? 0);
		const rows = await db
			.select()
			.from(agents)
			.where(and(...conditions))
			.orderBy(agents.createdAt)
			.limit(input.pageSize)
			.offset((input.page - 1) * input.pageSize);
		return { items: rows, total: Number(total) };
	}),

	getById: organizationProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ context, input }) => {
			const orgId = context.activeOrganization!.id;
			const [agent] = await db.select().from(agents).where(eq(agents.id, input.id)).limit(1);
			if (!agent || agent.organizationId !== orgId) {
				throwNotFound("Agent");
			}
			return agent;
		}),

	create: organizationProcedure.input(createAgentSchema).handler(async ({ context, input }) => {
		const orgId = context.activeOrganization!.id;
		const userId = context.session!.user.id;
		const id = randomUUID();
		await db.insert(agents).values({
			id,
			organizationId: orgId,
			name: input.name,
			description: input.description ?? null,
			role: input.role ?? null,
			purpose: input.purpose ?? null,
			model: input.model ?? "xiaomi/mimo-v2.5",
			systemPrompt: input.systemPrompt ?? null,
			guardrails: input.guardrails ?? [],
			riskLevel: input.riskLevel ?? "medium",
			dailyBudget: input.dailyBudget ?? null,
			ownerUserId: input.ownerUserId ?? null,
			createdBy: userId,
		});
		const [created] = await db.select().from(agents).where(eq(agents.id, id)).limit(1);
		return created;
	}),

	update: organizationProcedure.input(updateAgentSchema).handler(async ({ context, input }) => {
		const orgId = context.activeOrganization!.id;
		const { id, status, ...rest } = input;
		const [existing] = await db.select().from(agents).where(eq(agents.id, id)).limit(1);
		if (!existing || existing.organizationId !== orgId) {
			throwNotFound("Agent");
		}
		const updateData: Record<string, unknown> = { ...rest, updatedAt: new Date() };
		if (status !== undefined) {
			updateData.status = status;
		}
		await db.update(agents).set(updateData).where(eq(agents.id, id));
		const [updated] = await db.select().from(agents).where(eq(agents.id, id)).limit(1);
		return updated;
	}),

	delete: organizationProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ context, input }) => {
			const orgId = context.activeOrganization!.id;
			const [existing] = await db.select().from(agents).where(eq(agents.id, input.id)).limit(1);
			if (!existing || existing.organizationId !== orgId) {
				throwNotFound("Agent");
			}
			await db.delete(agents).where(eq(agents.id, input.id));
			return { deleted: true };
		}),

	pause: organizationProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ context, input }) => {
			const orgId = context.activeOrganization!.id;
			const [existing] = await db.select().from(agents).where(eq(agents.id, input.id)).limit(1);
			if (!existing || existing.organizationId !== orgId) {
				throwNotFound("Agent");
			}
			await db
				.update(agents)
				.set({ status: "paused", updatedAt: new Date() })
				.where(eq(agents.id, input.id));
			return { status: "paused" };
		}),

	activate: organizationProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ context, input }) => {
			const orgId = context.activeOrganization!.id;
			const [existing] = await db.select().from(agents).where(eq(agents.id, input.id)).limit(1);
			if (!existing || existing.organizationId !== orgId) {
				throwNotFound("Agent");
			}
			await db
				.update(agents)
				.set({ status: "active", updatedAt: new Date() })
				.where(eq(agents.id, input.id));
			return { status: "active" };
		}),

	listTools: organizationProcedure
		.input(z.object({ agentId: z.string() }))
		.handler(async ({ context, input }) => {
			const orgId = context.activeOrganization!.id;
			const bindings = await db
				.select()
				.from(agentTools)
				.where(eq(agentTools.agentId, input.agentId));

			const toolIds = bindings.map((b) => b.toolId);
			if (toolIds.length === 0) return [];

			const toolList = await db.select().from(tools).where(eq(tools.organizationId, orgId));

			return toolList.filter((t) => toolIds.includes(t.id));
		}),
	testRun: organizationProcedure.input(testRunSchema).handler(async ({ context, input }) => {
		const orgId = context.activeOrganization!.id;
		const userId = context.session!.user.id;

		const [agent] = await db
			.select()
			.from(agents)
			.where(and(eq(agents.id, input.agentId), eq(agents.organizationId, orgId)))
			.limit(1);

		if (!agent) throwNotFound("Agent");
		if (agent.status !== "active") throwAgentDisabled(agent.name);

		const runId = randomUUID();
		await db.insert(agentRuns).values({
			id: runId,
			organizationId: orgId,
			agentId: input.agentId,
			status: "queued",
			triggerSource: "test_run",
			requesterId: userId,
			requesterMetadata: { source: "web" },
			inputMessage: input.message,
			inputPayload: { message: input.message },
		});

		await writeAudit({
			organizationId: orgId,
			actorType: "user",
			actorId: userId,
			runId,
			targetType: "agent_run",
			targetId: runId,
			action: "run.test_requested",
		});

		await enqueueAgentRunJob({ runId });

		await publishRealtimeEvent({
			type: "run.updated",
			organizationId: orgId,
			runId,
			status: "queued",
		});

		return { runId };
	}),
};
