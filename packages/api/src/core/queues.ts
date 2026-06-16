import { Queue } from "bullmq";
import IORedis from "ioredis";
import { env } from "@agentclave/env/server";
import { AGENTCLAVE_AGENT_RUN_QUEUE, AGENTCLAVE_TOOL_EXECUTION_QUEUE } from "@agentclave/types";
import { agentRunJobPayloadSchema, toolExecutionJobPayloadSchema } from "@agentclave/schemas";

let _connection: IORedis | null = null;

export function createRedisConnection(): IORedis {
	if (!_connection) {
		_connection = new IORedis(env.REDIS_URL, {
			maxRetriesPerRequest: null,
		});
	}
	return _connection;
}

let _agentRunQueue: Queue | null = null;
let _toolExecutionQueue: Queue | null = null;

function getAgentRunQueue(): Queue {
	if (!_agentRunQueue) {
		_agentRunQueue = new Queue(AGENTCLAVE_AGENT_RUN_QUEUE, {
			connection: createRedisConnection(),
		});
	}
	return _agentRunQueue;
}

function getToolExecutionQueue(): Queue {
	if (!_toolExecutionQueue) {
		_toolExecutionQueue = new Queue(AGENTCLAVE_TOOL_EXECUTION_QUEUE, {
			connection: createRedisConnection(),
		});
	}
	return _toolExecutionQueue;
}

export async function enqueueAgentRunJob(input: { runId: string }): Promise<void> {
	const payload = agentRunJobPayloadSchema.parse(input);
	await getAgentRunQueue().add("process-agent-run", payload);
}

export async function enqueueToolExecutionJob(input: { toolRequestId: string }): Promise<void> {
	const payload = toolExecutionJobPayloadSchema.parse(input);
	await getToolExecutionQueue().add("execute-tool-request", payload);
}
