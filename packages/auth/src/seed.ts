import { randomUUID } from "node:crypto";
import { eq, and } from "drizzle-orm";
import { db } from "./db-instance";
import {
	organizationSettings,
	agents,
	policies,
	connectors,
	webhookEndpoints,
	tools,
	agentTools,
} from "@agentclave/db/schema/business";
import { encryptSecret } from "@agentclave/env/credentials";
import { env } from "@agentclave/env/server";

const now = () => new Date();

export async function seedWorkspaceTables(orgId: string, userId: string): Promise<void> {
	const timestamp = now();
	const telegramEnabled = Boolean(process.env.TELEGRAM_BOT_TOKEN);

	// ── Org Settings ──────────────────────────────────────
	const existingSettings = await db.query.organizationSettings.findFirst({
		where: eq(organizationSettings.organizationId, orgId),
	});
	if (!existingSettings) {
		await db.insert(organizationSettings).values({
			id: randomUUID(),
			organizationId: orgId,
			maxDailyRuns: 100,
			defaultApprovalTimeoutMinutes: 1440,
			createdAt: timestamp,
			updatedAt: timestamp,
		});
	}

	// ── Default Agent ─────────────────────────────────────
	const existingAgent = await db.query.agents.findFirst({
		where: eq(agents.organizationId, orgId),
	});
	if (!existingAgent) {
		const agentId = randomUUID();
		await db.insert(agents).values({
			id: agentId,
			organizationId: orgId,
			name: "Inventory Ops Agent",
			description: "Handles inventory requests from Telegram through governed tools",
			role: "inventory_ops",
			purpose: "Handle inventory requests from Telegram through governed tools",
			model: "xiaomi/mimo-v2.5",
			systemPrompt: [
				"You are an inventory operations agent.",
				"Rules:",
				"- Never guess SKU. Always search product first.",
				"- Check stock before proposing adjustment.",
				"- Every adjustment needs a reason.",
				"- Stock adjustments require manager approval.",
				"- Send Telegram notifications after completion or rejection.",
			].join("\n"),
			guardrails: [
				"never guess SKU",
				"check stock before adjustment",
				"every adjustment needs reason",
			],
			riskLevel: "medium",
			status: "paused",
			createdBy: userId,
			ownerUserId: userId,
			createdAt: timestamp,
			updatedAt: timestamp,
		});
		// ── Connectors ──────────────────────────────────────
		const inventoryConnectorId = randomUUID();

		if (telegramEnabled) {
			const telegramConnectorId = randomUUID();
			await db.insert(connectors).values({
				id: telegramConnectorId,
				organizationId: orgId,
				type: "telegram",
				provider: "telegram",
				name: "Telegram Bot",
				config: { managerChatId: process.env.TELEGRAM_MANAGER_CHAT_ID ?? "" },
				encryptedCredentials: encryptSecret(
					{ botToken: process.env.TELEGRAM_BOT_TOKEN ?? "" },
					env.CREDENTIAL_ENCRYPTION_KEY,
				),
				status: "paused",
				createdAt: timestamp,
				updatedAt: timestamp,
			});

			// ── Webhook Endpoint ────────────────────────────
			const webhookToken = randomUUID().replace(/-/g, "").slice(0, 32);
			await db.insert(webhookEndpoints).values({
				id: randomUUID(),
				organizationId: orgId,
				connectorId: telegramConnectorId,
				agentId,
				name: "Telegram inbound",
				publicToken: webhookToken,
				verificationType: "header_secret",
				secretHeaderName: "X-Telegram-Bot-Api-Secret-Token",
				encryptedSecret: encryptSecret(
					{ secret: process.env.TELEGRAM_WEBHOOK_SECRET ?? "dev-telegram-secret" },
					env.CREDENTIAL_ENCRYPTION_KEY,
				),
				responseStatus: 202,
				responseBody: { ok: true },
				status: "paused",
				createdAt: timestamp,
				updatedAt: timestamp,
			});
		}

		await db.insert(connectors).values({
			id: inventoryConnectorId,
			organizationId: orgId,
			type: "http",
			provider: "demo_inventory",
			name: "Demo Inventory API",
			config: { baseUrl: process.env.DEMO_INVENTORY_API_BASE_URL ?? "http://localhost:4301" },
			encryptedCredentials: encryptSecret(
				{ apiKey: process.env.DEMO_INVENTORY_API_KEY ?? "demo-inventory-key" },
				env.CREDENTIAL_ENCRYPTION_KEY,
			),
			status: "paused",
			createdAt: timestamp,
			updatedAt: timestamp,
		});

		// ── Tools ───────────────────────────────────────────
		const searchProductToolId = randomUUID();
		const getStockToolId = randomUUID();
		const createAdjustmentToolId = randomUUID();

		const toolDefs = [
			{
				id: searchProductToolId,
				name: "inventory.search_product",
				description: "Search products by name or SKU",
				connectorId: inventoryConnectorId,
				inputSchema: {
					type: "object",
					properties: { query: { type: "string", description: "Search query" } },
					required: ["query"],
				},
				outputSchema: {
					type: "object",
					properties: { results: { type: "array", items: { type: "object" } } },
				},
				riskLevel: "low" as const,
				executorType: "http",
				executorConfig: {
					method: "GET",
					url: "{{connector.config.baseUrl}}/products/search?q={{input.query}}",
					headers: { Authorization: "Bearer {{credentials.apiKey}}" },
				},
				defaultPolicy: "allow" as const,
			},
			{
				id: getStockToolId,
				name: "inventory.get_stock",
				description: "Get current stock level for a SKU",
				connectorId: inventoryConnectorId,
				inputSchema: {
					type: "object",
					properties: { sku: { type: "string", description: "Product SKU" } },
					required: ["sku"],
				},
				outputSchema: {
					type: "object",
					properties: { sku: { type: "string" }, quantity: { type: "number" } },
				},
				riskLevel: "low" as const,
				executorType: "http",
				executorConfig: {
					method: "GET",
					url: "{{connector.config.baseUrl}}/stock/{{input.sku}}",
					headers: { Authorization: "Bearer {{credentials.apiKey}}" },
				},
				defaultPolicy: "allow" as const,
			},
			{
				id: createAdjustmentToolId,
				name: "inventory.create_stock_adjustment",
				description: "Create a stock adjustment (requires manager approval)",
				connectorId: inventoryConnectorId,
				inputSchema: {
					type: "object",
					properties: {
						sku: { type: "string", description: "Product SKU" },
						newQuantity: { type: "number", description: "New stock quantity" },
						reason: { type: "string", description: "Reason for adjustment" },
						damageQuantity: { type: "number", description: "Damaged items count" },
						notes: { type: "string", description: "Additional notes" },
					},
					required: ["sku", "newQuantity", "reason"],
				},
				outputSchema: {
					type: "object",
					properties: {
						adjustmentId: { type: "string" },
						sku: { type: "string" },
						previousQuantity: { type: "number" },
						newQuantity: { type: "number" },
					},
				},
				riskLevel: "high" as const,
				executorType: "http",
				executorConfig: {
					method: "POST",
					url: "{{connector.config.baseUrl}}/stock-adjustments",
					headers: { Authorization: "Bearer {{credentials.apiKey}}" },
					body: "input",
					idempotencyHeader: "Idempotency-Key",
				},
				defaultPolicy: "require_approval" as const,
			},
		];

		for (const toolDef of toolDefs) {
			await db.insert(tools).values({
				id: toolDef.id,
				organizationId: orgId,
				connectorId: toolDef.connectorId,
				name: toolDef.name,
				description: toolDef.description,
				inputSchema: toolDef.inputSchema,
				outputSchema: toolDef.outputSchema,
				riskLevel: toolDef.riskLevel,
				executorType: toolDef.executorType,
				executorConfig: toolDef.executorConfig,
				defaultPolicy: toolDef.defaultPolicy,
				status: "active",
				createdAt: timestamp,
				updatedAt: timestamp,
			});

			await db.insert(agentTools).values({
				id: randomUUID(),
				agentId,
				toolId: toolDef.id,
				enabled: true,
				createdAt: timestamp,
			});
		}

		if (telegramEnabled) {
			const telegramConnectorRow = await db.query.connectors.findFirst({
				where: and(eq(connectors.organizationId, orgId), eq(connectors.provider, "telegram")),
			});
			if (telegramConnectorRow) {
				const sendMessageToolId = randomUUID();
				await db.insert(tools).values({
					id: sendMessageToolId,
					organizationId: orgId,
					connectorId: telegramConnectorRow.id,
					name: "telegram.send_message",
					description: "Send a message via Telegram",
					inputSchema: {
						type: "object",
						properties: {
							chatId: { type: "string", description: "Telegram chat ID" },
							text: { type: "string", description: "Message text" },
						},
						required: ["chatId", "text"],
					},
					outputSchema: {
						type: "object",
						properties: { ok: { type: "boolean" } },
					},
					riskLevel: "medium",
					executorType: "http",
					executorConfig: {
						method: "POST",
						url: "https://api.telegram.org/bot{{credentials.botToken}}/sendMessage",
						headers: { "Content-Type": "application/json" },
						body: "input",
					},
					defaultPolicy: "allow",
					status: "active",
					createdAt: timestamp,
					updatedAt: timestamp,
				});

				await db.insert(agentTools).values({
					id: randomUUID(),
					agentId,
					toolId: sendMessageToolId,
					enabled: true,
					createdAt: timestamp,
				});
			}
		}

		// ── Default Policies ──────────────────────────────────
		const policyDefs = [
			{ toolName: "inventory.search_product", effect: "allow" as const },
			{ toolName: "inventory.get_stock", effect: "allow" as const },
			{
				toolName: "inventory.create_stock_adjustment",
				effect: "require_approval" as const,
				approverRole: "manager",
			},
		];

		if (telegramEnabled) {
			policyDefs.push({ toolName: "telegram.send_message", effect: "allow" as const });
		}

		for (const pDef of policyDefs) {
			await db.insert(policies).values({
				id: randomUUID(),
				organizationId: orgId,
				toolName: pDef.toolName,
				effect: pDef.effect,
				approverRole: pDef.approverRole ?? null,
				priority: 0,
				enabled: true,
				createdBy: userId,
				createdAt: timestamp,
				updatedAt: timestamp,
			});
		}
	}
}
