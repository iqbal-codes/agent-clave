import { eq, asc } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "./db-instance";
import * as schema from "@agentclave/db/schema/auth";
import { seedWorkspaceTables } from "./seed";

const WORKSPACE_NAME = "My Organization";

function slugForUser(userId: string): string {
	// Use the full user id as the slug suffix so collisions are impossible
	// across the entire user table. The slug is never surfaced to users;
	// only the org name "My Organization" is shown in the UI.
	return userId;
}

type UserPayload = {
	id: string;
	email: string;
	name?: string | null;
};

// ── Repair helper for orphaned workspace accounts ──────────────────
// Mirrors the "earliest membership" rule from databaseHooks.session.create.before.

export async function repairOrphanedWorkspaceForUser(
	user: UserPayload,
): Promise<{
	action:
		| "restored-session-from-member"
		| "attached-owner-to-existing-workspace"
		| "created-workspace";
	organizationId: string;
}> {
	const timestamp = new Date();

	// 1. Check for an existing membership (earliest first)
	const [firstMember] = await db
		.select()
		.from(schema.member)
		.where(eq(schema.member.userId, user.id))
		.orderBy(asc(schema.member.createdAt))
		.limit(1);

	if (firstMember) {
		const organizationId = firstMember.organizationId;
		await seedWorkspaceTables(organizationId, user.id);
		await db
			.update(schema.session)
			.set({ activeOrganizationId: organizationId })
			.where(eq(schema.session.userId, user.id));
		return { action: "restored-session-from-member", organizationId };
	}

	// 2. Check for an org by the deterministic slug
	const slug = slugForUser(user.id);
	const [existingOrg] = await db
		.select()
		.from(schema.organization)
		.where(eq(schema.organization.slug, slug))
		.limit(1);

	if (existingOrg) {
		const organizationId = existingOrg.id;
		await db.insert(schema.member).values({
			id: randomUUID(),
			organizationId,
			userId: user.id,
			role: "owner",
			createdAt: timestamp,
		});
		await seedWorkspaceTables(organizationId, user.id);
		await db
			.update(schema.session)
			.set({ activeOrganizationId: organizationId })
			.where(eq(schema.session.userId, user.id));
		return { action: "attached-owner-to-existing-workspace", organizationId };
	}

	// 3. Create the default workspace from scratch
	const organizationId = randomUUID();
	const memberId = randomUUID();
	await db.transaction(async (tx) => {
		await tx.insert(schema.organization).values({
			id: organizationId,
			name: WORKSPACE_NAME,
			slug,
			createdAt: timestamp,
			updatedAt: timestamp,
		});
		await tx.insert(schema.member).values({
			id: memberId,
			organizationId,
			userId: user.id,
			role: "owner",
			createdAt: timestamp,
		});
	});
	await seedWorkspaceTables(organizationId, user.id);
	await db
		.update(schema.session)
		.set({ activeOrganizationId: organizationId })
		.where(eq(schema.session.userId, user.id));
	return { action: "created-workspace", organizationId };
}

// ── Signup bootstrap (direct-DB path only) ────────────────────────

async function createOrganizationDirect(
	userId: string,
): Promise<string | null> {
	const orgId = randomUUID();
	const memberId = randomUUID();
	const timestamp = new Date();

	try {
		await db.transaction(async (tx) => {
			await tx.insert(schema.organization).values({
				id: orgId,
				name: WORKSPACE_NAME,
				slug: slugForUser(userId),
				createdAt: timestamp,
				updatedAt: timestamp,
			});
			await tx.insert(schema.member).values({
				id: memberId,
				organizationId: orgId,
				userId,
				role: "owner",
				createdAt: timestamp,
			});
		});
		return orgId;
	} catch (err) {
		console.error("[auth.bootstrap] direct org insert failed", err);
		return null;
	}
}

export async function onUserCreateAfter(
	user: UserPayload,
	_context?: unknown,
): Promise<void> {
	// Direct-DB path only: Better Auth 1.5+ runs databaseHooks.user.create.after
	// after the transaction commits, and the hook has no request headers/context.
	// auth.api.createOrganization depends on that context and will silently fail.
	let orgId: string | null = null;

	orgId = await createOrganizationDirect(user.id);

	if (!orgId) {
		console.error(
			`[auth.bootstrap] unable to create organization for user ${user.id}; signup will continue without a workspace`,
		);
		return;
	}

	try {
		await seedWorkspaceTables(orgId, user.id);
	} catch (err) {
		console.error("[auth.bootstrap] seedWorkspaceTables failed", err);
	}

	try {
		await db
			.update(schema.session)
			.set({ activeOrganizationId: orgId })
			.where(eq(schema.session.userId, user.id));
	} catch (err) {
		console.error("[auth.bootstrap] session.activeOrganizationId update failed", err);
	}
}
