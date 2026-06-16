import { processAgentRun } from "../runtime/process-agent-run";

export async function processAgentRunJob(input: { runId: string }): Promise<void> {
	await processAgentRun({ runId: input.runId });
}
