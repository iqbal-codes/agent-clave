import { serve } from "@hono/node-server";
import { app } from "./app";

const port = Number(process.env.DEMO_INVENTORY_PORT ?? 4301);

serve({ fetch: app.fetch, port }, (info) => {
	console.log(`Demo Inventory API running on http://localhost:${info.port}`);
});
