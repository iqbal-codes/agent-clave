import { env } from "@agentclave/env/server";
import { Worker } from "bullmq";
import { AGENTCLAVE_AGENT_RUN_QUEUE, AGENTCLAVE_TOOL_EXECUTION_QUEUE } from "@agentclave/types";
import { agentRunJobPayloadSchema, toolExecutionJobPayloadSchema } from "@agentclave/schemas";
import { createRedisConnection } from "@agentclave/api/core/queues";
import { processAgentRunJob } from "@agentclave/api/core/jobs/process-agent-run";
import { processToolExecutionJob } from "@agentclave/api/core/jobs/process-tool-execution";

// Validate env on boot
void env;

const connection = createRedisConnection();

const agentRunWorker = new Worker(
	AGENTCLAVE_AGENT_RUN_QUEUE,
	async (job) => {
		const payload = agentRunJobPayloadSchema.parse(job.data);
		await processAgentRunJob(payload);
	},
	{ connection, concurrency: 1 },
);

const toolExecutionWorker = new Worker(
	AGENTCLAVE_TOOL_EXECUTION_QUEUE,
	async (job) => {
		const payload = toolExecutionJobPayloadSchema.parse(job.data);
		await processToolExecutionJob(payload);
	},
	{ connection, concurrency: 1 },
);

console.log(
	`Worker started. Listening on queues: ${AGENTCLAVE_AGENT_RUN_QUEUE}, ${AGENTCLAVE_TOOL_EXECUTION_QUEUE}`,
);

async function shutdown() {
	console.log("Shutting down worker...");
	await agentRunWorker.close();
	await toolExecutionWorker.close();
	await connection.quit();
	process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
