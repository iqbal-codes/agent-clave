import { db } from "@agentclave/db";
import { sql } from "drizzle-orm";

export interface RLSContext {
	organizationId: string;
	userId: string;
}

export async function withRLS<T>(ctx: RLSContext, fn: () => Promise<T>): Promise<T> {
	return db.transaction(async (tx) => {
		await tx.execute(sql`SET LOCAL app.current_organization_id = ${ctx.organizationId}`);
		await tx.execute(sql`SET LOCAL app.current_user_id = ${ctx.userId}`);
		return fn();
	});
}
