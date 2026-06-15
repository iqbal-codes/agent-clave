import { ORPCError } from "@orpc/server";

export type ErrorCode =
	| "UNAUTHORIZED"
	| "FORBIDDEN"
	| "VALIDATION_ERROR"
	| "NOT_FOUND"
	| "ORGANIZATION_REQUIRED"
	| "AGENT_DISABLED"
	| "INTERNAL_ERROR";

export function throwNotFound(entity: string): never {
	throw new ORPCError("NOT_FOUND", { message: `${entity} not found` });
}

export function throwForbidden(message = "Insufficient permissions"): never {
	throw new ORPCError("FORBIDDEN", { message });
}

export function throwUnauthorized(): never {
	throw new ORPCError("UNAUTHORIZED");
}

export function throwAgentDisabled(name: string): never {
	throw new ORPCError("AGENT_DISABLED", { message: `Agent "${name}" is disabled` });
}
