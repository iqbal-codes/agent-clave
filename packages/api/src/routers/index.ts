import type { RouterClient } from "@orpc/server";
import { publicProcedure } from "../index";
import { organizationRouter } from "./organization";
import { agentsRouter } from "./agents";
import { runsRouter } from "./runs";
import { toolRequestsRouter } from "./tool-requests";
import { policyRouter } from "./policy";
import { connectorsRouter } from "./connectors";
import { toolsRouter } from "./tools";
import { auditRouter } from "./audit";

export const appRouter = {
	healthCheck: publicProcedure.handler(() => "OK"),

	organization: {
		getContext: organizationRouter.getContext,
		getDashboard: organizationRouter.getDashboard,
		updateProfile: organizationRouter.updateProfile,
	},

	agents: {
		list: agentsRouter.list,
		getById: agentsRouter.getById,
		create: agentsRouter.create,
		update: agentsRouter.update,
		delete: agentsRouter.delete,
		pause: agentsRouter.pause,
		activate: agentsRouter.activate,
		listTools: agentsRouter.listTools,
	},

	runs: {
		list: runsRouter.list,
		getById: runsRouter.getById,
		listByAgentId: runsRouter.listByAgentId,
		listPendingApproval: runsRouter.listPendingApproval,
		cancel: runsRouter.cancel,
	},

	toolRequests: {
		listByRunId: toolRequestsRouter.listByRunId,
		listPendingApproval: toolRequestsRouter.listPendingApproval,
		getApprovalSession: toolRequestsRouter.getApprovalSession,
		reviewApproval: toolRequestsRouter.reviewApproval,
	},

	policy: {
		list: policyRouter.list,
		getById: policyRouter.getById,
		create: policyRouter.create,
		update: policyRouter.update,
		delete: policyRouter.delete,
	},

	connectors: {
		list: connectorsRouter.list,
		getById: connectorsRouter.getById,
		create: connectorsRouter.create,
		update: connectorsRouter.update,
		delete: connectorsRouter.delete,
		listEndpoints: connectorsRouter.listEndpoints,
		createEndpoint: connectorsRouter.createEndpoint,
		rotateSecret: connectorsRouter.rotateSecret,
		deleteEndpoint: connectorsRouter.deleteEndpoint,
		listDeliveries: connectorsRouter.listDeliveries,
	},

	tools: {
		list: toolsRouter.list,
		getById: toolsRouter.getById,
		create: toolsRouter.create,
		update: toolsRouter.update,
		delete: toolsRouter.delete,
		bindToAgent: toolsRouter.bindToAgent,
		unbindFromAgent: toolsRouter.unbindFromAgent,
	},

	auditLogs: {
		list: auditRouter.list,
	},
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
