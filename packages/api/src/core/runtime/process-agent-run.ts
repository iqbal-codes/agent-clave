import { db } from "@agentclave/db";
import {
	agentRuns,
	agents,
	agentTools,
	tools,
	policies,
	toolRequests,
	toolExecutions,
	approvalSessions,
	agentRunSteps,
	auditLogs,
} from "@agentclave/db/schema/business";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { env } from "@agentclave/env/server";
import { evaluatePolicy, type PolicyRule } from "../policy/evaluate";
import { executeToolRequest } from "../executors";
import { validateJsonSchemaPayload } from "../json-schema/validate";

interface OpenRouterToolCall {
	id: string;
	type: "function";
	function: { name: string; arguments: string };
}

interface OpenRouterChoice {
	message?: {
		content?: string;
		tool_calls?: OpenRouterToolCall[];
	};
	finish_reason?: string;
}

interface OpenRouterResponse {
	id: string;
	choices: OpenRouterChoice[];
	model: string;
	usage?: {
		prompt_tokens?: number;
		completion_tokens?: number;
		total_tokens?: number;
	};
}

async function writeStep(input: {
	runId: string;
	stepIndex: number;
	type: string;
	status: string;
	inputMetadata?: Record<string, unknown> | null;
	outputMetadata?: Record<string, unknown> | null;
	errorMetadata?: Record<string, unknown> | null;
	costCents?: number | null;
	latencyMs?: number | null;
}): Promise<void> {
	const { runId, stepIndex, type, status, inputMetadata, outputMetadata, errorMetadata, costCents, latencyMs } = input;
	await db.insert(agentRunSteps).values({
		id: randomUUID(),
		runId,
		stepIndex,
		type,
		status,
		inputMetadata: inputMetadata ?? null,
		outputMetadata: outputMetadata ?? null,
		errorMetadata: errorMetadata ?? null,
		costCents: costCents ?? null,
		latencyMs: latencyMs ?? null,
	});
}

async function writeAudit(input: {
	organizationId: string;
	actorType: string;
	actorId: string;
	runId: string;
	targetType: string;
	targetId: string;
	action: string;
	metadata?: Record<string, unknown> | null;
}): Promise<void> {
	const { organizationId, actorType, actorId, runId, targetType, targetId, action, metadata } = input;
	await db.insert(auditLogs).values({
		id: randomUUID(),
		organizationId,
		actorType,
		actorId,
		runId,
		targetType,
		targetId,
		action,
		metadata: metadata ?? null,
	});
}

function generateApprovalCode(): string {
	const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
	let code = "";
	for (let i = 0; i < 6; i++) {
		code += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return code;
}

export async function processAgentRun(input: { runId: string }): Promise<void> {
	const { runId } = input;

	const [run] = await db
		.select()
		.from(agentRuns)
		.where(eq(agentRuns.id, runId))
		.limit(1);

	if (!run) {
		throw new Error(`Agent run not found: ${runId}`);
	}

	const [agent] = await db
		.select()
		.from(agents)
		.where(eq(agents.id, run.agentId))
		.limit(1);

	if (!agent) {
		throw new Error(`Agent not found: ${run.agentId}`);
	}

	// Mark run as running
	await db.update(agentRuns).set({
		status: "running",
		startedAt: new Date(),
		updatedAt: new Date(),
	}).where(eq(agentRuns.id, runId));

	await writeStep({
		runId,
		stepIndex: 0,
		type: "agent_run_started",
		status: "completed",
	});

	// Load enabled tools
	const enabledToolBindings = await db
		.select()
		.from(agentTools)
		.where(
			and(
				eq(agentTools.agentId, run.agentId),
				eq(agentTools.enabled, true),
			),
		);

	const toolIds = enabledToolBindings.map((b) => b.toolId);
	const enabledTools = toolIds.length > 0
		? await db.select().from(tools).where(
				and(
					eq(tools.organizationId, run.organizationId),
					eq(tools.status, "active"),
				),
			)
		: [];

	// Load policies
	const policyRules = await db
		.select()
		.from(policies)
		.where(
			and(
				eq(policies.organizationId, run.organizationId),
				eq(policies.enabled, true),
			),
		);

	// Build OpenRouter tool specs
	const openRouterTools = enabledTools
		.filter((t) => toolIds.includes(t.id))
		.map((t) => ({
			type: "function" as const,
			function: {
				name: t.name,
				description: t.description ?? `Execute ${t.name}`,
				parameters: t.inputSchema as Record<string, unknown>,
			},
		}));

	// Build messages
	const messages: Array<Record<string, unknown>> = [
		{
			role: "system",
			content: agent.systemPrompt ?? "You are a helpful assistant.",
		},
	];

	if (run.inputMessage) {
		messages.push({ role: "user", content: run.inputMessage });
	} else if (run.inputPayload) {
		messages.push({ role: "user", content: JSON.stringify(run.inputPayload) });
	}

	// Loop up to 8 model iterations
	const MAX_ITERATIONS = 8;
	let stepIndex = 1;
	let iterations = 0;

	while (iterations < MAX_ITERATIONS) {
		iterations++;

		const startTime = Date.now();

		const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
				"Content-Type": "application/json",
				"HTTP-Referer": "https://agentclave.dev",
				"X-Title": "AgentClave",
			},
			body: JSON.stringify({
				model: agent.model,
				messages,
				tools: openRouterTools.length > 0 ? openRouterTools : undefined,
				tool_choice: openRouterTools.length > 0 ? "auto" : undefined,
			}),
		});

		const latencyMs = Date.now() - startTime;

		if (!response.ok) {
			const errorText = await response.text();
			await db.update(agentRuns).set({
				status: "failed",
				errorMessage: `OpenRouter error: ${response.status} ${errorText}`,
				completedAt: new Date(),
				updatedAt: new Date(),
			}).where(eq(agentRuns.id, runId));

			await writeStep({
				runId,
				stepIndex,
				type: "model_call",
				status: "failed",
				errorMetadata: { statusCode: response.status, error: errorText },
				latencyMs,
			});

			return;
		}

		const data = (await response.json()) as OpenRouterResponse;
		const choice = data.choices?.[0];

		// Record the model call step
		await writeStep({
			runId,
			stepIndex,
			type: "model_call",
			status: "completed",
			inputMetadata: { model: agent.model, messageCount: messages.length },
			outputMetadata: {
				finishReason: choice?.finish_reason,
				hasToolCalls: Boolean(choice?.message?.tool_calls?.length),
			},
			latencyMs,
		});

		stepIndex++;

		// No tool calls — model is done
		if (!choice?.message?.tool_calls?.length) {
			const finalResponse = choice?.message?.content ?? "";
			await db.update(agentRuns).set({
				status: "completed",
				finalResponse,
				completedAt: new Date(),
				totalLatencyMs: latencyMs,
				updatedAt: new Date(),
			}).where(eq(agentRuns.id, runId));

			await writeStep({
				runId,
				stepIndex,
				type: "run_completed",
				status: "completed",
				outputMetadata: { finalResponse: finalResponse.slice(0, 500) },
			});

			return;
		}

		// Process tool calls (only one allowed)
		const toolCalls = choice.message.tool_calls;
		if (toolCalls.length > 1) {
			await db.update(agentRuns).set({
				status: "failed",
				errorMessage: "Parallel tool calls are disabled but multiple tool calls were returned",
				completedAt: new Date(),
				updatedAt: new Date(),
			}).where(eq(agentRuns.id, runId));

			return;
		}

		const toolCall = toolCalls[0]!;
		const toolName = toolCall.function.name;
		let toolArgs: Record<string, unknown>;
		try {
			toolArgs = JSON.parse(toolCall.function.arguments) as Record<string, unknown>;
		} catch {
			toolArgs = {};
		}

		// Find the matching tool
		const matchedTool = enabledTools.find((t) => t.name === toolName);

		if (!matchedTool) {
			// Unknown tool — deny
			const deniedRequestId = randomUUID();
			await db.insert(toolRequests).values({
				id: deniedRequestId,
				runId,
				organizationId: run.organizationId,
				toolId: "unknown",
				toolName,
				payload: toolArgs,
				riskLevel: "low",
				status: "denied_by_policy",
				policyDecision: "deny",
			});

			await writeAudit({
				organizationId: run.organizationId,
				actorType: "system",
				actorId: "policy",
				runId,
				targetType: "tool_request",
				targetId: deniedRequestId,
				action: "tool.denied_unknown",
				metadata: { toolName },
			});

			// Append denial result to messages
			messages.push({
				role: "assistant",
				content: null,
				tool_calls: [{ id: toolCall.id, type: "function", function: { name: toolName, arguments: toolCall.function.arguments } }],
			});
			messages.push({
				role: "tool",
				tool_call_id: toolCall.id,
				content: JSON.stringify({ error: `Tool "${toolName}" is not available` }),
			});

			await writeStep({
				runId,
				stepIndex,
				type: "tool_denied",
				status: "completed",
				inputMetadata: { toolName },
				outputMetadata: { reason: "unknown_tool" },
			});

			stepIndex++;
			continue;
		}

		// Validate payload
		try {
			validateJsonSchemaPayload({
				schema: matchedTool.inputSchema,
				payload: toolArgs,
				label: toolName,
			});
		} catch {
			const failedRequestId = randomUUID();
			await db.insert(toolRequests).values({
				id: failedRequestId,
				runId,
				organizationId: run.organizationId,
				toolId: matchedTool.id,
				toolName,
				payload: toolArgs,
				riskLevel: matchedTool.riskLevel,
				status: "failed",
			});

			await writeAudit({
				organizationId: run.organizationId,
				actorType: "system",
				actorId: "validator",
				runId,
				targetType: "tool_request",
				targetId: failedRequestId,
				action: "tool.invalid_payload",
				metadata: { toolName },
			});

			messages.push({
				role: "assistant",
				content: null,
				tool_calls: [{ id: toolCall.id, type: "function", function: { name: toolName, arguments: toolCall.function.arguments } }],
			});
			messages.push({
				role: "tool",
				tool_call_id: toolCall.id,
				content: JSON.stringify({ error: `Invalid payload for tool "${toolName}"` }),
			});

			await writeStep({
				runId,
				stepIndex,
				type: "tool_invalid_payload",
				status: "completed",
				inputMetadata: { toolName },
				outputMetadata: { reason: "validation_failed" },
			});

			stepIndex++;
			continue;
		}

		// Evaluate policy
		const policyResult = evaluatePolicy({
			agentId: run.agentId,
			toolId: matchedTool.id,
			toolName: matchedTool.name,
			riskLevel: matchedTool.riskLevel,
			rules: policyRules as unknown as PolicyRule[],
		});

		const requestId = randomUUID();

		await writeAudit({
			organizationId: run.organizationId,
			actorType: "system",
			actorId: "policy",
			runId,
			targetType: "tool_request",
			targetId: requestId,
			action: "policy.evaluated",
			metadata: { toolName, decision: policyResult.decision, matchedPolicyId: policyResult.matchedPolicyId },
		});

		if (policyResult.decision === "deny") {
			await db.insert(toolRequests).values({
				id: requestId,
				runId,
				organizationId: run.organizationId,
				toolId: matchedTool.id,
				toolName,
				payload: toolArgs,
				riskLevel: matchedTool.riskLevel,
				status: "denied_by_policy",
				policyDecision: "deny",
				matchedPolicyId: policyResult.matchedPolicyId,
			});

			messages.push({
				role: "assistant",
				content: null,
				tool_calls: [{ id: toolCall.id, type: "function", function: { name: toolName, arguments: toolCall.function.arguments } }],
			});
			messages.push({
				role: "tool",
				tool_call_id: toolCall.id,
				content: JSON.stringify({ error: `Tool "${toolName}" denied by policy` }),
			});

			await writeStep({
				runId,
				stepIndex,
				type: "tool_denied_by_policy",
				status: "completed",
				inputMetadata: { toolName },
				outputMetadata: { decision: "deny" },
			});

			stepIndex++;
			continue;
		}

		if (policyResult.decision === "require_approval") {
			await db.insert(toolRequests).values({
				id: requestId,
				runId,
				organizationId: run.organizationId,
				toolId: matchedTool.id,
				toolName,
				payload: toolArgs,
				riskLevel: matchedTool.riskLevel,
				status: "pending_approval",
				policyDecision: "require_approval",
				matchedPolicyId: policyResult.matchedPolicyId,
			});

			const approvalCode = generateApprovalCode();
			const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

			await db.insert(approvalSessions).values({
				id: randomUUID(),
				organizationId: run.organizationId,
				runId,
				toolRequestId: requestId,
				status: "pending",
				approvalChannel: "telegram",
				approvalCode,
				requestMessage: `Tool "${toolName}" requires approval. Code: ${approvalCode}`,
				expiresAt,
			});

			await db.update(agentRuns).set({
				status: "waiting_for_approval",
				updatedAt: new Date(),
			}).where(eq(agentRuns.id, runId));

			await writeAudit({
				organizationId: run.organizationId,
				actorType: "system",
				actorId: "runtime",
				runId,
				targetType: "approval_session",
				targetId: requestId,
				action: "approval.requested",
				metadata: { toolName, approvalCode, channel: "telegram" },
			});

			await writeStep({
				runId,
				stepIndex,
				type: "approval_requested",
				status: "completed",
				inputMetadata: { toolName, approvalCode },
				outputMetadata: { channel: "telegram" },
			});

			// Send Telegram notification to manager
			try {
				await sendTelegramApproval({
					toolName,
					toolArgs,
					approvalCode,
					runId,
					requestMessage: `Tool "${toolName}" requires approval. Code: ${approvalCode}`,
				});
			} catch {
				// Telegram send failed — approval still stored
			}

			return;
		}

		// Policy allow — execute immediately
		await db.insert(toolRequests).values({
			id: requestId,
			runId,
			organizationId: run.organizationId,
			toolId: matchedTool.id,
			toolName,
			payload: toolArgs,
			riskLevel: matchedTool.riskLevel,
			status: "approved",
			policyDecision: "allow",
			matchedPolicyId: policyResult.matchedPolicyId,
		});

		await executeToolRequest({ toolRequestId: requestId });

		// Get execution result
		const [execution] = await db
			.select()
			.from(toolExecutions)
			.where(eq(toolExecutions.toolRequestId, requestId))
			.limit(1);

		const toolResult = execution?.responsePayload ?? { error: "No execution found" };

		// Append tool result to messages
		messages.push({
			role: "assistant",
			content: null,
			tool_calls: [{ id: toolCall.id, type: "function", function: { name: toolName, arguments: toolCall.function.arguments } }],
		});
		messages.push({
			role: "tool",
			tool_call_id: toolCall.id,
			content: JSON.stringify(toolResult),
		});

		await writeAudit({
			organizationId: run.organizationId,
			actorType: "system",
			actorId: "executor",
			runId,
			targetType: "tool_request",
			targetId: requestId,
			action: "tool.executed",
			metadata: { toolName },
		});

		await writeStep({
			runId,
			stepIndex,
			type: "tool_executed",
			status: "completed",
			inputMetadata: { toolName, payload: toolArgs },
			outputMetadata: { result: toolResult },
		});

		stepIndex++;
	}

	// Exceeded max iterations
	await db.update(agentRuns).set({
		status: "failed",
		errorMessage: `Exceeded maximum ${MAX_ITERATIONS} model iterations`,
		completedAt: new Date(),
		updatedAt: new Date(),
	}).where(eq(agentRuns.id, runId));
}

async function sendTelegramApproval(input: {
	toolName: string;
	toolArgs: Record<string, unknown>;
	approvalCode: string;
	runId: string;
	requestMessage: string;
}): Promise<void> {
	const botToken = env.TELEGRAM_BOT_TOKEN;
	const managerChatId = env.TELEGRAM_MANAGER_CHAT_ID;

	if (!botToken || !managerChatId) {
		return;
	}

	const text = [
		`🔔 Approval Required`,
		``,
		`Tool: ${input.toolName}`,
		`Code: ${input.approvalCode}`,
		``,
		`Payload:`,
		`<pre>${JSON.stringify(input.toolArgs, null, 2)}</pre>`,
		``,
		`Reply with:`,
		`APPROVE ${input.approvalCode}`,
		`REJECT ${input.approvalCode} [note]`,
	].join("\n");

	await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			chat_id: managerChatId,
			text,
			parse_mode: "HTML",
		}),
	});
}
