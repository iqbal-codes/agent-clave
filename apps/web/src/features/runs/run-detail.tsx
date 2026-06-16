import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@agentclave/ui/components/card";
import { Badge } from "@agentclave/ui/components/badge";
import { Skeleton } from "@agentclave/ui/components/skeleton";
import { ScrollText } from "lucide-react";
import { rpcClient } from "../../runtime";
import { Button } from "@agentclave/ui/components/button";
import { Textarea } from "@agentclave/ui/components/textarea";

export function RunDetailPage() {
	const { id } = useParams<{ id: string }>();
	const queryClient = useQueryClient();
	const [rejectingToolRequestId, setRejectingToolRequestId] = useState<string | null>(null);
	const [rejectNote, setRejectNote] = useState("");

	const { data: run, isLoading } = useQuery({
		queryKey: ["run", id],
		queryFn: async () => {
			return rpcClient.runs.getById({ id: id! });
		},
		enabled: Boolean(id),
	});

	const approveMutation = useMutation({
		mutationFn: (approvalId: string) =>
			rpcClient.toolRequests.reviewApproval({ approvalId, decision: "approved" }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["run", id] });
			setRejectingToolRequestId(null);
			setRejectNote("");
		},
	});

	const rejectMutation = useMutation({
		mutationFn: ({ approvalId, note }: { approvalId: string; note: string }) =>
			rpcClient.toolRequests.reviewApproval({ approvalId, decision: "rejected", note }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["run", id] });
			setRejectingToolRequestId(null);
			setRejectNote("");
		},
	});

	if (!run) return null;

	const pendingReviewRequests = run.toolRequests.filter((tr) => tr.status === "pending_approval");
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
						<Badge
							variant={
								run.status === "completed"
									? "default"
									: run.status === "failed"
										? "destructive"
										: "secondary"
							}
						>
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
									<Badge variant="outline" className="text-xs">
										{step.type}
									</Badge>
									<span className="text-muted-foreground">{step.status}</span>
									{step.latencyMs && (
										<span className="text-muted-foreground ml-auto">{step.latencyMs}ms</span>
									)}
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			{run.toolRequests.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium">
							Tool Requests ({run.toolRequests.length})
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							{run.toolRequests.map((tr) => (
								<div key={tr.id} className="flex items-center gap-3 text-sm">
									<span className="font-medium">{tr.toolName}</span>
									<Badge variant="outline" className="text-xs">
										{tr.status}
									</Badge>
									{tr.policyDecision && (
										<Badge variant="secondary" className="text-xs">
											{tr.policyDecision}
										</Badge>
									)}
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			{pendingReviewRequests.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium">
							Pending review requests ({pendingReviewRequests.length})
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{pendingReviewRequests.map((tr) => {
								const session = run.approvalSessions.find(
									(s) => s.toolRequestId === tr.id && s.status === "pending",
								);
								if (!session) {
									return (
										<div key={tr.id} className="rounded-md border p-3">
											<div className="flex items-center gap-2">
												<span className="font-medium text-sm">{tr.toolName}</span>
												<Badge variant="outline" className="text-xs">
													{tr.riskLevel}
												</Badge>
												<Badge variant="secondary" className="text-xs">
													{tr.status}
												</Badge>
											</div>
											<pre className="mt-2 text-xs text-muted-foreground overflow-x-auto max-h-32">
												{JSON.stringify(tr.payload, null, 2).slice(0, 300)}
											</pre>
										</div>
									);
								}
								const isRejecting = rejectingToolRequestId === tr.id;
								return (
									<div key={tr.id} className="rounded-md border p-3 space-y-2">
										<div className="flex items-center gap-2">
											<span className="font-medium text-sm">{tr.toolName}</span>
											<Badge variant="outline" className="text-xs">
												{tr.riskLevel}
											</Badge>
											{tr.policyDecision && (
												<Badge variant="outline" className="text-xs">
													{tr.policyDecision}
												</Badge>
											)}
										</div>
										<pre className="text-xs text-muted-foreground overflow-x-auto max-h-32">
											{JSON.stringify(tr.payload, null, 2).slice(0, 300)}
										</pre>
										<div className="flex items-center gap-2">
											<Button
												size="sm"
												disabled={approveMutation.isPending || rejectMutation.isPending}
												onClick={() => approveMutation.mutate(session.id)}
											>
												Approve
											</Button>
											{isRejecting ? (
												<div className="flex items-center gap-2 flex-1">
													<Textarea
														value={rejectNote}
														onChange={(e) => setRejectNote(e.target.value)}
														placeholder="Rejection note (optional)"
														className="flex-1 text-sm"
														rows={1}
													/>
													<Button
														size="sm"
														variant="destructive"
														disabled={rejectMutation.isPending}
														onClick={() =>
															rejectMutation.mutate({
																approvalId: session.id,
																note: rejectNote,
															})
														}
													>
														Reject
													</Button>
													<Button
														size="sm"
														variant="ghost"
														onClick={() => {
															setRejectingToolRequestId(null);
															setRejectNote("");
														}}
													>
														Cancel
													</Button>
												</div>
											) : (
												<Button
													size="sm"
													variant="destructive"
													disabled={approveMutation.isPending || rejectMutation.isPending}
													onClick={() => setRejectingToolRequestId(tr.id)}
												>
													Reject
												</Button>
											)}
										</div>
									</div>
								);
							})}
						</div>
					</CardContent>
				</Card>
			)}

			{run.approvalSessions.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium">
							Approvals ({run.approvalSessions.length})
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							{run.approvalSessions.map((s) => (
								<div key={s.id} className="flex items-center gap-3 text-sm">
									<span>Code: {s.approvalCode}</span>
									<Badge variant="outline" className="text-xs">
										{s.status}
									</Badge>
									<span className="text-muted-foreground">{s.requestMessage}</span>
									{"approverUserId" in s && s.approverUserId && (
										<span className="text-muted-foreground">by: {String(s.approverUserId)}</span>
									)}
									{"decisionNote" in s && s.decisionNote && (
										<span className="text-muted-foreground">note: {String(s.decisionNote)}</span>
									)}
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			{run.auditLogs && run.auditLogs.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="text-sm font-medium">
							Audit activity ({run.auditLogs.length})
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="divide-y">
							{run.auditLogs.map((log) => (
								<div key={log.id} className="flex items-center gap-4 py-3">
									<ScrollText className="h-4 w-4 text-muted-foreground shrink-0" />
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2">
											<Badge variant="outline" className="text-xs">
												{log.action}
											</Badge>
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
