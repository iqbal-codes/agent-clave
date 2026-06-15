import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@agentclave/ui/components/card";
import { Badge } from "@agentclave/ui/components/badge";
import { Skeleton } from "@agentclave/ui/components/skeleton";
import { CheckCircle } from "lucide-react";

interface ToolRequest {
	id: string;
	runId: string;
	toolName: string;
	payload: Record<string, unknown>;
	riskLevel: string;
	status: string;
}

export function ApprovalsPage() {
	const { data: approvals, isLoading } = useQuery({
		queryKey: ["approvals"],
		queryFn: async () => {
			const res = await fetch("/api/toolRequests.listPendingApproval", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ page: 1, pageSize: 50 }),
			});
			return res.json() as Promise<ToolRequest[]>;
		},
	});

	return (
		<div className="space-y-6 p-6">
			<div>
				<h1 className="text-2xl font-bold">Approvals</h1>
				<p className="text-muted-foreground">Review pending approval requests from agents.</p>
			</div>

			{isLoading ? (
				<div className="space-y-3">
					{Array.from({ length: 3 }).map((_, i) => (
						<Skeleton key={i} className="h-32" />
					))}
				</div>
			) : approvals && approvals.length > 0 ? (
				<div className="space-y-3">
					{approvals.map((approval) => (
						<Card key={approval.id}>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									{approval.toolName}
								</CardTitle>
								<div className="flex items-center gap-2">
									<Badge variant="outline">{approval.riskLevel}</Badge>
									<Badge variant="secondary">{approval.status}</Badge>
								</div>
							</CardHeader>
							<CardContent>
								<div className="text-sm text-muted-foreground">
									<p>Run: {approval.runId.slice(0, 8)}</p>
									<p className="mt-1">Payload: {JSON.stringify(approval.payload, null, 2).slice(0, 200)}</p>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			) : (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-12">
						<CheckCircle className="h-12 w-12 text-muted-foreground" />
						<p className="mt-4 text-lg font-medium">No pending approvals</p>
						<p className="text-sm text-muted-foreground">
							Approval requests will appear here when tools require manager approval.
						</p>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
