import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@agentclave/ui/components/card";
import { Badge } from "@agentclave/ui/components/badge";
import { Skeleton } from "@agentclave/ui/components/skeleton";
import { Play, ArrowRight } from "lucide-react";
import { rpcClient } from "../../runtime";
const statusColors: Record<string, string> = {
	queued: "secondary",
	running: "default",
	waiting_for_approval: "outline",
	completed: "default",
	failed: "destructive",
	rejected: "destructive",
	cancelled: "secondary",
	expired: "secondary",
};

export function RunsPage() {
	const [searchParams, setSearchParams] = useSearchParams();
	const statusFilter = searchParams.get("status") ?? undefined;

	const { data, isLoading } = useQuery({
		queryKey: ["runs", statusFilter],
		queryFn: async () => {
			const body: Record<string, unknown> = { page: 1, pageSize: 50 };
			if (statusFilter) {
				body.status = statusFilter;
			}
			return rpcClient.runs.list(body as unknown as Parameters<typeof rpcClient.runs.list>[0]);
		},
	});
	const runs = data?.items;

	return (
		<div className="space-y-6 p-6">
			<div>
				<h1 className="text-2xl font-bold">Runs</h1>
				<p className="text-muted-foreground">
					View agent run history and open pending items for review.
				</p>
			</div>

			<div className="flex gap-2">
				<button
					type="button"
					onClick={() => {
						setSearchParams({});
					}}
					className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
						!statusFilter
							? "bg-primary text-primary-foreground"
							: "bg-muted text-muted-foreground hover:bg-muted/80"
					}`}
				>
					All runs
				</button>
				<button
					type="button"
					onClick={() => {
						setSearchParams({ status: "waiting_for_approval" });
					}}
					className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
						statusFilter === "waiting_for_approval"
							? "bg-primary text-primary-foreground"
							: "bg-muted text-muted-foreground hover:bg-muted/80"
					}`}
				>
					Pending review
				</button>
			</div>

			{isLoading ? (
				<div className="space-y-3">
					{Array.from({ length: 5 }).map((_, i) => (
						<Skeleton key={i} className="h-20" />
					))}
				</div>
			) : runs && runs.length > 0 ? (
				<div className="flex flex-col space-y-3">
					{runs.map((run) => (
						<Link key={run.id} to={`/runs/${run.id}`}>
							<Card className="transition-colors hover:bg-muted/50">
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="text-sm font-medium">
										{run.inputMessage?.slice(0, 80) ?? "No input"}
									</CardTitle>
									<div className="flex items-center gap-2">
										<Badge
											variant={
												(statusColors[run.status] as
													| "default"
													| "secondary"
													| "destructive"
													| "outline") ?? "secondary"
											}
										>
											{run.status}
										</Badge>
										<ArrowRight className="h-4 w-4 text-muted-foreground" />
									</div>
								</CardHeader>
								<CardContent>
									<div className="flex items-center gap-4 text-sm text-muted-foreground">
										<span>ID: {run.id.slice(0, 8)}</span>
										<span>{run.triggerSource ?? "manual"}</span>
										{run.totalLatencyMs && <span>{(run.totalLatencyMs / 1000).toFixed(1)}s</span>}
										<span>{new Date(run.createdAt).toLocaleString()}</span>
									</div>
								</CardContent>
							</Card>
						</Link>
					))}
				</div>
			) : (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-12">
						<Play className="h-12 w-12 text-muted-foreground" />
						<p className="mt-4 text-lg font-medium">No runs yet</p>
						<p className="text-sm text-muted-foreground">
							Runs will appear here once agents start processing requests.
						</p>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
