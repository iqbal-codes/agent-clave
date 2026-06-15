import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { RPCHandler } from "@orpc/server/fetch";
import { createContext } from "@agentclave/api/context";
import { appRouter } from "@agentclave/api/routers/index";
import { auth } from "@agentclave/auth";
import { env } from "@agentclave/env/server";

import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { HTTPException } from "hono/http-exception";
import { serve } from "@hono/node-server";
import { ingestWebhook } from "@agentclave/api/core/webhooks/ingest";

const app = new Hono();

app.use(logger());
app.use(
	"/*",
	cors({
		origin: env.CORS_ORIGIN,
		credentials: true,
	}),
);

// Auth routes (Better Auth)
app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// Custom webhook ingress — mounted before oRPC handler
app.all("/api/webhooks/custom/:publicToken", async (c) => {
	const rawBody = await c.req.text();
	const result = await ingestWebhook({
		publicToken: c.req.param("publicToken"),
		method: c.req.method,
		headers: c.req.raw.headers,
		rawBody,
	});
	return c.json(result.body, result.status as 200);
});

// oRPC handlers
const apiHandler = new OpenAPIHandler(appRouter);
const rpcHandler = new RPCHandler(appRouter);

app.use("/rpc/*", async (c, next) => {
	const context = await createContext({ context: c });
	const result = await rpcHandler.handle(c.req.raw, {
		context,
		prefix: "/rpc",
	});
	if (result.matched) {
		return result.response;
	}
	return next();
});

app.use("/api/*", async (c, next) => {
	const context = await createContext({ context: c });
	const result = await apiHandler.handle(c.req.raw, {
		context,
		prefix: "/api",
	});
	if (result.matched) {
		return result.response;
	}
	return next();
});

app.get("/", (c) => c.text("OK"));


app.onError((err, c) => {
	if (err instanceof HTTPException) {
		return err.getResponse();
	}
	console.error(err);
	return c.json({ error: "Internal server error" }, 500);
});

export default app;

serve(
	{
		fetch: app.fetch,
		port: 4000,
	},
	(info) => {
		console.log(`API server running on http://localhost:${info.port}`);
	},
);
