import Ajv2020 from "ajv/dist/2020";
import { ORPCError } from "@orpc/server";

const ajv = new Ajv2020({
	allErrors: true,
	strict: true,
	removeAdditional: false,
});

export interface JsonSchemaValidationResult {
	value: Record<string, unknown>;
}

export function validateJsonSchemaPayload(input: {
	schema: unknown;
	payload: unknown;
	label: string;
}): JsonSchemaValidationResult {
	const { schema, payload, label } = input;

	let validate: ReturnType<typeof ajv.compile>;
	try {
		validate = ajv.compile(schema as Record<string, unknown>);
	} catch {
		throw new ORPCError("VALIDATION_ERROR", {
			message: `Invalid JSON schema for ${label}`,
		});
	}

	if (!validate(payload as Record<string, unknown>)) {
		throw new ORPCError("VALIDATION_ERROR", {
			message: `Invalid payload for ${label}`,
			data: { errors: validate.errors },
		});
	}

	return { value: payload as Record<string, unknown> };
}
