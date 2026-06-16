import { createDb } from "@agentclave/db";
import {
	organizationSettings,
	organizationModules,
	dealStages,
	stockLocations,
} from "@agentclave/db/schema/business";
import { randomUUID } from "node:crypto";

const db = createDb();
const orgId = "snjj90ITxkcMxYbqjHF7MmcgVILqyppW";
const userId = "adDSlDSypXaf9mF2RQL2tUvy69ge5sdx";

async function seed() {
	try {
		console.log("Inserting settings...");
		await db
			.insert(organizationSettings)
			.values({
				id: randomUUID(),
				organizationId: orgId,
				currency: "IDR",
			})
			.onConflictDoNothing();
		console.log("Settings OK");

		for (const moduleKey of ["crm", "inventory"] as const) {
			console.log("Inserting module:", moduleKey);
			await db
				.insert(organizationModules)
				.values({
					id: randomUUID(),
					organizationId: orgId,
					moduleKey,
					enabled: true,
					enabledAt: new Date(),
					enabledBy: userId,
				})
				.onConflictDoNothing();
		}
		console.log("Modules OK");

		const stages = ["New", "Qualified", "Proposal", "Won", "Lost"];
		for (let i = 0; i < stages.length; i++) {
			console.log("Inserting stage:", stages[i]);
			await db
				.insert(dealStages)
				.values({
					id: randomUUID(),
					organizationId: orgId,
					name: stages[i],
					sortOrder: i,
				})
				.onConflictDoNothing();
		}
		console.log("Stages OK");

		console.log("Inserting location...");
		await db
			.insert(stockLocations)
			.values({
				id: randomUUID(),
				organizationId: orgId,
				name: "Main Warehouse",
				type: "warehouse",
				isActive: true,
			})
			.onConflictDoNothing();
		console.log("Location OK");

		console.log("All seeding complete!");
	} catch (e: any) {
		console.error("Seed error:", e.message);
		console.error("Stack:", e.stack);
	}
}

seed();
