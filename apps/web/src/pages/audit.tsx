import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@agentclave/ui/components/card";
import { Badge } from "@agentclave/ui/components/badge";
import { Skeleton } from "@agentclave/ui/components/skeleton";
import { ScrollText } from "lucide-react";

interface AuditEntry {
	id: string;
	actorType: string;
	actorId: string;
	action: string;
	targetType: string;
	targetId: string;
	metadata: Record<string, unknown> | null;
	createdAt: string;
}

export function AuditPage() {
	const { data: logs, isLoading } = useQuery({
		queryKey: ["audit"],
		queryFn: async () => {
			const res = await fetch("/api/auditLogs.list", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ page: 1, pageSize: 100 }),
			});
			return res.json() as Promise<AuditEntry[]>;
		},
	});

	return (
		<div className="space-y-6 p-6">
			<div>
				<h1 className="text-2xl font-bold">Audit Log</h1>
				<p className="text-muted-foreground">Track all system and user actions.</p>
			</div>

			{isLoading ? (
				<div className="space-y-3">
					{Array.from({ length: 5 }).map((_, i) => (
						<Skeleton key={i} className="h-16" />
					))}
				</div>
			) : logs && logs.length > 0 ? (
				<Card>
					<CardContent className="p-0">
						<div className="divide-y">
							{logs.map((log) => (
								<div key={log.id} className="flex items-center gap-4 p-4">
									<ScrollText className="h-4 w-4 text-muted-foreground shrink-0" />
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2">
											<Badge variant="outline" className="text-xs">{log.action}</Badge>
											<span className="text-sm text-muted-foreground">
												{log.actorType}:{log.actorId.slice(0, 8)}
											</span>
										</div>
										<p className="text-sm text-muted-foreground mt-1">
											{log.targetType}:{log.targetId.slice(0, 8)}
										</p>
									</div>
									<span className="text-xs text-muted-foreground shrink-0">
										{new Date(log.createdAt).toLocaleString()}
									</span>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			) : (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-12">
						<ScrollText className="h-12 w-12 text-muted-foreground" />
						<p className="mt-4 text-lg font-medium">No audit entries</p>
						<p className="text-sm text-muted-foreground">
							Audit entries will appear here as agents process requests.
						</p>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
