import { db } from "@agentclave/db";
import { auditLogs } from "@agentclave/db/schema/business";
import { randomUUID } from "node:crypto";

export interface AuditParams {
	organizationId: string;
	actorType: string;
	actorId: string;
	runId?: string;
	targetType: string;
	targetId: string;
	action: string;
	metadata?: Record<string, unknown>;
}

export async function writeAudit(params: AuditParams): Promise<void> {
	await db.insert(auditLogs).values({
		id: randomUUID(),
		organizationId: params.organizationId,
		actorType: params.actorType,
		actorId: params.actorId,
		runId: params.runId ?? null,
		targetType: params.targetType,
		targetId: params.targetId,
		action: params.action,
		metadata: params.metadata ?? null,
	});
}
