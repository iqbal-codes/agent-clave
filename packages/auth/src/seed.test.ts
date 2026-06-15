import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@agentclave/db";
import {
	agents,
	policies,
	connectors,
	tools,
	agentTools,
	webhookEndpoints,
} from "@agentclave/db/schema/business";
import {
	organization,
	user,
} from "@agentclave/db/schema/auth";
import { seedWorkspaceTables } from "./seed";

describe("seedWorkspaceTables", () => {
	const orgId = randomUUID();
	const userId = randomUUID();

	beforeAll(async () => {
		await db.execute(`
			CREATE TABLE IF NOT EXISTS "user" (
				"id" text PRIMARY KEY,
				"name" text NOT NULL,
				"email" text NOT NULL UNIQUE,
				"email_verified" boolean NOT NULL DEFAULT false,
				"image" text,
				"created_at" timestamp NOT NULL DEFAULT now(),
				"updated_at" timestamp NOT NULL DEFAULT now()
			)
		`);
		await db.execute(`
			CREATE TABLE IF NOT EXISTS "organization" (
				"id" text PRIMARY KEY,
				"name" text NOT NULL,
				"slug" text NOT NULL UNIQUE,
				"logo" text,
				"created_at" timestamp NOT NULL DEFAULT now(),
				"updated_at" timestamp NOT NULL DEFAULT now()
			)
		`);

		await db.insert(organization).values({
			id: orgId,
			name: "Test Organization",
			slug: `test-org-${orgId.slice(0, 8)}`,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		await db.insert(user).values({
			id: userId,
			name: "Test User",
			email: `test-${userId.slice(0, 8)}@example.com`,
			emailVerified: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		await seedWorkspaceTables(orgId, userId);
	});

	afterAll(async () => {
		await db.delete(agentTools).where(eq(agentTools.agentId, orgId));
		await db.delete(policies).where(eq(policies.organizationId, orgId));
		await db.delete(tools).where(eq(tools.organizationId, orgId));
		await db.delete(webhookEndpoints).where(eq(webhookEndpoints.organizationId, orgId));
		await db.delete(connectors).where(eq(connectors.organizationId, orgId));
		await db.delete(agents).where(eq(agents.organizationId, orgId));
		await db.delete(user).where(eq(user.id, userId));
		await db.delete(organization).where(eq(organization.id, orgId));
	});

	it("seeds Inventory Ops Agent with correct role", async () => {
		const agent = await db.query.agents.findFirst({
			where: eq(agents.organizationId, orgId),
		});

		expect(agent).toBeDefined();
		expect(agent!.name).toBe("Inventory Ops Agent");
		expect(agent!.role).toBe("inventory_ops");
		expect(agent!.status).toBe("paused");
	});

	it("seeds Telegram Bot and Demo Inventory connectors", async () => {
		const conns = await db.query.connectors.findMany({
			where: eq(connectors.organizationId, orgId),
		});

		expect(conns).toHaveLength(2);
		const names = conns.map((c) => c.name).sort();
		expect(names).toContain("Demo Inventory API");
		expect(names).toContain("Telegram Bot");
	});

	it("seeds four tools bound to the agent", async () => {
		const toolList = await db.query.tools.findMany({
			where: eq(tools.organizationId, orgId),
		});

		expect(toolList).toHaveLength(4);
		const toolNames = toolList.map((t) => t.name).sort();
		expect(toolNames).toContain("inventory.search_product");
		expect(toolNames).toContain("inventory.get_stock");
		expect(toolNames).toContain("inventory.create_stock_adjustment");
		expect(toolNames).toContain("telegram.send_message");
	});

	it("seeds four policies", async () => {
		const policyList = await db.query.policies.findMany({
			where: eq(policies.organizationId, orgId),
		});

		expect(policyList).toHaveLength(4);
		const toolNames = policyList.map((p) => p.toolName).sort();
		expect(toolNames).toContain("inventory.search_product");
		expect(toolNames).toContain("inventory.get_stock");
		expect(toolNames).toContain("inventory.create_stock_adjustment");
		expect(toolNames).toContain("telegram.send_message");
	});

	it("does not seed wildcard allow rules", async () => {
		const policyList = await db.query.policies.findMany({
			where: eq(policies.organizationId, orgId),
		});

		for (const policy of policyList) {
			expect(policy.toolName).not.toBeNull();
		}
	});
});
