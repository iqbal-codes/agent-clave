import { randomUUID } from "node:crypto";
import { eq, and, or, inArray, ilike, count, asc, desc } from "drizzle-orm";
import { z } from "zod";
import { db } from "@agentclave/db";
import { tools, agentTools } from "@agentclave/db/schema/business";
import { organizationProcedure } from "../index";
import { throwNotFound } from "../core/errors";
import { createToolSchema, bindAgentToolSchema, toolListQuerySchema } from "@agentclave/schemas";
import { validateJsonSchemaPayload } from "../core/json-schema/validate";

export const toolsRouter = {
	list: organizationProcedure.input(toolListQuerySchema).handler(async ({ context, input }) => {
		const orgId = context.activeOrganization!.id;
		const conditions = [eq(tools.organizationId, orgId)];
		if (input.search) {
			conditions.push(
				or(ilike(tools.name, `%${input.search}%`), ilike(tools.description, `%${input.search}%`))!,
			);
		}
		if (input.riskLevel && input.riskLevel.length > 0) {
			conditions.push(inArray(tools.riskLevel, input.riskLevel));
		}
		if (input.executorType && input.executorType.length > 0) {
			conditions.push(inArray(tools.executorType, input.executorType));
		}
		if (input.defaultPolicy && input.defaultPolicy.length > 0) {
			conditions.push(inArray(tools.defaultPolicy, input.defaultPolicy));
		}
		if (input.status && input.status.length > 0) {
			conditions.push(inArray(tools.status, input.status));
		}
		const [countResult] = await db
			.select({ total: count() })
			.from(tools)
			.where(and(...conditions));
		const total = Number(countResult?.total ?? 0);
		const sortColumn =
			input.sort === "name"
				? tools.name
				: input.sort === "riskLevel"
					? tools.riskLevel
					: tools.createdAt;
		const rows = await db
			.select()
			.from(tools)
			.where(and(...conditions))
			.orderBy(input.order === "asc" ? asc(sortColumn) : desc(sortColumn))
			.limit(input.pageSize)
			.offset((input.page - 1) * input.pageSize);
		return { items: rows, total: Number(total) };
	}),

	getById: organizationProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ context, input }) => {
			const orgId = context.activeOrganization!.id;
			const [tool] = await db.select().from(tools).where(eq(tools.id, input.id)).limit(1);
			if (!tool || tool.organizationId !== orgId) {
				throwNotFound("Tool");
			}
			return tool;
		}),

	create: organizationProcedure.input(createToolSchema).handler(async ({ context, input }) => {
		const orgId = context.activeOrganization!.id;

		// Validate JSON schemas
		validateJsonSchemaPayload({
			schema: input.inputSchema,
			payload: {},
			label: `${input.name} input schema`,
		});
		validateJsonSchemaPayload({
			schema: input.outputSchema,
			payload: {},
			label: `${input.name} output schema`,
		});

		const id = randomUUID();
		await db.insert(tools).values({
			id,
			organizationId: orgId,
			name: input.name,
			description: input.description ?? null,
			connectorId: input.connectorId ?? null,
			inputSchema: input.inputSchema,
			outputSchema: input.outputSchema,
			riskLevel: input.riskLevel,
			executorType: input.executorType,
			executorConfig: input.executorConfig,
			defaultPolicy: input.defaultPolicy,
			status: input.status,
		});
		const [created] = await db.select().from(tools).where(eq(tools.id, id)).limit(1);
		return created;
	}),

	update: organizationProcedure
		.input(createToolSchema.partial().extend({ id: z.string() }))
		.handler(async ({ context, input }) => {
			const orgId = context.activeOrganization!.id;
			const { id, ...rest } = input;
			const [existing] = await db.select().from(tools).where(eq(tools.id, id)).limit(1);
			if (!existing || existing.organizationId !== orgId) {
				throwNotFound("Tool");
			}

			// Validate JSON schemas if provided
			if (rest.inputSchema) {
				validateJsonSchemaPayload({
					schema: rest.inputSchema,
					payload: {},
					label: `${rest.name ?? existing.name} input schema`,
				});
			}
			if (rest.outputSchema) {
				validateJsonSchemaPayload({
					schema: rest.outputSchema,
					payload: {},
					label: `${rest.name ?? existing.name} output schema`,
				});
			}

			await db
				.update(tools)
				.set({ ...rest, updatedAt: new Date() })
				.where(eq(tools.id, id));
			const [updated] = await db.select().from(tools).where(eq(tools.id, id)).limit(1);
			return updated;
		}),

	delete: organizationProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ context, input }) => {
			const orgId = context.activeOrganization!.id;
			const [existing] = await db.select().from(tools).where(eq(tools.id, input.id)).limit(1);
			if (!existing || existing.organizationId !== orgId) {
				throwNotFound("Tool");
			}
			await db.delete(tools).where(eq(tools.id, input.id));
			return { deleted: true };
		}),

	bindToAgent: organizationProcedure
		.input(bindAgentToolSchema)
		.handler(async ({ context, input }) => {
			const orgId = context.activeOrganization!.id;
			// Verify tool belongs to org
			const [tool] = await db.select().from(tools).where(eq(tools.id, input.toolId)).limit(1);
			if (!tool || tool.organizationId !== orgId) {
				throwNotFound("Tool");
			}

			const id = randomUUID();
			await db.insert(agentTools).values({
				id,
				agentId: input.agentId,
				toolId: input.toolId,
				enabled: input.enabled,
			});
			return { bound: true };
		}),

	unbindFromAgent: organizationProcedure
		.input(z.object({ agentId: z.string(), toolId: z.string() }))
		.handler(async ({ input }) => {
			await db
				.delete(agentTools)
				.where(and(eq(agentTools.agentId, input.agentId), eq(agentTools.toolId, input.toolId)));
			return { unbound: true };
		}),
};
