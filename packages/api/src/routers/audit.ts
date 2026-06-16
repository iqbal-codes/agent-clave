import { eq } from "drizzle-orm";
import { db } from "@agentclave/db";
import { auditLogs } from "@agentclave/db/schema/business";
import { organizationProcedure } from "../index";
import { tableQuerySchema } from "@agentclave/schemas";

export const auditRouter = {
	list: organizationProcedure.input(tableQuerySchema).handler(async ({ context, input }) => {
		const orgId = context.activeOrganization!.id;
		const rows = await db
			.select()
			.from(auditLogs)
			.where(eq(auditLogs.organizationId, orgId))
			.orderBy(auditLogs.createdAt)
			.limit(input.pageSize)
			.offset((input.page - 1) * input.pageSize);
		return rows;
	}),
};
