import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@agentclave/db";
import { policies } from "@agentclave/db/schema/business";
import { organizationProcedure } from "../index";
import { throwNotFound } from "../core/errors";
import {
	createPolicyRuleSchema,
	updatePolicyRuleSchema,
	tableQuerySchema,
} from "@agentclave/schemas";

export const policyRouter = {
	list: organizationProcedure.input(tableQuerySchema).handler(async ({ context }) => {
		const orgId = context.activeOrganization!.id;
		return await db
			.select()
			.from(policies)
			.where(eq(policies.organizationId, orgId))
			.orderBy(policies.priority);
	}),

	getById: organizationProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ context, input }) => {
			const orgId = context.activeOrganization!.id;
			const [policy] = await db.select().from(policies).where(eq(policies.id, input.id)).limit(1);
			if (!policy || policy.organizationId !== orgId) {
				throwNotFound("Policy");
			}
			return policy;
		}),

	create: organizationProcedure
		.input(createPolicyRuleSchema)
		.handler(async ({ context, input }) => {
			const orgId = context.activeOrganization!.id;
			const userId = context.session!.user.id;
			const id = randomUUID();
			await db.insert(policies).values({
				id,
				organizationId: orgId,
				agentId: input.agentId ?? null,
				toolId: input.toolId ?? null,
				toolName: input.toolName ?? null,
				effect: input.effect,
				conditions: input.conditions ?? null,
				approverRole: input.approverRole ?? null,
				priority: input.priority ?? 0,
				createdBy: userId,
			});
			const [created] = await db.select().from(policies).where(eq(policies.id, id)).limit(1);
			return created;
		}),

	update: organizationProcedure
		.input(updatePolicyRuleSchema)
		.handler(async ({ context, input }) => {
			const orgId = context.activeOrganization!.id;
			const { id, enabled, ...rest } = input;
			const [existing] = await db.select().from(policies).where(eq(policies.id, id)).limit(1);
			if (!existing || existing.organizationId !== orgId) {
				throwNotFound("Policy");
			}
			const updateData: Record<string, unknown> = { ...rest, updatedAt: new Date() };
			if (enabled !== undefined) {
				updateData.enabled = enabled;
			}
			await db.update(policies).set(updateData).where(eq(policies.id, id));
			const [updated] = await db.select().from(policies).where(eq(policies.id, id)).limit(1);
			return updated;
		}),

	delete: organizationProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ context, input }) => {
			const orgId = context.activeOrganization!.id;
			const [existing] = await db.select().from(policies).where(eq(policies.id, input.id)).limit(1);
			if (!existing || existing.organizationId !== orgId) {
				throwNotFound("Policy");
			}
			await db.delete(policies).where(eq(policies.id, input.id));
			return { deleted: true };
		}),
};
