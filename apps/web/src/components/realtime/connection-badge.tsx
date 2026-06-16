import { useRealtimeConnectionState } from "./realtime-provider";

const stateConfig = {
	live: { dot: "bg-emerald-500", text: "Live" },
	reconnecting: { dot: "bg-amber-500", text: "Reconnecting" },
	offline: { dot: "bg-muted-foreground", text: "Offline" },
} as const;

export function ConnectionBadge() {
	const state = useRealtimeConnectionState();
	const config = stateConfig[state];

	return (
		<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
			<span className={`h-2 w-2 rounded-full ${config.dot}`} />
			<span>{config.text}</span>
		</div>
	);
}
