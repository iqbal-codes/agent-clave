import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@agentclave/db";
import { agents, agentTools, tools } from "@agentclave/db/schema/business";
import { organizationProcedure } from "../index";
import { throwNotFound } from "../core/errors";
import { createAgentSchema, updateAgentSchema, tableQuerySchema } from "@agentclave/schemas";

export const agentsRouter = {
	list: organizationProcedure.input(tableQuerySchema).handler(async ({ context, input }) => {
		const orgId = context.activeOrganization!.id;
		const rows = await db
			.select()
			.from(agents)
			.where(eq(agents.organizationId, orgId))
			.orderBy(agents.createdAt)
			.limit(input.pageSize)
			.offset((input.page - 1) * input.pageSize);
		return rows;
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
};
