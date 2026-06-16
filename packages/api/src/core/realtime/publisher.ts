import IORedis from "ioredis";
import { env } from "@agentclave/env/server";
import type { RealtimeEvent } from "@agentclave/types";

const CHANNEL = "realtime.event";

let _publisher: IORedis | null = null;
let _subscriber: IORedis | null = null;

function getPublisher(): IORedis {
	if (!_publisher) {
		_publisher = new IORedis(env.REDIS_URL, {
			maxRetriesPerRequest: null,
		});
	}
	return _publisher;
}

function getSubscriber(): IORedis {
	if (!_subscriber) {
		_subscriber = new IORedis(env.REDIS_URL, {
			maxRetriesPerRequest: null,
		});
	}
	return _subscriber;
}

export async function publishRealtimeEvent(event: RealtimeEvent): Promise<void> {
	const pub = getPublisher();
	await pub.publish(CHANNEL, JSON.stringify(event));
}

export async function* subscribeRealtime(signal?: AbortSignal): AsyncIterable<RealtimeEvent> {
	const sub = getSubscriber();
	await sub.subscribe(CHANNEL);

	const queue: RealtimeEvent[] = [];
	let { promise: waitPromise, resolve: waitResolve } = Promise.withResolvers<void>();

	const onMessage = (_channel: string, message: string) => {
		try {
			const event = JSON.parse(message) as RealtimeEvent;
			queue.push(event);
			waitResolve();
			({ promise: waitPromise, resolve: waitResolve } = Promise.withResolvers<void>());
		} catch {
			// Ignore malformed messages
		}
	};

	sub.on("message", onMessage);

	try {
		while (!signal?.aborted) {
			if (queue.length > 0) {
				yield queue.shift()!;
			} else {
				await waitPromise;
			}
		}
	} finally {
		sub.off("message", onMessage);
		await sub.unsubscribe(CHANNEL);
	}
}
