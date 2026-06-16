import { z } from "zod";
import { organizationProcedure } from "../index";
import { subscribeRealtime } from "../core/realtime/publisher";

export const realtimeRouter = {
	subscribe: organizationProcedure.input(z.object({})).handler(async function* ({
		context,
		signal,
	}) {
		const orgId = context.activeOrganization!.id;

		for await (const event of subscribeRealtime(signal)) {
			if (event.organizationId === orgId) {
				yield event;
			}
		}
	}),
};
