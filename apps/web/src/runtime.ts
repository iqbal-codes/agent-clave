import {
	createQueryClient,
	createOrpcLink,
	createApiClient,
	createOrpc,
} from "@agentclave/api-client";
import type { AppRouterClient } from "@agentclave/api/routers/index";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export const queryClient = createQueryClient();
const link = createOrpcLink(API_URL);
export const rpcClient: AppRouterClient = createApiClient<AppRouterClient>(link);
export const orpc = createOrpc(rpcClient);
