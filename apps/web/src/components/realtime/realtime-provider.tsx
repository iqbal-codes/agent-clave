import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { RealtimeEvent } from "@agentclave/types";
import { rpcClient, queryClient } from "../../runtime";

type ConnectionState = "live" | "reconnecting" | "offline";

const RealtimeConnectionContext = createContext<ConnectionState>("reconnecting");

export function useRealtimeConnectionState(): ConnectionState {
	return useContext(RealtimeConnectionContext);
}

function invalidateForEvent(event: RealtimeEvent) {
	queryClient.invalidateQueries({ queryKey: ["runs"] });
	queryClient.invalidateQueries({ queryKey: ["dashboard"] });
	if ("runId" in event) {
		queryClient.invalidateQueries({ queryKey: ["run", event.runId] });
	}
}

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
	const [connectionState, setConnectionState] = useState<ConnectionState>("reconnecting");
	const abortRef = useRef<AbortController | null>(null);
	const mountedRef = useRef(true);

	useEffect(() => {
		mountedRef.current = true;

		async function connect() {
			while (mountedRef.current) {
				const controller = new AbortController();
				abortRef.current = controller;
				setConnectionState("reconnecting");

				try {
					const iterator = await rpcClient.realtime.subscribe({}, { signal: controller.signal });

					setConnectionState("live");

					for await (const event of iterator) {
						invalidateForEvent(event);
					}
				} catch (err) {
					if (!mountedRef.current) break;
					if (err instanceof DOMException && err.name === "AbortError") break;
					setConnectionState("offline");
					const { promise, resolve } = Promise.withResolvers<void>();
					setTimeout(resolve, 1000);
					await promise;
				} finally {
					abortRef.current = null;
				}
			}
		}

		connect();

		return () => {
			mountedRef.current = false;
			abortRef.current?.abort();
		};
	}, []);

	return (
		<RealtimeConnectionContext.Provider value={connectionState}>
			{children}
		</RealtimeConnectionContext.Provider>
	);
}
