import { randomUUID } from "node:crypto";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { db } from "@agentclave/db";
import { connectors, webhookEndpoints, webhookDeliveries } from "@agentclave/db/schema/business";
import { organizationProcedure } from "../index";
import { throwNotFound } from "../core/errors";
import {
	createConnectorSchema,
	createWebhookEndpointSchema,
	tableQuerySchema,
} from "@agentclave/schemas";
import { encryptSecret } from "../core/credentials";

export const connectorsRouter = {
	// ── Connectors ──────────────────────────────────────────
	list: organizationProcedure.input(tableQuerySchema).handler(async ({ context, input }) => {
		const orgId = context.activeOrganization!.id;
		return await db
			.select()
			.from(connectors)
			.where(eq(connectors.organizationId, orgId))
			.orderBy(connectors.createdAt)
			.limit(input.pageSize)
			.offset((input.page - 1) * input.pageSize);
	}),

	getById: organizationProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ context, input }) => {
			const orgId = context.activeOrganization!.id;
			const [connector] = await db
				.select()
				.from(connectors)
				.where(eq(connectors.id, input.id))
				.limit(1);
			if (!connector || connector.organizationId !== orgId) {
				throwNotFound("Connector");
			}
			// Never return decrypted credentials
			return {
				...connector,
				encryptedCredentials: connector.encryptedCredentials ? "[ENCRYPTED]" : null,
			};
		}),

	create: organizationProcedure.input(createConnectorSchema).handler(async ({ context, input }) => {
		const orgId = context.activeOrganization!.id;
		const id = randomUUID();
		const encryptedCredentials = input.credentials ? encryptSecret(input.credentials) : null;
		await db.insert(connectors).values({
			id,
			organizationId: orgId,
			type: input.type,
			provider: input.provider,
			name: input.name,
			config: input.config,
			encryptedCredentials,
			status: input.status,
		});
		const [created] = await db.select().from(connectors).where(eq(connectors.id, id)).limit(1);
		return { ...created!, encryptedCredentials: encryptedCredentials ? "[ENCRYPTED]" : null };
	}),

	update: organizationProcedure
		.input(z.object({ id: z.string() }).merge(createConnectorSchema.partial()))
		.handler(async ({ context, input }) => {
			const orgId = context.activeOrganization!.id;
			const { id, credentials, ...rest } = input;
			const [existing] = await db.select().from(connectors).where(eq(connectors.id, id)).limit(1);
			if (!existing || existing.organizationId !== orgId) {
				throwNotFound("Connector");
			}
			const updateData: Record<string, unknown> = { ...rest, updatedAt: new Date() };
			if (credentials !== undefined) {
				updateData.encryptedCredentials = credentials ? encryptSecret(credentials) : null;
			}
			await db.update(connectors).set(updateData).where(eq(connectors.id, id));
			const [updated] = await db.select().from(connectors).where(eq(connectors.id, id)).limit(1);
			return updated;
		}),

	delete: organizationProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ context, input }) => {
			const orgId = context.activeOrganization!.id;
			const [existing] = await db
				.select()
				.from(connectors)
				.where(eq(connectors.id, input.id))
				.limit(1);
			if (!existing || existing.organizationId !== orgId) {
				throwNotFound("Connector");
			}
			await db.delete(connectors).where(eq(connectors.id, input.id));
			return { deleted: true };
		}),

	// ── Webhook Endpoints ──────────────────────────────────
	listEndpoints: organizationProcedure
		.input(z.object({ connectorId: z.string().optional() }).merge(tableQuerySchema))
		.handler(async ({ context, input }) => {
			const orgId = context.activeOrganization!.id;
			const conditions = [eq(webhookEndpoints.organizationId, orgId)];
			if (input.connectorId) {
				conditions.push(eq(webhookEndpoints.connectorId, input.connectorId));
			}
			return await db
				.select()
				.from(webhookEndpoints)
				.where(and(...conditions))
				.orderBy(webhookEndpoints.createdAt)
				.limit(input.pageSize)
				.offset((input.page - 1) * input.pageSize);
		}),

	createEndpoint: organizationProcedure
		.input(createWebhookEndpointSchema)
		.handler(async ({ context, input }) => {
			const orgId = context.activeOrganization!.id;
			const id = randomUUID();
			const publicToken = randomUUID().replace(/-/g, "").slice(0, 32);
			const encryptedSecret = input.secret ? encryptSecret({ secret: input.secret }) : null;
			await db.insert(webhookEndpoints).values({
				id,
				organizationId: orgId,
				connectorId: input.connectorId ?? null,
				agentId: input.agentId ?? null,
				name: input.name,
				publicToken,
				verificationType: input.verificationType,
				secretHeaderName: input.secretHeaderName ?? null,
				encryptedSecret,
				responseStatus: input.responseStatus,
				responseBody: input.responseBody,
				status: input.status,
			});
			const [created] = await db
				.select()
				.from(webhookEndpoints)
				.where(eq(webhookEndpoints.id, id))
				.limit(1);
			return {
				...created!,
				publicUrlPath: `/api/webhooks/custom/${publicToken}`,
				encryptedSecret: encryptedSecret ? "[ENCRYPTED]" : null,
			};
		}),

	rotateSecret: organizationProcedure
		.input(z.object({ id: z.string(), newSecret: z.string().min(1) }))
		.handler(async ({ context, input }) => {
			const orgId = context.activeOrganization!.id;
			const [existing] = await db
				.select()
				.from(webhookEndpoints)
				.where(eq(webhookEndpoints.id, input.id))
				.limit(1);
			if (!existing || existing.organizationId !== orgId) {
				throwNotFound("Webhook endpoint");
			}
			const encryptedSecret = encryptSecret({ secret: input.newSecret });
			await db
				.update(webhookEndpoints)
				.set({
					encryptedSecret,
					updatedAt: new Date(),
				})
				.where(eq(webhookEndpoints.id, input.id));
			return { rotated: true };
		}),

	deleteEndpoint: organizationProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ context, input }) => {
			const orgId = context.activeOrganization!.id;
			const [existing] = await db
				.select()
				.from(webhookEndpoints)
				.where(eq(webhookEndpoints.id, input.id))
				.limit(1);
			if (!existing || existing.organizationId !== orgId) {
				throwNotFound("Webhook endpoint");
			}
			await db.delete(webhookEndpoints).where(eq(webhookEndpoints.id, input.id));
			return { deleted: true };
		}),

	listDeliveries: organizationProcedure
		.input(z.object({ endpointId: z.string() }).merge(tableQuerySchema))
		.handler(async ({ context, input }) => {
			const orgId = context.activeOrganization!.id;
			return await db
				.select()
				.from(webhookDeliveries)
				.where(
					and(
						eq(webhookDeliveries.organizationId, orgId),
						eq(webhookDeliveries.endpointId, input.endpointId),
					),
				)
				.orderBy(webhookDeliveries.receivedAt)
				.limit(input.pageSize)
				.offset((input.page - 1) * input.pageSize);
		}),
};
