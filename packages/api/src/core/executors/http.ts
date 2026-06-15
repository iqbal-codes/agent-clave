import { db } from "@agentclave/db";
import { toolRequests, tools, connectors, toolExecutions } from "@agentclave/db/schema/business";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { decryptSecret } from "../credentials";
import { validateJsonSchemaPayload } from "../json-schema/validate";

interface ConnectorCredentials {
	[key: string]: string;
}

interface ToolExecutorConfig {
	method?: string;
	url?: string;
	headers?: Record<string, string>;
	body?: string;
	timeoutMs?: number;
	idempotencyHeader?: string;
}

function resolveTemplate(
	template: string,
	vars: Record<string, Record<string, unknown>>,
): string {
	let resolved = template;
	for (const [namespace, values] of Object.entries(vars)) {
		for (const [key, value] of Object.entries(values)) {
			resolved = resolved.replace(
				new RegExp(`\\{\\{${namespace}\\.${key}\\}\\}`, "g"),
				String(value),
			);
		}
	}

	// Check for unresolved placeholders
	const unresolvedMatch = resolved.match(/\{\{[^}]+\}\}/);
	if (unresolvedMatch) {
		throw new Error(`Unresolved template placeholder: ${unresolvedMatch[0]}`);
	}

	return resolved;
}

function redactSensitive(
	obj: Record<string, unknown>,
	credentialValues: Record<string, string>,
): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(obj)) {
		if (typeof value === "string") {
			let redacted = value;
			for (const credVal of Object.values(credentialValues)) {
				if (credVal && redacted.includes(credVal)) {
					redacted = redacted.replace(credVal, "[REDACTED]");
				}
			}
			result[key] = redacted;
		} else {
			result[key] = value;
		}
	}
	return result;
}

export async function executeHttpRequest(input: {
	toolRequestId: string;
}): Promise<void> {
	const { toolRequestId } = input;

	const [toolRequest] = await db
		.select()
		.from(toolRequests)
		.where(eq(toolRequests.id, toolRequestId))
		.limit(1);

	if (!toolRequest) {
		throw new Error(`Tool request not found: ${toolRequestId}`);
	}

	const [tool] = await db
		.select()
		.from(tools)
		.where(eq(tools.id, toolRequest.toolId))
		.limit(1);

	if (!tool) {
		throw new Error(`Tool not found: ${toolRequest.toolId}`);
	}

	// Validate input payload against tool's input schema
	const { value: validatedPayload } = validateJsonSchemaPayload({
		schema: tool.inputSchema,
		payload: toolRequest.payload,
		label: tool.name,
	});

	// Load connector if present
	let connectorConfig: Record<string, unknown> = {};
	let credentialValues: Record<string, string> = {};

	if (tool.connectorId) {
		const [connector] = await db
			.select()
			.from(connectors)
			.where(eq(connectors.id, tool.connectorId))
			.limit(1);

		if (connector) {
			connectorConfig = (connector.config as Record<string, unknown>) ?? {};
			if (connector.encryptedCredentials) {
				const decrypted = decryptSecret<ConnectorCredentials>(connector.encryptedCredentials);
				if (decrypted) {
					credentialValues = decrypted;
				}
			}
		}
	}

	const executorConfig = tool.executorConfig as ToolExecutorConfig;
	const method = executorConfig.method ?? "GET";
	const timeoutMs = executorConfig.timeoutMs ?? 30000;

	// Build template variables
	const templateVars: Record<string, Record<string, unknown>> = {
		input: validatedPayload,
		connector: { config: connectorConfig },
		credentials: credentialValues,
		run: { id: toolRequest.runId },
		toolRequest: { id: toolRequest.id },
	};

	// Resolve URL
	const url = resolveTemplate(executorConfig.url ?? "", templateVars);

	// Build headers
	const headers: Record<string, string> = {};
	if (executorConfig.headers) {
		for (const [k, v] of Object.entries(executorConfig.headers)) {
			headers[k] = resolveTemplate(String(v), templateVars);
		}
	}

	// Build request
	const fetchOptions: RequestInit = {
		method,
		headers: { ...headers, "Content-Type": "application/json" },
		signal: AbortSignal.timeout(timeoutMs),
	};

	// Add idempotency header if configured
	if (executorConfig.idempotencyHeader) {
		headers[executorConfig.idempotencyHeader] = toolRequest.id;
	}

	// Add body for non-GET/DELETE
	if (method !== "GET" && method !== "DELETE") {
		if (executorConfig.body === "input") {
			fetchOptions.body = JSON.stringify(validatedPayload);
		}
	}

	// Store request metadata (redacted)
	const requestMetadata = redactSensitive(
		{ method, url, headers },
		credentialValues,
	);

	const startTime = Date.now();

	try {
		const response = await fetch(url, fetchOptions);
		const latencyMs = Date.now() - startTime;
		const responseBody = await response.json() as Record<string, unknown>;

		if (!response.ok) {
			// Store failed execution
			await db.insert(toolExecutions).values({
				id: randomUUID(),
				toolRequestId,
				executorType: "http",
				requestPayload: requestMetadata,
				responsePayload: responseBody,
				status: "failed",
				latencyMs,
				errorMetadata: { statusCode: response.status, statusText: response.statusText },
			});

			await db.update(toolRequests).set({
				status: "failed",
				completedAt: new Date(),
				updatedAt: new Date(),
			}).where(eq(toolRequests.id, toolRequestId));

			return;
		}

		// Store successful execution
		await db.insert(toolExecutions).values({
			id: randomUUID(),
			toolRequestId,
			executorType: "http",
			requestPayload: requestMetadata,
			responsePayload: responseBody,
			status: "succeeded",
			latencyMs,
		});

		await db.update(toolRequests).set({
			status: "executed",
			completedAt: new Date(),
			updatedAt: new Date(),
		}).where(eq(toolRequests.id, toolRequestId));
	} catch (error) {
		const latencyMs = Date.now() - startTime;
		const errorMessage = error instanceof Error ? error.message : "Unknown error";

		await db.insert(toolExecutions).values({
			id: randomUUID(),
			toolRequestId,
			executorType: "http",
			requestPayload: requestMetadata,
			status: "failed",
			latencyMs,
			errorMetadata: { message: errorMessage },
		});

		await db.update(toolRequests).set({
			status: "failed",
			completedAt: new Date(),
			updatedAt: new Date(),
		}).where(eq(toolRequests.id, toolRequestId));
	}
}
