import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@agentclave/ui/components/card";
import { Badge } from "@agentclave/ui/components/badge";
import { Skeleton } from "@agentclave/ui/components/skeleton";

interface RunDetail {
	id: string;
	status: string;
	inputMessage: string | null;
	finalResponse: string | null;
	totalLatencyMs: number | null;
	totalCostCents: number | null;
	errorMessage: string | null;
	createdAt: string;
	steps: Array<{
		id: string;
		stepIndex: number;
		type: string;
		status: string;
		inputMetadata: Record<string, unknown> | null;
		outputMetadata: Record<string, unknown> | null;
		errorMetadata: Record<string, unknown> | null;
		latencyMs: number | null;
		createdAt: string;
	}>;
	toolRequests: Array<{
		id: string;
		toolName: string;
		payload: Record<string, unknown>;
		status: string;
		policyDecision: string | null;
	}>;
	approvalSessions: Array<{
		id: string;
		status: string;
		approvalCode: string;
		requestMessage: string;
	}>;
}

export function RunDetailPage() {
	const { id } = useParams<{ id: string }>();

	const { data: run, isLoading } = useQuery({
		queryKey: ["run", id],
		queryFn: async () => {
			const res = await fetch("/api/runs/getById", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id }),
			});
			return res.json() as Promise<RunDetail>;
		},
		enabled: Boolean(id),
	});

	if (isLoading) {
		return (
			<div className="space-y-6 p-6">
				<Skeleton className="h-8 w-64" />
				<Skeleton className="h-48" />
			</div>
		);
	}

	if (!run) {
		return (
			<div className="p-6">
				<h1 className="text-2xl font-bold">Run not found</h1>
			</div>
		);
	}

	return (
		<div className="space-y-6 p-6">
			<div>
				<h1 className="text-2xl font-bold">Run Detail</h1>
				<p className="text-muted-foreground">ID: {run.id}</p>
			</div>

			<div className="grid gap-4 md:grid-cols-3">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">Status</CardTitle>
					</CardHeader>
					<CardContent>
						<Badge variant={run.status === "completed" ? "default" : run.status === "failed" ? "destructive" : "secondary"}>
							{run.status}
						</Badge>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">Latency</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{run.totalLatencyMs ? `${(run.totalLatencyMs / 1000).toFixed(1)}s` : "--"}
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">Created</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-sm">{new Date(run.createdAt).toLocaleString()}</div>
					</CardContent>
				</Card>
			</div>

			{run.inputMessage && (
				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium">Input</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm">{run.inputMessage}</p>
					</CardContent>
				</Card>
			)}

			{run.finalResponse && (
				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium">Final Response</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm whitespace-pre-wrap">{run.finalResponse}</p>
					</CardContent>
				</Card>
			)}

			{run.steps.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium">Steps ({run.steps.length})</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							{run.steps.map((step) => (
								<div key={step.id} className="flex items-center gap-3 text-sm">
									<span className="text-muted-foreground w-8">#{step.stepIndex}</span>
									<Badge variant="outline" className="text-xs">{step.type}</Badge>
									<span className="text-muted-foreground">{step.status}</span>
									{step.latencyMs && <span className="text-muted-foreground ml-auto">{step.latencyMs}ms</span>}
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			{run.toolRequests.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium">Tool Requests ({run.toolRequests.length})</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							{run.toolRequests.map((tr) => (
								<div key={tr.id} className="flex items-center gap-3 text-sm">
									<span className="font-medium">{tr.toolName}</span>
									<Badge variant="outline" className="text-xs">{tr.status}</Badge>
									{tr.policyDecision && <Badge variant="secondary" className="text-xs">{tr.policyDecision}</Badge>}
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			{run.approvalSessions.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium">Approvals ({run.approvalSessions.length})</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							{run.approvalSessions.map((s) => (
								<div key={s.id} className="flex items-center gap-3 text-sm">
									<span>Code: {s.approvalCode}</span>
									<Badge variant="outline" className="text-xs">{s.status}</Badge>
									<span className="text-muted-foreground">{s.requestMessage}</span>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			{run.errorMessage && (
				<Card className="border-destructive/50">
					<CardHeader>
						<CardTitle className="text-sm font-medium text-destructive">Error</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-destructive">{run.errorMessage}</p>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
