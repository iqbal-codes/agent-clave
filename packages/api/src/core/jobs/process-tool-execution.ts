import { executeApprovedToolRequest } from "../executors";

export async function processToolExecutionJob(input: { toolRequestId: string }): Promise<void> {
	await executeApprovedToolRequest({ toolRequestId: input.toolRequestId });
}
